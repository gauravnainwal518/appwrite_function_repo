const axios = require("axios");

module.exports = async ({ req, res, log, error }) => {
  //  Step 1: Handle CORS preflight request
  const allowedOrigins = ["https://blog-platform-using-react.vercel.app"]; //  frontend domain
  const origin = req.headers.origin;

  // Respond to preflight requests
  if (req.method === "OPTIONS") {
    log("CORS Preflight detected");
    return res.send("", 204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-appwrite-project, x-appwrite-function-variables",
    });
  }

  // Validate CORS for actual requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-appwrite-project, x-appwrite-function-variables",
  };

  log("Function started");

  const apiKey = process.env.GEMINI_API_KEY;

  // Step 2: Parse input safely
  let inputText;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    inputText = body.inputText;

    if (!inputText || typeof inputText !== "string") {
      throw new Error("Missing or invalid inputText");
    }

    log("Parsed inputText:", inputText);
  } catch (err) {
    error("Failed to parse input body:", err.message);
    log("Raw req.body:", JSON.stringify(req.body));
    return res.json(
      { error: "Invalid input. Send JSON with 'inputText'" },
      400,
      corsHeaders
    );
  }

  if (!apiKey) {
    error("Missing Gemini API Key");
    return res.json({ error: "Server configuration error" }, 500, corsHeaders);
  }

  // Step 3: Call Gemini API
  let generatedText = "";
  try {
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    generatedText =
      geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "No content generated";

    log("Gemini response received");
  } catch (err) {
    error("Gemini API Error:", err.message);
    log("Gemini error details:", JSON.stringify(err.response?.data || err));
    return res.json(
      { error: "Gemini API call failed" },
      500,
      corsHeaders
    );
  }

  // Step 4: Clean & return output
  try {
    const cleanOutput = generatedText.replace(/[^\x20-\x7E]+/g, ""); // remove non-printables
    log("Output sent:", cleanOutput);

    return res.json(
      {
        output: cleanOutput,
      },
      200,
      corsHeaders
    );
  } catch (e) {
    error("Failed to format output:", e.message);
    return res.json(
      { error: "Formatting error" },
      500,
      corsHeaders
    );
  }
};
