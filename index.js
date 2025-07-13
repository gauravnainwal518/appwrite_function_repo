const axios = require("axios");

module.exports = async ({ req, log, error }) => {
  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  //  Safely extract inputText from req.variables
  let inputText;
  try {
    inputText = req.variables?.inputText;

    if (!inputText || typeof inputText !== "string") {
      throw new Error("Missing or invalid inputText");
    }

    log("Parsed inputText:", inputText);
  } catch (err) {
    error("Failed to extract inputText:", err.message);
    return JSON.stringify({ error: "Invalid inputText received." });
  }

  if (!apiKey) {
    error("Gemini API key is missing");
    return JSON.stringify({ error: "Missing Gemini API key." });
  }

  try {
    log("Calling Gemini Flash API...");

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const generatedText =
      geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No content generated.";

    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, "");

    log("AI Output sent:", cleanOutput);

    return JSON.stringify({ output: cleanOutput });
  } catch (err) {
    error("Gemini API error:", err.message);
    log("Details:", JSON.stringify(err.response?.data || err));
    return JSON.stringify({ error: "Gemini API request failed." });
  }
};
