module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ ok: true, tokenConfigured: !!process.env.POSTMARK_SERVER_TOKEN });
};
