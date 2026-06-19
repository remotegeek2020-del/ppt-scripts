const { getMessages, getBounces, getOpens, getClicks } = require('../postmark');

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
    const [messages, bounces, opens, clicks] = await Promise.all([
      getMessages(token, fromdate, todate, subject, 5000),
      getBounces(token, fromdate, todate, 5000).catch(() => []),
      getOpens(token, fromdate, todate).catch(() => []),
      getClicks(token, fromdate, todate).catch(() => []),
    ]);

    // Build MessageID → subject lookup from messages we fetched
    const msgSubject = {};
    for (const msg of messages) {
      msgSubject[msg.MessageID] = msg.Subject || '(no subject)';
    }

    // Unique recipients who opened / clicked (one count per message)
    const openedMsgIds = new Set(opens.map(o => o.MessageID));
    const clickedMsgIds = new Set(clicks.map(c => c.MessageID));

    // Group by subject
    const grouped = {};
    for (const msg of messages) {
      const subj = msg.Subject || '(no subject)';
      if (!grouped[subj]) {
        grouped[subj] = { subject: subj, sent: 0, opened: 0, clicked: 0, bounced: 0 };
      }
      grouped[subj].sent++;
      if (openedMsgIds.has(msg.MessageID)) grouped[subj].opened++;
      if (clickedMsgIds.has(msg.MessageID)) grouped[subj].clicked++;
    }

    // Merge bounce counts from Bounces API (accurate source)
    for (const b of bounces) {
      const subj = b.Subject || '(no subject)';
      if (subject && !subj.toLowerCase().includes(subject.toLowerCase())) continue;
      if (!grouped[subj]) grouped[subj] = { subject: subj, sent: 0, opened: 0, clicked: 0, bounced: 0 };
      grouped[subj].bounced++;
    }

    const subjects = Object.values(grouped).sort((a, b) => b.sent - a.sent);
    res.json({ total: messages.length, capped: messages.length >= 5000, subjects });
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
};
