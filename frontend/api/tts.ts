export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const cleanText = text.replace(/[*_#`]/g, '').trim();
  const apiKey =
    process.env.ELEVENLABS_API_KEY || 'sk_19e8cb2386f1ab9f298302f94336203c6b858467b79d3c71';
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (elevenRes.ok) {
      const buffer = await elevenRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.byteLength);
      return res.status(200).send(Buffer.from(buffer));
    } else {
      const errText = await elevenRes.text();
      console.warn('ElevenLabs API response status:', elevenRes.status, errText);
      return res.status(503).json({ error: 'TTS fallback needed', status: elevenRes.status });
    }
  } catch (err: any) {
    console.warn('TTS streaming exception:', err);
    return res.status(500).json({ error: 'TTS server error', message: err.message });
  }
}
