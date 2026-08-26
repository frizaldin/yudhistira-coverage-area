<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== aktivitas ===\n";
foreach (\DB::table('sales_activities')->select('aktivitas', \DB::raw('count(*) as c'))->groupBy('aktivitas')->orderByDesc('c')->limit(40)->get() as $a) {
    echo json_encode($a, JSON_UNESCAPED_UNICODE) . "\n";
}
echo "=== hasil ===\n";
foreach (\DB::table('sales_activities')->select('hasil', \DB::raw('count(*) as c'))->groupBy('hasil')->orderByDesc('c')->limit(50)->get() as $a) {
    echo json_encode($a, JSON_UNESCAPED_UNICODE) . "\n";
}
echo "=== aktivitas+hasil sample ===\n";
foreach (\DB::table('sales_activities')->select('aktivitas', 'hasil', \DB::raw('count(*) as c'))->groupBy('aktivitas', 'hasil')->orderByDesc('c')->limit(40)->get() as $a) {
    echo json_encode($a, JSON_UNESCAPED_UNICODE) . "\n";
}
