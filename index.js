const axios = require('axios');

module.exports = async function (req, res) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Log OpenAI API Key for confirmation
  console.log('OpenAI API Key:', apiKey);

  // Log incoming request body and headers
  console.log('Incoming Payload (raw):', req.payload);
  console.log('Request Headers:', req.headers);

  let inputText;

  // Check if we have a valid payload
  try {
    // Ensure payload is valid and parse it
    const payload = req.payload ? JSON.parse(req.payload) : {};
    inputText = payload.inputText;
    console.log('Parsed Payload:', payload);  // Log parsed payload
  } catch (err) {
    console.error('Failed to parse payload:', err.message);
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid payload format.' }),
    });
  }

  // If inputText is missing, return error
  if (!inputText) {
    console.log('Input text is missing!');
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Input text is required.' }),
    });
  }

  // Send the request to OpenAI API
  try {
    const openAiResponse = await axios.post(
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
      }
    );

    const aiText = openAiResponse.data.choices[0].text.trim();

    res.json({
      statusCode: 200,
      body: JSON.stringify({ response: aiText }),
    });
  } catch (error) {
    console.error('Error from OpenAI API:', error.message);
    res.json({
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    });
  }
};
