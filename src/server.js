import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import portsRoutes from './routes/ports.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import routesRoutes from './routes/routes.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// routes
app.use('/api/auth', authRoutes);

//API cập nhật thông tin user
app.use('/api/users', userRoutes);

//API lấy danh sách khuyến mãi
app.use('/api/promotions', promotionsRoutes);

//API lấy danh sách cảng
app.use('/api/ports', portsRoutes);

//API lấy danh sách tuyến
app.use('/api/routes', routesRoutes);

// ==== phần xủ lý lỗi ====
// error handler chung
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // log ra console cho dev
  console.error(err);

  // trả JSON thay vì HTML
  res.status(status).json({
    ok: false,
    message,
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
