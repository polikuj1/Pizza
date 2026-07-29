export interface MenuItem {
  id: string;
  zh: string;
  en: string;
  description: string;
  price: number;
  category: string;
  hasTemp: boolean;
  soldOut: boolean;
  enabled: boolean;
}

export interface Category {
  id: string;
  label: string;
}

export interface OrderLine {
  id: string;
  zh: string;
  qty: number;
  cheese: boolean;
  temp: 'ice' | 'hot';
  unitPrice: number;
  lineTotal: number;
  cheeseSuffix: string;
  tempSuffix: string;
}

export type OrderChannel = 'walkin' | 'ig';

export interface Order {
  id: number;
  items: OrderLine[];
  total: number;
  customerName: string;
  customerPhone: string;
  note: string;
  payment: 'store' | 'online';
  status: number;
  orderType: 'online' | 'dinein' | 'takeout';
  table: number | null;
  channel: OrderChannel | null;
  pickupDate: string | null;
  pickupTime: string | null;
  createdAt: string;
  servedAt: string | null;
  completedAt: string | null;
}

export interface AppConfig {
  cheeseUpcharge: number;
  pickupEstimateMinutes: number;
  storeOpen: boolean;
}

export interface CartLineState {
  itemId: string;
  qty: number;
  cheese: boolean;
  temp: 'ice' | 'hot';
}

export type Cart = Record<string, CartLineState>;

export type Permission = 'admin' | 'pos' | 'tables' | 'history' | 'users' | 'menu' | 'stats';

export type StatsRange = 'day' | 'week' | 'month' | 'custom';

export interface StatsRevenueBucket {
  label: string;
  date: string | null;
  revenue: number;
  orderCount: number;
}

export interface StatsOrderTypeBreakdown {
  orderType: Order['orderType'];
  revenue: number;
  orderCount: number;
}

export interface StatsItemRankingEntry {
  itemId: string;
  zh: string;
  qty: number;
  revenue: number;
}

export interface StatsSummary {
  range: StatsRange;
  startDate: string;
  endDate: string;
  itemCategory: string | null;
  revenue: { buckets: StatsRevenueBucket[] };
  orderTypes: { breakdown: StatsOrderTypeBreakdown[] };
  itemRanking: { items: StatsItemRankingEntry[] };
}

export type TableCell =
  | { num: number; occupied: false }
  | { num: number; occupied: true; orders: Order[] };

export interface OrderHistoryPage {
  orders: Order[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface StaffUser {
  id: number;
  username: string;
  permissions: Permission[];
  createdAt: string;
}
