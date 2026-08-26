<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "customer_plans cols: " . implode(', ', Schema::getColumnListing('customer_plans')) . "\n";

// Cek apakah ada SP di sales_plans / aktivitas untuk Caringin & Cariu Kab Bogor 2026
$spPlans = DB::select("
SELECT COUNT(*) as cnt, COALESCE(SUM(sp.sp_exemplar),0) as sp_sum
FROM customers c
JOIN customer_plans sp ON sp.customer_id = c.id AND sp.year = 2026
WHERE c.cabang_id = 52
  AND (
    UPPER(c.kecamatan_name) LIKE 'CARINGIN, KAB. BOGOR%'
    OR UPPER(c.kecamatan_name) LIKE 'CARIU, KAB. BOGOR%'
  )
");
echo "customer_plans SP Bogor Caringin/Cariu 2026: " . json_encode($spPlans[0]) . "\n";

// Sample: sekolah ber-realisasi tapi SP=0
$sample = DB::select("
SELECT c.name, c.kecamatan_name, cp.sp_exemplar, cp.real_exemplar, cp.is_ac
FROM customers c
JOIN customer_plans cp ON cp.customer_id = c.id AND cp.year = 2026
WHERE c.cabang_id = 52
  AND (
    UPPER(c.kecamatan_name) LIKE 'CARINGIN, KAB. BOGOR%'
    OR UPPER(c.kecamatan_name) LIKE 'CARIU, KAB. BOGOR%'
  )
  AND cp.real_exemplar > 0
ORDER BY cp.real_exemplar DESC
LIMIT 10
");
echo "\nTop 10 realisasi (SP field):\n";
foreach ($sample as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}
