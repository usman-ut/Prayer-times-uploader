export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfBase64 } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GEMINI_API_KEY || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Missing API keys' });
  }

  try {
    // Send to Gemini
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Extract prayer times from this PDF timetable. Return ONLY this JSON structure with times in HH:MM format:\n{\"fajrJ_weekday\":\"4:10\",\"fajrJ_weekend\":\"4:00\",\"zohrJ_weekday\":\"2:00\",\"zohrJ_friday\":\"1:30\",\"asrJ_weekday\":\"7:30\",\"asrJ_weekend\":\"7:40\",\"days\":[null,{\"fajr\":\"2:29\",\"sr\":\"4:43\",\"zohr\":\"1:05\",\"asr\":\"6:43\",\"mag\":\"9:32\",\"isha\":\"10:32\",\"magJ\":\"9:32\",\"ishaJ\":\"10:42\"},...]}",
            inlineData: { mimeType: "application/pdf", data: pdfBase64 }
          }]
        }]
      })
    });

    const geminiData = await geminiRes.json();
    const prayerTimes = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // Update GitHub
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const fileContent = JSON.stringify(prayerTimes, null, 2);
    const encodedContent = Buffer.from(fileContent).toString('base64');

    const currentFile = await octokit.repos.getContent({
      owner: 'usman-ut',
      repo: 'Prayer-times',
      path: 'timetable.json'
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: 'usman-ut',
      repo: 'Prayer-times',
      path: 'timetable.json',
      message: 'Update prayer times from PDF',
      content: encodedContent,
      sha: currentFile.data.sha
    });

    res.status(200).json({ success: true, message: 'Prayer times updated!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
