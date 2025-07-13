const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("Function started");

  // 1. Parse input
  let inputText;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    inputText = body?.inputText || body; // Support both {inputText: ""} and direct string
    log("Parsed input:", inputText.substring(0, 100));
  } catch (err) {
    error("Input parsing failed:", err);
    return res.json({ statusCode: 400, error: "Invalid input format" });
  }

  // 2. Validate input
  if (!inputText || typeof inputText !== "string") {
    return res.json({ statusCode: 400, error: "Missing or invalid input text" });
  }

  // 3. Get API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    error("Gemini API key missing");
    return res.json({ statusCode: 500, error: "Server configuration error" });
  }

  // 4. Call Gemini API
  try {
    const response = await axios.post(
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
    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
      || "No content generated.";

    return res.json({ 
      statusCode: 200, 
      output: generatedText 
    });

  } catch (err) {
    error("Gemini API Error:", err.message);
    const status = err.response?.status || 500;
    return res.json({
      statusCode: status,
      error: err.response?.data?.error || err.message
    });
  }
};