const axios = require('axios');

module.exports = async ({ req, log, error }) => {
  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  // Step 1: Parse input safely
  let inputText;
try {
  let body = req.body;

  if (typeof body === "string") {
    if (body.trim() === "") {
      throw new Error("Empty request body received");
    }
    log("Parsing body from string");
    body = JSON.parse(body);
  }

  inputText = body?.inputText;

  if (!inputText || typeof inputText !== "string") {
    throw new Error("Missing or invalid inputText");
  }

  log("Parsed inputText:", inputText);
} catch (err) {
  error("Failed to parse input body:", err.message);
  log("Raw req.body:", JSON.stringify(req.body));
  return JSON.stringify({ error: "Invalid input. Expecting JSON with 'inputText'" });
}

  // Step 3: Call Gemini API
  let generatedText = "";
  try {
    log("Calling Gemini Flash API");

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    generatedText =
      geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No content generated.";

    log("Gemini response received");
  } catch (err) {
    error("Gemini API Error:", err.message || err);
    log("Error details:", JSON.stringify(err.response?.data || err));
    return JSON.stringify({ error: "Gemini API error occurred. Check logs for details." });
  }

  // Step 4: Return stringified JSON
  try {
    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, '');
    log("Output sent:", cleanOutput);
    return JSON.stringify({ output: cleanOutput });
  } catch (e) {
    error("Failed to clean output:", e.message);
    return JSON.stringify({ error: "Error while formatting output." });
  }
};
