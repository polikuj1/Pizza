// 跟後端共用的型別直接從 backend/src/shared/types.ts 引用（見該檔案開頭的說明），避免兩邊各自手刻同一組型別、改了忘記同步
import type { MenuItem, OrderLine, OrderChannel, Order, Permission, CartItemInput } from '../../backend/src/shared/types';
export type { MenuItem, OrderLine, OrderChannel, Order, Permission, CartItemInput };

export interface Category {
  id: string;
  label: string;
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
