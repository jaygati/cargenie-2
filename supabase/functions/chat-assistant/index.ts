import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserRequirements {
  minSeats?: number;
  fuelType?: string;
  bodyType?: string;
  budget?: string;
}

function extractRequirements(message: string, history: any[]): UserRequirements {
  const reqs: UserRequirements = {};
  const allText = (history.map((m: any) => m.content).join(' ') + ' ' + message).toLowerCase();
  
  const seatsMatch = allText.match(/(\d+)\s*(?:seat|passenger|people|person|family of (\d+))/i);
  if (seatsMatch) {
    const familySize = seatsMatch[2] ? parseInt(seatsMatch[2]) : parseInt(seatsMatch[1]);
    reqs.minSeats = familySize;
  }
  
  if (allText.includes('electric') || allText.includes('ev')) {
    reqs.fuelType = 'electric';
  } else if (allText.includes('hybrid')) {
    reqs.fuelType = 'hybrid';
  } else if (allText.includes('gas') || allText.includes('gasoline')) {
    reqs.fuelType = 'gas';
  }
  
  if (allText.includes('suv')) {
    reqs.bodyType = 'suv';
  } else if (allText.includes('truck')) {
    reqs.bodyType = 'truck';
  } else if (allText.includes('sedan')) {
    reqs.bodyType = 'sedan';
  } else if (allText.includes('minivan') || allText.includes('van')) {
    reqs.bodyType = 'minivan';
  }
  
  return reqs;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requirements = extractRequirements(message, conversationHistory || []);
    
    let query = supabase.from("car_models").select("*");
    
    if (requirements.minSeats) {
      query = query.gte('seats', requirements.minSeats);
    }
    if (requirements.fuelType) {
      query = query.eq('fuel_type', requirements.fuelType);
    }
    if (requirements.bodyType) {
      query = query.eq('body_type', requirements.bodyType);
    }
    
    const { data: carModels } = await query.limit(50);

    const systemPrompt = `You are CarGenie, a helpful AI assistant for car recommendations.

CRITICAL RULES - NEVER VIOLATE THESE:
1. SEATING CAPACITY IS NON-NEGOTIABLE: If user needs seats for X people, ONLY recommend cars with X or MORE seats. A 5-seater CANNOT accommodate 7 people.
2. When user says "family of X", they need AT LEAST X seats minimum.
3. ALWAYS verify seat count matches requirements before recommending.
4. If no cars match their strict requirements, tell them honestly - don't compromise on safety.

Available car models (already filtered by requirements):
${JSON.stringify(carModels, null, 2)}

User Requirements Detected:
${JSON.stringify(requirements, null, 2)}

Your Response Format:
- Be conversational and friendly
- Ask clarifying questions if needs are unclear
- When recommending, return ONLY this JSON structure:
{
  "message": "Your friendly response explaining why these cars work",
  "recommendations": ["model_id_1", "model_id_2"]
}
- If just chatting without recommendations: { "message": "your response" }
- NEVER recommend a car that doesn't meet the minimum requirements
- Tell them to click "Show Available Deals" when ready

Examples of GOOD responses:
- Family of 7 → Only recommend 7+ seat SUVs/minivans
- 5 passengers → 5+ seat vehicles are fine
- Electric preference → Only electric cars

Examples of BAD responses (NEVER DO THIS):
- Family of 7 → DO NOT recommend 5-seat sedans
- Need truck → DO NOT recommend sedans
- Want electric → DO NOT recommend gas cars`;

    const messages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    let assistantMessage = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    assistantMessage = assistantMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    let parsedResponse;
    try {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = { message: assistantMessage };
      }
    } catch {
      parsedResponse = { message: assistantMessage };
    }

    let recommendedModels = [];
    if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
      const modelIds = parsedResponse.recommendations;
      let modelQuery = supabase
        .from("car_models")
        .select("*")
        .in("id", modelIds);
      
      if (requirements.minSeats) {
        modelQuery = modelQuery.gte('seats', requirements.minSeats);
      }
      if (requirements.fuelType) {
        modelQuery = modelQuery.eq('fuel_type', requirements.fuelType);
      }
      if (requirements.bodyType) {
        modelQuery = modelQuery.eq('body_type', requirements.bodyType);
      }
      
      const { data: models } = await modelQuery;
      recommendedModels = models || [];
      
      if (recommendedModels.length === 0 && requirements.minSeats) {
        parsedResponse.message = `I notice you need seating for ${requirements.minSeats} people. Unfortunately, none of the cars I suggested meet that requirement. Let me find vehicles with at least ${requirements.minSeats} seats for you.`;
      }
    }

    return new Response(
      JSON.stringify({
        message: parsedResponse.message || assistantMessage,
        models: recommendedModels,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        message: "I'm having trouble processing that right now. Could you try rephrasing your question?",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});