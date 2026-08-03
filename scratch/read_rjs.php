<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$data = \Maatwebsite\Excel\Facades\Excel::toArray(new \stdClass(), 'database/data/RJS - Tangerang.xls');
echo json_encode(array_slice($data[0], 10, 10), JSON_PRETTY_PRINT);
