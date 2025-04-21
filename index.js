const axios = require('axios');

module.exports = async function (req, res) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Debug: Log full request object (for troubleshooting)
  console.log('Full Request Object:', JSON.stringify(req, null, 2));

  // Check if OpenAI API key exists
  if (!apiKey) {
    console.error('OpenAI API Key is missing!');
    return res.json({
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration: OpenAI API key not set.' }),
    });
  }

  let inputText;
  let payload = {};

  // Parse incoming data (handle both req.body and req.payload)
  try {
    if (req.body) {
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (req.payload) {
      payload = typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload;
    } else {
      console.error('No valid payload found in request.');
      return res.json({
        statusCode: 400,
        body: JSON.stringify({ error: 'No input data provided.' }),
      });
    }

    inputText = payload.inputText;
    console.log('Parsed Payload:', payload);
  } catch (err) {
    console.error('Payload parsing failed:', err.message);
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON format. Send { "inputText": "your text" }' }),
    });
  }

  // Validate input
  if (!inputText || typeof inputText !== 'string') {
    console.error('Invalid inputText:', inputText);
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Valid "inputText" string is required.' }),
    });
  }

  // Call OpenAI API
  try {
    const openAiResponse = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003', // Consider updating to newer models like gpt-3.5-turbo
        prompt: inputText,
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10-second timeout
      }
    );

    const aiText = openAiResponse.data.choices[0]?.text?.trim() || 'No response from AI.';
    
    return res.json({
      statusCode: 200,
      body: JSON.stringify({ response: aiText }),
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    return res.json({
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ 
        error: 'OpenAI API failed',
        details: error.response?.data || error.message 
      }),
    });
  }
};