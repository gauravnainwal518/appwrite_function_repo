const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  log('Execution started');

  if (!apiKey) {
    error('Gemini API key missing');
    return res.json({
      statusCode: 500,
      body: { error: 'Server misconfiguration' }
    }, 500);
  }

 let inputText;
try {
  const rawBody = req.body || "";
  log(`Raw body: ${rawBody}`);

  const payload = JSON.parse(rawBody); // ⬅️ this is the fix
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
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
      {
        contents: [
          {
            parts: [{ text: inputText }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000
      }
    );

    const result = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    log('Gemini success');
    return res.json({
      statusCode: 200,
      body: { response: result || 'No content generated.' }
    });
  } catch (err) {
    error(`Gemini error: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    return res.json({
      statusCode: err.response?.status || 502,
      body: {
        error: 'AI service unavailable',
        details: err.response?.data || err.message
      }
    }, err.response?.status || 502);
  }
};
