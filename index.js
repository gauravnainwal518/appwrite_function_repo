const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  // 1. Initialize (Appwrite now provides log/error helpers)
  const apiKey = process.env.OPENAI_API_KEY;
  log('Execution started'); // Proper logging
  
  // 2. Validate API Key
  if (!apiKey) {
    error('OpenAI API key missing');
    return res.json({ 
      statusCode: 500,
      body: { error: 'Server misconfiguration' }
    }, 500);
  }

  // 3. Parse Input (Appwrite-specific method)
  let inputText;
  try {
    // Appwrite now provides parsed JSON automatically
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

  // 4. Call OpenAI (Updated endpoint for newer versions)
  try {
    log(`Calling OpenAI with: ${inputText.substring(0, 50)}...`);
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // or gpt-4 depending on your use case
        messages: [{ role: 'user', content: inputText }],
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

    const result = aiResponse.data.choices[0]?.message?.content?.trim();
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
