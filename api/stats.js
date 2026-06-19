const { getStats } = require('../postmark');

function dateStr(d) { return d.toISOString().split('T')[0]; }

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const token = process.env.POSTMARK_SERVER_TOKEN || req.headers['x-postmark-token'];
  if (!token) {
    return res.status(400).json({ error: 'Missing Postmark token. Add POSTMARK_SERVER_TOKEN in Vercel → Project Settings → Environment Variables.' });
  }

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromdate = req.query.fromdate || dateStr(from);
  const todate = req.query.todate || dateStr(to);

  try {
    const stats = await getStats(token, fromdate, todate);
    res.json(stats);
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
};
