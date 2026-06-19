const { getMessages, getBounces } = require('../postmark');

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
    // Fetch messages and bounces in parallel
    const [messages, bounces] = await Promise.all([
      getMessages(token, fromdate, todate, subject, 5000),
      getBounces(token, fromdate, todate, 5000).catch(() => []),
    ]);

    // Index bounces by subject
    const bouncesBySubject = {};
    for (const b of bounces) {
      const subj = b.Subject || '(no subject)';
      // If subject filter is active, only count matching bounces
      if (subject && !subj.toLowerCase().includes(subject.toLowerCase())) continue;
      bouncesBySubject[subj] = (bouncesBySubject[subj] || 0) + 1;
    }

    // Group messages by subject — sent count only (status is unreliable for delivered/opened)
    const grouped = {};
    for (const msg of messages) {
      const subj = msg.Subject || '(no subject)';
      if (!grouped[subj]) {
        grouped[subj] = { subject: subj, sent: 0, bounced: 0 };
      }
      grouped[subj].sent++;
    }

    // Merge bounce counts
    for (const [subj, count] of Object.entries(bouncesBySubject)) {
      if (grouped[subj]) {
        grouped[subj].bounced = count;
      } else {
        // Bounce subject not in messages list (outside date range edge case)
        grouped[subj] = { subject: subj, sent: 0, bounced: count };
      }
    }

    const subjects = Object.values(grouped).sort((a, b) => b.sent - a.sent);
    res.json({ total: messages.length, capped: messages.length >= 5000, subjects });
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
};
