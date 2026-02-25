export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voice } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key missing in Vercel settings!' });
  }

  // The Director's Note forces the epic, emotional tone
  const promptText = `Director's Note: Read the following Bangla text as a captivating historical Islamic epic story. Use a reverent, deeply emotional, and dramatic storytelling tone with natural human pacing.\n\nText to read: ${text}`;

  try {
    // Explicitly targeting the Flash TTS model to bypass the Pro quota limit
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice // Autonoe or Zubenelgenubi
              }
            }
          }
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // Extract the base64 audio string
    const inlineData = data.candidates[0].content.parts[0].inlineData;
    
    res.status(200).json({ 
      audioContent: inlineData.data,
      mimeType: inlineData.mimeType 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to Gemini API. Please check your network.' });
  }
}
