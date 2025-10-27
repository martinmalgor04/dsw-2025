#!/usr/bin/env node

/**
 * Next.js Standalone Server with PORT environment variable support
 * This allows the server to listen on a custom port via environment variables
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Get port from environment or default to 3005
const port = parseInt(process.env.PORT || '3005', 10);
const hostname = process.env.HOSTNAME || 'localhost';

console.log(`[Next.js Server] Starting on ${hostname}:${port}`);

// Initialize Next.js app
const app = next({
  dev: false,
  dir: __dirname,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, () => {
    console.log(`✓ Ready on http://${hostname}:${port}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
