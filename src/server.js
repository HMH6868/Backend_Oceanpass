import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import otpRoutes from './routes/otp.routes.js';
import portsRoutes from './routes/ports.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import routesRoutes from './routes/routes.routes.js';
import userRoutes from './routes/user.routes.js';
import vesselRoutes from './routes/vessel.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import passwordRoutes from './routes/password.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));


// routes
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/auth', passwordRoutes); // forgot-password, reset-password

//API cập nhật thông tin user
app.use('/api/users', userRoutes);

//API lấy danh sách khuyến mãi
app.use('/api/promotions', promotionsRoutes);

//API lấy danh sách cảng
app.use('/api/ports', portsRoutes);

//API lấy danh sách tuyến
app.use('/api/routes', routesRoutes);

app.use('/api/vessels', vesselRoutes);


// ==== phần xử lý lỗi tập trung ====
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
