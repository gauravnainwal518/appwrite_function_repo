const axios = require('axios');

module.exports = async function (req, res) {
  const { inputText } = req.payload;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!inputText) {
    res.status(400).send({ error: 'Input text is required.' });
    return;
  }

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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiText = openAiResponse.data.choices[0].text.trim();
    res.send({ response: aiText });
  } catch (error) {
    console.error('Error from OpenAI API:', error.message);
    res.status(500).send({ error: error.message });
  }
};
