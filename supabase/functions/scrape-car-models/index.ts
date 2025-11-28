import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const realCarModels = [
  { make: 'Toyota', model: 'Camry', year_min: 2020, year_max: 2024, body_type: 'sedan', seats: 5, fuel_type: 'gas', mpg_city: 28, mpg_highway: 39, description: 'Best-selling midsize sedan with legendary reliability and excellent fuel economy', specs: { horsepower: 203, cargo_space: '15.1 cu ft', msrp: 26420 } },
  { make: 'Toyota', model: 'Corolla', year_min: 2020, year_max: 2024, body_type: 'sedan', seats: 5, fuel_type: 'gas', mpg_city: 31, mpg_highway: 40, description: 'Compact sedan with outstanding fuel efficiency and Toyota reliability', specs: { horsepower: 169, cargo_space: '13.1 cu ft', msrp: 21550 } },
  { make: 'Toyota', model: 'RAV4', year_min: 2019, year_max: 2024, body_type: 'suv', seats: 5, fuel_type: 'gas', mpg_city: 27, mpg_highway: 35, description: 'America\'s best-selling SUV with spacious interior and standard AWD', specs: { horsepower: 203, cargo_space: '37.5 cu ft', msrp: 28475 } },
  { make: 'Toyota', model: 'Highlander', year_min: 2020, year_max: 2024, body_type: 'suv', seats: 8, fuel_type: 'gas', mpg_city: 21, mpg_highway: 29, description: 'Three-row family SUV with exceptional reliability and safety ratings', specs: { horsepower: 295, cargo_space: '84.3 cu ft', msrp: 37755 } },
  { make: 'Toyota', model: 'Tacoma', year_min: 2020, year_max: 2024, body_type: 'truck', seats: 5, fuel_type: 'gas', mpg_city: 20, mpg_highway: 23, description: 'Legendary midsize truck with off-road capability and great resale value', specs: { horsepower: 278, towing_capacity: '6800 lbs', msrp: 29395 } },
  { make: 'Toyota', model: 'Tundra', year_min: 2022, year_max: 2024, body_type: 'truck', seats: 6, fuel_type: 'gas', mpg_city: 18, mpg_highway: 24, description: 'Full-size truck with powerful twin-turbo V6 and impressive towing', specs: { horsepower: 389, towing_capacity: '12000 lbs', msrp: 39965 } },
  { make: 'Toyota', model: 'Sienna', year_min: 2021, year_max: 2024, body_type: 'minivan', seats: 8, fuel_type: 'hybrid', mpg_city: 36, mpg_highway: 36, description: 'Only hybrid minivan with standard AWD and excellent fuel economy', specs: { horsepower: 245, cargo_space: '101 cu ft', msrp: 37535 } },
  { make: 'Honda', model: 'Civic', year_min: 2022, year_max: 2024, body_type: 'sedan', seats: 5, fuel_type: 'gas', mpg_city: 31, mpg_highway: 40, description: 'Sporty compact sedan with engaging driving dynamics and premium interior', specs: { horsepower: 180, cargo_space: '14.8 cu ft', msrp: 24650 } },
  { make: 'Honda', model: 'Accord', year_min: 2023, year_max: 2024, body_type: 'sedan', seats: 5, fuel_type: 'gas', mpg_city: 29, mpg_highway: 37, description: 'Midsize sedan winner with upscale cabin and excellent driving experience', specs: { horsepower: 192, cargo_space: '16.7 cu ft', msrp: 27295 } },
  { make: 'Honda', model: 'CR-V', year_min: 2023, year_max: 2024, body_type: 'suv', seats: 5, fuel_type: 'gas', mpg_city: 28, mpg_highway: 34, description: 'Compact SUV leader with spacious cargo area and Honda reliability', specs: { horsepower: 190, cargo_space: '39.3 cu ft', msrp: 30800 } },
  { make: 'Ford', model: 'F-150', year_min: 2021, year_max: 2024, body_type: 'truck', seats: 6, fuel_type: 'gas', mpg_city: 20, mpg_highway: 26, description: 'America\'s best-selling vehicle with aluminum body and powerful engines', specs: { horsepower: 290, towing_capacity: '13200 lbs', msrp: 36770 } },
  { make: 'Ford', model: 'Mustang', year_min: 2020, year_max: 2024, body_type: 'coupe', seats: 4, fuel_type: 'gas', mpg_city: 21, mpg_highway: 32, description: 'Iconic muscle car with thrilling performance and modern tech', specs: { horsepower: 310, cargo_space: '13.5 cu ft', msrp: 30920 } },
  { make: 'Chevrolet', model: 'Silverado 1500', year_min: 2020, year_max: 2024, body_type: 'truck', seats: 6, fuel_type: 'gas', mpg_city: 17, mpg_highway: 23, description: 'Full-size truck with powerful engines and modern technology', specs: { horsepower: 355, towing_capacity: '13300 lbs', msrp: 37100 } },
  { make: 'Nissan', model: 'Altima', year_min: 2020, year_max: 2024, body_type: 'sedan', seats: 5, fuel_type: 'gas', mpg_city: 28, mpg_highway: 39, description: 'Midsize sedan with available AWD and ProPILOT Assist', specs: { horsepower: 188, cargo_space: '15.4 cu ft', msrp: 25990 } },
  { make: 'Hyundai', model: 'Tucson', year_min: 2022, year_max: 2024, body_type: 'suv', seats: 5, fuel_type: 'gas', mpg_city: 26, mpg_highway: 33, description: 'Compact SUV with futuristic design and hybrid option', specs: { horsepower: 187, cargo_space: '74.8 cu ft', msrp: 27750 } }
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count: currentCount } = await supabase
      .from('car_models')
      .select('*', { count: 'exact', head: true });

    if (currentCount === null) {
      throw new Error('Could not get current count');
    }

    if (currentCount >= 1500) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Database already has ${currentCount} models (target: 1500)`,
          currentCount,
          added: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let successCount = 0;
    let skippedCount = 0;

    for (const car of realCarModels) {
      const { error } = await supabase
        .from('car_models')
        .insert(car);

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          skippedCount++;
        }
      } else {
        successCount++;
      }
    }

    const { count: finalCount } = await supabase
      .from('car_models')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully populated database',
        initialCount: currentCount,
        finalCount,
        added: successCount,
        skipped: skippedCount,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});