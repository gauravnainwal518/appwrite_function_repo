const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log(" NEW EXECUTION");
  log("Headers received:", JSON.stringify(req.headers));
  log("Parsed body received:", req.body);

  try {
    const { inputText } = req.body || {};

    if (!inputText || typeof inputText !== 'string') {
      return res.json({
        statusCode: 400,
        error: "Missing or invalid input text"
      });
    }

    log("Processing input:", inputText.substring(0, 100));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        statusCode: 500,
        error: "Server configuration error - API key missing"
      });
    }

    let generatedText = null;
    try {
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

      generatedText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    } catch (apiError) {
      error("Gemini API Error:", apiError.message);
    }

    return res.json({
      statusCode: 200,
      output: generatedText || "Sorry, I couldn’t generate a proper response. Please try again later."
    });

  } catch (err) {
    error("Fatal error:", err.message, err.stack);
    return res.json({
      statusCode: 500,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
