<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$salesId = 2;
$activeCabangId = 52;

$kecamatanData = \App\Models\Customer::where('sales_id', $salesId)
    ->where('cabang_id', $activeCabangId)
    ->whereNotNull('kecamatan_name')
    ->select(
        'kecamatan_name',
        \Illuminate\Support\Facades\DB::raw('count(*) as total_sekolah'),
        \Illuminate\Support\Facades\DB::raw('sum(is_active) as sekolah_aktif'),
        \Illuminate\Support\Facades\DB::raw('sum(total_student) as potensi_siswa')
    )
    ->groupBy('kecamatan_name')
    ->get()
    ->keyBy(function ($item) {
        return mb_strtolower(trim($item->kecamatan_name));
    });

echo "Kecamatan Data Count: " . $kecamatanData->count() . "\n";
foreach ($kecamatanData as $key => $item) {
    echo "  Key: {$key} -> " . $item->kecamatan_name . "\n";
}

$processedKec = []; // Dummy
// Add fallback Point features for kecamatans not found in GeoJSON
$mergedFeatures = [];
foreach ($kecamatanData as $kecKey => $coverageInfo) {
    if (!in_array($kecKey, $processedKec)) {
        // Try to get lat/lng from kecamatans table
        $originalName = $coverageInfo->kecamatan_name;
        $parts = explode(',', $originalName);
        $kecOnly = trim($parts[0]);

        $kecDb = \DB::table('kecamatans')->whereRaw('LOWER(camat_name) = ?', [mb_strtolower($kecOnly)])->first();
        if ($kecDb) {
            echo "  Found in DB: {$kecOnly} -> geomap=" . ($kecDb->geomap ?? 'null') . "\n";
        } else {
            echo "  NOT Found in DB: {$kecOnly}\n";
        }
    }
}
