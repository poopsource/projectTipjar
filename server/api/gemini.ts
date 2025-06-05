import fetch from 'node-fetch';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

/**
 * Analyze an image using Google's Gemini Vision API to extract text
 * @param imageBase64 The base64-encoded image data
 * @returns An object with extracted text or error details
 */
export async function analyzeImage(imageBase64: string): Promise<{text: string | null; error?: string}> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("No Gemini API key provided");
      return { 
        text: null,
        error: "API key missing. Please configure the Gemini API key." 
      };
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
    
    const promptText = `
      Extract ALL TEXT from this image first. Then identify and extract ALL partner names and their tippable hours from the text.
      
      Look for patterns indicating partner names followed by hours, such as:
      - "Name: X hours" or "Name: Xh"
      - "Name - X hours"
      - "Name (X hours)"
      - Any text that includes names with numeric values that could represent hours
      
      Return EACH partner's full name followed by their hours, with one partner per line.
      Format the output exactly like this:
      John Smith: 32
      Maria Garcia: 24.5
      Alex Johnson: 18.75
      
      Make sure to include ALL partners mentioned in the image, not just the first one.
      If hours are not explicitly labeled, look for numeric values near names that could represent hours.
    `;
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: promptText
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    };
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to call Gemini API";
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // If error parsing fails, use the generic message
      }
      
      console.error("Gemini API error:", response.status, errorText);
      return { 
        text: null, 
        error: `API Error (${response.status}): ${errorMessage}`
      };
    }
    
    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("No text in Gemini response");
      return { 
        text: null,
        error: "No text extracted from the image. Try a clearer image or manual entry."
      };
    }
    
    return { text: data.candidates[0].content.parts[0].text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { 
      text: null,
      error: "An unexpected error occurred while processing the image."
    };
  }
}