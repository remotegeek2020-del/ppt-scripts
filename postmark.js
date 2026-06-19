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

async function getBounces(token, fromdate, todate, maxBounces = 5000) {
  const api = client(token);
  const bounces = [];
  let offset = 0;
  const count = 500;

  while (bounces.length < maxBounces) {
    const params = { count, offset, fromdate, todate };
    const res = await api.get('/bounces', { params });
    const batch = res.data.Bounces || [];
    if (batch.length === 0) break;
    bounces.push(...batch);
    offset += batch.length;
    if (bounces.length >= res.data.TotalCount) break;
  }

  return bounces;
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

async function paginate(api, path, resultKey, maxItems = 5000) {
  const items = [];
  let offset = 0;
  const count = 500;
  while (items.length < maxItems) {
    const res = await api.get(path, { params: { count, offset } });
    const batch = res.data[resultKey] || [];
    if (batch.length === 0) break;
    items.push(...batch);
    offset += batch.length;
    if (items.length >= res.data.TotalCount) break;
  }
  return items;
}

async function getOpens(token, fromdate, todate) {
  const api = client(token);
  const items = [];
  let offset = 0;
  const count = 500;
  while (items.length < 10000) {
    const res = await api.get('/messages/outbound/opens', { params: { count, offset, fromdate, todate } });
    const batch = res.data.Opens || [];
    if (batch.length === 0) break;
    items.push(...batch);
    offset += batch.length;
    if (items.length >= res.data.TotalCount) break;
  }
  return items;
}

async function getClicks(token, fromdate, todate) {
  const api = client(token);
  const items = [];
  let offset = 0;
  const count = 500;
  while (items.length < 10000) {
    const res = await api.get('/messages/outbound/clicks', { params: { count, offset, fromdate, todate } });
    const batch = res.data.Clicks || [];
    if (batch.length === 0) break;
    items.push(...batch);
    offset += batch.length;
    if (items.length >= res.data.TotalCount) break;
  }
  return items;
}

module.exports = { getStats, getMessages, getBounces, getOpens, getClicks };
