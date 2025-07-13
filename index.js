const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("Function started. Raw request body:", req.body);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    error("Gemini API key is missing");
    return res.json({ error: "Server configuration error" }, 500);
  }

  // CORS Configuration
  const origin = req.headers.origin || "";
  const allowedOrigins = [
    "https://blog-platform-using-react.vercel.app",
    "http://localhost:3000" // Add development URL
  ];

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Appwrite-Project"
  };

  if (req.method === "OPTIONS") {
    return res.send("", 204, corsHeaders);
  }

  // Input Parsing
  let inputText;
  try {
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    inputText = typeof rawBody === "object" ? rawBody.inputText : rawBody;
    
    if (!inputText || typeof inputText !== "string") {
      throw new Error("Invalid input format");
    }
    
    log("Processing input:", inputText);
  } catch (err) {
    error("Input parsing failed:", err.message);
    return res.json(
      { error: "Invalid input. Send text directly or as {inputText: '...'}" },
      400,
      corsHeaders
    );
  }

  // Gemini API Call
  try {
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const generatedText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
      || "No content generated.";

    // Clean and return response
    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, '');
    return res.json({ output: cleanOutput }, 200, corsHeaders);

  } catch (err) {
    error("Gemini API error:", err.message);
    return res.json(
      { error: "Content generation failed. Please try again." },
      500,
      corsHeaders
    );
  }
};