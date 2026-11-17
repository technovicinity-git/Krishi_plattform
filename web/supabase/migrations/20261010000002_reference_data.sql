-- Migration: reference_data
-- Livestock categories, divisions, districts, and breeds.
-- All tables are seeded with the initial data needed to create plans.

-- =========================================================================
-- 1. LIVESTOCK CATEGORIES
-- =========================================================================

create table if not exists public.livestock_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_en     text not null,
  name_bn     text not null,
  icon        text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists livestock_categories_sort_idx
  on public.livestock_categories(sort_order);

drop trigger if exists livestock_categories_touch on public.livestock_categories;
create trigger livestock_categories_touch
  before update on public.livestock_categories
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- 2. DIVISIONS
-- =========================================================================

create table if not exists public.divisions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_en     text not null,
  name_bn     text not null,
  sort_order  int not null default 0
);

create index if not exists divisions_sort_idx on public.divisions(sort_order);

-- =========================================================================
-- 3. DISTRICTS
-- =========================================================================

create table if not exists public.districts (
  id           uuid primary key default gen_random_uuid(),
  division_id  uuid not null references public.divisions(id) on delete cascade,
  slug         text not null unique,
  name_en      text not null,
  name_bn      text not null,
  sort_order   int not null default 0
);

create index if not exists districts_division_idx on public.districts(division_id);
create index if not exists districts_sort_idx     on public.districts(sort_order);

-- =========================================================================
-- 4. BREEDS
-- =========================================================================

