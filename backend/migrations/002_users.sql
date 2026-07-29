CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 沿用原本 .env 共用帳密（帳號 staff，密碼見團隊內部密碼管理工具），已用 scrypt 雜湊
INSERT INTO users (username, password_hash, permissions) VALUES
  ('staff', '366cb876c4aba35f4a93ca3416a86d6f:2053f14e86f11c072680d9d188d21efa7f2bc79f8d32637adb95153fed087e90c409c4d83dc5831d915c586f04fc44932b6f62f0fb5e0f768c7b90a75fbbeced',
   ARRAY['admin', 'pos', 'tables', 'history', 'users']);
