<?php

use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ImportController;

/**
 * MONITORING ROUTES
 */
Route::prefix('monitoring')->name('monitoring.')->group(function () {
    Route::get('/nasional',               [MonitoringController::class, 'nasional'])->name('nasional');
    Route::get('/area',                   [MonitoringController::class, 'areaSelect'])->name('area.select');
    Route::get('/area/{id}',              [MonitoringController::class, 'area'])->name('area');
    Route::get('/peta',                   [MonitoringController::class, 'peta'])->name('peta');
    Route::get('/sekolah',                [MonitoringController::class, 'sekolah'])->name('sekolah');
    Route::get('/sekolah/{id}/detail',    [MonitoringController::class, 'showSekolah'])->name('sekolah.show');
    
    // Import Routes
    Route::get('/import',                 [ImportController::class, 'index'])->name('import');
    Route::post('/import',                [ImportController::class, 'store'])->name('import.store');
    Route::post('/import/report',         [ImportController::class, 'storeReport'])->name('import.report.store');
    Route::post('/import/report/bulk',    [ImportController::class, 'storeBulkReport'])->name('import.report.bulk');
    Route::delete('/import/report/reset', [ImportController::class, 'resetData'])->name('import.report.reset');
    
    // Pengaturan Route
    Route::get('/pengaturan',             [MonitoringController::class, 'pengaturan'])->name('pengaturan');
    Route::put('/pengaturan/sales-score-weights', [MonitoringController::class, 'updateSalesScoreWeights'])->name('pengaturan.sales-score-weights');

    Route::get('/uncovered-customers',    [MonitoringController::class, 'uncoveredCustomers'])->name('uncovered-customers');
    Route::get('/area-kosong',            [MonitoringController::class, 'areaKosong'])->name('area-kosong');
    Route::get('/rekap-sales',            [MonitoringController::class, 'rekapSales'])->name('rekap-sales');
    Route::get('/rekap-sales/{id}/detail',[MonitoringController::class, 'rekapSalesDetail'])->name('rekap-sales.detail');
    Route::get('/sales-performance',      [MonitoringController::class, 'salesPerformance'])->name('sales-performance');
    Route::get('/sales-performance/geojson', [MonitoringController::class, 'salesPerformanceGeoJson'])->name('sales-performance.geojson');
    Route::get('/report',                 [MonitoringController::class, 'report'])->name('report');
    Route::get('/report/export',          [MonitoringController::class, 'reportExport'])->name('report.export');

    // Detail Routes (Nasional)
    Route::prefix('nasional')->name('nasional.')->group(function () {
        Route::get('/sekolah',            [MonitoringController::class, 'detailSekolahNasional'])->name('sekolah');
        Route::get('/customer-aktif',     [MonitoringController::class, 'detailCustomerAktifNasional'])->name('customer-aktif');
        Route::get('/coverage',           [MonitoringController::class, 'detailCoverageNasional'])->name('coverage');
        Route::get('/opportunity',        [MonitoringController::class, 'detailOpportunityNasional'])->name('opportunity');
        Route::get('/target-eksemplar',   [MonitoringController::class, 'detailTargetEksemplarNasional'])->name('target-eksemplar');
        Route::get('/sumber-dana',        [MonitoringController::class, 'detailSumberDanaNasional'])->name('sumber-dana');
        Route::get('/sumber-dana/{sales_id}', [MonitoringController::class, 'detailSumberDanaSalesNasional'])->name('sumber-dana.sales');
        Route::get('/siswa',              [MonitoringController::class, 'detailSiswaNasional'])->name('siswa');
        
        // Detail Sales per Jenjang
        Route::get('/sales-jenjang',      [MonitoringController::class, 'detailSalesJenjangNasional'])->name('sales-jenjang');
        Route::get('/sales-jenjang-kecamatan', [MonitoringController::class, 'detailSalesJenjangKecamatanNasional'])->name('sales-jenjang-kecamatan');
        
        // Detail Komposisi Jenjang
        Route::get('/komposisi-jenjang',  [MonitoringController::class, 'detailKomposisiJenjangNasional'])->name('komposisi-jenjang');
        
        // Detail Kompetitor
        Route::get('/kompetitor',         [MonitoringController::class, 'detailKompetitorNasional'])->name('kompetitor');
    });

    // Detail Routes (Area)
    Route::prefix('area/{id}')->name('area.')->group(function () {
        Route::get('/sekolah',            [MonitoringController::class, 'detailSekolahArea'])->name('sekolah');
        Route::get('/customer-aktif',     [MonitoringController::class, 'detailCustomerAktifArea'])->name('customer-aktif');
        Route::get('/coverage',           [MonitoringController::class, 'detailCoverageArea'])->name('coverage');
        Route::get('/opportunity',        [MonitoringController::class, 'detailOpportunityArea'])->name('opportunity');
        Route::get('/target-eksemplar',   [MonitoringController::class, 'detailTargetEksemplarArea'])->name('target-eksemplar');
        Route::get('/sumber-dana',        [MonitoringController::class, 'detailSumberDanaArea'])->name('sumber-dana');
        Route::get('/sumber-dana/{sales_id}', [MonitoringController::class, 'detailSumberDanaSalesArea'])->name('sumber-dana.sales');
        Route::get('/siswa',              [MonitoringController::class, 'detailSiswaArea'])->name('siswa');
        Route::get('/sales-jenjang',      [MonitoringController::class, 'detailSalesJenjangArea'])->name('sales-jenjang');
        Route::get('/sales-jenjang-kecamatan', [MonitoringController::class, 'detailSalesJenjangKecamatanArea'])->name('sales-jenjang-kecamatan');
        Route::get('/komposisi-jenjang',  [MonitoringController::class, 'detailKomposisiJenjangArea'])->name('komposisi-jenjang');
        Route::get('/kompetitor',         [MonitoringController::class, 'detailKompetitorArea'])->name('kompetitor');
    });

    // Detail Routes (per Cabang)
    Route::prefix('cabang/{cabangCode}')->name('cabang.')->group(function () {
        Route::get('/sekolah',            [MonitoringController::class, 'detailSekolah'])->name('sekolah');
        Route::get('/customer-aktif',     [MonitoringController::class, 'detailCustomerAktif'])->name('customer-aktif');
        Route::get('/coverage',           [MonitoringController::class, 'detailCoverage'])->name('coverage');
        Route::get('/opportunity',        [MonitoringController::class, 'detailOpportunity'])->name('opportunity');
        Route::get('/target-eksemplar',   [MonitoringController::class, 'detailTargetEksemplar'])->name('target-eksemplar');
        Route::get('/sumber-dana',        [MonitoringController::class, 'detailSumberDana'])->name('sumber-dana');
        Route::get('/sumber-dana/{sales_id}', [MonitoringController::class, 'detailSumberDanaSalesCabang'])->name('sumber-dana.sales');
        Route::get('/siswa',              [MonitoringController::class, 'detailSiswa'])->name('siswa');
        Route::get('/sales-jenjang',      [MonitoringController::class, 'detailSalesJenjang'])->name('sales-jenjang');
        Route::get('/sales-jenjang-kecamatan', [MonitoringController::class, 'detailSalesJenjangKecamatan'])->name('sales-jenjang-kecamatan');
        Route::get('/kompetitor',         [MonitoringController::class, 'detailKompetitorCabang'])->name('kompetitor');
    });
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'track-log'])
    ->name('dashboard');

