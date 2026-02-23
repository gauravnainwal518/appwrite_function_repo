const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("Function started");

  try {
    let inputText;
    const raw = req.body;

    log("Body type: " + typeof raw);
    log("Body value: " + JSON.stringify(raw));

    if (typeof raw === 'string') {
      // Try URL-encoded: data=%7B%22inputText%22...
      const params = new URLSearchParams(raw);
      const dataField = params.get('data');
      if (dataField) {
        inputText = JSON.parse(dataField).inputText;
      } else {
        // Try JSON string
        const outer = JSON.parse(raw);
        const inner = typeof outer.data === 'string' ? JSON.parse(outer.data) : outer;
        inputText = inner.inputText;
      }
    } else if (typeof raw === 'object' && raw !== null) {
      const inner = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw;
      inputText = inner.inputText;
    }

    log("Extracted inputText: " + inputText);

    if (!inputText || typeof inputText !== 'string') {
      return res.json({ statusCode: 400, error: "Missing or invalid input text" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ statusCode: 500, error: "API key missing" });
    }

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: inputText }] }] },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );

    const generatedText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return res.json({
      statusCode: 200,
      output: generatedText || "Sorry, couldn't generate a response."
    });

  } catch (err) {
    error("Fatal: " + err.message);
    return res.json({ statusCode: 500, error: err.message });
  }
};