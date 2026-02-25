export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voice } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key missing in Vercel!' });
  }

  // Determine the actual AI voice to use
  const selectedVoice = voice === 'DUAL' ? 'Zubenelgenubi' : voice;

  // The Advanced Core-Observation Prompt
  let promptText = `Director's Note: Before speaking, analyze the cultural, historical, and emotional core of the following text, paying special attention to the deep linguistic nuances of Bangla or Arabic if present. Deliver this as a premium, captivating epic story. \n\n`;
  
  if (voice === 'DUAL') {
    promptText += `CRITICAL INSTRUCTION: You must act in a "Dual Voice" format. Use a grounded, cinematic voice for all general narration. However, whenever you encounter dialogue (text inside quotes or spoken by a character), dramatically shift your vocal tone, pitch, and emotion to sound like a completely different person speaking.\n\n`;
  }

  promptText += `Text to perform: ${text}`;

  try {
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
                voiceName: selectedVoice 
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

    // Safely extract the audio
    const inlineData = data.candidates[0].content.parts[0].inlineData;
    
    // Send it back cleanly to the frontend
    res.status(200).json({ 
      audioContent: inlineData.data
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to AI server.' });
  }
}
