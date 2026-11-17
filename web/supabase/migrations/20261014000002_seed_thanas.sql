-- Migration: seed_thanas
-- Seeds a starter set of thanas/upazilas for the districts currently used
-- in demo plans. More can be added later via another migration.

with d as (select id, slug from public.districts)
insert into public.thanas (district_id, slug, name_en, name_bn, sort_order)
select d.id, x.slug, x.name_en, x.name_bn, x.sort_order
from (values
  -- Gazipur
  ('gazipur', 'gazipur-sadar',       'Gazipur Sadar',       'গাজীপুর সদর',       1),
  ('gazipur', 'kaliakair',           'Kaliakair',           'কালিয়াকৈর',        2),
  ('gazipur', 'kapasia',             'Kapasia',             'কাপাসিয়া',         3),
  ('gazipur', 'sreepur',             'Sreepur',             'শ্রীপুর',           4),
  ('gazipur', 'kaliganj-gazipur',    'Kaliganj',            'কালীগঞ্জ',          5),

  -- Mymensingh
  ('mymensingh', 'mymensingh-sadar', 'Mymensingh Sadar',    'ময়মনসিংহ সদর',     1),
  ('mymensingh', 'bhaluka',          'Bhaluka',             'ভালুকা',            2),
  ('mymensingh', 'trishal',          'Trishal',             'ত্রিশাল',           3),
  ('mymensingh', 'muktagachha',      'Muktagachha',         'মুক্তাগাছা',        4),
  ('mymensingh', 'fulbaria',         'Fulbaria',            'ফুলবাড়িয়া',        5),
  ('mymensingh', 'gaffargaon',       'Gaffargaon',          'গফরগাঁও',           6),
  ('mymensingh', 'gouripur',         'Gouripur',            'গৌরীপুর',           7),
  ('mymensingh', 'ishwarganj',       'Ishwarganj',          'ঈশ্বরগঞ্জ',         8),
  ('mymensingh', 'nandail',          'Nandail',             'নান্দাইল',           9),
  ('mymensingh', 'phulpur',          'Phulpur',             'ফুলপুর',            10),
  ('mymensingh', 'tarakanda',        'Tarakanda',           'তারাকান্দা',        11),
  ('mymensingh', 'haluaghat',        'Haluaghat',           'হালুয়াঘাট',        12),
  ('mymensingh', 'dhobaura',         'Dhobaura',            'ধোবাউড়া',          13),

  -- Cox's Bazar
  ('coxs-bazar', 'coxs-bazar-sadar', 'Cox''s Bazar Sadar',  'কক্সবাজার সদর',   1),
  ('coxs-bazar', 'chakaria',         'Chakaria',            'চকরিয়া',           2),
  ('coxs-bazar', 'ramu',             'Ramu',                'রামু',              3),
  ('coxs-bazar', 'teknaf',           'Teknaf',              'টেকনাফ',            4),
  ('coxs-bazar', 'ukhiya',           'Ukhiya',              'উখিয়া',            5),
  ('coxs-bazar', 'kutubdia',         'Kutubdia',            'কুতুবদিয়া',        6),
  ('coxs-bazar', 'maheshkhali',      'Maheshkhali',         'মহেশখালী',          7),
  ('coxs-bazar', 'pekua',            'Pekua',               'পেকুয়া',            8),

  -- Chattogram
  ('chattogram', 'chattogram-sadar', 'Chattogram Sadar',    'চট্টগ্রাম সদর',    1),
  ('chattogram', 'anwara',           'Anwara',              'আনোয়ারা',          2),
  ('chattogram', 'banshkhali',       'Banshkhali',          'বাঁশখালী',          3),
  ('chattogram', 'boalkhali',        'Boalkhali',           'বোয়ালখালী',        4),
  ('chattogram', 'chandanaish',      'Chandanaish',         'চন্দনাইশ',          5),
  ('chattogram', 'fatikchhari',      'Fatikchhari',         'ফটিকছড়ি',          6),
  ('chattogram', 'hathazari',        'Hathazari',           'হাটহাজারী',         7),
  ('chattogram', 'lohagara-ctg',     'Lohagara',            'লোহাগাড়া',         8),
  ('chattogram', 'mirsharai',        'Mirsharai',           'মীরসরাই',           9),
  ('chattogram', 'patiya',           'Patiya',              'পটিয়া',            10),
  ('chattogram', 'rangunia',         'Rangunia',            'রাঙ্গুনিয়া',       11),
  ('chattogram', 'raozan',           'Raozan',              'রাউজান',            12),
  ('chattogram', 'sandwip',          'Sandwip',             'সন্দ্বীপ',           13),
  ('chattogram', 'satkania',         'Satkania',            'সাতকানিয়া',        14),
  ('chattogram', 'sitakunda',        'Sitakunda',           'সীতাকুণ্ড',         15),

  -- Sylhet
  ('sylhet', 'sylhet-sadar',    'Sylhet Sadar',    'সিলেট সদর',    1),
  ('sylhet', 'beanibazar',      'Beanibazar',      'বিয়ানীবাজার',   2),
  ('sylhet', 'bishwanath',      'Bishwanath',      'বিশ্বনাথ',      3),
  ('sylhet', 'balaganj',        'Balaganj',        'বালাগঞ্জ',      4),
  ('sylhet', 'companiganj',     'Companiganj',     'কোম্পানীগঞ্জ',   5),
  ('sylhet', 'fenchuganj',      'Fenchuganj',      'ফেঞ্চুগঞ্জ',     6),
  ('sylhet', 'golapganj',       'Golapganj',       'গোলাপগঞ্জ',     7),
  ('sylhet', 'gowainghat',      'Gowainghat',      'গোয়াইনঘাট',     8),
  ('sylhet', 'jaintiapur',      'Jaintiapur',      'জৈন্তাপুর',       9),
  ('sylhet', 'kanaighat',       'Kanaighat',       'কানাইঘাট',      10),
  ('sylhet', 'zakiganj',        'Zakiganj',        'জকিগঞ্জ',       11),
  ('sylhet', 'osmaninagar',     'Osmaninagar',     'ওসমানীনগর',     12),

  -- Khulna
  ('khulna', 'khulna-sadar',    'Khulna Sadar',    'খুলনা সদর',     1),
  ('khulna', 'batiaghata',      'Batiaghata',      'বটিয়াঘাটা',     2),
  ('khulna', 'dacope',          'Dacope',          'দাকোপ',         3),
  ('khulna', 'dumuria',         'Dumuria',         'ডুমুরিয়া',       4),
  ('khulna', 'dighalia',        'Dighalia',        'দিঘলিয়া',       5),
  ('khulna', 'koyra',           'Koyra',           'কয়রা',          6),
  ('khulna', 'paikgachha',      'Paikgachha',      'পাইকগাছা',       7),
  ('khulna', 'phultala',        'Phultala',        'ফুলতলা',        8),
  ('khulna', 'rupsa',           'Rupsa',           'রূপসা',         9),
  ('khulna', 'terokhada',       'Terokhada',       'তেরখাদা',       10),

  -- Rajshahi
  ('rajshahi', 'boalia',            'Boalia',            'বোয়ালিয়া',      1),
  ('rajshahi', 'motihar',           'Motihar',           'মতিহার',         2),
  ('rajshahi', 'rajpara',           'Rajpara',           'রাজপাড়া',        3),
  ('rajshahi', 'shah-makhdum',      'Shah Makhdum',      'শাহ মখদুম',     4),
  ('rajshahi', 'paba',              'Paba',              'পবা',            5),
  ('rajshahi', 'durgapur-raj',      'Durgapur',          'দুর্গাপুর',       6),
  ('rajshahi', 'mohonpur',          'Mohonpur',          'মোহনপুর',       7),
  ('rajshahi', 'bagha',             'Bagha',             'বাঘা',           8),
  ('rajshahi', 'charghat',          'Charghat',          'চারঘাট',         9),
  ('rajshahi', 'puthia',            'Puthia',            'পুঠিয়া',         10),
  ('rajshahi', 'bagmara',           'Bagmara',           'বাগমারা',        11),
  ('rajshahi', 'tanore',            'Tanore',            'তানোর',          12),
  ('rajshahi', 'godagari',          'Godagari',          'গোদাগাড়ী',      13)
) as x(dist_slug, slug, name_en, name_bn, sort_order)
join d on d.slug = x.dist_slug
on conflict (slug) do nothing;