import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function extractRequirements(message: string, history: any[]) {
  const reqs: any = {};
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
  } else if (allText.includes('coupe')) {
    reqs.bodyType = 'coupe';
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

    const carListText = carModels?.map(car => 
      `- ${car.make} ${car.model} (${car.year_min}-${car.year_max}): ${car.seats} seats, ${car.fuel_type}, ${car.body_type}${car.description ? ', ' + car.description : ''}`
    ).join('\n') || 'No matching cars found';

    const systemPrompt = `You are CarGenie, an expert AI assistant for car recommendations. You help users find the perfect car based on their needs.

Important Rules:
1. SEATING CAPACITY: If user needs X seats, ONLY recommend cars with X or MORE seats. A 5-seater CANNOT fit 7 people.
2. Be conversational and friendly, not robotic
3. Ask clarifying questions if requirements are vague
4. Provide specific reasons why a car matches their needs
5. When recommending cars, explain the features and benefits
6. Tell them to click "Show Available Deals" when they're interested
7. Be concise but helpful
8. Only recommend from the available cars listed below

Available Cars (already filtered by requirements):
${carListText}

User Requirements Detected:
${JSON.stringify(requirements, null, 2)}`;

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

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured. Please add it to Supabase Edge Function secrets.");
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini error:", geminiResponse.status, errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    let assistantMessage = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!assistantMessage) {
      throw new Error("No response from Gemini");
    }

    // Extract model IDs if Gemini mentions specific cars
    let recommendedModels: any[] = [];
    if (carModels && carModels.length > 0) {
      const mentionedCars = carModels.filter(car => {
        const carName = `${car.make} ${car.model}`.toLowerCase();
        return assistantMessage.toLowerCase().includes(car.make.toLowerCase()) || 
               assistantMessage.toLowerCase().includes(carName);
      });
      recommendedModels = mentionedCars.slice(0, 5);
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
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
        message: "I'm having trouble right now. Please try again in a moment!",
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