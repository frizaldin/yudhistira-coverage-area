<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$role = \App\Models\Role::where('type', 'office')->orderBy('id', 'desc')->first();
$roleId = $role->id ?? 1;

$counts = ['area' => 0, 'cabang' => 0, 'kecamatan' => 0, 'sales' => 0];

// 1. Generate for Areas
foreach (\App\Models\Area::all() as $area) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $area->name)) . '@admin.com';
    $user = \App\Models\User::firstOrCreate(
        ['email' => $email],
        [
            'name' => 'User Area ' . $area->name,
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role_id' => $roleId,
            'level' => 'area',
            'area_id' => $area->id,
        ]
    );
    if ($user->wasRecentlyCreated) $counts['area']++;
}

// 2. Generate for Cabangs
foreach (\App\Models\Cabang::all() as $cabang) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $cabang->nama_cabang)) . '@admin.com';
    $user = \App\Models\User::firstOrCreate(
        ['email' => $email],
        [
            'name' => 'User Cabang ' . $cabang->nama_cabang,
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role_id' => $roleId,
            'level' => 'cabang',
            'cabang_id' => $cabang->id,
        ]
    );
    if ($user->wasRecentlyCreated) $counts['cabang']++;
}

// 3. Generate for Kecamatans
foreach (\App\Models\Kecamatan::all() as $kecamatan) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $kecamatan->camat_name)) . '@admin.com';
    $user = \App\Models\User::firstOrCreate(
        ['email' => $email],
        [
            'name' => 'User Kecamatan ' . $kecamatan->camat_name,
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role_id' => $roleId,
            'level' => 'kecamatan',
            'kecamatan_id' => $kecamatan->camat_code,
        ]
    );
    if ($user->wasRecentlyCreated) $counts['kecamatan']++;
}

// 4. Generate for Sales
foreach (\App\Models\Sales::all() as $sales) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $sales->name)) . '@sales.com';
    $user = \App\Models\User::firstOrCreate(
        ['email' => $email],
        [
            'name' => 'User Sales ' . $sales->name,
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role_id' => $roleId,
            'level' => 'sales',
            'sales_id' => $sales->id,
        ]
    );
    if ($user->wasRecentlyCreated) $counts['sales']++;
}

echo "Berhasil generate users:\n";
echo "- Area: {$counts['area']}\n";
echo "- Cabang: {$counts['cabang']}\n";
echo "- Kecamatan: {$counts['kecamatan']}\n";
echo "- Sales: {$counts['sales']}\n";
