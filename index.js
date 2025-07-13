const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  // Origin checking (for Vercel frontend)
  const origin = req.headers.origin || "";
  const allowedOrigins = [
    "https://blog-platform-using-react.vercel.app"
  ];

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-appwrite-project, x-appwrite-function-variables"
  };

  // Handle preflight CORS (OPTIONS method)
  if (req.method === "OPTIONS") {
    log("CORS preflight received");
    return res.send("", 204, corsHeaders);
  }

  // Step 1: Parse request body
  let inputText;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    inputText = body?.inputText;

    if (!inputText || typeof inputText !== "string") {
      throw new Error("Missing or invalid inputText");
    }

    log("Parsed inputText:", inputText);
  } catch (err) {
    error("Failed to parse input body:", err.message);
    return res.json(
      { error: "Invalid input. Expecting JSON with 'inputText'" },
      400,
      corsHeaders
    );
  }

  // Step 2: Check API key
  if (!apiKey) {
    error("Gemini API key is missing");
    return res.json({ error: "Gemini API key not configured" }, 500, corsHeaders);
  }

  // Step 3: Call Gemini
  let generatedText = "";
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

    generatedText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No content generated.";
    log("Gemini response received");
  } catch (err) {
    error("Gemini API error:", err.message);
    return res.json({ error: "Gemini API error occurred" }, 500, corsHeaders);
  }

  // Step 4: Return clean response
  try {
    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, '');
    log("Output sent:", cleanOutput);

    return res.json({ output: cleanOutput }, 200, corsHeaders);
  } catch (e) {
    error("Failed to return output:", e.message);
    return res.json({ error: "Error formatting response" }, 500, corsHeaders);
  }
};
