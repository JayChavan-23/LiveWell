export function notFound(_req, res) {
  res.status(404).json({ error: 'Not Found' });
}
export function errorHandler(err, _req, res, _next) {
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
