const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  // 1. Configure CORS
  const allowedOrigins = [
    "https://blog-platform-using-react.vercel.app",
    "http://localhost:3000"
  ];

  const requestOrigin = req.headers.origin || '';
  const isAllowedOrigin = allowedOrigins.includes(requestOrigin);

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowedOrigin ? requestOrigin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Appwrite-Project",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };

  // 2. Handle preflight requests
  if (req.method === "OPTIONS") {
    log("[CORS] Handling preflight request from origin:", requestOrigin);
    return res.send("", 204, corsHeaders);
  }

  // 3. Main request processing
  try {
    log("[Request] Incoming from origin:", requestOrigin);
    log("[Request] Headers:", req.headers);
    
    // 4. Validate origin
    if (!isAllowedOrigin) {
      error("[CORS] Blocked origin:", requestOrigin);
      return res.json({ error: "Origin not allowed" }, 403, corsHeaders);
    }

    // 5. Parse input
    let inputText;
    try {
      const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      inputText = typeof rawBody === "object" ? rawBody.inputText || rawBody.text : rawBody;
      
      if (!inputText || typeof inputText !== "string") {
        throw new Error("Invalid input format");
      }
      
      log("[Input] Processed:", inputText.substring(0, 100) + (inputText.length > 100 ? "..." : ""));
    } catch (err) {
      error("[Input] Parsing failed:", err.message);
      return res.json(
        { error: "Invalid input. Send text directly or as {inputText: '...'}" },
        400,
        corsHeaders
      );
    }

    // 6. Verify API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      error("[Config] Gemini API key missing");
      return res.json({ error: "Server configuration error" }, 500, corsHeaders);
    }

    // 7. Call Gemini API
    log("[Gemini] Making API call with input length:", inputText.length);
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

    // 8. Process response
    const generatedText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
      || "No content generated.";

    const cleanOutput = generatedText
      .replace(/[^\x20-\x7E]+/g, '') // Remove non-ASCII
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    log("[Output] Generated (first 100 chars):", cleanOutput.substring(0, 100) + (cleanOutput.length > 100 ? "..." : ""));

    return res.json({ output: cleanOutput }, 200, corsHeaders);

  } catch (err) {
    // 9. Error handling
    error("[Error] Unhandled exception:", err.message);
    
    const statusCode = err.response?.status || 500;
    const errorMessage = statusCode === 503 
      ? "Service temporarily unavailable" 
      : (err.response?.data?.error || err.message);

    return res.json(
      { 
        error: errorMessage,
        ...(err.response?.data && { details: err.response.data })
      },
      statusCode,
      corsHeaders
    );
  }
};