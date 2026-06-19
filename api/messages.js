const { getMessages } = require('../postmark');

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
  const subject = req.query.subject || '';

  try {
    const messages = await getMessages(token, fromdate, todate, subject, 5000);

    const grouped = {};
    for (const msg of messages) {
      const subj = msg.Subject || '(no subject)';
      if (!grouped[subj]) {
        grouped[subj] = { subject: subj, sent: 0, delivered: 0, opened: 0, bounced: 0, spam: 0, unsubscribed: 0, other: 0 };
      }
      const g = grouped[subj];
      g.sent++;
      const status = (msg.Status || '').toLowerCase();
      if (status === 'delivered') g.delivered++;
      else if (status === 'opened') { g.delivered++; g.opened++; }
      else if (status.includes('bounce')) g.bounced++;
      else if (status === 'spamcomplaint') g.spam++;
      else if (status === 'unsubscribe') g.unsubscribed++;
      else g.other++;
    }

    const subjects = Object.values(grouped).sort((a, b) => b.sent - a.sent);
    res.json({ total: messages.length, capped: messages.length >= 5000, subjects });
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
};
