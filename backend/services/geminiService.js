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
const buildPrompt = ({ occasion, hairType, hairLength, stylingPreference, timeAvailableMinutes, gender }) => {
  return `You are an expert professional hairstylist and tutorial writer.

Generate a hairstyle tutorial for a user with the following preferences:
- Style For: ${gender}
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
1. Ensure the suggested hairstyle, techniques, and product recommendations are appropriate and relevant for a ${gender} audience.
2. Provide clear, numbered, step-by-step instructions appropriate for the stated hair type/length and occasion.
3. The sum of all step durations should realistically fit within the time available (it's okay to be slightly under, but do not significantly exceed it).
4. Include 2-4 short practical tips (e.g. product recommendations, common mistakes to avoid).
5. Provide ONE concise YouTube search query that would help the user find a relevant visual tutorial for this exact style.
6. Keep instructions beginner-friendly and easy to follow at home without a professional stylist.

Respond ONLY with the structured data requested.`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isOverloadedError = (error) => {
  if (!error) return false;
  const status = error.status || error.statusCode;
  if (status === 503) return true;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("service unavailable") ||
    msg.includes("spikes in demand") ||
    msg.includes("high demand")
  );
};

const isRateLimitError = (error) => {
  if (!error) return false;
  const status = error.status || error.statusCode;
  if (status === 429) return true;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit")
  );
};

/**
 * Calls Gemini to generate a structured hairstyle tutorial.
 *
 * @param {Object} preferences - { occasion, hairType, hairLength, stylingPreference, timeAvailableMinutes, gender }
 * @returns {Promise<Object>} parsed JSON matching hairstyleResponseSchema
 */
const generateHairstyleInstructions = async (preferences) => {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: hairstyleResponseSchema,
      temperature: 0.7,
    },
  });

  const prompt = buildPrompt(preferences);
  let result;

  try {
    result = await model.generateContent(prompt);
  } catch (firstError) {
    if (isOverloadedError(firstError)) {
      console.warn("Gemini service overloaded (503). Retrying once after 1.5s delay...");
      await sleep(1500);
      try {
        result = await model.generateContent(prompt);
      } catch (retryError) {
        console.error("Gemini retry failed due to overload:", retryError.message);
        throw new ApiError(
          503,
          "Our AI is a bit busy right now — please try again in a moment"
        );
      }
    } else if (isRateLimitError(firstError)) {
      console.error("Gemini rate limit exceeded:", firstError.message);
      throw new ApiError(
        429,
        "Too many requests to the AI stylist right now — please wait a moment and try again"
      );
    } else {
      console.error("Gemini API error:", firstError.message);
      throw new ApiError(
        502,
        "Failed to generate hairstyle instructions from AI service. Please try again."
      );
    }
  }

  try {
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON:", parseError.message);
    throw new ApiError(502, "AI returned an invalid response format. Please try generating again.");
  }
};

module.exports = { generateHairstyleInstructions };
