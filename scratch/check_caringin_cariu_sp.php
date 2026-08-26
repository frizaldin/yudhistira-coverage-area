<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$year = 2026;
try {
    $year = (int) (DB::table('configuration')->value('target_year') ?: 2026);
} catch (Throwable $e) {
    // ignore
}
echo "Target year: {$year}\n";

$cabangId = 52;
$agg = DB::select("
SELECT customers.kecamatan_name,
  COUNT(DISTINCT customers.id) as total_sekolah,
  COUNT(DISTINCT CASE WHEN customer_plans.is_ac = 1 THEN customers.id END) as ac,
  COALESCE(SUM(customer_plans.sp_exemplar), 0) as sp_exemplar_sum,
  COUNT(DISTINCT CASE WHEN customer_plans.sp_exemplar > 0 THEN customers.id END) as sp_customer,
  COALESCE(SUM(customer_plans.real_exemplar), 0) as real_exemplar_sum,
  COUNT(DISTINCT CASE WHEN customer_plans.real_exemplar > 0 THEN customers.id END) as real_cust
FROM customers
LEFT JOIN customer_plans ON customer_plans.customer_id = customers.id AND customer_plans.year = ?
WHERE customers.cabang_id = ?
  AND (
    UPPER(customers.kecamatan_name) LIKE 'CARINGIN%'
    OR UPPER(customers.kecamatan_name) LIKE 'CARIU%'
  )
GROUP BY customers.kecamatan_name
ORDER BY customers.kecamatan_name
", [$year, $cabangId]);

echo "\n=== Agregat year={$year} (rumus Market Share) ===\n";
foreach ($agg as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}

$anyYear = DB::select("
SELECT c.name, c.kecamatan_name, c.is_active, cp.year, cp.sp_exemplar, cp.real_exemplar, cp.is_ac
FROM customers c
INNER JOIN customer_plans cp ON cp.customer_id = c.id
WHERE c.cabang_id = ?
  AND (UPPER(c.kecamatan_name) LIKE 'CARINGIN%' OR UPPER(c.kecamatan_name) LIKE 'CARIU%')
  AND (COALESCE(cp.sp_exemplar,0) > 0)
ORDER BY c.kecamatan_name, cp.year DESC, c.name
LIMIT 50
", [$cabangId]);

echo "\n=== Sekolah dengan SP > 0 (semua tahun) ===\n";
echo 'count: ' . count($anyYear) . "\n";
foreach ($anyYear as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}

$byYear = DB::select("
SELECT UPPER(SUBSTRING_INDEX(c.kecamatan_name, ',', 1)) as kec,
  cp.year,
  COALESCE(SUM(cp.sp_exemplar),0) as sp_sum,
  COUNT(DISTINCT CASE WHEN cp.sp_exemplar > 0 THEN c.id END) as sp_cust
FROM customers c
INNER JOIN customer_plans cp ON cp.customer_id = c.id
WHERE c.cabang_id = ?
  AND (UPPER(c.kecamatan_name) LIKE 'CARINGIN%' OR UPPER(c.kecamatan_name) LIKE 'CARIU%')
GROUP BY kec, cp.year
ORDER BY kec, cp.year
", [$cabangId]);

echo "\n=== SP per tahun ===\n";
foreach ($byYear as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}
