const axios = require('axios');

module.exports = async function (context) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Logs
  context.log('🔐 OpenAI API Key:', apiKey ? '✅ Present' : '❌ Missing');
  context.log('📦 Incoming Payload (raw):', context.req.bodyRaw);
  context.log('🧾 Request Headers:', context.req.headers);

  let inputText;

  try {
    const payload = JSON.parse(context.req.bodyRaw || '{}');
    inputText = payload.inputText;
  } catch (err) {
    context.error('❌ Failed to parse payload:', err.message);
    return context.res.send(JSON.stringify({ error: 'Invalid payload format.' }), 400);
  }

  if (!inputText) {
    context.log('⚠️ Input text is missing!');
    return context.res.send(JSON.stringify({ error: 'Input text is required.' }), 400);
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

    context.log('✅ OpenAI Response:', aiText);

    return context.res.send(JSON.stringify({ response: aiText }), 200);
  } catch (error) {
    context.error('❌ Error from OpenAI API:', error.message);
    return context.res.send(JSON.stringify({ error: error.message }), 500);
  }
};
