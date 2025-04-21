const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  log('Execution started');

  if (!apiKey) {
    error('OpenAI API key missing');
    return res.json({
      statusCode: 500,
      body: { error: 'Server misconfiguration' }
    }, 500);
  }

  // 👇 Change made here
  let inputText;
  try {
    const payload = JSON.parse(req.payload || '{}'); // <-- KEY FIX
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
    log(`Calling OpenAI with: ${inputText.substring(0, 50)}...`);
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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    const result = aiResponse.data.choices[0]?.text?.trim();
    log('OpenAI success');
    
    return res.json({
      statusCode: 200,
      body: { response: result }
    });
  } catch (err) {
    error(`OpenAI error: ${err.response?.data || err.message}`);
    return res.json({
      statusCode: err.response?.status || 502,
      body: {
        error: 'AI service unavailable',
        details: err.response?.data || err.message
      }
    }, err.response?.status || 502);
  }
};
