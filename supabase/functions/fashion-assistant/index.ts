import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  try {
    const requestBody = await req.json();
    const userQuery = typeof requestBody.userQuery === 'string' ? requestBody.userQuery : '';
    const location = typeof requestBody.location === 'string' ? requestBody.location : '';
    const mode = requestBody.mode || 'full';

    const weatherApiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!weatherApiKey) {
      return new Response(JSON.stringify({
        error: "Weather API key not configured"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${weatherApiKey}&units=metric&lang=en`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      return new Response(JSON.stringify({
        error: `Weather API error: ${weatherResponse.statusText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const weather = await weatherResponse.json();

    const weatherData = {
      location: weather.name,
      description: weather.weather[0].description,
      temperature: weather.main.temp,
      feelsLike: weather.main.feels_like,
      humidity: weather.main.humidity,
      windSpeed: weather.wind.speed,
      icon: weather.weather[0].icon,
    };

    if (mode === 'weather-only' || !userQuery || userQuery.trim() === '') {
      const responseData = {
        weather: weatherData,
        suggestions: "",
        conversationResponse: "",
        responseType: "weather-only"
      };
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    function containsJapanese(text: string): boolean {
      return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    }
    const inJapanese = containsJapanese(userQuery);

    const smartPrompt = `You are an intelligent fashion and weather assistant. Based on the user's query and current weather data, provide an appropriate response.

Current Weather in ${weather.name}:
- Weather: ${weather.weather[0].description}
- Temperature: ${weather.main.temp}°C (feels like ${weather.main.feels_like}°C)
- Humidity: ${weather.main.humidity}%
- Wind: ${weather.wind.speed} m/s

User Query: "${userQuery}"

If the user is asking for outfit suggestions, provide exactly 3 outfit recommendations in this format:

**Outfit Idea 1:** [Creative Name]
**Clothing Items:** [specific items]
**Color/Style:** [colors and style details]
**Why it's suitable:** [weather explanation]

**Outfit Idea 2:** [Creative Name]
**Clothing Items:** [specific items]
**Color/Style:** [colors and style details]
**Why it's suitable:** [weather explanation]

**Outfit Idea 3:** [Creative Name]
**Clothing Items:** [specific items]
**Color/Style:** [colors and style details]
**Why it's suitable:** [weather explanation]

If the user is asking about weather, activities, or general conversation, provide a natural helpful response.

IMPORTANT: Respond in ${inJapanese ? 'Japanese' : 'English'} language.

Do not include any instruction labels or type indicators in your response. Respond directly to the user's question.`;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        error: "Gemini API key not configured"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.5-pro", 
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
    ];

    let aiResponse = "";
    let lastError = "";

    console.log('=== GEMINI API DEBUG START ===');
    console.log('User query:', userQuery);
    console.log('Location:', location);
    console.log('Gemini API key exists:', !!geminiApiKey);
    console.log('Gemini API key length:', geminiApiKey ? geminiApiKey.length : 0);
    console.log('Available models:', modelNames);
    console.log('Prompt length:', smartPrompt.length);

    for (const modelName of modelNames) {
      try {
        console.log(`\n--- Trying model: ${modelName} ---`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        console.log('Request URL:', geminiUrl.replace(geminiApiKey, 'HIDDEN_KEY'));
        
        const geminiRequestBody = {
          contents: [
            {
              parts: [
                { text: smartPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1500,
          },
        };

        console.log('Request body structure:', {
          contentsLength: geminiRequestBody.contents.length,
          partsLength: geminiRequestBody.contents[0].parts.length,
          promptLength: geminiRequestBody.contents[0].parts[0].text.length,
          temperature: geminiRequestBody.generationConfig.temperature,
          maxTokens: geminiRequestBody.generationConfig.maxOutputTokens
        });

        console.log(`Making fetch request to Gemini...`);
        const startTime = Date.now();

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify(geminiRequestBody),
        });

        const endTime = Date.now();
        console.log(`Fetch completed in ${endTime - startTime}ms`);
        console.log(`Response status: ${geminiRes.status}`);
        console.log(`Response statusText: ${geminiRes.statusText}`);
        console.log(`Response headers:`, Object.fromEntries(geminiRes.headers.entries()));

        if (geminiRes.ok) {
          console.log('Response is OK, parsing JSON...');
          const aiData = await geminiRes.json();
          console.log('Full AI response:', JSON.stringify(aiData, null, 2));

          if (aiData.candidates && aiData.candidates.length > 0) {
            const candidate = aiData.candidates[0];
            console.log('First candidate details:', {
              hasContent: !!candidate.content,
              hasParts: !!candidate.content?.parts,
              partsLength: candidate.content?.parts?.length || 0,
              finishReason: candidate.finishReason,
              safetyRatings: candidate.safetyRatings
            });
            
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              aiResponse = candidate.content.parts[0].text || "";
              console.log('AI response length:', aiResponse.length);
              console.log('AI response preview:', aiResponse.substring(0, 500));
              
              if (aiResponse.trim()) {
                console.log(`✅ SUCCESS with model: ${modelName}`);
                break;
              } else {
                console.log('❌ Empty response from AI');
                lastError = 'Empty response from AI';
              }
            } else {
              console.log('❌ No content/parts in candidate');
              lastError = 'No content/parts in candidate';
            }
            
            if (candidate.finishReason) {
              console.log(`Finish reason: ${candidate.finishReason}`);
              lastError = `Finish reason: ${candidate.finishReason}`;
            }
          } else {
            console.log('❌ No candidates in response');
            lastError = 'No candidates in response';
          }
        } else {
          console.log('❌ Response not OK, getting error text...');
          const errorText = await geminiRes.text();
          console.log('Error response body:', errorText);
          lastError = `HTTP ${geminiRes.status}: ${errorText}`;
        }
      } catch (error) {
        console.error(`❌ Exception with model ${modelName}:`, error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        lastError = `Exception: ${error.message}`;
      }
    }

    console.log('=== GEMINI API DEBUG END ===');
    console.log('Final AI response length:', aiResponse.length);
    console.log('Last error:', lastError);

    if (!aiResponse.trim()) {
      aiResponse = `The weather in ${weather.name} is currently ${weather.weather[0].description} with a temperature of ${weather.main.temp}°C. How can I help you with weather information or outfit suggestions?`;
    }

    // Clean up any instruction labels that might appear
    aiResponse = aiResponse.replace(/^TYPE [AB] - [A-Z\s]+:?\s*/i, '').trim();

    function isOutfitSuggestion(text: string): boolean {
      return text.includes('**Outfit Idea') && (text.includes('**Clothing Items:**') || text.includes('**Color/Style:**') || text.includes('**Why it\'s suitable:**'));
    }

    const responseData = {
      weather: weatherData,
      suggestions: isOutfitSuggestion(aiResponse) ? aiResponse : "",
      conversationResponse: !isOutfitSuggestion(aiResponse) ? aiResponse : "",
      responseType: isOutfitSuggestion(aiResponse) ? "outfit" : "conversation"
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});