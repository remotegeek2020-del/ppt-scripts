const { getOpens } = require('../postmark');

function dateStr(d) { return d.toISOString().split('T')[0]; }

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const token = process.env.POSTMARK_SERVER_TOKEN || req.headers['x-postmark-token'];
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const today = dateStr(new Date());

  try {
    const opens = await getOpens(token, today, today, 1000);

    opens.sort((a, b) => new Date(b.ReceivedAt) - new Date(a.ReceivedAt));

    res.json({
      opens: opens.map(o => ({
        email: o.Recipient,
        at: o.ReceivedAt,
        firstOpen: o.FirstOpen,
        messageId: o.MessageID,
      })),
    });
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
};
