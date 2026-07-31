// 前後端共用型別。物理上放在 backend/src/ 底下是刻意的：後端用 tsc 真的把這裡的檔案編譯成 dist/*.js，
// rootDir 限制檔案必須在 src/ 之下；前端用 vite（noEmit，不受 rootDir 限制）可以自由用相對路徑跨資料夾
// import，所以讓「會被 rootDir 綁住」的那一邊當 host，前端跨過去讀，兩邊都不用碰打包設定。
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

export type OrderChannel = 'walkin' | 'ig' | 'phone';

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
  paid: boolean;
  createdAt: string;
  servedAt: string | null;
  completedAt: string | null;
}

export interface CartItemInput {
  id: string;
  qty: number;
  cheese: boolean;
  temp?: 'ice' | 'hot';
}

export const PERMISSIONS = ['admin', 'pos', 'tables', 'history', 'users', 'menu', 'stats'] as const;
export type Permission = (typeof PERMISSIONS)[number];
