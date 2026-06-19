const { getMessages, getOpens, getClicks } = require('../postmark');

function dateStr(d) { return d.toISOString().split('T')[0]; }

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const token = process.env.POSTMARK_SERVER_TOKEN || req.headers['x-postmark-token'];
  if (!token) return res.status(400).json({ error: 'Missing Postmark token.' });

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromdate = req.query.fromdate || dateStr(from);
  const todate = req.query.todate || dateStr(to);
  const subject = req.query.subject || '';

  if (!subject) return res.status(400).json({ error: 'subject is required' });

  try {
    const [messages, opens, clicks] = await Promise.all([
      getMessages(token, fromdate, todate, subject, 2000),
      getOpens(token, fromdate, todate).catch(() => []),
      getClicks(token, fromdate, todate).catch(() => []),
    ]);

    // Index by MessageID — only messages matching this subject
    const msgIndex = {};
    for (const msg of messages) {
      const email =
        (msg.Recipients && msg.Recipients[0]) ||
        (typeof msg.To === 'string' ? msg.To : '') ||
        '';
      msgIndex[msg.MessageID] = {
        email,
        sentAt: msg.ReceivedAt,
        status: msg.Status || 'Unknown',
        opens: 0,
        clicks: 0,
      };
    }

    for (const open of opens) {
      if (msgIndex[open.MessageID]) msgIndex[open.MessageID].opens++;
    }

    for (const click of clicks) {
      if (msgIndex[click.MessageID]) msgIndex[click.MessageID].clicks++;
    }

    const recipients = Object.values(msgIndex).sort(
      (a, b) => b.opens - a.opens || new Date(b.sentAt) - new Date(a.sentAt)
    );

    res.json({ total: recipients.length, recipients });
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
};
