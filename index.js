const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("Function started with headers:", JSON.stringify(req.headers));
  
  try {
    // 1. Parse input with better error handling
    let requestBody;
    try {
      requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      log("Parsed request body:", JSON.stringify(requestBody));
    } catch (e) {
      error("Raw body received:", req.body);
      throw new Error("Invalid JSON format");
    }

    // 2. Extract input text with multiple fallbacks
    const inputText = requestBody?.inputText || 
                     requestBody?.text || 
                     (typeof requestBody === 'string' ? requestBody : null);

    if (!inputText || typeof inputText !== 'string') {
      throw new Error("Missing or invalid input text");
    }

    log("Processing input:", inputText.substring(0, 100));

    // 3. Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    // 4. Call Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );

    // 5. Process response
    const generatedText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
      || "No content generated.";

    return res.json({
      statusCode: 200,
      output: generatedText
    });

  } catch (err) {
    error("Function error:", err.message, err.stack);

    // Determine status code
    const statusCode = err.message.includes("Invalid JSON") || 
                      err.message.includes("Missing or invalid") ? 400 : 500;

    return res.json({
      statusCode: statusCode,
      error: err.message,
      ...(err.response?.data && { details: err.response.data })
    });
  }
};