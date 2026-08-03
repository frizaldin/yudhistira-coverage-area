<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sales = \App\Models\Sales::all();
foreach($sales as $s) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $s->name)) . '@sales.com';
    \App\Models\User::where('email', $email)->update(['sales_id' => $s->id]);
}
echo \App\Models\User::where('level', 'sales')->whereNotNull('sales_id')->count() . " users updated.\n";
