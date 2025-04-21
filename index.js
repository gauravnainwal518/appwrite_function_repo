const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log('Execution started');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    error('Missing OpenAI API Key');
    return res.json({ error: 'Server misconfiguration' }, 500);
  }

  let inputText;
  try {
    const rawBody = req.bodyRaw;
    log('Raw payload:', rawBody);

    const payload = JSON.parse(rawBody || '{}');
    inputText = payload.inputText;

    if (!inputText) {
      error('Missing inputText');
      return res.json({ error: 'Required field: inputText' }, 400);
    }
  } catch (err) {
    error('Payload parsing failed: ' + err.message);
    return res.json({ error: 'Invalid JSON payload' }, 400);
  }

  try {
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: inputText,
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = aiResponse.data.choices[0]?.text?.trim();
    return res.json({ response: result }, 200);
  } catch (err) {
    error('OpenAI error: ' + err.message);
    return res.json({ error: 'AI service failed', details: err.message }, 500);
  }
};
