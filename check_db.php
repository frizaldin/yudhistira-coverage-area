<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = \App\Models\SalesAreaCover::limit(6)->get();
echo json_encode($rows, JSON_PRETTY_PRINT);
