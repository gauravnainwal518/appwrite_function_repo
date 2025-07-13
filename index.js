const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("--- NEW EXECUTION ---");
  log("Headers received:", JSON.stringify(req.headers));
  log("Raw body received:", req.body);
  log("Body type:", typeof req.body);

  try {
    // Check for empty body
    if (!req.body || req.body === '') {
      error("Empty body detected");
      return res.json({
        statusCode: 400,
        error: "Request body cannot be empty",
        receivedBody: req.body
      });
    }

    // Parse the request
    let parsedRequest;
    try {
      parsedRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (parsedRequest.data) {
        try {
          parsedRequest = JSON.parse(parsedRequest.data);
        } catch (innerError) {
          error("Inner data parse error:", innerError);
          return res.json({
            statusCode: 400,
            error: `Invalid inner data format: ${innerError.message}`
          });
        }
      }
    } catch (parseError) {
      error("Parse error:", parseError);
      return res.json({
        statusCode: 400,
        error: "Invalid request format",
        details: parseError.message,
        receivedBody: req.body
      });
    }

    log("Successfully parsed request:", parsedRequest);

    const inputText = parsedRequest.inputText || parsedRequest.text;
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

    // Call Gemini API
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

    //  Always return something
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
