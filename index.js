const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  log('Execution started');

  if (!apiKey) {
    error('OpenRouter API key missing');
    return res.json({
      statusCode: 500,
      body: { error: 'Server misconfiguration' }
    }, 500);
  }

  let inputText;
  try {
    const payload = req.body || {};
    log(`Raw payload: ${JSON.stringify(payload)}`);
    
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
      body: { error: 'Send JSON: {"inputText":"Your message"}' }
    }, 400);
  }

  try {
    log(`Calling OpenRouter with: ${inputText.substring(0, 50)}...`);
    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mixtral-8x7b',
        messages: [{ role: 'user', content: inputText }],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000
      }
    );

    const result = aiResponse.data.choices[0]?.message?.content?.trim();
    log('OpenRouter success');

    return res.json({
      statusCode: 200,
      body: { response: result }
    });
  } catch (err) {
    error(`OpenRouter error: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    return res.json({
      statusCode: err.response?.status || 502,
      body: {
        error: 'AI service unavailable',
        details: err.response?.data || err.message
      }
    }, err.response?.status || 502);
  }
};
