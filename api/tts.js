export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, emotion } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key missing in Vercel settings!' });
  }

  // Setting the voice based on a simple logic: 
  // If 'excited' or 'story' we'll use Autonoe (Female), otherwise Zubenelgenubi (Male)
  // You can also add a toggle to your HTML later to choose specifically!
  const voiceName = (emotion === 'excited' || emotion === 'story') 
    ? 'Autonoe' 
    : 'Zubenelgenubi';

  try {
    // Calling the Gemini 2.5 TTS API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:predict?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generativeContent: {
          parts: [{ text: text }]
        },
        generationConfig: {
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName 
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

    // Gemini returns the audio in a slightly different format
    const audioData = data.predictions[0].audioContents;
    res.status(200).json({ audioContent: audioData });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to Gemini AI Studio' });
  }
}
