-- ═══ المتاجر (Multi-tenant) ═══
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ═══ الموظفون (مرتبطون بـ auth.users) ═══
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  role text check (role in ('owner','manager','cashier')) default 'cashier',
  pin_hash text,               -- نُخزّن hash وليس PIN صريح
  phone text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ═══ المنتجات (packagings كـ JSONB للبساطة في المرحلة 1) ═══
create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  code text,
  barcode text,
  category text,
  base_unit text default 'piece',
  cost_price numeric(12,2) default 0,
  selling_price numeric(12,2) default 0,
  wholesale_price numeric(12,2) default 0,
  stock_quantity numeric(12,3) default 0,
  min_stock_alert numeric(12,3) default 0,
  is_weighted boolean default false,
  expiry_date date,
  packagings jsonb default '[]'::jsonb,
  warehouse_stocks jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  deleted_at timestamptz,      -- soft delete للمزامنة
  unique(store_id, barcode)
);
create index on products(store_id) where deleted_at is null;
create index on products(store_id, updated_at);

-- ═══ العملاء ═══
create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  tax_number text,
  balances jsonb default '{}'::jsonb,   -- {SAR: 2450, USD: 0}
  credit_limit numeric(12,2) default 0,
  price_tier text default 'retail',
  notes text,
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create index on customers(store_id, updated_at);

-- ═══ الفواتير ═══
create table invoices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  invoice_number text not null,
  date timestamptz not null,
  type text check (type in ('sale','return','exchange')),
  customer_id uuid references customers(id),
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  tax_amount numeric(12,2) default 0,
  total numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  remaining_amount numeric(12,2) default 0,
  payment_method text,
  currency text default 'SAR',
  warehouse_id uuid,
  cashier_name text,
  notes text,
  updated_at timestamptz default now(),
  unique(store_id, invoice_number)
);

-- ═══ دفتر اليومية (لمرحلة لاحقة لكن نجهّزه) ═══
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  entry_number text not null,
  date timestamptz not null,
  description text,
  lines jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);
