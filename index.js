const axios = require('axios');

module.exports = async ({ req, log, error }) => {
  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  let inputText;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    inputText = body?.inputText;
    log("Parsed Body:", JSON.stringify(body));
  } catch (err) {
    error("Failed to parse input body");
    return JSON.stringify({ statusCode: 400, message: "Invalid JSON body" });
  }

  if (!apiKey) {
    error("Missing API Key");
    return JSON.stringify({ statusCode: 500, message: "Missing Gemini API Key" });
  }

  if (!inputText || typeof inputText !== "string") {
    error("Missing or invalid inputText");
    return JSON.stringify({ statusCode: 400, message: "Missing or invalid inputText" });
  }

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const generatedText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No content generated.";

    return JSON.stringify({
      statusCode: 200,
      output: generatedText
    });

  } catch (err) {
    error("Gemini API Error:", err.message || err);
    return JSON.stringify({
      statusCode: 500,
      message: "Gemini API call failed",
      error: err.message,
      details: err.response?.data || null
    });
  }
};
