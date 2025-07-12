const axios = require('axios');

const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log("🔥 Function started"); // <-- force this log to verify deployment

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    error('Gemini API key missing');
    return res.json({
      statusCode: 500,
      body: { error: 'Server misconfiguration' }
    }, 500);
  }


  let inputText;
  try {
    log("BODY RAW: " + req.body); // 👈 ADD THIS FOR DEBUGGING

    const payload = JSON.parse(req.body); // important: parse req.body manually
    inputText = payload.inputText;

    if (!inputText) {
      error('Missing inputText');
      return res.json({
        statusCode: 400,
        body: { error: 'Required field: inputText' }
      }, 400);
    }
  } catch (err) {
    error(`Parsing failed: ${err.message}`);
    return res.json({
      statusCode: 400,
      body: { error: 'Send JSON: {\"inputText\":\"Your message\"}' }
    }, 400);
  }

  try {
    log(`Calling Gemini with: ${inputText.substring(0, 50)}...`);

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: inputText }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      }
    );

    const result = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return res.json({
      statusCode: 200,
      body: { response: result || 'No content generated.' }
    });
  } catch (err) {
    error(`Gemini error: ${err.message}`);
    return res.json({
      statusCode: err.response?.status || 502,
      body: {
        error: 'AI service unavailable',
        details: err.response?.data || err.message
      }
    }, err.response?.status || 502);
  }
};
