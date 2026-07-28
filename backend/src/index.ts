import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { menuRouter } from './routes/menu';
import { ordersRouter } from './routes/orders';
import { config } from './config';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/config', (_req, res) => res.json(config));
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: '伺服器錯誤' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`pizza backend listening on :${port}`));
