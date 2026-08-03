<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$levels = \App\Models\User::select('level')->distinct()->pluck('level')->toArray();
echo json_encode($levels);

$roles = \App\Models\Role::select('type', 'name')->get()->toArray();
echo "\nRoles:\n";
print_r($roles);
