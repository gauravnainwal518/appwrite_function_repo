const axios = require('axios');

module.exports = async ({ req, log, error }) => {
  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  let inputText;

  try {
    const payload = req.payload;
    if (!payload || payload.trim() === "") {
      throw new Error("Empty payload received");
    }

    const body = JSON.parse(payload);
    inputText = body.inputText;

    if (!inputText || typeof inputText !== "string") {
      throw new Error("Missing or invalid inputText");
    }

    log("Parsed inputText:", inputText);
  } catch (err) {
    error("Failed to parse payload:", err.message);
    log("Raw req.payload:", req.payload);
    return JSON.stringify({ error: "Invalid input. Expecting JSON with 'inputText'" });
  }

  if (!apiKey) {
    error("Gemini API key is missing");
    return JSON.stringify({ error: "Gemini API key not set in environment" });
  }

  try {
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

    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, '');

    return JSON.stringify({ output: cleanOutput });

  } catch (err) {
    error("Gemini API Error:", err.message);
    log("Error details:", JSON.stringify(err.response?.data || err));
    return JSON.stringify({ error: "Gemini API error occurred" });
  }
};
