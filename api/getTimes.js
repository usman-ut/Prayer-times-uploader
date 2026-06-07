export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('https://raw.githubusercontent.com/usman-ut/Prayer-times/main/timetable.json');
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({error: e.message});
  }
}
