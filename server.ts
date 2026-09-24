import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Health check endpoints for container orchestrators (Cloud Run, Kubernetes)
app.get(['/healthz', '/health', '/livez', '/readyz'], (_req, res) => {
  res.status(200).send('OK');
});

// Serve static files from Vite build directory with caching
app.use(express.static(path.join(__dirname, 'dist'), { maxAge: '1h' }));

// SPA fallback to index.html for client-side routing
app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('<!doctype html><html><head><title>Khubaib Salafi Portfolio</title></head><body><div id="root"></div></body></html>');
    }
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
