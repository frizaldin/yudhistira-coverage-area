<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$role = \App\Models\Role::where('type', 'office')->orderBy('id', 'desc')->first();
$roleId = $role->id ?? 1;

$password = \Illuminate\Support\Facades\Hash::make('password123');

$users = [];

// 1. Generate for Areas
foreach (\App\Models\Area::all() as $area) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $area->name)) . '@admin.com';
    $users[] = [
        'name' => 'User Area ' . $area->name,
        'email' => $email,
        'password' => $password,
        'role_id' => $roleId,
        'level' => 'area',
        'area_id' => $area->id,
        'cabang_id' => null,
        'sales_id' => null,
        'kecamatan_id' => null,
    ];
}

// 2. Generate for Cabangs
foreach (\App\Models\Cabang::all() as $cabang) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $cabang->nama_cabang)) . '@admin.com';
    $users[] = [
        'name' => 'User Cabang ' . $cabang->nama_cabang,
        'email' => $email,
        'password' => $password,
        'role_id' => $roleId,
        'level' => 'cabang',
        'area_id' => null,
        'cabang_id' => $cabang->id,
        'sales_id' => null,
        'kecamatan_id' => null,
    ];
}

// 3. Generate for Kecamatans
foreach (\App\Models\Kecamatan::all() as $kecamatan) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $kecamatan->camat_name)) . '@admin.com';
    $users[] = [
        'name' => 'User Kecamatan ' . $kecamatan->camat_name,
        'email' => $email,
        'password' => $password,
        'role_id' => $roleId,
        'level' => 'kecamatan',
        'area_id' => null,
        'cabang_id' => null,
        'sales_id' => null,
        'kecamatan_id' => $kecamatan->camat_code,
    ];
}

// 4. Generate for Sales
foreach (\App\Models\Sales::all() as $sales) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $sales->name)) . '@sales.com';
    $users[] = [
        'name' => 'User Sales ' . $sales->name,
        'email' => $email,
        'password' => $password,
        'role_id' => $roleId,
        'level' => 'sales',
        'area_id' => null,
        'cabang_id' => null,
        'sales_id' => $sales->id,
        'kecamatan_id' => null,
    ];
}

$chunks = array_chunk($users, 1000);
$inserted = 0;
foreach ($chunks as $chunk) {
    // We use insertOrIgnore to not fail if email exists
    $count = \App\Models\User::insertOrIgnore($chunk);
    $inserted += $count;
}

echo "Berhasil generate: $inserted users.\n";
