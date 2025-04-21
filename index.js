const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  log('Execution started');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    error('OpenAI API key missing');
    return res.json({ error: 'Server misconfiguration' }, 500);
  }

  let inputText;
  try {
    const raw = req.payload;
    log('Raw payload:', raw);

    const parsed = JSON.parse(raw || '{}');
    inputText = parsed.inputText;

    if (!inputText) {
      error('Missing inputText');
      return res.json({ error: 'Required field: inputText' }, 400);
    }
  } catch (err) {
    error('Invalid JSON:', err.message);
    return res.json({ error: 'Invalid JSON format.' }, 400);
  }

  try {
    const response = await axios.post(
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

    const result = response.data.choices[0]?.text?.trim();
    return res.json({ response: result }, 200);
  } catch (err) {
    error('OpenAI API failed:', err.message);
    return res.json({ error: 'Failed to contact OpenAI', details: err.message }, 500);
  }
};
