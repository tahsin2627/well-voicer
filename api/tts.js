export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voice } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key missing in Vercel settings!' });
  }

  // The Magic Secret: We use a "Director's Note" to force automatic expression
  const promptText = `Director's Note: Read the following Bangla text as a captivating historical Islamic epic story. Use a reverent, deeply emotional, and dramatic storytelling tone with natural human pacing.\n\nText to read: ${text}`;

  try {
    // Switched to the Flash model to bypass the "limit: 0" quota error!
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
                voiceName: voice // This passes 'Autonoe' or 'Zubenelgenubi'
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

    // Extracting the audio file correctly from the Gemini structure
    const inlineData = data.candidates[0].content.parts[0].inlineData;
    
    res.status(200).json({ 
      audioContent: inlineData.data,
      mimeType: inlineData.mimeType 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to Gemini API. Please check your network.' });
  }
}
