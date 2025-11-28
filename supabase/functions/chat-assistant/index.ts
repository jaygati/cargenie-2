import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CarModel {
  id: string;
  make: string;
  model: string;
  seats: number;
  fuel_type: string;
  body_type: string;
  [key: string]: any;
}

interface UserRequirements {
  minSeats?: number;
  fuelType?: string;
  bodyType?: string;
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

function generateResponse(requirements: UserRequirements, carModels: CarModel[], userMessage: string): { message: string; recommendations: string[] } {
  const parts: string[] = [];
  const recommendedIds: string[] = [];

  if (!carModels || carModels.length === 0) {
    return {
      message: "I couldn't find any cars matching your requirements. Could you tell me a bit more about what you're looking for?",
      recommendations: []
    };
  }

  if (requirements.minSeats || requirements.fuelType || requirements.bodyType) {
    parts.push('Perfect! Based on your needs, I found some great options for you:');
    
    if (requirements.minSeats) {
      parts.push(`\nYou mentioned needing ${requirements.minSeats}+ seats - I'm showing you vehicles with that capacity.`);
    }
    if (requirements.fuelType) {
      parts.push(`You're interested in ${requirements.fuelType} vehicles, so I've filtered those.`);
    }
    if (requirements.bodyType) {
      parts.push(`I found some ${requirements.bodyType} models that match your preferences.`);
    }

    const topModels = carModels.slice(0, 3);
    if (topModels.length > 0) {
      parts.push('\nHere are my recommendations:');
      topModels.forEach(model => {
        recommendedIds.push(model.id);
        parts.push(`• ${model.make} ${model.model} (${model.seats} seats, ${model.fuel_type})`);
      });
    }

    parts.push('\nClick "Show Available Deals" to see current listings, or ask me more questions!');
  } else {
    parts.push('I\'d love to help you find the perfect car! Could you tell me more about your needs?');
    parts.push('\nFor example:');
    parts.push('• How many seats do you need?');
    parts.push('• What fuel type interests you? (gas, hybrid, electric)');
    parts.push('• What body type? (sedan, SUV, truck, minivan)');
    parts.push('\nJust describe what you\'re looking for and I\'ll show you the best matches!');
  }

  return {
    message: parts.join('\n'),
    recommendations: recommendedIds
  };
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
    
    const { data: carModels, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    const response = generateResponse(requirements, carModels || [], message);

    return new Response(
      JSON.stringify({
        message: response.message,
        models: carModels && carModels.length > 0
          ? carModels.filter(m => response.recommendations.includes(m.id))
          : []
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
        error: String(error),
        message: "Sorry, I encountered an error. Please try again!",
        models: []
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