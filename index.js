const axios = require('axios');

module.exports = async function (req, res) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Log incoming request body and headers for debugging
  console.log('Incoming Request Body:', req.body);
  console.log('Request Headers:', req.headers);

  // Get inputText from either payload or body
  const inputText = req.body?.inputText || req.payload?.inputText;

  // Check if inputText is provided
  if (!inputText) {
    console.error('Input text is missing!');
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Input text is required.' }),
    });
  }

  try {
    // Send request to OpenAI API
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

    // Return AI response
    res.json({
      statusCode: 200,
      body: JSON.stringify({ response: aiText }),
    });
  } catch (error) {
    // Handle API errors
    console.error('Error from OpenAI API:', error.message);
    res.json({
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    });
  }
};
