CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  zh TEXT NOT NULL,
  en TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  has_temp BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  payment TEXT NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0,
  order_type TEXT NOT NULL,
  table_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  served_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER SEQUENCE orders_id_seq RESTART WITH 1001;

INSERT INTO menu_items (id, zh, en, description, price, category, has_temp) VALUES
  ('margherita', '瑪格麗特', 'Margherita', '蕃茄紅醬、羅勒', 290, 'pizza', false),
  ('sweetpotato', '蜜香地瓜', 'Sweet Potato', '地瓜、蜂蜜', 320, 'pizza', false),
  ('banana', '巧克蕉焦', 'Banana Chocolate', '香蕉、巧克力', 320, 'pizza', false),
  ('vegetable', '蔬菜派對', 'Vegetable', '時蔬大雜燴', 320, 'pizza', false),
  ('salami', '腸腸轟趴', 'Salami', '蕃茄紅醬、蘑菇、臘腸、紫洋蔥', 320, 'pizza', false),
  ('florentina', '佛倫提納', 'Florentina', '時蔬、培根、半熟蛋、大蒜', 350, 'pizza', false),
  ('prosciutto', '芝麻葉生火腿', 'Prosciutto', '芝麻葉、生火腿', 380, 'pizza', false),
  ('shrimp', '青醬鮮蝦', 'Pesto Shrimp', '自製青醬、紫洋蔥、紅黃椒、鮮蝦、松子', 380, 'pizza', false),
  ('americano', '美式', 'Americano', '甜度冰塊皆為固定比例', 100, 'drinks', true),
  ('latte', '拿鐵', 'Latte', '甜度冰塊皆為固定比例', 120, 'drinks', true),
  ('lemonamericano', '檸檬美式', 'Lemon Americano', '甜度冰塊皆為固定比例', 130, 'drinks', false),
  ('tea', '四季春茶(無糖)', 'Tea', '甜度冰塊皆為固定比例', 100, 'drinks', false),
  ('orangesoda', '柳橙氣泡', 'Orange Soda', '甜度冰塊皆為固定比例', 140, 'drinks', false),
  ('grapefruitgreentea', '葡萄柚綠茶', 'Grapefruit Green Tea', '甜度冰塊皆為固定比例', 140, 'drinks', false),
  ('passionlemonsoda', '百香檸檬氣泡', 'Passion Lemon Soda', '甜度冰塊皆為固定比例', 140, 'drinks', false),
  ('fries', '香酥薯條', 'French Fries', '現炸薯條', 120, 'snacks', false),
  ('chickenwing', '香香烤雞翅', 'Chicken Wing', '烤雞翅', 150, 'snacks', false);
