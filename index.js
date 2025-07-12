const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log(" Function started");

  const apiKey = process.env.GEMINI_API_KEY;
  const inputText = req.body.inputText;

  if (!apiKey) {
    error(" Gemini API key missing");
    return res.status(500).json({ message: "Gemini API key not set." });
  }

  try {
    log(`Calling Gemini Flash with: ${inputText}`);

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

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || " No content generated.";
    return res.json({ output: generatedText });

  } catch (err) {
    error("❌ Gemini API Error:", err.message || err);
    log(" Error details:", err.response?.data || err);
    return res.status(500).json({
      message: "Error calling Gemini Flash",
      error: err.message,
      details: err.response?.data
    });
  }
};
