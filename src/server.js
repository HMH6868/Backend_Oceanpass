import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// routes
app.use('/api/auth', authRoutes);

// error handler chung
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ ok: false, message: err.message || 'Internal Error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
