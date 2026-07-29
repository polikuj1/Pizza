import 'dotenv/config';

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

export const PERMISSIONS = ['admin', 'pos', 'tables', 'history', 'users', 'menu', 'stats'] as const;
export type Permission = (typeof PERMISSIONS)[number];