Route::middleware(['auth', 'track-log'])->group(function () {
    /**
     * PROFILE
     */
    Route::controller(ProfileController::class)
        ->prefix('profile')
        ->group(function () {
            Route::get('', 'edit')->name('profile.edit');
            Route::patch('', 'update')->name('profile.update');
            Route::delete('', 'destroy')->name('profile.destroy');
        });



    /**
     * USERS
     */
    Route::controller(UserController::class)
        ->prefix('users')
        ->group(function () {
            Route::get('', 'index')->name('users.index')->middleware('permission:users');

            Route::middleware(['permission:users,create'])->group(function () {
                Route::get('/create', 'create')->name('users.create');
                Route::post('', 'store')->name('users.store');
            });

            Route::middleware(['permission:users,update'])->group(function () {
                Route::get('/{item}/edit', 'edit')->name('users.edit');
                Route::post('/{id}/update', 'update')->name('users.update');
            });

            Route::middleware(['permission:users,delete'])->group(function () {
                Route::delete('/{item}', 'destroy')->name('users.destroy');
                Route::post('/{id}/restore', 'restore')->name('users.restore');
                Route::post('/bulk-delete', 'bulkDelete');
                Route::post('/bulk-restore', 'bulkRestore');
            });
        });

    /**
     * ROLES
     */
    Route::controller(RoleController::class)
        ->prefix('roles')
        ->group(function () {
            Route::get('', 'index')->name('roles.index')->middleware('permission:roles');

            Route::middleware(['permission:roles,create'])->group(function () {
                Route::get('/create', 'create')->name('roles.create');
                Route::post('', 'store')->name('roles.store');
            });

            Route::middleware(['permission:roles,update'])->group(function () {
                Route::get('/{item}/edit', 'edit')->name('roles.edit');
                Route::post('/{id}/update', 'update')->name('roles.update');
            });

            Route::middleware(['permission:roles,delete'])->group(function () {
                Route::delete('/{item}', 'destroy')->name('roles.destroy');
                Route::post('/bulk-delete', 'bulkDelete');
            });
        });

    /**
     * CONFIGURATION
     */
    Route::controller(ConfigurationController::class)
        ->middleware(['permission:configuration'])
        ->prefix('/configuration')
        ->group(function () {
            Route::get('', 'index')->name('configuration.index');
            Route::post('', 'update')->name('configuration.update')
                ->middleware(['permission:configuration,update']);
        });

});
require __DIR__ . '/auth.php';
