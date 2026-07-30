import 'dotenv/config';

export { PERMISSIONS, type Permission } from './shared/types';

export const config = {
  cheeseUpcharge: Number(process.env.CHEESE_UPCHARGE ?? 50),
  pickupEstimateMinutes: Number(process.env.PICKUP_ESTIMATE_MINUTES ?? 20),
};

export const CATEGORIES = [
  { id: 'pizza', label: 'Pizza' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'snacks', label: 'Snacks' },
];

export const TABLES = [1, 2, 3, 4, 5];
