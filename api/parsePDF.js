export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GEMINI_API_KEY || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Missing API keys' });
  }

  try {
    // Send image to Gemini
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Extract prayer times from this timetable image. Return ONLY valid JSON with this exact structure:\n{\n  \"month\": \"June\",\n  \"year\": 2026,\n  \"monthIndex\": 5,\n  \"islamicMonth\": \"Zul-Hijjah / Muharram\",\n  \"masjid\": \"Azharul Madaaris · Bradford\",\n  \"fajrJ_weekday\": \"4:10\",\n  \"fajrJ_weekend\": \"4:00\",\n  \"zohrJ_weekday\": \"2:00\",\n  \"zohrJ_friday\": \"1:30\",\n  \"asrJ_weekday\": \"7:30\",\n  \"asrJ_weekend\": \"7:40\",\n  \"days\": [null, {\"fajr\": \"HH:MM\", \"sr\": \"HH:MM\", \"zohr\": \"HH:MM\", \"asr\": \"HH:MM\", \"mag\": \"HH:MM\", \"isha\": \"HH:MM\", \"magJ\": \"HH:MM\", \"ishaJ\": \"HH:MM\"}, ...]\n}\nExtract times exactly as shown. Return ONLY the JSON, no other text.",
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          }]
        }]
      })
    });

    const geminiData = await geminiRes.json();
    const jsonText = geminiData.contents[0].parts[0].text;
    
    // Parse JSON from response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(400).json({ error: 'Could not extract JSON from image' });
    }
    
    const timetableData = JSON.parse(jsonMatch[0]);

    // Update GitHub
    const octokit = new (await import('@octokit/rest')).Octokit({
      auth: GITHUB_TOKEN
    });

    const fileContent = JSON.stringify(timetableData, null, 2);
    const base64Content = Buffer.from(fileContent).toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner: 'usman-ut',
      repo: 'Prayer-times',
      path: 'timetable.json',
      message: `Update prayer times from image - ${new Date().toLocaleDateString()}`,
      content: base64Content
    });

    return res.status(200).json({ success: true, message: 'Timetable updated!' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
