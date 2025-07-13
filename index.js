const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  // CORS Configuration
  const origin = req.headers.origin || req.headers.Origin || "";
  const allowedOrigins = [
    "https://blog-platform-using-react.vercel.app",
    "http://localhost:3000",
  
  ];

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-Appwrite-Project, Origin, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    log("[CORS] Handling preflight request");
    return res.send("", 204, corsHeaders);
  }

  // Main request handling
  try {
    log("[Request] Headers:", req.headers);
    log("[Request] Raw Body:", req.body);

    // Verify origin
    if (!allowedOrigins.includes(origin)) {
      error("[CORS] Blocked origin:", origin);
      return res.json({ error: "Origin not allowed" }, 403, corsHeaders);
    }

    // Parse input
    let inputText;
    try {
      const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      inputText = typeof rawBody === "object" ? rawBody.inputText || rawBody.text : rawBody;
      
      if (!inputText || typeof inputText !== "string") {
        throw new Error("Invalid input format");
      }
      
      log("[Input] Processed:", inputText);
    } catch (err) {
      error("[Input] Parsing failed:", err.message);
      return res.json(
        { error: "Invalid input. Send text directly or as {inputText: '...'}" },
        400,
        corsHeaders
      );
    }

    // Verify API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      error("[Config] Gemini API key missing");
      return res.json({ error: "Server configuration error" }, 500, corsHeaders);
    }

    // Call Gemini API
    log("[Gemini] Making API call");
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 30000 // 30 second timeout
      }
    );

    // Process response
    const generatedText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
      || "No content generated.";

    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, '');
    log("[Output] Generated:", cleanOutput);

    return res.json({ output: cleanOutput }, 200, corsHeaders);

  } catch (err) {
    error("[Error] Unhandled exception:", err.message);
    console.error("Stack trace:", err.stack);
    
    const statusCode = err.response?.status || 500;
    const errorMessage = statusCode === 503 
      ? "Service temporarily unavailable" 
      : err.message;

    return res.json(
      { error: errorMessage },
      statusCode,
      corsHeaders
    );
  }
};