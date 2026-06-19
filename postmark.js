const axios = require('axios');

const BASE = 'https://api.postmarkapp.com';

function client(token) {
  return axios.create({
    baseURL: BASE,
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': token,
    },
  });
}

async function getStats(token, fromdate, todate) {
  const api = client(token);
  const params = { fromdate, todate };

  const outbound = await api.get('/stats/outbound', { params });

  let unsubscribes = 0;
  try {
    const unsubs = await api.get('/stats/outbound/unsubscribes', { params });
    unsubscribes = unsubs.data.Unsubscribes || 0;
  } catch (_) {
    // endpoint not available on all plans — skip silently
  }

  const o = outbound.data;
  return {
    sent: o.Sent || 0,
    bounced: o.Bounced || 0,
    bounceRate: o.BounceRate || 0,
    spamComplaints: o.SpamComplaints || 0,
    opens: o.Opens || 0,
    uniqueOpens: o.UniqueOpens || 0,
    totalClicks: o.TotalClicks || 0,
    uniqueClicks: o.UniqueLinksClicked || 0,
    withOpenTracking: o.WithOpenTracking || 0,
    withLinkTracking: o.WithLinkTracking || 0,
    unsubscribes,
  };
}

async function getMessages(token, fromdate, todate, subject = '', maxMessages = 10000) {
  const api = client(token);
  const messages = [];
  let offset = 0;
  const count = 500;

  while (messages.length < maxMessages) {
    const params = { count, offset, fromdate, todate };
    if (subject) params.subject = subject;

    const res = await api.get('/messages/outbound', { params });
    const batch = res.data.Messages || [];

    if (batch.length === 0) break;

    messages.push(...batch);
    offset += batch.length;

    if (messages.length >= res.data.TotalCount) break;
  }

  return messages;
}

module.exports = { getStats, getMessages };
