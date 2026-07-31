const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { ApiError } = require("../middleware/errorHandler");

// Initialize the Gemini client once using the API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Defines the EXACT JSON shape we want Gemini to return.
 * Using responseSchema + responseMimeType "application/json" forces
 * Gemini to return valid, structured JSON instead of free-form text,
 * so we never have to fragile-parse markdown or guess field names.
 */
const hairstyleResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    totalTimeMinutes: {
      type: SchemaType.NUMBER,
      description: "Total estimated time to complete the hairstyle, in minutes",
    },
    steps: {
      type: SchemaType.ARRAY,
      description: "Ordered, numbered steps to achieve the hairstyle",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          stepNumber: { type: SchemaType.NUMBER },
          instruction: { type: SchemaType.STRING },
          durationMinutes: { type: SchemaType.NUMBER },
        },
        required: ["stepNumber", "instruction", "durationMinutes"],
      },
    },
    tips: {
      type: SchemaType.ARRAY,
      description: "Short, practical styling tips (e.g. product suggestions, tricks)",
      items: { type: SchemaType.STRING },
    },
    youtubeSearchQuery: {
      type: SchemaType.STRING,
      description:
        "A concise, effective search query a user could paste into YouTube to find a matching visual tutorial",
    },
  },
  required: ["totalTimeMinutes", "steps", "tips", "youtubeSearchQuery"],
};

/**
 * Builds the prompt sent to Gemini based on user preferences.
 */
const buildPrompt = ({ occasion, hairType, hairLength, stylingPreference, timeAvailableMinutes }) => {
  return `You are an expert professional hairstylist and tutorial writer.

Generate a hairstyle tutorial for a user with the following preferences:
- Occasion: ${occasion}
- Hair Type: ${hairType}
- Hair Length: ${hairLength}
- Styling Preference: ${stylingPreference} (${
    stylingPreference === "Heatless"
      ? "do NOT use any heat tools like straighteners, curling irons, or blow dryers"
      : "heat tools such as curling irons, straighteners, or blow dryers are allowed"
  })
- Time Available: approximately ${timeAvailableMinutes} minutes

Requirements:
1. Provide clear, numbered, step-by-step instructions appropriate for the stated hair type/length and occasion.
2. The sum of all step durations should realistically fit within the time available (it's okay to be slightly under, but do not significantly exceed it).
3. Include 2-4 short practical tips (e.g. product recommendations, common mistakes to avoid).
4. Provide ONE concise YouTube search query that would help the user find a relevant visual tutorial for this exact style.
5. Keep instructions beginner-friendly and easy to follow at home without a professional stylist.

Respond ONLY with the structured data requested.`;
};

/**
 * Calls Gemini to generate a structured hairstyle tutorial.
 *
 * @param {Object} preferences - { occasion, hairType, hairLength, stylingPreference, timeAvailableMinutes }
 * @returns {Promise<Object>} parsed JSON matching hairstyleResponseSchema
 */
const generateHairstyleInstructions = async (preferences) => {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: hairstyleResponseSchema,
        temperature: 0.7,
      },
    });

    const prompt = buildPrompt(preferences);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // responseText is guaranteed valid JSON because of responseSchema above,
    // but we still guard with try/catch in case of an unexpected API change.
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (error) {
    console.error("Gemini API error:", error.message);
    throw new ApiError(502, "Failed to generate hairstyle instructions from AI service");
  }
};

module.exports = { generateHairstyleInstructions };
