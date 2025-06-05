import fetch from 'node-fetch';

interface LlamaResponse {
  text?: string;
  error?: string;
}

/**
 * Analyze an image using LLAMA API to extract text
 * @param imageBase64 The base64-encoded image data
 * @returns An object with extracted text or error details
 */
export async function analyzeImage(imageBase64: string): Promise<{text: string | null; error?: string}> {
  try {
    const apiKey = "LLM|1097528278865084|9vLMnRv6vEG1don6uGKUgPaNc9I";
    
    if (!apiKey) {
      console.error("No LLAMA API key provided");
      return { 
        text: null,
        error: "API key missing. Please configure the LLAMA API key." 
      };
    }
    
    const apiUrl = "https://api.llama.ai/v1/vision";
    
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
      image: imageBase64,
      prompt: promptText,
      temperature: 0.2,
      max_tokens: 2048
    };
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to call LLAMA API";
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If error parsing fails, use the generic message
      }
      
      console.error("LLAMA API error:", response.status, errorText);
      return { 
        text: null, 
        error: `API Error (${response.status}): ${errorMessage}`
      };
    }
    
    const data = await response.json() as LlamaResponse;
    
    if (!data.text) {
      console.error("No text in LLAMA response");
      return { 
        text: null,
        error: "No text extracted from the image. Try a clearer image or manual entry."
      };
    }
    
    return { text: data.text };
  } catch (error) {
    console.error("Error calling LLAMA API:", error);
    return { 
      text: null,
      error: "An unexpected error occurred while processing the image."
    };
  }
}