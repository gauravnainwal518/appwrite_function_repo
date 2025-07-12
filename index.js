const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  // Parse the request body (Appwrite Console may send it as a string)
  let inputText;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    inputText = body?.inputText;
    log("Parsed Body:", JSON.stringify(body));
  } catch (err) {
    error("Failed to parse input body");
    return res.json({ statusCode: 400, message: "Invalid JSON body" });
  }

  log("Calling Gemini Flash with:", inputText);

  if (!apiKey) {
    error("Gemini API key missing");
    return res.json({ statusCode: 500, message: "Gemini API key not set." });
  }

  if (!inputText || typeof inputText !== "string") {
    error("Invalid or missing inputText");
    return res.json({ statusCode: 400, message: "Missing or invalid inputText" });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const generatedText =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No content generated.";

    return res.json({ statusCode: 200, output: generatedText });

  } catch (err) {
    error("Gemini API Error:", err.message || err);
    log("Error details:", JSON.stringify(err.response?.data || err));
    return res.json({
      statusCode: 500,
      message: "Error calling Gemini Flash",
      error: err.message,
      details: err.response?.data || null
    });
  }
};