create table if not exists public.breeds (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.livestock_categories(id) on delete cascade,
  slug         text not null unique,
  name_en      text not null,
  name_bn      text not null,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists breeds_category_idx on public.breeds(category_id);

-- =========================================================================
-- 5. PERMISSIONS
-- =========================================================================

alter table public.livestock_categories enable row level security;
alter table public.divisions            enable row level security;
alter table public.districts            enable row level security;
alter table public.breeds               enable row level security;

grant select, insert, update, delete
  on public.livestock_categories, public.divisions, public.districts, public.breeds
  to service_role;

-- =========================================================================
-- 6. SEED — LIVESTOCK CATEGORIES
-- =========================================================================

insert into public.livestock_categories (slug, name_en, name_bn, icon, sort_order) values
  ('cow',     'Cow',     'গরু',   'cow',     1),
  ('goat',    'Goat',    'ছাগল',  'goat',    2),
  ('buffalo', 'Buffalo', 'মহিষ',  'buffalo', 3),
  ('sheep',   'Sheep',   'ভেড়া', 'sheep',   4)
on conflict (slug) do nothing;

-- =========================================================================
-- 7. SEED — DIVISIONS
-- =========================================================================

insert into public.divisions (slug, name_en, name_bn, sort_order) values
  ('dhaka',      'Dhaka',      'ঢাকা',       1),
  ('chattogram', 'Chattogram', 'চট্টগ্রাম',  2),
  ('rajshahi',   'Rajshahi',   'রাজশাহী',    3),
  ('khulna',     'Khulna',     'খুলনা',      4),
  ('barishal',   'Barishal',   'বরিশাল',     5),
  ('sylhet',     'Sylhet',     'সিলেট',      6),
  ('rangpur',    'Rangpur',    'রংপুর',      7),
  ('mymensingh', 'Mymensingh', 'ময়মনসিংহ',  8)
on conflict (slug) do nothing;

-- =========================================================================
-- 8. SEED — DISTRICTS (64 total)
-- =========================================================================

with d as (select id, slug from public.divisions)
insert into public.districts (division_id, slug, name_en, name_bn, sort_order)
select d.id, x.slug, x.name_en, x.name_bn, x.sort_order
from (values
  -- Dhaka Division (13)
  ('dhaka', 'dhaka',         'Dhaka',         'ঢাকা',          1),
  ('dhaka', 'faridpur',      'Faridpur',      'ফরিদপুর',       2),
  ('dhaka', 'gazipur',       'Gazipur',       'গাজীপুর',       3),
  ('dhaka', 'gopalganj',     'Gopalganj',     'গোপালগঞ্জ',     4),
  ('dhaka', 'kishoreganj',   'Kishoreganj',   'কিশোরগঞ্জ',     5),
  ('dhaka', 'madaripur',     'Madaripur',     'মাদারীপুর',     6),
  ('dhaka', 'manikganj',     'Manikganj',     'মানিকগঞ্জ',     7),
  ('dhaka', 'munshiganj',    'Munshiganj',    'মুন্সিগঞ্জ',     8),
  ('dhaka', 'narayanganj',   'Narayanganj',   'নারায়ণগঞ্জ',   9),
  ('dhaka', 'narsingdi',     'Narsingdi',     'নরসিংদী',       10),
  ('dhaka', 'rajbari',       'Rajbari',       'রাজবাড়ী',      11),
  ('dhaka', 'shariatpur',    'Shariatpur',    'শরীয়তপুর',     12),
  ('dhaka', 'tangail',       'Tangail',       'টাঙ্গাইল',      13),

  -- Chattogram Division (11)
  ('chattogram', 'bandarban',      'Bandarban',      'বান্দরবান',      1),
  ('chattogram', 'brahmanbaria',   'Brahmanbaria',   'ব্রাহ্মণবাড়িয়া', 2),
  ('chattogram', 'chandpur',       'Chandpur',       'চাঁদপুর',        3),
  ('chattogram', 'chattogram',     'Chattogram',     'চট্টগ্রাম',       4),
  ('chattogram', 'cumilla',        'Cumilla',        'কুমিল্লা',        5),
  ('chattogram', 'coxs-bazar',     'Cox''s Bazar',   'কক্সবাজার',      6),
  ('chattogram', 'feni',           'Feni',           'ফেনী',           7),
  ('chattogram', 'khagrachhari',   'Khagrachhari',   'খাগড়াছড়ি',      8),
  ('chattogram', 'lakshmipur',     'Lakshmipur',     'লক্ষ্মীপুর',      9),
  ('chattogram', 'noakhali',       'Noakhali',       'নোয়াখালী',      10),
  ('chattogram', 'rangamati',      'Rangamati',      'রাঙ্গামাটি',     11),

  -- Rajshahi Division (8)
  ('rajshahi', 'bogura',           'Bogura',           'বগুড়া',         1),
  ('rajshahi', 'chapainawabganj',  'Chapainawabganj',  'চাঁপাইনবাবগঞ্জ', 2),
  ('rajshahi', 'joypurhat',        'Joypurhat',        'জয়পুরহাট',      3),
  ('rajshahi', 'naogaon',          'Naogaon',          'নওগাঁ',          4),
  ('rajshahi', 'natore',           'Natore',           'নাটোর',          5),
  ('rajshahi', 'pabna',            'Pabna',            'পাবনা',          6),
  ('rajshahi', 'rajshahi',         'Rajshahi',         'রাজশাহী',        7),
  ('rajshahi', 'sirajganj',        'Sirajganj',        'সিরাজগঞ্জ',      8),

  -- Khulna Division (10)
  ('khulna', 'bagerhat',    'Bagerhat',    'বাগেরহাট',    1),
  ('khulna', 'chuadanga',   'Chuadanga',   'চুয়াডাঙ্গা',   2),
  ('khulna', 'jashore',     'Jashore',     'যশোর',        3),
  ('khulna', 'jhenaidah',   'Jhenaidah',   'ঝিনাইদহ',     4),
  ('khulna', 'khulna',      'Khulna',      'খুলনা',       5),
  ('khulna', 'kushtia',     'Kushtia',     'কুষ্টিয়া',    6),
  ('khulna', 'magura',      'Magura',      'মাগুরা',      7),
  ('khulna', 'meherpur',    'Meherpur',    'মেহেরপুর',    8),
  ('khulna', 'narail',      'Narail',      'নড়াইল',       9),
  ('khulna', 'satkhira',    'Satkhira',    'সাতক্ষীরা',    10),

  -- Barishal Division (6)
  ('barishal', 'barguna',     'Barguna',     'বরগুনা',     1),
  ('barishal', 'barishal',    'Barishal',    'বরিশাল',     2),
  ('barishal', 'bhola',       'Bhola',       'ভোলা',       3),
  ('barishal', 'jhalokati',   'Jhalokati',   'ঝালকাঠি',    4),
  ('barishal', 'patuakhali',  'Patuakhali',  'পটুয়াখালী',  5),
  ('barishal', 'pirojpur',    'Pirojpur',    'পিরোজপুর',   6),

  -- Sylhet Division (4)
  ('sylhet', 'habiganj',    'Habiganj',    'হবিগঞ্জ',      1),
  ('sylhet', 'moulvibazar', 'Moulvibazar', 'মৌলভীবাজার',   2),
  ('sylhet', 'sunamganj',   'Sunamganj',   'সুনামগঞ্জ',    3),
  ('sylhet', 'sylhet',      'Sylhet',      'সিলেট',        4),

  -- Rangpur Division (8)
  ('rangpur', 'dinajpur',      'Dinajpur',      'দিনাজপুর',      1),
  ('rangpur', 'gaibandha',     'Gaibandha',     'গাইবান্ধা',     2),
  ('rangpur', 'kurigram',      'Kurigram',      'কুড়িগ্রাম',     3),
  ('rangpur', 'lalmonirhat',   'Lalmonirhat',   'লালমনিরহাট',    4),
  ('rangpur', 'nilphamari',    'Nilphamari',    'নীলফামারী',     5),
  ('rangpur', 'panchagarh',    'Panchagarh',    'পঞ্চগড়',       6),
  ('rangpur', 'rangpur',       'Rangpur',       'রংপুর',        7),
  ('rangpur', 'thakurgaon',    'Thakurgaon',    'ঠাকুরগাঁও',     8),

  -- Mymensingh Division (4)
  ('mymensingh', 'jamalpur',   'Jamalpur',   'জামালপুর',   1),
  ('mymensingh', 'mymensingh', 'Mymensingh', 'ময়মনসিংহ',  2),
  ('mymensingh', 'netrokona',  'Netrokona',  'নেত্রকোণা',   3),
  ('mymensingh', 'sherpur',    'Sherpur',    'শেরপুর',     4)
) as x(div_slug, slug, name_en, name_bn, sort_order)
join d on d.slug = x.div_slug
on conflict (slug) do nothing;

-- =========================================================================
-- 9. SEED — BREEDS
-- =========================================================================

with c as (select id, slug from public.livestock_categories)
insert into public.breeds (category_id, slug, name_en, name_bn, sort_order)
select c.id, x.slug, x.name_en, x.name_bn, x.sort_order
from (values
  -- Cow
  ('cow', 'cow-sahiwal',           'Sahiwal',            'সাহিওয়াল',         1),
  ('cow', 'cow-red-chittagong',    'Red Chittagong',     'লাল চিটাগাং',       2),
  ('cow', 'cow-local-native',      'Local Native',       'দেশীয়',            3),
  ('cow', 'cow-holstein-friesian', 'Holstein Friesian',  'হলস্টেইন ফ্রিজিয়ান', 4),
  ('cow', 'cow-brahman',           'Brahman',            'ব্রাহম্যান',        5),
  ('cow', 'cow-pabna',             'Pabna',              'পাবনা',             6),
  -- Goat
  ('goat', 'goat-black-bengal',  'Black Bengal',  'কালো বেঙ্গল',   1),
  ('goat', 'goat-jamunapari',    'Jamunapari',    'যমুনাপাড়ি',    2),
  ('goat', 'goat-boer',          'Boer',          'বোর',           3),
  ('goat', 'goat-sirohi',        'Sirohi',        'সিরোহি',        4),
  -- Buffalo
  ('buffalo', 'buffalo-murrah',      'Murrah',      'মুররা',      1),
  ('buffalo', 'buffalo-nili-ravi',   'Nili-Ravi',   'নিলি-রাভি',  2),
  ('buffalo', 'buffalo-indigenous',  'Indigenous',  'দেশীয়',      3),
  -- Sheep
  ('sheep', 'sheep-garole',       'Garole',       'গাড়ল',       1),
  ('sheep', 'sheep-dumba',        'Dumba',        'ডুম্বা',       2),
  ('sheep', 'sheep-indigenous',   'Indigenous',   'দেশীয়',       3)
) as x(cat_slug, slug, name_en, name_bn, sort_order)
join c on c.slug = x.cat_slug
on conflict (slug) do nothing;