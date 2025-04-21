const axios = require('axios');

module.exports = async function (req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // Debug: Log raw request data (critical for troubleshooting)
  console.log('Raw request data:', {
    body: req.body,
    payload: req.payload,
    headers: req.headers
  });

  // 1. Handle missing API key
  if (!apiKey) {
    console.error('Missing OpenAI API Key');
    return res.json({
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    });
  }

  // 2. Safely extract and parse input
  let inputText;
  try {
    // Priority: req.body > req.payload > raw request
    const rawData = req.body || req.payload || '{}';
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    
    inputText = data.inputText;
    
    if (!inputText) {
      console.error('Missing inputText in payload:', data);
      return res.json({
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: inputText' })
      });
    }
  } catch (err) {
    console.error('JSON parsing failed:', err.message);
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Invalid JSON format',
        solution: 'Send {"inputText":"Your message"} as raw JSON'
      })
    });
  }

  // 3. Call OpenAI API
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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return res.json({
      statusCode: 200,
      body: JSON.stringify({ 
        response: response.data.choices[0]?.text?.trim() 
      })
    });
  } catch (error) {
    console.error('OpenAI API error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return res.json({
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'OpenAI API request failed',
        details: error.response?.data || error.message
      })
    });
  }
};