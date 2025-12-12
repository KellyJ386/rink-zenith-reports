import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, latitude, longitude } = await req.json();
    
    console.log("Weather request:", { address, latitude, longitude });

    let lat = latitude;
    let lon = longitude;

    // If no coordinates provided, geocode the address
    if (!lat || !lon) {
      if (!address) {
        return new Response(
          JSON.stringify({ error: "Address or coordinates required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract city name from address (Open-Meteo geocoding only works with city names)
      // Try to parse city from formats like "123 Street, City, State ZIP" or "City, State"
      const addressParts = address.split(',').map((p: string) => p.trim());
      let searchQuery = address;
      
      if (addressParts.length >= 2) {
        // Try the second part (usually the city) or combine city and state
        const cityPart = addressParts.length >= 3 ? addressParts[1] : addressParts[0];
        const statePart = addressParts.length >= 3 ? addressParts[2] : addressParts[1];
        // Remove ZIP code from state part if present
        const stateClean = statePart.replace(/\d{5}(-\d{4})?/, '').trim();
        searchQuery = `${cityPart} ${stateClean}`.trim();
      }
      
      console.log("Extracted search query from address:", searchQuery);
      
      // Use Open-Meteo's geocoding API
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`;
      console.log("Geocoding URL:", geocodeUrl);
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.results || geocodeData.results.length === 0) {
        console.log("Geocoding failed, no results");
        return new Response(
          JSON.stringify({ error: "Could not geocode address" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      lat = geocodeData.results[0].latitude;
      lon = geocodeData.results[0].longitude;
      console.log("Geocoded coordinates:", { lat, lon });
    }

    // Fetch weather from Open-Meteo (free, no API key needed)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    console.log("Weather URL:", weatherUrl);
    
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      console.log("Weather fetch failed:", weatherData);
      return new Response(
        JSON.stringify({ error: "Could not fetch weather data" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const temperatureF = weatherData.current.temperature_2m;
    const temperatureC = Math.round((temperatureF - 32) * 5 / 9);
    const weatherCode = weatherData.current.weather_code;

    // Map weather codes to descriptions
    const weatherDescriptions: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Thunderstorm with heavy hail",
    };

    const result = {
      temperatureF: Math.round(temperatureF),
      temperatureC,
      weatherCode,
      description: weatherDescriptions[weatherCode] || "Unknown",
      coordinates: { lat, lon },
    };

    console.log("Weather result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Weather function error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
