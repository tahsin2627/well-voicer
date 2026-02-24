export default async function handler(req, res) {
  // Only allow POST requests from our frontend
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, emotion } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY; // We will add this in Vercel later

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing in Vercel setup!' });
  }

  // This is the "Expressive" magic using SSML
  let ssmlText = `<speak>${text}</speak>`;
  
  if (emotion === 'excited') {
    // Faster rate, higher pitch
    ssmlText = `<speak><prosody rate="fast" pitch="+2st">${text}</prosody></speak>`;
  } else if (emotion === 'serious') {
    // Slower rate, lower pitch
    ssmlText = `<speak><prosody rate="slow" pitch="-2st">${text}</prosody></speak>`;
  } else if (emotion === 'story') {
    // Moderate pace with slight emphasis
    ssmlText = `<speak><prosody rate="medium" volume="loud">${text}</prosody></speak>`;
  }

  try {
    const googleResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml: ssmlText },
        // Using the high-quality Bangladesh Bangla Wavenet Voice
        voice: { languageCode: 'bn-BD', name: 'bn-BD-Wavenet-A' },
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

    const data = await googleResponse.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // Send the audio file back to the phone
    res.status(200).json({ audioContent: data.audioContent });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to Google' });
  }
}
