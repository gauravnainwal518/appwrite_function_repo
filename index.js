const axios = require('axios');

module.exports = async ({ req, log, error }) => {
  log("🚀 Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  // Step 1: Parse input safely
  let inputText;
  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

    inputText = body?.inputText;

    if (!inputText || typeof inputText !== "string") {
      throw new Error("Missing or invalid inputText");
    }

    log("✅ Parsed inputText:", inputText);
  } catch (err) {
    error("❌ Failed to parse input body:", err.message);
    log("🪵 Raw req.body:", JSON.stringify(req.body));
    return JSON.stringify({
      statusCode: 400,
      message: "Failed to parse input body or missing inputText"
    });
  }

  // Step 2: Check for API Key
  if (!apiKey) {
    error("❌ Gemini API key is missing");
    return JSON.stringify({
      statusCode: 500,
      message: "Gemini API key is not set in environment variables"
    });
  }

  // Step 3: Call Gemini API
  try {
    log("📡 Calling Gemini Flash API...");

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const generatedText =
      geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No content generated.";

    log("✅ Gemini response received");

    return JSON.stringify({
      statusCode: 200,
      output: generatedText
    });

  } catch (err) {
    error("❌ Gemini API Error:", err.message || err);
    log("🪵 Error details:", JSON.stringify(err.response?.data || err));
    return JSON.stringify({
      statusCode: 500,
      message: "Error calling Gemini Flash",
      error: err.message,
      details: err.response?.data || null
    });
  }
};
