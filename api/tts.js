export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voice } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key missing in Vercel!' });
  }

  const selectedVoice = voice === 'DUAL' ? 'Zubenelgenubi' : voice;

  let promptText = `Director's Note: Analyze the cultural and emotional core of the following text. Deliver this as a premium, captivating epic story.\n\n`;
  if (voice === 'DUAL') {
    promptText += `CRITICAL INSTRUCTION: You must act in a "Dual Voice" format. Use a grounded voice for narration, but dramatically shift your vocal tone and pitch to sound like a different person whenever you read dialogue inside quotes.\n\n`;
  }
  promptText += `Text to perform: ${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
        }
      })
    });

    // We catch the raw text first in case Vercel times out and sends an HTML error
    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: 'Server Timeout: Try generating a shorter story.' });
    }

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // THE FIX: Check if the AI secretly returned text instead of audio
    if (!data.candidates || !data.candidates[0].content.parts[0].inlineData) {
      const warningText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unknown AI rejection.";
      return res.status(500).json({ error: "AI did not return audio. It said: " + warningText.substring(0, 100) });
    }

    const inlineData = data.candidates[0].content.parts[0].inlineData;
    
    res.status(200).json({ 
      audioContent: inlineData.data,
      mimeType: inlineData.mimeType || 'audio/wav'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to AI server.' });
  }
}
