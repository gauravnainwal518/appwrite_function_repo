const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  log('Execution started');

  if (!apiKey) {
    error('Missing OpenAI API key');
    return res.json({ error: 'Server misconfiguration' }, 500);
  }

  let inputText;
  try {
    const payloadRaw = req.payload;
    log(`Raw payload: ${payloadRaw}`);

    const payload = JSON.parse(payloadRaw || '{}');
    inputText = payload.inputText;

    if (!inputText) {
      error('Missing inputText');
      return res.json({ error: 'Required field: inputText' }, 400);
    }
  } catch (err) {
    error(`JSON parse error: ${err.message}`);
    return res.json({ error: 'Invalid JSON body.' }, 400);
  }

  try {
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: inputText,
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    const result = aiResponse.data.choices[0]?.text?.trim();
    return res.json({ response: result }, 200);
  } catch (err) {
    error(`OpenAI error: ${err.message}`);
    return res.json({
      error: 'AI service error',
      details: err.message,
    }, 502);
  }
};
