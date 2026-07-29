import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { menuRouter } from './routes/menu';
import { ordersRouter } from './routes/orders';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { statsRouter } from './routes/stats';
import { configRouter } from './routes/config';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/config', configRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: '伺服器錯誤' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`pizza backend listening on :${port}`));
