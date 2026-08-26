<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo implode(',', \Schema::getColumnListing('cities')) . PHP_EOL;
foreach (\DB::table('cities')->where('city_name', 'like', '%BOGOR%')->orWhere('city_name', 'like', '%TASIK%')->get() as $c) {
    echo json_encode($c) . PHP_EOL;
}
