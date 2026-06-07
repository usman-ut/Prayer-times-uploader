export default async function handler(req, res) {
  const { imageBase64 } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const GH_TOKEN = process.env.GITHUB_TOKEN;

  if (!GEMINI_KEY || !GH_TOKEN) {
    console.log("Keys:", { GEMINI_KEY: !!GEMINI_KEY, GH_TOKEN: !!GH_TOKEN });
    return res.status(400).json({ error: 'Missing keys. Check Vercel env vars.' });
  }

  return res.json({ success: true });
}
