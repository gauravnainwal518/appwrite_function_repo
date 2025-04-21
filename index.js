const axios = require('axios');

module.exports = async function (req, res) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Debug logs
  console.log('🔐 OpenAI API Key:', apiKey ? '✅ Present' : '❌ Missing');
  console.log('📦 Incoming Payload (raw):', req.bodyRaw);
  console.log('🧾 Request Headers:', req.headers);

  let inputText;

  try {
    const payload = JSON.parse(req.bodyRaw || '{}');
    inputText = payload.inputText;
  } catch (err) {
    console.error('❌ Failed to parse payload:', err.message);
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid payload format.' }),
    });
  }

  if (!inputText) {
    console.log('⚠️ Input text is missing!');
    return res.json({
      statusCode: 400,
      body: JSON.stringify({ error: 'Input text is required.' }),
    });
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
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiText = openAiResponse.data.choices[0].text.trim();

    console.log('✅ OpenAI Response:', aiText);

    res.json({
      statusCode: 200,
      body: JSON.stringify({ response: aiText }),
    });
  } catch (error) {
    console.error('❌ Error from OpenAI API:', error.message);
    res.json({
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    });
  }
};
