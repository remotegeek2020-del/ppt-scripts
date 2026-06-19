require('dotenv').config();
const express = require('express');
const { getStats, getMessages } = require('./postmark');

const app = express();
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function defaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toDateStr(from), to: toDateStr(to) };
}

function getToken(req) {
  return process.env.POSTMARK_SERVER_TOKEN || req.headers['x-postmark-token'];
}

app.get('/api/stats', async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(400).json({ error: 'Missing Postmark server token' });

  const defaults = defaultDates();
  const fromdate = req.query.fromdate || defaults.from;
  const todate = req.query.todate || defaults.to;

  try {
    const stats = await getStats(token, fromdate, todate);
    res.json(stats);
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
});

app.get('/api/messages', async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(400).json({ error: 'Missing Postmark server token' });

  const defaults = defaultDates();
  const fromdate = req.query.fromdate || defaults.from;
  const todate = req.query.todate || defaults.to;
  const subject = req.query.subject || '';

  try {
    const messages = await getMessages(token, fromdate, todate, subject);

    // Group by subject and aggregate status counts
    const grouped = {};
    for (const msg of messages) {
      const subj = msg.Subject || '(no subject)';
      if (!grouped[subj]) {
        grouped[subj] = {
          subject: subj,
          sent: 0,
          delivered: 0,
          opened: 0,
          bounced: 0,
          spam: 0,
          unsubscribed: 0,
          other: 0,
        };
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
    res.json({ total: messages.length, capped: messages.length >= 10000, subjects });
  } catch (err) {
    const msg = err.response?.data?.Message || err.message;
    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Postmark Dashboard → http://localhost:${PORT}`);
});
