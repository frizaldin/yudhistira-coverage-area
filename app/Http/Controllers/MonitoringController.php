<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Area;
use App\Models\Customer;
use App\Models\SalesPlan;
use App\Models\MarketShare;
use App\Models\Sales;

class MonitoringController extends Controller
{
    /** Props legacy untuk halaman sales-style; hindari buildUniversalDashboardData penuh. */
    private function minimalDashboardLegacyProps(): array
    {
        return [
            'realStats' => [],
            'rankingKecamatan' => [],
            'mapMarkers' => [],
            'competitors' => [],
            'timSalesPerformance' => ['all' => [], 'worst' => []],
            'timSalesPerformanceWorst' => [],
            'trl' => [],
            'trlJenjang' => [],
            'salesPerformance' => [],
            'schools' => [],
            'dana' => [],
            'jenjang' => [],
            'trend' => [],
            'areaCovers' => [],
            'leaderboard' => [],
            'salesJenjangData' => [],
            'salesJenjangTotal' => [],
            'uncovered' => [],
            'uncoveredDana' => [],
        ];
    }

    /** Daftar sekolah/kegiatan cukup besar — kirim setelah halaman utama tampil. */
    private function deferDashboardTabLists(array $lists): array
    {
        $deferred = [];
        foreach ($lists as $key => $value) {
            $deferred[$key] = Inertia::defer(fn () => $value);
        }

        return $deferred;
    }

    /**
     * API async: data berat dashboard Area/Cabang (dipanggil setelah shell halaman tampil).
     */
    public function dashboardData(\Illuminate\Http\Request $request)
    {
        $section = strtolower((string) $request->input('section', 'dashboard'));
        if (!in_array($section, ['dashboard', 'lists', 'all'], true)) {
            $section = 'dashboard';
        }

        // lists payload besar — butuh memori lebih, jangan di-cache (serialize dobel = OOM)
        @ini_set('memory_limit', $section === 'lists' || $section === 'all' ? '1024M' : '512M');
        @set_time_limit(180);

        $user = auth()->user();
        $areaId = (int) $request->input('area_id');
        $cabangId = $request->filled('cabang_id') ? (int) $request->input('cabang_id') : null;

        $cfg = \App\Models\Configuration::query()->first(['target_year', 'prev_year']);
        $targetYear = (int) ($request->input('tahun') ?: ($cfg->target_year ?? date('Y')));

        $area = Area::find($areaId);
        if (!$area) {
            return response()->json(['message' => 'Area tidak ditemukan'], 404);
        }

        if ($user && $user->level === 'area' && (int) $user->area_id !== $areaId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if ($user && $user->level === 'cabang' && (int) $user->cabang_id !== (int) $cabangId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $build = function () use ($area, $cabangId, $targetYear, $cfg, $section) {
            return $cabangId
                ? $this->buildCabangDashboardPayload($area, $cabangId, $targetYear, $cfg, $section)
                : $this->buildAreaDashboardPayload($area, $targetYear, $section);
        };

        if ($section === 'dashboard') {
            $cacheKey = sprintf(
                'monitoring:dash:v3:%s:%s:%s:dashboard',
                $areaId,
                $cabangId ?: 0,
                $targetYear
            );
            $payload = \Illuminate\Support\Facades\Cache::remember($cacheKey, 120, $build);
        } else {
            $payload = $build();
        }

        if (($payload['_status'] ?? null) === 404) {
            return response()->json(['message' => $payload['message'] ?? 'Not found'], 404);
        }

        return response()->json($payload);
    }

    private function buildCabangDashboardPayload($area, int $cabangId, int $targetYear, $cfg, string $section): array
    {
        $cabangObj = \App\Models\Cabang::where('area_id', $area->id)->find($cabangId);
        if (!$cabangObj) {
            return ['message' => 'Cabang tidak ditemukan', '_status' => 404];
        }

        $lite = $section === 'dashboard';
        $cn = strtolower(trim((string) $cabangObj->nama_cabang));
        $prevYear = (int) ($cfg->prev_year ?? ($targetYear - 1));
        $salesIdsCabang = \App\Models\Customer::where('cabang_id', $cabangObj->id)
            ->whereNotNull('sales_id')
            ->distinct()
            ->pluck('sales_id');

        $listSalesCabang = \App\Models\Sales::query()
            ->whereIn('sales.id', $salesIdsCabang)
            ->leftJoin('customers', 'customers.sales_id', '=', 'sales.id')
            ->leftJoin('customer_plans', function ($join) use ($targetYear) {
                $join->on('customer_plans.customer_id', '=', 'customers.id')
                    ->where('customer_plans.year', '=', $targetYear);
            })
            ->where('customers.cabang_id', $cabangObj->id)
            ->groupBy('sales.id', 'sales.name')
            ->selectRaw("
                sales.id as id,
                sales.name as name,
                COUNT(DISTINCT customers.id) as total_sekolah,
                COUNT(DISTINCT CASE WHEN customer_plans.is_ac = 1 THEN customers.id END) as area_cover,
                COUNT(DISTINCT CASE WHEN customer_plans.real_exemplar > 0 THEN customers.id END) as customer_realisasi,
                COALESCE(SUM(customer_plans.real_exemplar), 0) as realisasi,
                COALESCE(SUM(customer_plans.target_exemplar), 0) as target,
                COALESCE(SUM(customer_plans.sp_exemplar), 0) as sp,
                COALESCE(SUM(customer_plans.potential_exemplar), 0) as potensi
            ")
            ->orderByDesc('realisasi')
            ->get()
            ->filter(function ($row) use ($cn) {
                $name = strtolower(trim((string) ($row->name ?? '')));

                return $name !== $cn && $name !== ('kantor ' . $cn);
            })
            ->values()
            ->map(function ($row, $idx) {
                $realisasi = (int) round((float) $row->realisasi);
                $target = (int) round((float) $row->target);
                $areaCover = (int) $row->area_cover;
                $customerRealisasi = (int) $row->customer_realisasi;

                return [
                    'no' => $idx + 1,
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'total_sekolah' => (int) $row->total_sekolah,
                    'area_cover' => $areaCover,
                    'customer_realisasi' => $customerRealisasi,
                    'realisasi' => $realisasi,
                    'target' => $target,
                    'sp' => (int) round((float) $row->sp),
                    'potensi' => (int) round((float) $row->potensi),
                    'achievement_pct' => $target > 0
                        ? round(($realisasi / $target) * 100, 1)
                        : ($realisasi > 0 ? 100.0 : 0.0),
                    'cover_pct' => $areaCover > 0
                        ? round(($customerRealisasi / $areaCover) * 100, 1)
                        : 0.0,
                ];
            })
            ->values()
            ->toArray();

        if ($section === 'lists') {
            $lists = $this->buildLeanDashboardLists(null, (int) $cabangObj->id, null, $targetYear);

            return [
                'section' => 'lists',
                'listsReady' => true,
                'listSalesCabang' => $listSalesCabang,
                'listSekolah' => $lists['listSekolah'],
                'listNonAreaCover' => $lists['listNonAreaCover'],
                'kegiatanSales' => $lists['kegiatanSales'],
            ];
        }

        $detailBundle = $this->buildSalesStyleDashboardBundle(
            null,
            (int) $cabangObj->id,
            $targetYear,
            'CABANG ' . strtoupper((string) $cabangObj->nama_cabang),
            null,
            null,
            false,
            $lite
        );

        $totalSekolahCabang = (int) \App\Models\Customer::where('cabang_id', $cabangObj->id)->count();
        $detailBundle['kpiData']['totalSekolahCabang'] = $totalSekolahCabang;
        $detailBundle['kpiData']['totalKecamatanCabang'] = (int) \App\Models\Customer::where('cabang_id', $cabangObj->id)
            ->whereNotNull('kecamatan_name')
            ->where('kecamatan_name', '!=', '')
            ->selectRaw('COUNT(DISTINCT kecamatan_name) as cnt')
            ->value('cnt');

        $areaCoverFromPlans = (int) \App\Models\Customer::where('cabang_id', $cabangObj->id)
            ->whereExists(function ($q) use ($targetYear) {
                $q->selectRaw('1')
                    ->from('customer_plans')
                    ->whereColumn('customer_plans.customer_id', 'customers.id')
                    ->where('customer_plans.year', $targetYear)
                    ->where('customer_plans.is_ac', 1);
            })
            ->count();
        $detailBundle['kpiData']['areaCover'] = $areaCoverFromPlans;
        $detailBundle['insights']['totalAreaCover'] = $areaCoverFromPlans;

        $realPrevCabang = (int) \App\Models\CustomerPlan::query()
            ->where('year', $prevYear)
            ->whereIn('customer_id', function ($q) use ($cabangObj) {
                $q->select('id')->from('customers')->where('cabang_id', $cabangObj->id);
            })
            ->sum('real_exemplar');
        $spCurrCabang = (int) \App\Models\CustomerPlan::query()
            ->where('year', $targetYear)
            ->whereIn('customer_id', function ($q) use ($cabangObj) {
                $q->select('id')->from('customers')->where('cabang_id', $cabangObj->id);
            })
            ->sum('sp_exemplar');

        $cabangInsights = $this->buildScopeKpiInsights([
            'totalSekolah' => $totalSekolahCabang,
            'areaCover' => $areaCoverFromPlans,
            'potensiEks' => (int) ($detailBundle['insights']['totalPotensiEksemplar'] ?? 0),
            'realCurr' => (int) ($detailBundle['insights']['totalRealisasiTargetYear'] ?? 0),
            'realPrev' => $realPrevCabang,
            'targetEks' => (int) ($detailBundle['insights']['totalRencanaJualTargetYear'] ?? 0),
            'customerWithRealisasi' => (int) ($detailBundle['insights']['customerWithRealisasi'] ?? 0),
            'spCurr' => $spCurrCabang,
            'salesIdsForScore' => $salesIdsCabang,
            'salesPerformanceAll' => [],
            'excludeSalesNames' => [$cn, 'kantor ' . $cn],
            'targetYear' => $targetYear,
            'prevYear' => $prevYear,
        ], 'Cabang');

        $payload = [
            'section' => 'dashboard',
            'listsReady' => false,
            'kpiData' => $detailBundle['kpiData'],
            'insights' => $detailBundle['insights'],
            'jenjangBreakdown' => $detailBundle['jenjangBreakdown'],
            'sumberDanaBreakdown' => $detailBundle['sumberDanaBreakdown'],
            'gradeRealisasiBreakdown' => $detailBundle['gradeRealisasiBreakdown'] ?? [],
            'activityBreakdown' => $detailBundle['activityBreakdown'],
            'resultBreakdown' => $detailBundle['resultBreakdown'],
            'cabangInsights' => $cabangInsights,
            'listSalesCabang' => $listSalesCabang,
            'listSekolah' => [],
            'listNonAreaCover' => [],
            'kegiatanSales' => [],
            'salesProfile' => [
                'name' => 'CABANG ' . strtoupper((string) $cabangObj->nama_cabang),
                'code' => (string) $cabangObj->id,
                'profile_type' => 'cabang',
                'total_sales' => count($listSalesCabang),
                'cabang' => [
                    'nama_cabang' => $cabangObj->nama_cabang,
                    'area' => ['name' => $area->name],
                ],
            ],
        ];

        if ($section === 'all') {
            $full = $this->buildSalesStyleDashboardBundle(
                null,
                (int) $cabangObj->id,
                $targetYear,
                'CABANG ' . strtoupper((string) $cabangObj->nama_cabang),
                null,
                null,
                false,
                false
            );
            $payload['listsReady'] = true;
            $payload['listSekolah'] = $full['listSekolah'];
            $payload['listNonAreaCover'] = $this->buildNonAreaCoverCustomers((int) $cabangObj->id, null, $targetYear);
            $payload['kegiatanSales'] = $full['kegiatanSales'];
        }

        return $payload;
    }

    private function buildAreaDashboardPayload($area, int $targetYear, string $section): array
    {
        $displayName = strtoupper($area->name);
        $areaLabel = preg_match('/^AREA\b/i', $displayName)
            ? $displayName
            : ('AREA ' . $displayName);

        $cabangs = \App\Models\Cabang::where('area_id', $area->id)->orderBy('nama_cabang')->get();
        $totalSales = (int) Customer::query()
            ->where('area_id', $area->id)
            ->whereNotNull('sales_id')
            ->where('sales_id', '>', 0)
            ->selectRaw('COUNT(DISTINCT sales_id) as cnt')
            ->value('cnt');

        if ($section === 'lists') {
            $lists = $this->buildLeanDashboardLists(null, null, (int) $area->id, $targetYear);

            // Ringkasan per cabang untuk tab Cabang (hemat: di sini saja, bukan di dashboard)
            $prevY = $targetYear - 1;
            $cabangMetricRows = Customer::query()
                ->where('customers.area_id', $area->id)
                ->leftJoin('customer_plans', function ($join) use ($targetYear, $prevY) {
                    $join->on('customer_plans.customer_id', '=', 'customers.id')
                        ->whereIn('customer_plans.year', [$targetYear, $prevY]);
                })
                ->groupBy('customers.cabang_id')
                ->selectRaw("
                    customers.cabang_id as cabang_id,
                    COUNT(DISTINCT CASE WHEN customer_plans.year = {$targetYear} AND customer_plans.is_ac = 1 THEN customers.id END) as area_cover,
                    COALESCE(SUM(CASE WHEN customer_plans.year = {$prevY} THEN customer_plans.potential_exemplar ELSE 0 END), 0) as potensi_prev,
                    COALESCE(SUM(CASE WHEN customer_plans.year = {$prevY} THEN customer_plans.sp_exemplar ELSE 0 END), 0) as sp_prev,
                    COALESCE(SUM(CASE WHEN customer_plans.year = {$prevY} THEN customer_plans.real_exemplar ELSE 0 END), 0) as real_prev,
                    COALESCE(SUM(CASE WHEN customer_plans.year = {$targetYear} THEN customer_plans.potential_exemplar ELSE 0 END), 0) as potensi_curr,
                    COALESCE(SUM(CASE WHEN customer_plans.year = {$targetYear} THEN customer_plans.sp_exemplar ELSE 0 END), 0) as sp_curr,
                    COALESCE(SUM(CASE WHEN customer_plans.year = {$targetYear} THEN customer_plans.real_exemplar ELSE 0 END), 0) as real_curr
                ")
                ->get()
                ->keyBy('cabang_id');

            $dapodikPerCabang = \App\Models\Kecamatan::query()
                ->whereIn('cabang_id', $cabangs->pluck('id'))
                ->selectRaw('cabang_id, SUM(COALESCE(dapodik_customer, 0)) as total')
                ->groupBy('cabang_id')
                ->pluck('total', 'cabang_id');

            $listCabangArea = $cabangs->map(function ($cab, $idx) use ($dapodikPerCabang, $cabangMetricRows) {
                $m = $cabangMetricRows->get($cab->id);
                $realPrev = (int) round((float) ($m->real_prev ?? 0));
                $realCurr = (int) round((float) ($m->real_curr ?? 0));
                $growth = $realPrev > 0
                    ? round((($realCurr - $realPrev) / $realPrev) * 100, 1)
                    : ($realCurr > 0 ? 100.0 : 0.0);

                return [
                    'no' => $idx + 1,
                    'id' => $cab->id,
                    'name' => $cab->nama_cabang,
                    'dapodik' => (int) ($dapodikPerCabang[$cab->id] ?? 0),
                    'area_cover' => (int) ($m->area_cover ?? 0),
                    'potensi_prev' => (int) round((float) ($m->potensi_prev ?? 0)),
                    'sp_prev' => (int) round((float) ($m->sp_prev ?? 0)),
                    'real_prev' => $realPrev,
                    'potensi_curr' => (int) round((float) ($m->potensi_curr ?? 0)),
                    'sp_curr' => (int) round((float) ($m->sp_curr ?? 0)),
                    'real_curr' => $realCurr,
                    'growth_pct' => $growth,
                ];
            })->values()->toArray();

            return [
                'section' => 'lists',
                'listsReady' => true,
                'listCabangArea' => $listCabangArea,
                'listSekolah' => $lists['listSekolah'],
                'listNonAreaCover' => $lists['listNonAreaCover'],
                'kegiatanSales' => $lists['kegiatanSales'],
            ];
        }

        $lite = $section === 'dashboard';
        $detailBundle = $this->buildSalesStyleDashboardBundle(
            null,
            null,
            $targetYear,
            $areaLabel,
            (int) $area->id,
            null,
            false,
            $lite
        );

        $customerAreaQuery = Customer::where('area_id', $area->id);
        $totalSekolahArea = (int) (clone $customerAreaQuery)->count();
        $totalAreaCover = (int) (clone $customerAreaQuery)
            ->whereExists(function ($q) use ($targetYear) {
                $q->selectRaw('1')
                    ->from('customer_plans')
                    ->whereColumn('customer_plans.customer_id', 'customers.id')
                    ->where('customer_plans.year', $targetYear)
                    ->where('customer_plans.is_ac', 1);
            })
            ->count();

        $detailBundle['kpiData']['totalSekolahCabang'] = $totalSekolahArea;
        $detailBundle['kpiData']['totalKecamatanCabang'] = (int) (clone $customerAreaQuery)
            ->whereNotNull('kecamatan_name')
            ->where('kecamatan_name', '!=', '')
            ->selectRaw('COUNT(DISTINCT kecamatan_name) as cnt')
            ->value('cnt');
        $detailBundle['kpiData']['areaCover'] = $totalAreaCover;
        $detailBundle['insights']['totalAreaCover'] = $totalAreaCover;

        $prevY = $targetYear - 1;
        $cabangMetricRows = Customer::query()
            ->where('customers.area_id', $area->id)
            ->leftJoin('customer_plans', function ($join) use ($targetYear, $prevY) {
                $join->on('customer_plans.customer_id', '=', 'customers.id')
                    ->whereIn('customer_plans.year', [$targetYear, $prevY]);
            })
            ->groupBy('customers.cabang_id')
            ->selectRaw("
                customers.cabang_id as cabang_id,
                COUNT(DISTINCT CASE WHEN customer_plans.year = {$targetYear} AND customer_plans.is_ac = 1 THEN customers.id END) as area_cover,
                COALESCE(SUM(CASE WHEN customer_plans.year = {$prevY} THEN customer_plans.potential_exemplar ELSE 0 END), 0) as potensi_prev,
                COALESCE(SUM(CASE WHEN customer_plans.year = {$prevY} THEN customer_plans.sp_exemplar ELSE 0 END), 0) as sp_prev,
                COALESCE(SUM(CASE WHEN customer_plans.year = {$prevY} THEN customer_plans.real_exemplar ELSE 0 END), 0) as real_prev,
                COALESCE(SUM(CASE WHEN customer_plans.year = {$targetYear} THEN customer_plans.potential_exemplar ELSE 0 END), 0) as potensi_curr,
                COALESCE(SUM(CASE WHEN customer_plans.year = {$targetYear} THEN customer_plans.sp_exemplar ELSE 0 END), 0) as sp_curr,
                COALESCE(SUM(CASE WHEN customer_plans.year = {$targetYear} THEN customer_plans.real_exemplar ELSE 0 END), 0) as real_curr
            ")
            ->get()
            ->keyBy('cabang_id');

        $dapodikPerCabang = \App\Models\Kecamatan::query()
            ->whereIn('cabang_id', $cabangs->pluck('id'))
            ->selectRaw('cabang_id, SUM(COALESCE(dapodik_customer, 0)) as total')
            ->groupBy('cabang_id')
            ->pluck('total', 'cabang_id');

        $listCabangArea = $cabangs->map(function ($cab, $idx) use ($dapodikPerCabang, $cabangMetricRows) {
            $m = $cabangMetricRows->get($cab->id);
            $realPrev = (int) round((float) ($m->real_prev ?? 0));
            $realCurr = (int) round((float) ($m->real_curr ?? 0));
            $growth = $realPrev > 0
                ? round((($realCurr - $realPrev) / $realPrev) * 100, 1)
                : ($realCurr > 0 ? 100.0 : 0.0);

            return [
                'no' => $idx + 1,
                'id' => $cab->id,
                'name' => $cab->nama_cabang,
                'dapodik' => (int) ($dapodikPerCabang[$cab->id] ?? 0),
                'area_cover' => (int) ($m->area_cover ?? 0),
                'potensi_prev' => (int) round((float) ($m->potensi_prev ?? 0)),
                'sp_prev' => (int) round((float) ($m->sp_prev ?? 0)),
                'real_prev' => $realPrev,
                'potensi_curr' => (int) round((float) ($m->potensi_curr ?? 0)),
                'sp_curr' => (int) round((float) ($m->sp_curr ?? 0)),
                'real_curr' => $realCurr,
                'growth_pct' => $growth,
            ];
        })->values()->toArray();

        $payload = [
            'section' => 'dashboard',
            'listsReady' => false,
            'kpiData' => $detailBundle['kpiData'],
            'insights' => $detailBundle['insights'],
            'jenjangBreakdown' => $detailBundle['jenjangBreakdown'],
            'sumberDanaBreakdown' => $detailBundle['sumberDanaBreakdown'],
            'gradeRealisasiBreakdown' => $detailBundle['gradeRealisasiBreakdown'] ?? [],
            'activityBreakdown' => $detailBundle['activityBreakdown'],
            'resultBreakdown' => $detailBundle['resultBreakdown'],
            'listCabangArea' => $listCabangArea,
            'listSekolah' => [],
            'listNonAreaCover' => [],
            'kegiatanSales' => [],
            'salesProfile' => [
                'name' => $areaLabel,
                'code' => (string) $area->id,
                'profile_type' => 'area',
                'total_sales' => $totalSales,
                'total_cabang' => (int) $cabangs->count(),
                'cabang' => [
                    'nama_cabang' => $area->name,
                    'area' => ['name' => $area->name],
                ],
            ],
        ];

        if ($section === 'all') {
            $full = $this->buildSalesStyleDashboardBundle(
                null,
                null,
                $targetYear,
                $areaLabel,
                (int) $area->id,
                null,
                false,
                false
            );
            $payload['listsReady'] = true;
            $payload['listSekolah'] = $full['listSekolah'];
            $payload['listNonAreaCover'] = $this->buildNonAreaCoverCustomers(null, (int) $area->id, $targetYear);
            $payload['kegiatanSales'] = $full['kegiatanSales'];
        }

        return $payload;
    }
    private function getCompetitorName($id)
    {
        static $map = null;
        if ($map === null) {
            $map = \App\Models\Competitor::pluck('nama', 'id')->toArray();
        }
        return $map[$id] ?? $id;
    }

    /**
     * Load all provinces for the selector page.
     */
    public function areaSelect()
    {
        $user = auth()->user();
        if ($user && $user->level === 'area') {
            return redirect()->route('monitoring.area', ['id' => $user->area_id]);
        } elseif ($user && $user->level === 'cabang') {
            $cabang = \App\Models\Cabang::find($user->cabang_id);
            if ($cabang) {
                return redirect()->route('monitoring.area', ['id' => $cabang->area_id, 'cabang' => $cabang->id]);
            }
        } elseif ($user && $user->level === 'sales') {
            $sales = \App\Models\Sales::find($user->sales_id);
            if ($sales && $sales->cabang) {
                return redirect()->route('monitoring.area', ['id' => $sales->cabang->area_id, 'cabang' => $sales->cabang_id]);
            }

            if ($user->area_id && $user->cabang_id) {
                return redirect()->route('monitoring.area', ['id' => $user->area_id, 'cabang' => $user->cabang_id]);
            }

            // Fallback for sales without any assignments or customers
            return Inertia::render('Monitoring/NoData', [
                'activeNav' => 'sales',
            ]);
        }

        $areas = Area::orderBy('name')->get();

        return Inertia::render('Monitoring/AreaSelect', [
            'activeNav' => 'area',
            'areas'     => $areas,
        ]);
    }

    /**
     * Pilih Area → Cabang untuk Dashboard Cabang.
     * Query: ?area_id=xx menampilkan daftar cabang di area tersebut.
     */
    public function cabangSelect(\Illuminate\Http\Request $request)
    {
        $user = auth()->user();

        if ($user && $user->level === 'cabang') {
            $cabang = \App\Models\Cabang::find($user->cabang_id);
            if ($cabang) {
                return redirect()->route('monitoring.area', [
                    'id' => $cabang->area_id,
                    'cabang' => $cabang->id,
                ]);
            }
        }

        if ($user && $user->level === 'sales') {
            $sales = \App\Models\Sales::find($user->sales_id);
            if ($sales && $sales->cabang) {
                return redirect()->route('monitoring.area', [
                    'id' => $sales->cabang->area_id,
                    'cabang' => $sales->cabang_id,
                ]);
            }
            if ($user->area_id && $user->cabang_id) {
                return redirect()->route('monitoring.area', [
                    'id' => $user->area_id,
                    'cabang' => $user->cabang_id,
                ]);
            }

            return Inertia::render('Monitoring/NoData', [
                'activeNav' => 'sales',
            ]);
        }

        $areaQuery = Area::query()->orderBy('name');
        if ($user && $user->level === 'area' && $user->area_id) {
            $areaQuery->where('id', $user->area_id);
        }
        $areas = $areaQuery->get(['id', 'name']);

        $cabangQuery = \App\Models\Cabang::query()->orderBy('nama_cabang');
        if ($user && $user->level === 'area' && $user->area_id) {
            $cabangQuery->where('area_id', $user->area_id);
        }
        $cabangs = $cabangQuery->get(['id', 'nama_cabang', 'area_id']);

        return Inertia::render('Monitoring/CabangSelect', [
            'activeNav' => 'cabang',
            'areas' => $areas,
            'cabangs' => $cabangs,
            'defaultAreaId' => ($user && $user->level === 'area') ? $user->area_id : null,
        ]);
    }

    /**
     * Build dashboard data specifically for a Cabang
     */

    private function buildUniversalDashboardData($scope = 'CABANG', $scopeId = null, $overrideSalesId = null)
    {
        $user = auth()->user();
        $isSales = $overrideSalesId || ($user && $user->level === 'sales' && $user->sales_id);

        $customerQuery = \App\Models\Customer::query();

        $sumberDana = request('sumber_dana');
        if ($sumberDana === 'BOS') {
            $customerQuery->where('sumber_dana', 'like', '%BOS%');
        } elseif ($sumberDana === 'SWA' || $sumberDana === 'SWADANA') {
            $customerQuery->where('sumber_dana', 'like', '%SWA%');
        }

        if ($scope === 'CABANG' && $scopeId) {
            $customerQuery->where('cabang_id', $scopeId);
            $cabangIds = [$scopeId];
        } elseif ($scope === 'AREA' && $scopeId) {
            $customerQuery->where('area_id', $scopeId);
            $cabangIds = \App\Models\Cabang::where('area_id', $scopeId)->pluck('id')->toArray();
        } else {
            // NASIONAL
            $cabangIds = \App\Models\Cabang::pluck('id')->toArray();
        }

        if ($overrideSalesId) {
            $salesIds = collect([$overrideSalesId]);
        } elseif ($user && $user->level === 'sales' && $user->sales_id) {
            $salesIds = collect([$user->sales_id]);
        } else {
            $salesIds = (clone $customerQuery)->pluck('sales_id')->unique();
        }

        if ($overrideSalesId) {
            $customerQuery->where('sales_id', $overrideSalesId);
        } elseif ($user && $user->level === 'sales' && $user->sales_id) {
            $customerQuery->where('sales_id', $user->sales_id);
        }

        $totalSekolah = (clone $customerQuery)->count();
        // TRL specific for scope
        $totalTahan = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('tahan_customer');
        $totalRebut = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('rebut_customer');
        $totalLepas = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('lepas_customer');
        $totalGagal = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('gagal_customer');

        $customerAktifTargetYear = request('year', date('Y'));
        $customerAktifPrevYear = $customerAktifTargetYear - 1;
        $customerAktif = (clone $customerQuery)
            ->whereHas('customerPlans', function ($q) use ($customerAktifPrevYear) {
                $q->where('year', $customerAktifPrevYear)->where('real_exemplar', '>', 0);
            })->whereHas('customerPlans', function ($q) use ($customerAktifTargetYear) {
                $q->where('year', $customerAktifTargetYear)->where('target_exemplar', '>', 0);
            })->count();

        $targetEksemplar = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)->sum('target_exemplar');

        // Realisasi eksemplar dari customer_plans (SalesPlan sering 0 / tidak terisi)
        $cfgYears = \App\Models\Configuration::query()->first(['target_year', 'prev_year']);
        $realisasiYear = (int) (request('tahun') ?: ($cfgYears->target_year ?? date('Y')));
        $customerIdsForReal = (clone $customerQuery)->pluck('id');
        $realEksemplar = $customerIdsForReal->isEmpty()
            ? 0
            : (int) \App\Models\CustomerPlan::whereIn('customer_id', $customerIdsForReal)
                ->where('year', $realisasiYear)
                ->sum('real_exemplar');

        $totalSiswa = (clone $customerQuery)->sum('total_student') ?? 0;

        // Potensi eksemplar: BOS = siswa × 1.5; selain itu agregasi per sekolah
        $sumberDanaReq = strtoupper((string) request('sumber_dana', ''));
        if ($sumberDanaReq === 'BOS') {
            $potensiEksemplar = (int) ceil($totalSiswa * 1.5);
        } else {
            $potensiEksemplar = (int) (clone $customerQuery)
                ->get(['total_student', 'sumber_dana', 'potensi_sekolah'])
                ->sum(function ($c) {
                    $siswa = (int) ($c->total_student ?? 0);
                    $sd = strtoupper((string) ($c->sumber_dana ?? ''));
                    if (str_contains($sd, 'BOS')) {
                        return (int) ceil($siswa * 1.5);
                    }
                    $ps = (int) ($c->potensi_sekolah ?? 0);
                    return $ps > 0 ? $ps : $siswa;
                });
        }

        $totalRencanaJual = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('target_customer');
        $realisasiJual = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('real_customer');

        $totalDapodikCabang = \App\Models\Kecamatan::whereIn('cabang_id', $cabangIds)->sum('dapodik_customer');
        $totalCustomerCabang = \App\Models\Customer::whereIn('cabang_id', $cabangIds)->count();

        $trl = [
            ['key' => 'tahan', 'label' => 'TAHAN', 'value' => number_format($totalTahan, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($totalTahan / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Customer Aktif SP', 'color' => '#10b981', 'icon' => 'bi-shield-check'],
            ['key' => 'rebut', 'label' => 'REBUT', 'value' => number_format($totalRebut, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($totalRebut / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Masuk AC baru (SP)', 'color' => '#60a5fa', 'icon' => 'bi-arrow-repeat'],
            ['key' => 'lepas', 'label' => 'LEPAS', 'value' => number_format($totalLepas, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($totalLepas / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Tidak masuk AC', 'color' => '#f59e0b', 'icon' => 'bi-box-arrow-right'],
            ['key' => 'gagal', 'label' => 'GAGAL', 'value' => number_format($totalGagal, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($totalGagal / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Tidak masuk AC 2 thn', 'color' => '#ef4444', 'icon' => 'bi-x-circle'],
        ];

        $trlJenjang = [];
        foreach (['SD', 'SMP', 'SMA', 'SMK'] as $j) {
            $trlJenjang[] = [
                'jenjang' => $j,
                'tahan'   => \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->where('jenjang', $j)->sum('tahan_customer'),
                'rebut'   => \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->where('jenjang', $j)->sum('rebut_customer'),
                'lepas'   => \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->where('jenjang', $j)->sum('lepas_customer'),
                'gagal'   => \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->where('jenjang', $j)->sum('gagal_customer'),
            ];
        }

        $mySalesList = \App\Models\Sales::whereIn('id', $salesIds)->get();
        $salesPlanAgg2 = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)
            ->whereNull('jenjang')
            ->selectRaw('sales_id, SUM(real_exemplar) as real_eks, SUM(tahan_customer) as tahan, SUM(rebut_customer) as rebut')
            ->groupBy('sales_id')
            ->get()
            ->keyBy('sales_id');

        $salesPlanByJenjang = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)
            ->whereNotNull('jenjang')
            ->selectRaw('sales_id, jenjang, SUM(real_exemplar) as real_eks, SUM(tahan_customer) as tahan, SUM(rebut_customer) as rebut')
            ->groupBy('sales_id', 'jenjang')
            ->get()
            ->groupBy('sales_id');

        $targetAgg = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)
            ->selectRaw('sales_id, SUM(target_exemplar) as target_eks')
            ->groupBy('sales_id')
            ->pluck('target_eks', 'sales_id');

        $timSalesData = ['all' => [], 'sd' => [], 'smp' => [], 'sma' => []];

        foreach ($mySalesList as $sales) {
            $qBase = \App\Models\Customer::where('sales_id', $sales->id);
            
            if ($sumberDana === 'BOS') {
                $qBase->where('sumber_dana', 'like', '%BOS%');
            } elseif ($sumberDana === 'SWA' || $sumberDana === 'SWADANA') {
                $qBase->where('sumber_dana', 'like', '%SWA%');
            }

            if ($scope === 'CABANG') $qBase->where('cabang_id', $scopeId);
            elseif ($scope === 'AREA') $qBase->where('area_id', $scopeId);

            $ts = (clone $qBase)->count();
            $ak = (clone $qBase)->where('is_active', 1)->count();
            $coverage = $ts > 0 ? round(($ak / $ts) * 100, 2) : 0;
            $status = 'Kurang';
            if ($coverage >= 70) $status = 'Sangat Baik';
            elseif ($coverage >= 40) $status = 'Baik';

            // Customer realisasi (customer_plans.real_exemplar > 0) vs Area Cover
            $realCustomer = (clone $qBase)->whereHas('customerPlans', function ($q) use ($realisasiYear) {
                $q->where('year', $realisasiYear)->where('real_exemplar', '>', 0);
            })->count();
            $realisasiPct = $ak > 0 ? round(($realCustomer / $ak) * 100, 2) : 0;
            $realisasiStatus = 'Kurang';
            if ($realisasiPct >= 70) $realisasiStatus = 'Sangat Baik';
            elseif ($realisasiPct >= 40) $realisasiStatus = 'Baik';

            $target_eksemplar = $targetAgg[$sales->id] ?? 0;
            $planAgg = $salesPlanAgg2->get($sales->id);
            $real_eksemplar = $planAgg ? $planAgg->real_eks : 0;
            $tahan = $planAgg ? $planAgg->tahan : 0;
            $rebut = $planAgg ? $planAgg->rebut : 0;
            $pencapaian = $target_eksemplar > 0 ? round(($real_eksemplar / $target_eksemplar) * 100, 2) : 0;

            $timSalesData['all'][] = [
                'id' => $sales->id,
                'name' => $sales->name,
                'total_sekolah' => $ts,
                'aktif' => $ak,
                'coverage' => $coverage,
                'real_customer' => $realCustomer,
                'realisasi_pct' => $realisasiPct,
                'realisasi_status' => $realisasiStatus,
                'target_eksemplar' => (int)$target_eksemplar,
                'real_eksemplar' => (int)$real_eksemplar,
                'pencapaian' => $pencapaian,
                'tahan' => (int)$tahan,
                'rebut' => (int)$rebut,
                'status' => $status,
                'score' => $ak
            ];

            foreach (['SD', 'SMP', 'SMA'] as $j) {
                $qJ = (clone $qBase)->where('jenjang', $j);
                $tsJ = $qJ->count();
                $akJ = (clone $qJ)->where('is_active', 1)->count();
                $covJ = $tsJ > 0 ? round(($akJ / $tsJ) * 100, 2) : 0;
                $stJ = 'Kurang';
                if ($covJ >= 70) $stJ = 'Sangat Baik';
                elseif ($covJ >= 40) $stJ = 'Baik';

                $realJ = (clone $qJ)->whereHas('customerPlans', function ($q) use ($realisasiYear) {
                    $q->where('year', $realisasiYear)->where('real_exemplar', '>', 0);
                })->count();
                $realPctJ = $akJ > 0 ? round(($realJ / $akJ) * 100, 2) : 0;
                $realStJ = 'Kurang';
                if ($realPctJ >= 70) $realStJ = 'Sangat Baik';
                elseif ($realPctJ >= 40) $realStJ = 'Baik';
                
                $pAggJ = null;
                if ($salesPlanByJenjang->has($sales->id)) {
                    $pAggJ = $salesPlanByJenjang->get($sales->id)->firstWhere('jenjang', $j);
                }

                $timSalesData[strtolower($j)][] = [
                    'id' => $sales->id,
                    'name' => $sales->name,
                    'total_sekolah' => $tsJ,
                    'aktif' => $akJ,
                    'coverage' => $covJ,
                    'real_customer' => $realJ,
                    'realisasi_pct' => $realPctJ,
                    'realisasi_status' => $realStJ,
                    'target_eksemplar' => 0,
                    'real_eksemplar' => (int)($pAggJ ? $pAggJ->real_eks : 0),
                    'pencapaian' => 0,
                    'tahan' => (int)($pAggJ ? $pAggJ->tahan : 0),
                    'rebut' => (int)($pAggJ ? $pAggJ->rebut : 0),
                    'status' => $stJ,
                    'score' => $akJ
                ];
            }
        }

        $timSalesPerformance = [];
        $timSalesPerformanceWorst = [];
        
        foreach (['all', 'sd', 'smp', 'sma'] as $key) {
            usort($timSalesData[$key], function ($a, $b) {
                return $b['score'] <=> $a['score'];
            });
            $timSalesPerformance[$key] = array_slice($timSalesData[$key], 0, 10);

            // Worst: realisasi customer vs area cover (terendah)
            $worstSorted = $timSalesData[$key];
            usort($worstSorted, function ($a, $b) {
                $cmp = $a['realisasi_pct'] <=> $b['realisasi_pct'];
                if ($cmp !== 0) return $cmp;
                return $b['aktif'] <=> $a['aktif']; // AC lebih besar lebih prioritas ditinjau
            });
            $timSalesPerformanceWorst[$key] = array_slice($worstSorted, 0, 5);
        }

        $bosValue = \App\Models\SalesCityPlan::whereIn('sales_id', $salesIds)->where('sumber_dana', 'BOS')->sum('target_customer');
        $swadanaValue = \App\Models\SalesCityPlan::whereIn('sales_id', $salesIds)->where('sumber_dana', 'SWADANA')->sum('target_customer');
        $totalDana = $bosValue + $swadanaValue;

        if ($totalDana > 0) {
            $danaData = [
                ['label' => 'BOS', 'value' => round(($bosValue / $totalDana) * 100), 'color' => '#1d4ed8', 'sekolah' => number_format($bosValue, 0, ',', '.')],
                ['label' => 'Swadana', 'value' => round(($swadanaValue / $totalDana) * 100), 'color' => '#93c5fd', 'sekolah' => number_format($swadanaValue, 0, ',', '.')]
            ];
        } else {
            $danaData = [
                ['label' => 'BOS', 'value' => 0, 'color' => '#1d4ed8', 'sekolah' => '-'],
                ['label' => 'Swadana', 'value' => 0, 'color' => '#93c5fd', 'sekolah' => '-']
            ];
        }

        $bosUncovered = (clone $customerQuery)->where('is_active', false)->where('sumber_dana', 'BOS')->count();
        $swadanaUncovered = (clone $customerQuery)->where('is_active', false)->where('sumber_dana', 'like', 'SWA%')->count();
        $totalUncoveredDana = $bosUncovered + $swadanaUncovered;

        if ($totalUncoveredDana > 0) {
            $uncoveredDanaData = [
                ['label' => 'Negeri (BOS)', 'value' => round(($bosUncovered / $totalUncoveredDana) * 100, 1), 'color' => '#1d4ed8', 'sekolah' => number_format($bosUncovered, 0, ',', '.')],
                ['label' => 'Swasta', 'value' => round(($swadanaUncovered / $totalUncoveredDana) * 100, 1), 'color' => '#f59e0b', 'sekolah' => number_format($swadanaUncovered, 0, ',', '.')]
            ];
        } else {
            $uncoveredDanaData = [
                ['label' => 'Negeri (BOS)', 'value' => 0, 'color' => '#1d4ed8', 'sekolah' => '-'],
                ['label' => 'Swasta', 'value' => 0, 'color' => '#f59e0b', 'sekolah' => '-']
            ];
        }

        $jenjangColors = [
            'SD'  => '#3b82f6',
            'SMP' => '#8b5cf6',
            'SMA' => '#eab308',
            'SMK' => '#f97316',
            'DLL' => '#10b981',
        ];
        $jenjangDataRaw = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)
            ->whereIn('jenjang', ['SD', 'SMP', 'SMA', 'SMK', 'DLL'])
            ->selectRaw('jenjang, SUM(ac_customer_prev) as ac25, SUM(ac_customer_curr) as ac26, SUM(target_customer) as tar')
            ->groupBy('jenjang')
            ->get();

        $totalAc25 = $jenjangDataRaw->sum('ac25') ?: 1;
        $jenjangData = $jenjangDataRaw->map(function ($j) use ($jenjangColors, $totalAc25) {
            return [
                'label'  => $j->jenjang,
                'value'  => round(($j->ac25 / $totalAc25) * 100),
                'color'  => $jenjangColors[$j->jenjang] ?? '#64748b',
                'qty'    => $j->ac25,
                'ac25'   => $j->ac25,
                'ac26'   => $j->ac26,
                'target' => $j->tar,
            ];
        })->values()->toArray();

        if (empty($jenjangData)) {
            $jenjangData = [
                ['label' => 'SD',  'value' => 0, 'color' => '#3b82f6', 'qty' => 0, 'ac25' => 0, 'ac26' => 0, 'target' => 0],
                ['label' => 'SMP', 'value' => 0, 'color' => '#8b5cf6', 'qty' => 0, 'ac25' => 0, 'ac26' => 0, 'target' => 0],
                ['label' => 'SMA', 'value' => 0, 'color' => '#eab308', 'qty' => 0, 'ac25' => 0, 'ac26' => 0, 'target' => 0],
                ['label' => 'SMK', 'value' => 0, 'color' => '#f97316', 'qty' => 0, 'ac25' => 0, 'ac26' => 0, 'target' => 0],
            ];
        }

        $salesJenjangRaw = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)
            ->whereIn('jenjang', ['SD', 'SMP', 'SMA', 'SMK', 'DLL'])
            ->where('target_customer', '>', 0)
            ->select('jenjang', \DB::raw('COUNT(DISTINCT sales_id) as total'))
            ->groupBy('jenjang')
            ->get();

        $realisasiJenjangRaw = \DB::table('customer_plans')
            ->join('customers', 'customer_plans.customer_id', '=', 'customers.id')
            ->whereIn('customers.sales_id', $salesIds)
            ->select('customers.jenjang', \DB::raw('COUNT(DISTINCT CASE WHEN customer_plans.real_exemplar > 0 THEN customers.id END) as total_real_customer'))
            ->groupBy('customers.jenjang')
            ->get()
            ->keyBy('jenjang');

        $salesJenjangColors = ['SD' => '#1d4ed8', 'SMP' => '#60a5fa', 'SMA' => '#fbbf24', 'SMK' => '#fb923c', 'DLL' => '#10b981'];
        $salesJenjangData = [];
        $totalSalesJenjang = $salesJenjangRaw->sum('total');
        $totalRealisasiJenjang = 0;

        foreach (['SD', 'SMP', 'SMA', 'SMK', 'DLL'] as $j) {
            $count = $salesJenjangRaw->firstWhere('jenjang', $j)->total ?? 0;
            $realisasi = $realisasiJenjangRaw->has($j) ? $realisasiJenjangRaw->get($j)->total_real_customer : 0;
            $totalRealisasiJenjang += $realisasi;
            
            $salesJenjangData[] = [
                'label' => $j,
                'total' => number_format($count, 0, ',', '.'),
                'pct'   => $totalSalesJenjang > 0 ? number_format(($count / $totalSalesJenjang) * 100, 2, ',', '.') : '0,00',
                'realisasi' => number_format($realisasi, 0, ',', '.'),
                'color' => $salesJenjangColors[$j] ?? '#cbd5e1',
            ];
        }
        $salesJenjangTotal = number_format($totalSalesJenjang, 0, ',', '.');
        $salesJenjangTotalRealisasi = number_format($totalRealisasiJenjang, 0, ',', '.');

        $rankingKecamatanQuery = \App\Models\Kecamatan::query();
        if ($scope !== 'NASIONAL') {
            $rankingKecamatanQuery->whereIn('cabang_id', $cabangIds);
        }
        $rankingKecamatan = $rankingKecamatanQuery->get()
            ->map(function ($r) {
                $total = $r->dapodik_customer ?? 0;
                $aktif = $r->ac_customer ?? 0;
                $pct = $total > 0 ? round(($aktif / $total) * 100) : 0;
                return [
                    'name'  => $r->camat_name,
                    'total' => $total,
                    'cust'  => $aktif,
                    'pct'   => $pct,
                    'lat'   => null,
                    'lng'   => null,
                    'geomap' => $r->geomap
                ];
            })->toArray();

        usort($rankingKecamatan, function ($a, $b) {
            return $b['pct'] <=> $a['pct'];
        });

        $mapMarkers = [];
        foreach ($rankingKecamatan as $cov) {
            if ($cov['geomap']) {
                $geomap = json_decode($cov['geomap'], true);
                if ($geomap && isset($geomap['lat']) && isset($geomap['lng'])) {
                    $belum = $cov['total'] - $cov['cust'];
                    $mapMarkers[] = [
                        'lat' => $geomap['lat'],
                        'lng' => $geomap['lng'],
                        'label' => $cov['name'],
                        'pct' => $cov['pct'],
                        'total' => $cov['total'],
                        'aktif' => $cov['cust'],
                        'belum' => $belum
                    ];
                }
            }
        }
        $rankingKecamatan = array_slice($rankingKecamatan, 0, 50);

        // Ranking peraihan potensi per sekolah
        $rankingSchools = (clone $customerQuery)
            ->whereNotNull('sales_id')
            ->get(['id', 'name', 'kecamatan_name', 'jenjang', 'total_student', 'sumber_dana', 'potensi_sekolah', 'is_active']);

        $rankingPlansByCustomer = $rankingSchools->isEmpty()
            ? collect()
            : \App\Models\CustomerPlan::whereIn('customer_id', $rankingSchools->pluck('id'))
                ->where('year', $realisasiYear)
                ->selectRaw('customer_id, SUM(real_exemplar) as real_eks, SUM(potential_exemplar) as pot_eks')
                ->groupBy('customer_id')
                ->get()
                ->keyBy('customer_id');

        $rankingPeraihanPotensi = $rankingSchools->map(function ($c) use ($sumberDanaReq, $rankingPlansByCustomer) {
            $siswaDb = (int) ($c->total_student ?? 0);
            $sd = strtoupper((string) ($c->sumber_dana ?? ''));
            $isBos = $sumberDanaReq === 'BOS' || str_contains($sd, 'BOS');

            $plan = $rankingPlansByCustomer->get($c->id);
            $real = (int) ($plan->real_eks ?? 0);
            $planPotensi = (int) ($plan->pot_eks ?? 0);
            $masterPotensi = (int) ($c->potensi_sekolah ?? 0);

            // Data total_student sering corrupt (0/1). Prioritas potensi:
            // 1) siswa valid (>1) × 1.5 untuk BOS
            // 2) potential_exemplar di customer_plans
            // 3) potensi_sekolah master
            $siswa = $siswaDb;
            $potensi = 0;
            $siswaEstimated = false;

            if ($isBos && $siswaDb > 1) {
                $potensi = (int) ceil($siswaDb * 1.5);
            } elseif ($planPotensi > 0) {
                $potensi = $planPotensi;
                if ($siswaDb <= 1) {
                    $siswa = (int) max(1, round($planPotensi / 1.5));
                    $siswaEstimated = true;
                }
            } elseif ($masterPotensi > 0) {
                $potensi = $masterPotensi;
                if ($siswaDb <= 1) {
                    $siswa = (int) max(1, round($masterPotensi / 1.5));
                    $siswaEstimated = true;
                }
            } elseif (!$isBos && $siswaDb > 0) {
                $potensi = $siswaDb;
            } else {
                return null; // tidak cukup data untuk ranking
            }

            if ($potensi < 10) {
                return null; // skip data tidak masuk akal
            }

            $pct = $potensi > 0 ? round(($real / $potensi) * 100, 1) : 0.0;

            return [
                'id' => $c->id,
                'name' => $c->name,
                'kecamatan' => $c->kecamatan_name ?: '-',
                'jenjang' => $c->jenjang ?: '-',
                'siswa' => $siswa,
                'siswa_estimated' => $siswaEstimated,
                'potensi' => $potensi,
                'realisasi' => $real,
                'pct' => $pct,
                'is_active' => (bool) $c->is_active,
            ];
        })
            ->filter()
            ->sort(function ($a, $b) {
                if ($b['pct'] !== $a['pct']) {
                    return $b['pct'] <=> $a['pct'];
                }
                return $b['realisasi'] <=> $a['realisasi'];
            })
            ->values()
            ->take(50)
            ->map(function ($row, $i) {
                $row['no'] = $i + 1;
                return $row;
            })
            ->toArray();

        // Top sekolah Area Cover (is_active) by total siswa
        $schools = (clone $customerQuery)
            ->with('cabang')
            ->where('is_active', true)
            ->whereNotNull('total_student')
            ->orderBy('total_student', 'desc')
            ->take(10)
            ->get()
            ->map(function ($c, $i) {
                return [
                    'no' => $i + 1,
                    'name' => $c->name,
                    'grade' => $c->jenjang ?: 'N/A',
                    'branch' => $c->kecamatan_name ?: ($c->cabang ? $c->cabang->nama_cabang : 'N/A'),
                    'siswa' => number_format($c->total_student, 0, ',', '.'),
                    'status' => 'Area Cover',
                    'potensi' => number_format((int) ($c->potensi_sekolah ?? 0), 0, ',', '.'),
                ];
            })->toArray();

        $rawCompetitors = (clone $customerQuery)
            ->whereNotNull('penerbit')
            ->where('penerbit', '!=', '')
            ->pluck('penerbit');

        $competitorCounts = [];
        foreach ($rawCompetitors as $pStr) {
            $parts = array_map('trim', explode(',', $pStr));
            foreach ($parts as $p) {
                if (!empty($p)) $competitorCounts[$p] = ($competitorCounts[$p] ?? 0) + 1;
            }
        }
        arsort($competitorCounts);

        $competitors = [];
        $i = 0;
        $colors = ['#1d4ed8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#64748b'];
        foreach ($competitorCounts as $label => $count) {
            if ($i >= 8) break;
            $competitors[] = [
                'label' => $this->getCompetitorName($label),
                'value' => $count,
                'color' => $colors[$i % count($colors)]
            ];
            $i++;
        }

        $leaderboard = array_map(function ($s, $idx) {
            return [
                'no' => $idx + 1,
                'name' => $s['name'],
                'tahan' => $s['tahan'],
                'rebut' => $s['rebut'],
                'score' => $s['score'],
                'coverage' => $s['coverage'],
            ];
        }, $timSalesPerformance['all'], array_keys($timSalesPerformance['all']));

        $uncoveredQuery = \App\Models\Kecamatan::query();
        if ($scope !== 'NASIONAL') {
            $uncoveredQuery->whereIn('cabang_id', $cabangIds);
        }
        $uncovered = $uncoveredQuery->get()
            ->map(function ($kec) {
                $dapodikCust = $kec->dapodik_customer ?? 0;
                $acCust = $kec->ac_customer ?? 0;
                $oppVal = max(0, $dapodikCust - $acCust);
                return [
                    'kecamatan' => $kec->camat_name,
                    'school_count' => $oppVal,
                    'potensi' => $kec->dapodik_student ?? 0,
                    '_opp_val' => $oppVal
                ];
            })
            ->sortByDesc('_opp_val')
            ->values()
            ->take(10)
            ->map(function ($c, $idx) {
                $c['no'] = $idx + 1;
                unset($c['_opp_val']);
                return $c;
            })
            ->toArray();

        $potensiKecamatan = $uncoveredQuery->get()
            ->map(function ($kec) {
                $siswa = $kec->dapodik_student ?? 0;
                $potensi = ceil($siswa * 1.5);
                return [
                    'kecamatan' => $kec->camat_name,
                    'siswa' => $siswa,
                    'potensi_eks' => $potensi
                ];
            })
            ->sortByDesc('potensi_eks')
            ->values()
            ->take(10)
            ->map(function ($c, $idx) {
                $c['no'] = $idx + 1;
                return $c;
            })
            ->toArray();

        return [
            'realStats' => [
                'total_sekolah' => $totalSekolah,
                'customer_aktif' => $customerAktif,
                'target_eksemplar' => $targetEksemplar,
                'real_eksemplar' => $realEksemplar,
                'potensi_eksemplar' => $potensiEksemplar,
                'total_siswa' => $totalSiswa,
                'total_rencana_jual' => $totalRencanaJual,
                'realisasi_jual' => $realisasiJual,
                'total_dapodik_cabang' => $totalDapodikCabang,
                'total_customer_cabang' => $totalCustomerCabang,
            ],
            'trl' => $trl,
            'trlJenjang' => $trlJenjang,
            'timSalesPerformance' => $timSalesPerformance,
            'timSalesPerformanceWorst' => $timSalesPerformanceWorst,
            'rankingKecamatan' => $rankingKecamatan,
            'rankingPeraihanPotensi' => $rankingPeraihanPotensi,
            'mapMarkers' => $mapMarkers,
            'schools' => $schools,
            'dana' => $danaData,
            'uncoveredDana' => $uncoveredDanaData,
            'jenjang' => $jenjangData,
            'trend' => (function () use ($customerQuery) {
                $customerIds = (clone $customerQuery)->select('id');
                $trendRaw = \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
                    ->select(
                        'year',
                        'sumber_dana',
                        \DB::raw('SUM(real_exemplar) as total_real'),
                        \DB::raw('SUM(target_exemplar) as total_target')
                    )
                    ->groupBy('year', 'sumber_dana')
                    ->orderBy('year')
                    ->get();

                $trendGrouped = [];
                foreach ($trendRaw as $tr) {
                    $year = (string) $tr->year;
                    if (!isset($trendGrouped[$year])) {
                        $trendGrouped[$year] = [
                            'label' => $year,
                            'swa_real' => 0,
                            'bos_real' => 0,
                            'swa_target' => 0,
                            'bos_target' => 0,
                            'real' => 0,
                            'target' => 0,
                        ];
                    }
                    $real = (int) $tr->total_real;
                    $target = (int) $tr->total_target;
                    $trendGrouped[$year]['real'] += $real;
                    $trendGrouped[$year]['target'] += $target;

                    $sd = strtoupper((string) ($tr->sumber_dana ?? ''));
                    if (str_contains($sd, 'SWA')) {
                        $trendGrouped[$year]['swa_real'] += $real;
                        $trendGrouped[$year]['swa_target'] += $target;
                    } elseif (str_contains($sd, 'BOS')) {
                        $trendGrouped[$year]['bos_real'] += $real;
                        $trendGrouped[$year]['bos_target'] += $target;
                    }
                }

                return array_values(array_map(function ($row) {
                    $row['uncov'] = max(0, (int) $row['target'] - (int) $row['real']);
                    $row['v'] = $row['target'] > 0
                        ? round(($row['real'] / $row['target']) * 100, 2)
                        : 0;
                    return $row;
                }, $trendGrouped));
            })(),
            'competitors' => $competitors,
            'leaderboard' => $leaderboard,
            'uncovered' => $uncovered,
            'potensiKecamatan' => $potensiKecamatan,
            'salesJenjangData' => $salesJenjangData,
            'salesJenjangTotal' => $salesJenjangTotal,
            'salesJenjangTotalRealisasi' => $salesJenjangTotalRealisasi,
            'jenjangFocus' => $this->buildJenjangFocusData($customerQuery),
            // also need uncoveredAnalysis as a fallback? In new component, we just use uncovered?
            // Actually the components in Area.jsx expect "top10Schools" for schools, or "schools".
            // It expects "salesPerformance" instead of "timSalesPerformance" or they are mapped?
            // In Cabang.jsx: it passes "timSalesPerformance". Area.jsx expects it too since it's a clone.
            // Also need "salesPerformance" which is different.
            // I'll ensure all keys are preserved.
        ];
    }

    /**
     * Fokus data jenjang: realisasi YoY (eksemplar + customer), sekolah baru,
     * growth Area Cover — dikelompokkan per kota/kab & per kecamatan.
     */
    private function buildJenjangFocusData($customerQuery): array
    {
        $cfg = \App\Models\Configuration::query()->first();
        $year = (int) (request('tahun') ?: ($cfg->target_year ?? date('Y')));
        $prev = $year - 1;
        $jenjangOrder = ['SD', 'SMP', 'SMA', 'SMK', 'DLL'];

        $emptyMetrics = static function () {
            return [
                'ac_prev' => 0,
                'ac_curr' => 0,
                'real_eks_prev' => 0,
                'real_eks_curr' => 0,
                'real_cust_prev' => 0,
                'real_cust_curr' => 0,
                'sekolah_baru' => 0,
                'potensi' => 0,
                'siswa' => 0,
            ];
        };

        $sumberDanaFilter = strtoupper((string) request('sumber_dana', ''));

        $customers = (clone $customerQuery)
            ->whereNotNull('sales_id')
            ->get(['id', 'kecamatan_name', 'jenjang', 'sales_id', 'total_student', 'sumber_dana', 'potensi_sekolah']);

        if ($customers->isEmpty()) {
            return [
                'year' => $year,
                'prev_year' => $prev,
                'summary' => [],
                'by_kota' => [],
                'by_kecamatan' => [],
            ];
        }

        $ids = $customers->pluck('id');

        $plansByCustomer = \App\Models\CustomerPlan::whereIn('customer_id', $ids)
            ->whereIn('year', [$year, $prev])
            ->selectRaw('customer_id, year, MAX(is_ac) as is_ac, SUM(real_exemplar) as real_eks')
            ->groupBy('customer_id', 'year')
            ->get()
            ->groupBy('customer_id');

        $hadHistory = \App\Models\CustomerPlan::whereIn('customer_id', $ids)
            ->where('year', '<', $year)
            ->where(function ($q) {
                $q->where('is_ac', 1)->orWhere('real_exemplar', '>', 0);
            })
            ->distinct()
            ->pluck('customer_id')
            ->flip();

        $summary = [];
        $byKota = [];
        $byKecamatan = [];

        $bump = static function (&$bucket, string $group, string $jenjang, array $delta) use ($emptyMetrics) {
            if (!isset($bucket[$group][$jenjang])) {
                $bucket[$group][$jenjang] = $emptyMetrics();
            }
            foreach ($delta as $k => $v) {
                $bucket[$group][$jenjang][$k] += $v;
            }
        };

        foreach ($customers as $c) {
            $jenjang = strtoupper(trim((string) ($c->jenjang ?: 'DLL')));
            if (!in_array($jenjang, $jenjangOrder, true)) {
                $jenjang = 'DLL';
            }

            $raw = trim((string) ($c->kecamatan_name ?? ''));
            $parts = array_values(array_filter(array_map('trim', explode(',', $raw)), static fn ($p) => $p !== ''));
            $kecamatanLabel = $raw !== '' ? $raw : 'Tidak Diketahui';
            $kota = count($parts) > 1 ? $parts[count($parts) - 1] : 'Tanpa Kota/Kab';

            $cp = $plansByCustomer->get($c->id) ?? collect();
            $prevRow = $cp->firstWhere('year', $prev);
            $currRow = $cp->firstWhere('year', $year);

            $acPrev = ((int) ($prevRow->is_ac ?? 0)) === 1 ? 1 : 0;
            $acCurr = ((int) ($currRow->is_ac ?? 0)) === 1 ? 1 : 0;
            $eksPrev = (int) ($prevRow->real_eks ?? 0);
            $eksCurr = (int) ($currRow->real_eks ?? 0);
            $custPrev = $eksPrev > 0 ? 1 : 0;
            $custCurr = $eksCurr > 0 ? 1 : 0;
            $sekolahBaru = ($acCurr === 1 && !isset($hadHistory[$c->id])) ? 1 : 0;

            $siswa = (int) ($c->total_student ?? 0);
            $sumberSekolah = strtoupper((string) ($c->sumber_dana ?? ''));
            $isBos = $sumberDanaFilter === 'BOS'
                || str_contains($sumberSekolah, 'BOS');
            // BOS: potensi = jumlah siswa × 1.5; selain itu pakai potensi_sekolah (fallback siswa)
            $potensi = $isBos
                ? (int) ceil($siswa * 1.5)
                : (int) (($c->potensi_sekolah ?? 0) > 0 ? $c->potensi_sekolah : $siswa);

            $delta = [
                'ac_prev' => $acPrev,
                'ac_curr' => $acCurr,
                'real_eks_prev' => $eksPrev,
                'real_eks_curr' => $eksCurr,
                'real_cust_prev' => $custPrev,
                'real_cust_curr' => $custCurr,
                'sekolah_baru' => $sekolahBaru,
                'potensi' => $potensi,
                'siswa' => $siswa,
            ];

            if (!isset($summary[$jenjang])) {
                $summary[$jenjang] = $emptyMetrics();
            }
            foreach ($delta as $k => $v) {
                $summary[$jenjang][$k] += $v;
            }

            $bump($byKota, $kota, $jenjang, $delta);
            $bump($byKecamatan, $kecamatanLabel, $jenjang, $delta);
        }

        $finalizeGroup = static function (array $bucket, array $jenjangOrder) {
            $out = [];
            foreach ($bucket as $group => $jenjangMap) {
                $rows = [];
                $totals = [
                    'ac_prev' => 0,
                    'ac_curr' => 0,
                    'real_eks_prev' => 0,
                    'real_eks_curr' => 0,
                    'real_cust_prev' => 0,
                    'real_cust_curr' => 0,
                    'sekolah_baru' => 0,
                    'potensi' => 0,
                    'siswa' => 0,
                ];
                foreach ($jenjangOrder as $j) {
                    if (!isset($jenjangMap[$j])) {
                        continue;
                    }
                    $m = $jenjangMap[$j];
                    $growth = $m['ac_prev'] > 0
                        ? round((($m['ac_curr'] - $m['ac_prev']) / $m['ac_prev']) * 100, 1)
                        : ($m['ac_curr'] > 0 ? 100.0 : 0.0);
                    $rows[] = array_merge(['jenjang' => $j], $m, ['ac_growth' => $growth]);
                    foreach ($totals as $k => $_) {
                        $totals[$k] += $m[$k];
                    }
                }
                if (empty($rows)) {
                    continue;
                }
                $totalsGrowth = $totals['ac_prev'] > 0
                    ? round((($totals['ac_curr'] - $totals['ac_prev']) / $totals['ac_prev']) * 100, 1)
                    : ($totals['ac_curr'] > 0 ? 100.0 : 0.0);
                $out[] = [
                    'group' => $group,
                    'rows' => $rows,
                    'totals' => array_merge($totals, ['ac_growth' => $totalsGrowth]),
                ];
            }

            usort($out, static function ($a, $b) {
                return $b['totals']['ac_curr'] <=> $a['totals']['ac_curr'];
            });

            return $out;
        };

        $summaryRows = [];
        foreach ($jenjangOrder as $j) {
            if (!isset($summary[$j])) {
                continue;
            }
            $m = $summary[$j];
            $growth = $m['ac_prev'] > 0
                ? round((($m['ac_curr'] - $m['ac_prev']) / $m['ac_prev']) * 100, 1)
                : ($m['ac_curr'] > 0 ? 100.0 : 0.0);
            $summaryRows[] = array_merge(['jenjang' => $j], $m, ['ac_growth' => $growth]);
        }

        return [
            'year' => $year,
            'prev_year' => $prev,
            'summary' => $summaryRows,
            'by_kota' => $finalizeGroup($byKota, $jenjangOrder),
            'by_kecamatan' => $finalizeGroup($byKecamatan, $jenjangOrder),
        ];
    }



    public function peta()
    {
        $provinces = \DB::table('provinces')
            ->select('province_code', 'province_name')
            ->orderBy('province_name')
            ->get();

        $coords = config('province_coords', []);

        // Fetch real stats by Province directly from kecamatans -> city_code (first 2 digits)
        $totalPerProv = \DB::table('kecamatans')
            ->selectRaw('LEFT(city_code, 2) as prov_code, SUM(dapodik_customer) as total')
            ->groupBy('prov_code')
            ->get()
            ->keyBy('prov_code');

        $aktifPerProv = \DB::table('sales_city_plans')
            ->where('sumber_dana', 'TOTAL')
            ->join('cities', 'sales_city_plans.city_name', '=', 'cities.city_name')
            ->selectRaw('cities.province_code as prov_code, SUM(ac_customer) as aktif')
            ->groupBy('prov_code')
            ->get()
            ->keyBy('prov_code');

        $mapMarkers = $provinces->map(function ($p) use ($coords, $totalPerProv, $aktifPerProv) {
            $c = $coords[strtoupper($p->province_name)] ?? ['lat' => -2.5, 'lng' => 118.0];

            $statTotal = $totalPerProv->get($p->province_code);
            $statAktif = $aktifPerProv->get($p->province_code);

            $total = $statTotal ? $statTotal->total : 0;
            $aktif = $statAktif ? $statAktif->aktif : 0;
            $belum = max(0, $total - $aktif);
            $pct = $total > 0 ? round(($aktif / $total) * 100) : 0;

            return [
                'lat' => $c['lat'],
                'lng' => $c['lng'],
                'label' => $p->province_name,
                'pct' => $pct,
                'total' => $total,
                'aktif' => (int)$aktif,
                'belum' => $belum
            ];
        })->toArray();

        return Inertia::render('Monitoring/Peta', [
            'mapMarkers' => $mapMarkers
        ]);
    }

    public function sekolah(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\Customer::with(['cabang', 'area', 'sales']);

        $user = auth()->user();
        if ($user) {
            if ($user->level === 'area') {
                $query->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $query->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                $query->where('sales_id', $user->sales_id);
            }
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }

        if ($request->filled('jenis')) {
            if ($request->jenis === 'negeri') {
                $query->where('sumber_dana', 'BOS');
            } elseif ($request->jenis === 'swasta') {
                $query->where('sumber_dana', 'like', 'SWA%');
            }
        }

        // Hitung Sekolah Negeri dan Swasta
        $totalNegeri = (clone $query)->where('sumber_dana', 'BOS')->count();
        $totalSwasta = (clone $query)->where('sumber_dana', 'like', 'SWA%')->count();

        $customers = $query->orderBy('name')->paginate(15)->appends($request->query());

        $areas = \App\Models\Area::orderBy('name')->get();
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();

        return Inertia::render('Monitoring/Sekolah', [
            'customers' => $customers,
            'areas' => $areas,
            'cabangs' => $cabangs,
            'stats' => [
                'negeri' => $totalNegeri,
                'swasta' => $totalSwasta,
                'total' => $totalNegeri + $totalSwasta
            ],
            'filters' => $request->only(['search', 'area_id', 'cabang_id', 'jenis'])
        ]);
    }

    /* ══════════════════════════════════════════════════════════
     *  DANA BOS — Monitoring khusus customer dengan sumber_dana BOS
     * ══════════════════════════════════════════════════════════ */

    /** Peta label market_shares (long form) → kode jenjang singkat. */
    private function danaBosJenjangMap(): array
    {
        return [
            '1. SD / MI'   => 'SD',
            '1. SD / MIS'  => 'SD',
            '2. SMP / MTS' => 'SMP',
            '2. SMP / MTs' => 'SMP',
            '3. SMA / MA'  => 'SMA',
            '4. SMK'       => 'SMK',
        ];
    }

    private function danaBosJenjangColors(): array
    {
        return ['SD' => '#1d4ed8', 'SMP' => '#60a5fa', 'SMA' => '#fbbf24', 'SMK' => '#fb923c'];
    }

    /**
     * Filter query customers ke sekolah negeri saja (berdasarkan pola nama).
     * Tidak ada kolom jenis_sekolah di DB; swasta (SDS/SDIT/MIS/dll.) dikeluarkan.
     */
    private function applySekolahNegeriFilter($query)
    {
        return $query
            ->where('name', 'not like', '%SWASTA%')
            ->where(function ($w) {
                $w->where('name', 'like', '%NEGERI%')
                    ->orWhere('name', 'like', 'SDN %')
                    ->orWhere('name', 'like', 'SDN.%')
                    ->orWhere('name', 'like', 'SMPN %')
                    ->orWhere('name', 'like', 'SMPN.%')
                    ->orWhere('name', 'like', 'SMAN %')
                    ->orWhere('name', 'like', 'SMAN.%')
                    ->orWhere('name', 'like', 'SMKN %')
                    ->orWhere('name', 'like', 'SMKN.%')
                    ->orWhere('name', 'like', 'MIN %')
                    ->orWhere('name', 'like', 'MIN.%')
                    ->orWhere('name', 'like', 'MTsN %')
                    ->orWhere('name', 'like', 'MTSN %')
                    ->orWhere('name', 'like', 'MAN %')
                    ->orWhere('name', 'like', 'SD N %')
                    ->orWhere('name', 'like', 'SMP N %')
                    ->orWhere('name', 'like', 'SMA N %')
                    ->orWhere('name', 'like', 'SMK N %');
            });
    }

    /**
     * Sekolah Non Area Cover:
     * 1) Distinct customer_id dari customer_plans (is_ac=1, tahun target) di scope
     * 2) Customers di scope yang id-nya TIDAK ada di set tersebut
     *
     * @return \Illuminate\Support\Collection<int, \App\Models\Customer>
     */
    /**
     * List sekolah / non-AC / kegiatan hemat memori (chunk + array polos, tanpa KPI).
     */
    private function buildLeanDashboardLists(?int $salesId, ?int $cabangId, ?int $areaId, int $year): array
    {
        $prevYear = $year - 1;
        $gradeThresholds = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
            ?->resolvedSchoolGradeThresholds()
            ?? \App\Models\Configuration::defaultSchoolGradeThresholds();

        $base = \App\Models\Customer::query()
            ->select([
                'id', 'name', 'npsn', 'kecamatan_name', 'jenjang', 'is_active', 'total_student',
                'penerbit', 'sumber_dana', 'potensi_sekolah', 'sales_id', 'cabang_id', 'area_id',
            ]);
        if ($salesId) {
            $base->where('sales_id', $salesId);
        }
        if ($cabangId) {
            $base->where('cabang_id', $cabangId);
        }
        if ($areaId) {
            $base->where('area_id', $areaId);
        }

        $cabangNameById = [];
        $areaNameById = [];
        $salesNameById = [];
        $cabangIds = (clone $base)->whereNotNull('cabang_id')->distinct()->pluck('cabang_id');
        if ($cabangIds->isNotEmpty()) {
            $cabangNameById = \App\Models\Cabang::whereIn('id', $cabangIds)->pluck('nama_cabang', 'id')->all();
        }
        $areaIds = (clone $base)->whereNotNull('area_id')->distinct()->pluck('area_id');
        if ($areaIds->isNotEmpty()) {
            $areaNameById = \App\Models\Area::whereIn('id', $areaIds)->pluck('name', 'id')->all();
        }
        $salesIds = (clone $base)->whereNotNull('sales_id')->where('sales_id', '>', 0)->distinct()->pluck('sales_id');
        if ($salesIds->isNotEmpty()) {
            $salesNameById = \App\Models\Sales::whereIn('id', $salesIds)->pluck('name', 'id')->all();
        }

        $listSekolah = [];
        $listNonAreaCover = [];

        (clone $base)->orderBy('id')->chunkById(400, function ($schools) use (
            &$listSekolah,
            &$listNonAreaCover,
            $year,
            $prevYear,
            $gradeThresholds,
            $cabangNameById,
            $areaNameById,
            $salesNameById
        ) {
            $ids = $schools->pluck('id')->all();
            if ($ids === []) {
                return;
            }

            $plansByCustomer = \App\Models\CustomerPlan::query()
                ->whereIn('customer_id', $ids)
                ->whereBetween('year', [$year - 3, $year])
                ->select([
                    'customer_id', 'year', 'sumber_dana',
                    'real_exemplar', 'target_exemplar', 'sp_exemplar', 'potential_exemplar', 'is_ac',
                ])
                ->get()
                ->groupBy('customer_id');

            foreach ($schools as $school) {
                $rows = $plansByCustomer->get($school->id, collect());
                $byYear = [];
                foreach ($rows as $p) {
                    $y = (int) $p->year;
                    if (!isset($byYear[$y])) {
                        $byYear[$y] = [
                            'real' => 0.0,
                            'target' => 0.0,
                            'sp' => 0.0,
                            'pot' => 0.0,
                            'is_ac' => 0,
                            'swa' => 0.0,
                            'bos' => 0.0,
                        ];
                    }
                    $byYear[$y]['real'] += (float) $p->real_exemplar;
                    $byYear[$y]['target'] += (float) $p->target_exemplar;
                    $byYear[$y]['sp'] += (float) $p->sp_exemplar;
                    $byYear[$y]['pot'] += (float) $p->potential_exemplar;
                    $byYear[$y]['is_ac'] = max($byYear[$y]['is_ac'], (int) $p->is_ac);
                    $sd = strtoupper(trim((string) ($p->sumber_dana ?? '')));
                    if ($y === $year) {
                        if (str_starts_with($sd, 'SWA')) {
                            $byYear[$y]['swa'] += (float) $p->potential_exemplar;
                        }
                        if (str_contains($sd, 'BOS')) {
                            $byYear[$y]['bos'] += (float) $p->potential_exemplar;
                        }
                    }
                }

                $isAc = (int) ($byYear[$year]['is_ac'] ?? 0) === 1;
                $sid = (int) ($school->sales_id ?? 0);
                $row = [
                    'id' => (int) $school->id,
                    'name' => $school->name,
                    'npsn' => $school->npsn ?? null,
                    'kecamatan_name' => $school->kecamatan_name,
                    'jenjang' => $school->jenjang,
                    'is_active' => $isAc ? 1 : 0,
                    'total_student' => (int) ($school->total_student ?? 0),
                    'penerbit' => $school->penerbit,
                    'sumber_dana' => $school->sumber_dana,
                    'potensi_sekolah' => $school->potensi_sekolah,
                    'sales_id' => $sid > 0 ? $sid : null,
                    'cabang_id' => $school->cabang_id ? (int) $school->cabang_id : null,
                    'area_id' => $school->area_id ? (int) $school->area_id : null,
                    'is_ac_previous' => ((int) ($byYear[$prevYear]['is_ac'] ?? 0) === 1) ? 1 : 0,
                    'target_exemplar_current' => (int) round((float) ($byYear[$year]['target'] ?? 0)),
                    'real_exemplar_current' => (int) round((float) ($byYear[$year]['real'] ?? 0)),
                    'sp_exemplar_current' => (int) round((float) ($byYear[$year]['sp'] ?? 0)),
                    'potential_exemplar_current' => (int) round((float) ($byYear[$year]['pot'] ?? 0)),
                    'real_exemplar_previous' => (int) round((float) ($byYear[$prevYear]['real'] ?? 0)),
                    'target_exemplar_previous' => (int) round((float) ($byYear[$prevYear]['target'] ?? 0)),
                    'potential_exemplar_previous' => (int) round((float) ($byYear[$prevYear]['pot'] ?? 0)),
                    'sp_exemplar_previous' => (int) round((float) ($byYear[$prevYear]['sp'] ?? 0)),
                    'real_exemplar_ym3' => (int) round((float) ($byYear[$year - 3]['real'] ?? 0)),
                    'real_exemplar_ym2' => (int) round((float) ($byYear[$year - 2]['real'] ?? 0)),
                    'prev_realisasi' => ((float) ($byYear[$prevYear]['real'] ?? 0)) > 0,
                    'cabang_name' => $cabangNameById[(int) ($school->cabang_id ?? 0)] ?? 'Tanpa Cabang',
                    'area_name' => $areaNameById[(int) ($school->area_id ?? 0)] ?? 'Tanpa Area',
                    'sales_name' => $sid > 0
                        ? (string) ($salesNameById[$sid] ?? 'Tanpa Sales')
                        : 'Tanpa Sales',
                    'school_grade' => \App\Models\Configuration::schoolGradeFromSiswa(
                        (int) ($school->total_student ?? 0),
                        $gradeThresholds
                    ),
                    'potensi_swa' => (int) round((float) ($byYear[$year]['swa'] ?? 0)),
                    'potensi_bos' => (int) round((float) ($byYear[$year]['bos'] ?? 0)),
                ];

                $listSekolah[] = $row;
                if (!$isAc) {
                    $listNonAreaCover[] = $row;
                }
            }

            unset($plansByCustomer, $schools);
            if (function_exists('gc_collect_cycles')) {
                gc_collect_cycles();
            }
        });

        usort($listSekolah, fn ($a, $b) => strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? '')));
        usort($listNonAreaCover, fn ($a, $b) => strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? '')));

        $kegiatanQuery = \App\Models\SalesActivity::query()
            ->select([
                'id', 'sales_id', 'sales_name', 'customer_id', 'customer_name',
                'tanggal', 'aktivitas', 'hasil', 'keterangan',
            ])
            ->orderByDesc('id');

        if ($salesId) {
            $kegiatanQuery->where('sales_id', $salesId);
        } elseif ($cabangId) {
            if ($salesIds->isEmpty()) {
                $kegiatanQuery->whereRaw('1 = 0');
            } else {
                $kegiatanQuery->whereIn('sales_id', $salesIds);
            }
        } elseif ($areaId) {
            if ($salesIds->isEmpty()) {
                $kegiatanQuery->whereRaw('1 = 0');
            } else {
                $kegiatanQuery->whereIn('sales_id', $salesIds);
            }
        } else {
            $kegiatanQuery->whereRaw('1 = 0');
        }

        $kegiatanSales = $kegiatanQuery->get()->map(fn ($a) => [
            'id' => (int) $a->id,
            'sales_id' => $a->sales_id ? (int) $a->sales_id : null,
            'sales_name' => $a->sales_name,
            'customer_id' => $a->customer_id ? (int) $a->customer_id : null,
            'customer_name' => $a->customer_name,
            'tanggal' => $a->tanggal,
            'aktivitas' => $a->aktivitas,
            'hasil' => $a->hasil,
            'keterangan' => $a->keterangan,
        ])->values()->all();

        return [
            'listSekolah' => $listSekolah,
            'listNonAreaCover' => $listNonAreaCover,
            'kegiatanSales' => $kegiatanSales,
        ];
    }
    private function buildNonAreaCoverCustomers(?int $cabangId, ?int $areaId, int $year)
    {
        $scope = \App\Models\Customer::query();
        if ($cabangId) {
            $scope->where('cabang_id', $cabangId);
        } elseif ($areaId) {
            $scope->where('area_id', $areaId);
        } else {
            return collect();
        }

        $scopeIds = (clone $scope)->pluck('id');
        if ($scopeIds->isEmpty()) {
            return collect();
        }

        $acIds = \App\Models\CustomerPlan::query()
            ->whereIn('customer_id', $scopeIds)
            ->where('year', $year)
            ->where('is_ac', 1)
            ->distinct()
            ->pluck('customer_id');

        $rowsQuery = clone $scope;
        if ($acIds->isNotEmpty()) {
            $rowsQuery->whereNotIn('id', $acIds);
        }
        $rows = $rowsQuery
            ->orderBy('name')
            ->get([
                'id', 'name', 'npsn', 'kecamatan_name', 'jenjang', 'total_student',
                'is_active', 'penerbit', 'sumber_dana', 'potensi_sekolah',
                'sales_id', 'cabang_id', 'area_id',
            ]);

        $salesNameById = [];
        $salesIds = $rows->pluck('sales_id')->filter()->unique()->values();
        if ($salesIds->isNotEmpty()) {
            $salesNameById = \App\Models\Sales::whereIn('id', $salesIds)
                ->pluck('name', 'id')->all();
        }

        $cabangNameById = [];
        $cabangIds = $rows->pluck('cabang_id')->filter()->unique()->values();
        if ($cabangIds->isNotEmpty()) {
            $cabangNameById = \App\Models\Cabang::whereIn('id', $cabangIds)
                ->pluck('nama_cabang', 'id')->all();
        }

        $gradeThresholds = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
            ?->resolvedSchoolGradeThresholds()
            ?? \App\Models\Configuration::defaultSchoolGradeThresholds();

        return $rows->map(function ($s) use ($salesNameById, $cabangNameById, $gradeThresholds) {
            $sid = (int) ($s->sales_id ?? 0);
            $s->is_active = 0;
            $s->sales_name = $sid > 0
                ? (string) ($salesNameById[$sid] ?? 'Tanpa Sales')
                : 'Tanpa Sales';
            $s->cabang_name = $cabangNameById[(int) ($s->cabang_id ?? 0)] ?? 'Tanpa Cabang';
            $s->school_grade = \App\Models\Configuration::schoolGradeFromSiswa(
                (int) ($s->total_student ?? 0),
                $gradeThresholds
            );
            $s->real_exemplar_current = 0;
            $s->sp_exemplar_current = 0;
            $s->real_exemplar_previous = 0;
            $s->sp_exemplar_previous = 0;
            $s->real_exemplar_ym3 = 0;
            $s->real_exemplar_ym2 = 0;
            $s->potential_exemplar_current = 0;
            $s->potensi_swa = 0;
            $s->potensi_bos = 0;

            return $s;
        })->values();
    }

    /** Cari cabang_id untuk user level sales (dari user langsung atau relasi sales->cabang). */
    private function danaBosResolveCabangIdForSales($user): ?int
    {
        if (!$user) {
            return null;
        }
        if ($user->cabang_id) {
            return (int) $user->cabang_id;
        }
        if ($user->sales_id) {
            $sales = Sales::find($user->sales_id);
            if ($sales && $sales->cabang) {
                return (int) $sales->cabang->id;
            }
        }
        return null;
    }

    /** Scope query Customer sesuai level user + filter request (area_id/cabang_id). */
    private function danaBosApplyCustomerScope($query, $user, \Illuminate\Http\Request $request): void
    {
        if ($user) {
            if ($user->level === 'area') {
                $query->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $query->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                $query->where('sales_id', $user->sales_id);
            }
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }
        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }
    }

    /** Scope query MarketShare sesuai level user + filter request (area_id/cabang_id). */
    private function danaBosApplyMarketShareScope($query, $user, \Illuminate\Http\Request $request): void
    {
        if ($user) {
            if ($user->level === 'area') {
                $query->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $query->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                $cabangId = $this->danaBosResolveCabangIdForSales($user);
                if ($cabangId) {
                    $query->where('cabang_id', $cabangId);
                }
            }
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }
        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }
    }

    /**
     * Dashboard "Dana BOS" — fokus pada customer dengan sumber_dana BOS:
     * market share vs dapodik, breakdown jenjang, komposisi, ranking sales,
     * dan analisa YoY + rekomendasi.
     */
    public function danaBos(\Illuminate\Http\Request $request)
    {
        $cfg = \App\Models\Configuration::query()->first(['target_year', 'prev_year']);
        $year = (int) ($request->query('tahun') ?: ($cfg->target_year ?? date('Y')));
        $prevYear = (int) ($cfg->prev_year ?? ($year - 1));

        $user = auth()->user();

        $jenjangMap = $this->danaBosJenjangMap();
        $jenjangColors = $this->danaBosJenjangColors();
        $jenjangOrder = ['SD', 'SMP', 'SMA', 'SMK'];

        /* ── Scope customer BOS negeri saja ── */
        $customerQuery = Customer::query()->where('sumber_dana', 'like', '%BOS%');
        $this->applySekolahNegeriFilter($customerQuery);
        $this->danaBosApplyCustomerScope($customerQuery, $user, $request);

        $customers = (clone $customerQuery)->get([
            'id', 'name', 'jenjang', 'total_student', 'sales_id', 'area_id', 'cabang_id',
            'sumber_dana', 'is_active', 'kecamatan_name',
        ]);
        $customerIds = $customers->pluck('id');

        // Total customer semua sumber dana (scope sama) untuk komposisi BOS vs Non-BOS
        $allCustomerQuery = Customer::query();
        $this->danaBosApplyCustomerScope($allCustomerQuery, $user, $request);
        $totalCustomerAllDana = (clone $allCustomerQuery)->count();

        /* ── Customer plans tahun berjalan & sebelumnya (prefer sumber_dana BOS) ── */
        $plansByCustomer = $customerIds->isEmpty()
            ? collect()
            : \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
                ->whereIn('year', [$year, $prevYear])
                ->where('sumber_dana', 'like', '%BOS%')
                ->select('customer_id', 'year', 'is_ac', 'real_exemplar')
                ->get()
                ->groupBy('customer_id');

        $getPlanRow = function ($customerId, $yr) use ($plansByCustomer) {
            $rows = $plansByCustomer->get($customerId);
            return $rows ? $rows->firstWhere('year', $yr) : null;
        };

        $emptyJenjangMetric = static function () {
            return [
                'sekolah' => 0, 'siswa' => 0, 'potensi' => 0,
                'ac_curr' => 0, 'real_customer' => 0, 'real_eksemplar' => 0,
            ];
        };

        $jenjangAgg = [];
        $salesJenjangAgg = [];

        $totalAcCurr = 0;
        $totalAcPrev = 0;
        $totalRealCustCurr = 0;
        $totalRealCustPrev = 0;
        $totalRealEksCurr = 0;
        $totalRealEksPrev = 0;
        $totalSiswa = 0;
        $totalPotensi = 0;

        foreach ($customers as $c) {
            $j = strtoupper(trim((string) ($c->jenjang ?: '')));
            if (!in_array($j, $jenjangOrder, true)) {
                $j = 'LAINNYA';
            }

            $currRow = $getPlanRow($c->id, $year);
            $prevRow = $getPlanRow($c->id, $prevYear);

            $isActive = (bool) ($c->is_active ?? false);
            $acCurr = (((int) ($currRow->is_ac ?? 0)) === 1 || $isActive) ? 1 : 0;
            $acPrev = ((int) ($prevRow->is_ac ?? 0)) === 1 ? 1 : 0;
            $eksCurr = (int) ($currRow->real_exemplar ?? 0);
            $eksPrev = (int) ($prevRow->real_exemplar ?? 0);
            $custCurr = $eksCurr > 0 ? 1 : 0;
            $custPrev = $eksPrev > 0 ? 1 : 0;

            $siswa = (int) ($c->total_student ?? 0);
            $potensi = (int) ceil($siswa * 1.5);

            if (!isset($jenjangAgg[$j])) {
                $jenjangAgg[$j] = $emptyJenjangMetric();
            }
            $jenjangAgg[$j]['sekolah']++;
            $jenjangAgg[$j]['siswa'] += $siswa;
            $jenjangAgg[$j]['potensi'] += $potensi;
            $jenjangAgg[$j]['ac_curr'] += $acCurr;
            $jenjangAgg[$j]['real_customer'] += $custCurr;
            $jenjangAgg[$j]['real_eksemplar'] += $eksCurr;

            if ($c->sales_id) {
                $key = $c->sales_id . '|' . $j;
                if (!isset($salesJenjangAgg[$key])) {
                    $salesJenjangAgg[$key] = [
                        'sales_id' => $c->sales_id,
                        'jenjang' => $j,
                        'sekolah' => 0, 'siswa' => 0, 'potensi' => 0,
                        'ac_curr' => 0, 'real_customer' => 0, 'real_eksemplar' => 0,
                    ];
                }
                $salesJenjangAgg[$key]['sekolah']++;
                $salesJenjangAgg[$key]['siswa'] += $siswa;
                $salesJenjangAgg[$key]['potensi'] += $potensi;
                $salesJenjangAgg[$key]['ac_curr'] += $acCurr;
                $salesJenjangAgg[$key]['real_customer'] += $custCurr;
                $salesJenjangAgg[$key]['real_eksemplar'] += $eksCurr;
            }

            $totalAcCurr += $acCurr;
            $totalAcPrev += $acPrev;
            $totalRealCustCurr += $custCurr;
            $totalRealCustPrev += $custPrev;
            $totalRealEksCurr += $eksCurr;
            $totalRealEksPrev += $eksPrev;
            $totalSiswa += $siswa;
            $totalPotensi += $potensi;
        }

        $totalSekolahBos = $customers->count();

        $pctChange = static function ($curr, $prev) {
            if ($prev > 0) {
                return round((($curr - $prev) / $prev) * 100, 1);
            }
            return $curr > 0 ? 100.0 : 0.0;
        };

        $coveragePct = $totalSekolahBos > 0 ? round(($totalAcCurr / $totalSekolahBos) * 100, 1) : 0.0;
        $achievementPct = $totalPotensi > 0 ? round(($totalRealEksCurr / $totalPotensi) * 100, 1) : 0.0;
        $yoyEksPct = $pctChange($totalRealEksCurr, $totalRealEksPrev);
        $yoyCustPct = $pctChange($totalRealCustCurr, $totalRealCustPrev);
        $yoyAcPct = $pctChange($totalAcCurr, $totalAcPrev);

        $kpi = [
            'total_sekolah_bos'  => $totalSekolahBos,
            'area_cover'         => $totalAcCurr,
            'realisasi_customer' => $totalRealCustCurr,
            'realisasi_eksemplar' => $totalRealEksCurr,
            'potensi_eksemplar'  => $totalPotensi,
            'total_siswa'        => $totalSiswa,
            'coverage_pct'       => $coveragePct,
            'achievement_pct'    => $achievementPct,
            'yoy_eks_pct'        => $yoyEksPct,
        ];

        /* ── Market Share per jenjang (numerator BOS, denominator dapodik) ── */
        $marketShareQuery = MarketShare::whereNull('kecamatan_code')->whereIn('jenjang', array_keys($jenjangMap));
        $this->danaBosApplyMarketShareScope($marketShareQuery, $user, $request);
        $rawMs = $marketShareQuery->select('jenjang', DB::raw('SUM(dapodik_customer) as total'))
            ->groupBy('jenjang')
            ->get();

        $dapodikByJenjang = [];
        foreach ($rawMs as $row) {
            $key = $jenjangMap[$row->jenjang] ?? null;
            if (!$key) {
                continue;
            }
            $dapodikByJenjang[$key] = ($dapodikByJenjang[$key] ?? 0) + (int) $row->total;
        }

        $marketShare = [];
        foreach ($jenjangOrder as $j) {
            $dapodik = $dapodikByJenjang[$j] ?? 0;
            $bosSekolah = $jenjangAgg[$j]['sekolah'] ?? 0;
            $bosAc = $jenjangAgg[$j]['ac_curr'] ?? 0;
            $penetrasi = $dapodik > 0 ? round(($bosSekolah / $dapodik) * 100, 2) : 0.0;
            $marketShare[] = [
                'jenjang'       => $j,
                'dapodik'       => $dapodik,
                'bos_sekolah'   => $bosSekolah,
                'bos_ac'        => $bosAc,
                'penetrasi_pct' => $penetrasi,
                'color'         => $jenjangColors[$j],
            ];
        }

        /* ── Jenjang breakdown ── */
        $jenjangData = [];
        foreach ($jenjangOrder as $j) {
            $m = $jenjangAgg[$j] ?? $emptyJenjangMetric();
            $jenjangData[] = [
                'jenjang'        => $j,
                'sekolah'        => $m['sekolah'],
                'siswa'          => $m['siswa'],
                'potensi'        => $m['potensi'],
                'real_customer'  => $m['real_customer'],
                'real_eksemplar' => $m['real_eksemplar'],
                'color'          => $jenjangColors[$j],
            ];
        }

        /* ── Komposisi ── */
        $byJenjangKomposisi = [];
        foreach ($jenjangOrder as $j) {
            $count = $jenjangAgg[$j]['sekolah'] ?? 0;
            if ($count <= 0) {
                continue;
            }
            $byJenjangKomposisi[] = ['label' => $j, 'value' => $count, 'color' => $jenjangColors[$j]];
        }
        $nonBos = max(0, $totalCustomerAllDana - $totalSekolahBos);
        $komposisi = [
            'byJenjang' => $byJenjangKomposisi,
            'bosVsLain' => [
                ['label' => 'BOS', 'value' => $totalSekolahBos, 'color' => '#1d4ed8'],
                ['label' => 'Non-BOS', 'value' => $nonBos, 'color' => '#cbd5e1'],
            ],
        ];

        /* ── Ranking sales per segmen (jenjang) ── */
        $rankingSalesIds = collect($salesJenjangAgg)->pluck('sales_id')->unique()->values();
        $salesNamesMap = $rankingSalesIds->isEmpty()
            ? collect()
            : Sales::whereIn('id', $rankingSalesIds)->pluck('name', 'id');

        $rankingSalesSegmen = collect($salesJenjangAgg)
            ->map(function ($row) use ($salesNamesMap) {
                return [
                    'sales_id'        => $row['sales_id'],
                    'sales_name'      => $salesNamesMap[$row['sales_id']] ?? ('Sales #' . $row['sales_id']),
                    'jenjang'         => $row['jenjang'],
                    'sekolah'         => $row['sekolah'],
                    'real_customer'   => $row['real_customer'],
                    'real_eksemplar'  => $row['real_eksemplar'],
                    'potensi'         => $row['potensi'],
                    'achievement_pct' => $row['potensi'] > 0
                        ? round(($row['real_eksemplar'] / $row['potensi']) * 100, 1)
                        : 0.0,
                ];
            })
            ->sortByDesc('real_eksemplar')
            ->take(30)
            ->values()
            ->toArray();

        /* ── Analisa YoY + rekomendasi ── */
        $rekomendasi = [];

        if ($yoyEksPct < 0) {
            $rekomendasi[] = 'Realisasi eksemplar BOS turun ' . number_format(abs($yoyEksPct), 1, ',', '.') . '% dibanding ' . $prevYear . ', perlu evaluasi strategi penjualan segera.';
        } else {
            $rekomendasi[] = 'Realisasi eksemplar BOS tumbuh ' . number_format($yoyEksPct, 1, ',', '.') . '% dibanding ' . $prevYear . ', pertahankan momentum ini di tahun ' . $year . '.';
        }

        $lowestPenetrasi = collect($marketShare)->filter(fn ($r) => $r['dapodik'] > 0)->sortBy('penetrasi_pct')->first();
        if ($lowestPenetrasi) {
            $rekomendasi[] = 'Penetrasi BOS di jenjang ' . $lowestPenetrasi['jenjang'] . ' masih rendah (' . number_format($lowestPenetrasi['penetrasi_pct'], 1, ',', '.') . '% dari ' . number_format($lowestPenetrasi['dapodik'], 0, ',', '.') . ' sekolah dapodik), jadikan prioritas ekspansi tahun depan.';
        }

        $biggestGap = collect($jenjangData)
            ->map(function ($r) {
                $r['gap'] = $r['potensi'] - $r['real_eksemplar'];
                return $r;
            })
            ->sortByDesc('gap')
            ->first();
        if ($biggestGap && $biggestGap['gap'] > 0) {
            $rekomendasi[] = 'Jenjang ' . $biggestGap['jenjang'] . ' memiliki gap potensi terbesar: ' . number_format($biggestGap['gap'], 0, ',', '.') . ' eksemplar belum tergarap dari total potensi ' . number_format($biggestGap['potensi'], 0, ',', '.') . '.';
        }

        $salesNoRealisasi = collect($rankingSalesSegmen)
            ->filter(fn ($r) => $r['sekolah'] > 0 && $r['real_eksemplar'] <= 0)
            ->take(3);
        foreach ($salesNoRealisasi as $r) {
            $rekomendasi[] = 'Sales ' . $r['sales_name'] . ' memegang ' . $r['sekolah'] . ' sekolah BOS jenjang ' . $r['jenjang'] . ' namun belum ada realisasi eksemplar tahun ' . $year . ', perlu follow-up.';
        }

        if ($achievementPct < 50) {
            $rekomendasi[] = 'Achievement realisasi terhadap potensi BOS baru ' . number_format($achievementPct, 1, ',', '.') . '%, masih banyak peluang siswa BOS yang belum tergarap maksimal.';
        }

        if ($coveragePct < 50) {
            $rekomendasi[] = 'Coverage area (AC) sekolah BOS baru ' . number_format($coveragePct, 1, ',', '.') . '%, dorong onboarding sekolah BOS baru menjadi customer aktif tahun ' . $year . '.';
        }

        if (count($rekomendasi) < 4) {
            $rekomendasi[] = 'Terus pantau performa realisasi BOS tiap jenjang secara berkala untuk menjaga pertumbuhan tahun ' . $year . '.';
        }

        $rekomendasi = array_slice($rekomendasi, 0, 8);

        $analisa = [
            'prev' => ['year' => $prevYear, 'real_eksemplar' => $totalRealEksPrev, 'real_customer' => $totalRealCustPrev, 'ac' => $totalAcPrev],
            'curr' => ['year' => $year, 'real_eksemplar' => $totalRealEksCurr, 'real_customer' => $totalRealCustCurr, 'ac' => $totalAcCurr],
            'yoy_eks_pct'  => $yoyEksPct,
            'yoy_cust_pct' => $yoyCustPct,
            'yoy_ac_pct'   => $yoyAcPct,
            'rekomendasi'  => $rekomendasi,
        ];

        $tabelSegmen = $this->buildDanaBosTabelSegmen(
            $customers,
            $getPlanRow,
            $year,
            $prevYear,
            $jenjangOrder,
            $jenjangColors
        );

        /* ── Filter options (area/cabang) sesuai level user ── */
        $filterOptions = ['areas' => [], 'cabangs' => []];
        if (!$user || $user->level === 'nasional') {
            $filterOptions['areas'] = Area::orderBy('name')->get(['id', 'name']);
            $cabangQuery = \App\Models\Cabang::orderBy('nama_cabang');
            if ($request->filled('area_id')) {
                $cabangQuery->where('area_id', $request->area_id);
            }
            $filterOptions['cabangs'] = $cabangQuery->get(['id', 'nama_cabang', 'area_id']);
        } elseif ($user->level === 'area') {
            $filterOptions['areas'] = Area::where('id', $user->area_id)->get(['id', 'name']);
            $filterOptions['cabangs'] = \App\Models\Cabang::where('area_id', $user->area_id)
                ->orderBy('nama_cabang')
                ->get(['id', 'nama_cabang', 'area_id']);
        }

        // Dashboard overview ala Area (scoped BOS)
        $scopeAreaId = $request->filled('area_id')
            ? (int) $request->area_id
            : (($user && $user->level === 'area') ? (int) $user->area_id : null);
        $scopeCabangId = $request->filled('cabang_id')
            ? (int) $request->cabang_id
            : (($user && $user->level === 'cabang') ? (int) $user->cabang_id : null);
        $scopeSalesId = ($user && $user->level === 'sales') ? (int) $user->sales_id : null;

        $detailBundle = $this->buildSalesStyleDashboardBundle(
            $scopeSalesId,
            $scopeCabangId,
            $year,
            'Dana BOS',
            $scopeAreaId,
            'BOS',
            true
        );

        // Tabel Segmen: initial load hanya ringkasan per Area (lazy-load anak saat expand)
        $listSegmenArea = $this->buildDanaBosSegmenAreaSummaries(
            $detailBundle['listSekolah'] ?? collect(),
            $scopeAreaId,
            $scopeCabangId
        );

        return Inertia::render('Monitoring/DanaBos', [
            'activeNav' => 'dana-bos',
            'tahun'     => $year,
            'prevYear'  => $prevYear,
            'filters'   => [
                'area_id'   => $request->query('area_id'),
                'cabang_id' => $request->query('cabang_id'),
                'tahun'     => $year,
            ],
            'filterOptions'       => $filterOptions,
            'kpi'                 => $kpi,
            'marketShare'         => $marketShare,
            'jenjang'             => $jenjangData,
            'komposisi'           => $komposisi,
            'rankingSalesSegmen'  => $rankingSalesSegmen,
            'analisa'             => $analisa,
            'tabelSegmen'         => $tabelSegmen,
            'useSalesStyleDashboard' => true,
            'kpiData' => $detailBundle['kpiData'],
            'insights' => $detailBundle['insights'],
            'listSekolah' => $detailBundle['listSekolah'],
            'listSegmenArea' => $listSegmenArea,
            'listKecamatanSegmen' => [],
            'jenjangBreakdown' => $detailBundle['jenjangBreakdown'],
            'sumberDanaBreakdown' => $detailBundle['sumberDanaBreakdown'],
            'gradeRealisasiBreakdown' => $detailBundle['gradeRealisasiBreakdown'] ?? [],
            'kegiatanSales' => $detailBundle['kegiatanSales'],
            'activityBreakdown' => $detailBundle['activityBreakdown'],
            'resultBreakdown' => $detailBundle['resultBreakdown'],
            'salesProfile' => [
                'name' => 'Dana BOS',
                'code' => 'BOS',
                'cabang' => [
                    'nama_cabang' => 'Nasional',
                    'area' => ['name' => 'Dana BOS'],
                ],
            ],
            'configuration' => [
                'target_year' => $year,
                'prev_year' => $prevYear,
            ],
        ]);
    }

    /**
     * Lazy-load anak Tabel Segmen Dana BOS untuk satu Area.
     */
    public function danaBosSegmenChildren(\Illuminate\Http\Request $request)
    {
        $cfg = \App\Models\Configuration::query()->first(['target_year', 'prev_year']);
        $year = (int) ($request->query('tahun') ?: ($cfg->target_year ?? date('Y')));
        $user = auth()->user();

        $areaName = trim((string) $request->query('area_name', ''));
        $areaIdParam = $request->query('area_id');
        $cabangId = $request->filled('cabang_id') ? (int) $request->cabang_id : null;
        if ($user && $user->level === 'cabang' && !$cabangId) {
            $cabangId = (int) $user->cabang_id;
        }

        $isUnassigned = $areaName === 'Belum Ter-assign'
            || $areaIdParam === '0'
            || $areaIdParam === 0;

        if ($isUnassigned) {
            $detailBundle = $this->buildSalesStyleDashboardBundle(
                ($user && $user->level === 'sales') ? (int) $user->sales_id : null,
                $cabangId,
                $year,
                'Dana BOS',
                null,
                'BOS',
                true
            );
            $rows = $this->buildDanaBosKecamatanSegmenList(
                $detailBundle['listSekolah'] ?? collect(),
                null,
                $cabangId
            );
            $rows = array_values(array_filter(
                $rows,
                static fn ($r) => ($r['area_name'] ?? '') === 'Belum Ter-assign'
            ));
        } else {
            $areaId = $request->filled('area_id')
                ? (int) $request->area_id
                : (($user && $user->level === 'area') ? (int) $user->area_id : null);

            if (!$areaId && $areaName !== '') {
                $areaId = (int) (\App\Models\Area::where('name', $areaName)->value('id') ?? 0);
                $areaId = $areaId > 0 ? $areaId : null;
            }

            $detailBundle = $this->buildSalesStyleDashboardBundle(
                ($user && $user->level === 'sales') ? (int) $user->sales_id : null,
                $cabangId,
                $year,
                'Dana BOS',
                $areaId,
                'BOS',
                true
            );
            $rows = $this->buildDanaBosKecamatanSegmenList(
                $detailBundle['listSekolah'] ?? collect(),
                $areaId,
                $cabangId
            );
            if ($areaName !== '') {
                $rows = array_values(array_filter(
                    $rows,
                    static fn ($r) => ($r['area_name'] ?? '') === $areaName
                ));
            }
        }

        return response()->json([
            'rows' => $rows,
        ]);
    }

    /**
     * Ringkasan per Area untuk initial load Tabel Segmen (tanpa leaf kecamatan).
     */
    private function buildDanaBosSegmenAreaSummaries($listSekolah, ?int $areaId = null, ?int $cabangId = null): array
    {
        $cabangQuery = \App\Models\Cabang::query()->with('area');
        if ($cabangId) {
            $cabangQuery->where('id', $cabangId);
        } elseif ($areaId) {
            $cabangQuery->where('area_id', $areaId);
        }
        $cabangs = $cabangQuery->get();

        $kecCountByCabang = $cabangs->isEmpty()
            ? collect()
            : \App\Models\Kecamatan::query()
                ->whereIn('cabang_id', $cabangs->pluck('id'))
                ->selectRaw('cabang_id, COUNT(*) as cnt')
                ->groupBy('cabang_id')
                ->pluck('cnt', 'cabang_id');

        $empty = static function (string $name, int $id): array {
            return [
                'key' => $name,
                'display' => $name,
                'area_id' => $id,
                'area_name' => $name,
                'count' => 0,
                'total_student' => 0,
                'real_exemplar_ym3' => 0,
                'real_exemplar_ym2' => 0,
                'sp_exemplar_previous' => 0,
                'real_exemplar_previous' => 0,
                'sp_exemplar_current' => 0,
                'real_exemplar_current' => 0,
                'ac_prev' => 0,
                'ac_curr' => 0,
                'cust_real' => 0,
                'total_cust' => 0,
                'marketshare_pct' => 0,
                'jumlah_salesman' => 0,
                'salesman_ids' => [],
                'salesman_names' => [],
                '_salesmen' => [],
            ];
        };

        $byArea = [];
        foreach ($cabangs as $cab) {
            $name = $cab->area->name ?? 'Tanpa Area';
            $aid = (int) ($cab->area_id ?? 0);
            if (!isset($byArea[$name])) {
                $byArea[$name] = $empty($name, $aid);
            }
            $byArea[$name]['count'] += (int) ($kecCountByCabang[$cab->id] ?? 0);
        }

        // Area tanpa cabang di scope tetap tidak muncul; pastikan semua area ada bila tanpa filter
        if (!$areaId && !$cabangId) {
            foreach (\App\Models\Area::orderBy('name')->get(['id', 'name']) as $area) {
                $name = $area->name;
                if (!isset($byArea[$name])) {
                    $byArea[$name] = $empty($name, (int) $area->id);
                }
            }
            $orphanCount = (int) \App\Models\Kecamatan::query()
                ->where(function ($q) {
                    $q->whereNull('cabang_id')->orWhere('cabang_id', 0);
                })
                ->count();
            if ($orphanCount > 0) {
                $byArea['Belum Ter-assign'] = $empty('Belum Ter-assign', 0);
                $byArea['Belum Ter-assign']['count'] = $orphanCount;
            }
        }

        foreach ($listSekolah as $s) {
            $acCurr = (int) ($s->is_active ?? 0) === 1 ? 1 : 0;
            $acPrev = (int) ($s->is_ac_previous ?? 0) === 1 ? 1 : 0;
            $name = $s->area_name ?? 'Tanpa Area';
            if (!isset($byArea[$name])) {
                $byArea[$name] = $empty($name, (int) ($s->area_id ?? 0));
            }
            $byArea[$name]['ac_prev'] += $acPrev;
            $byArea[$name]['ac_curr'] += $acCurr;
            $byArea[$name]['total_cust']++;
            if ((float) ($s->real_exemplar_current ?? 0) > 0) {
                $byArea[$name]['cust_real']++;
            }
            $sid = (int) ($s->sales_id ?? 0);
            if ($sid > 0) {
                $sname = trim((string) ($s->sales_name ?? ''));
                $byArea[$name]['_salesmen'][$sid] = $sname !== '' && $sname !== 'Tanpa Sales'
                    ? $sname
                    : ('Sales #' . $sid);
            }
            if ($acCurr === 1) {
                $byArea[$name]['total_student'] += (int) ($s->total_student ?? 0);
                $byArea[$name]['real_exemplar_ym3'] += (int) ($s->real_exemplar_ym3 ?? 0);
                $byArea[$name]['real_exemplar_ym2'] += (int) ($s->real_exemplar_ym2 ?? 0);
                $byArea[$name]['sp_exemplar_previous'] += (int) ($s->sp_exemplar_previous ?? 0);
                $byArea[$name]['real_exemplar_previous'] += (int) ($s->real_exemplar_previous ?? 0);
                $byArea[$name]['sp_exemplar_current'] += (int) ($s->sp_exemplar_current ?? 0);
                $byArea[$name]['real_exemplar_current'] += (int) ($s->real_exemplar_current ?? 0);
            }
        }

        foreach ($byArea as &$areaRow) {
            $totalCust = (int) ($areaRow['total_cust'] ?? 0);
            $custReal = (int) ($areaRow['cust_real'] ?? 0);
            $areaRow['marketshare_pct'] = $totalCust > 0
                ? round(($custReal / $totalCust) * 100, 1)
                : 0.0;
            $salesmen = $areaRow['_salesmen'] ?? [];
            ksort($salesmen);
            $areaRow['salesman_ids'] = array_map('intval', array_keys($salesmen));
            $areaRow['salesman_names'] = array_values($salesmen);
            $areaRow['jumlah_salesman'] = count($salesmen);
            unset($areaRow['_salesmen']);
        }
        unset($areaRow);

        $out = array_values($byArea);
        usort($out, static fn ($a, $b) => strcmp($a['display'], $b['display']));

        return $out;
    }

    /**
     * Agregat sekolah BOS → baris kecamatan untuk tab Tabel Segmen (AnalisisTab).
     * Hierarki FE: Area → Cabang → Kota/Kab → Kecamatan (leaf).
     * Seed seluruh kecamatan master + pastikan semua Area/Cabang di scope tampil
     * (kecamatan tanpa cabang_id masuk "Belum Ter-assign", atau diwariskan via city_code bila unik).
     */
    private function buildDanaBosKecamatanSegmenList($listSekolah, ?int $areaId = null, ?int $cabangId = null): array
    {
        $pct = static function (float $curr, float $prev): float {
            if ($prev > 0) {
                return round((($curr - $prev) / $prev) * 100, 1);
            }

            return $curr > 0 ? 100.0 : 0.0;
        };

        $normalizeKec = static function (string $name): string {
            $n = mb_strtoupper(trim($name));
            $n = preg_replace('/^(KEC\.?\s*|KECAMATAN\s+)/u', '', $n) ?? $n;

            return trim(preg_replace('/\s+/u', ' ', $n) ?? $n);
        };

        $makeRow = static function (
            string $kec,
            string $kota,
            string $areaName,
            string $cabangName,
            int $areaIdVal,
            int $cabangIdVal
        ): array {
            $key = $areaName . '|' . $cabangName . '|' . $kota . '|' . $kec;

            return [
                'id' => $key,
                'name' => $kec === 'TANPA KECAMATAN' ? 'Tanpa Kecamatan' : $kec,
                'kecamatan_name' => $kota === 'TANPA KOTA/KAB' ? $kec : ($kec . ', ' . $kota),
                'jenjang' => 'KEC',
                'is_active' => 0,
                'area_id' => $areaIdVal,
                'cabang_id' => $cabangIdVal,
                'area_name' => $areaName,
                'cabang_name' => $cabangName,
                'total_student' => 0,
                'real_exemplar_ym3' => 0,
                'real_exemplar_ym2' => 0,
                'potential_exemplar_previous' => 0,
                'sp_exemplar_previous' => 0,
                'real_exemplar_previous' => 0,
                'potential_exemplar_current' => 0,
                'sp_exemplar_current' => 0,
                'real_exemplar_current' => 0,
                'ac_prev' => 0,
                'ac_curr' => 0,
                'school_count' => 0,
                'cust_real' => 0,
                'total_cust' => 0,
                'marketshare_pct' => 0,
                'jumlah_salesman' => 0,
                'salesman_ids' => [],
                'salesman_names' => [],
                '_salesmen' => [],
                'growth_ac_pct' => 0,
                'growth_real_pct' => 0,
            ];
        };

        $cabangQuery = \App\Models\Cabang::query()->with('area');
        if ($cabangId) {
            $cabangQuery->where('id', $cabangId);
        } elseif ($areaId) {
            $cabangQuery->where('area_id', $areaId);
        }
        $cabangs = $cabangQuery->get()->keyBy('id');

        $cityNameByCode = DB::table('cities')->pluck('city_name', 'city_code');

        // Wariskan cabang_id ke kecamatan orphan bila 1 kota hanya punya 1 cabang ter-assign
        $cityCabangInherit = \App\Models\Kecamatan::query()
            ->whereNotNull('cabang_id')
            ->where('cabang_id', '>', 0)
            ->get(['city_code', 'cabang_id'])
            ->groupBy('city_code')
            ->map(function ($g) {
                $ids = $g->pluck('cabang_id')->unique()->values();

                return $ids->count() === 1 ? (int) $ids->first() : null;
            })
            ->filter();

        $map = [];
        $ensure = function (
            string $kec,
            string $kota,
            string $areaName,
            string $cabangName,
            int $areaIdVal,
            int $cabangIdVal
        ) use (&$map, $makeRow): void {
            $key = $areaName . '|' . $cabangName . '|' . $kota . '|' . $kec;
            if (!isset($map[$key])) {
                $map[$key] = $makeRow($kec, $kota, $areaName, $cabangName, $areaIdVal, $cabangIdVal);
            }
        };

        // 1) Semua kecamatan master
        $masterKec = \App\Models\Kecamatan::query()
            ->get(['camat_name', 'city_code', 'cabang_id']);

        foreach ($masterKec as $mk) {
            $kec = $normalizeKec((string) ($mk->camat_name ?? ''));
            if ($kec === '') {
                continue;
            }
            $kotaRaw = trim((string) ($cityNameByCode[$mk->city_code] ?? ''));
            $kota = $kotaRaw !== '' ? mb_strtoupper($kotaRaw) : 'TANPA KOTA/KAB';

            $resolvedCabangId = (int) ($mk->cabang_id ?? 0);
            if ($resolvedCabangId <= 0) {
                $resolvedCabangId = (int) ($cityCabangInherit[$mk->city_code] ?? 0);
            }

            if ($resolvedCabangId > 0 && isset($cabangs[$resolvedCabangId])) {
                $cab = $cabangs[$resolvedCabangId];
                $ensure(
                    $kec,
                    $kota,
                    $cab->area->name ?? 'Tanpa Area',
                    $cab->nama_cabang ?? 'Tanpa Cabang',
                    (int) ($cab->area_id ?? 0),
                    (int) $cab->id
                );
                continue;
            }

            // Di luar scope cabang ter-assign: hanya tampilkan orphan bila tanpa filter area/cabang
            if ($cabangId || $areaId) {
                continue;
            }
            if ($resolvedCabangId > 0) {
                // cabang ada di DB tapi tidak masuk query scope (harusnya jarang)
                continue;
            }

            $ensure(
                $kec,
                $kota,
                'Belum Ter-assign',
                'Tanpa Cabang',
                0,
                0
            );
        }

        // 2) Pastikan setiap Area/Cabang di scope punya minimal 1 leaf (agar 9 area tampil)
        foreach ($cabangs as $cab) {
            $areaName = $cab->area->name ?? 'Tanpa Area';
            $cabangName = $cab->nama_cabang ?? 'Tanpa Cabang';
            $prefix = $areaName . '|' . $cabangName . '|';
            $hasLeaf = false;
            foreach ($map as $key => $_) {
                if (str_starts_with($key, $prefix)) {
                    $hasLeaf = true;
                    break;
                }
            }
            if (!$hasLeaf) {
                $ensure(
                    '— Belum ada kecamatan —',
                    'TANPA KOTA/KAB',
                    $areaName,
                    $cabangName,
                    (int) ($cab->area_id ?? 0),
                    (int) $cab->id
                );
            }
        }

        // 3) Gabungkan metrik dari sekolah BOS
        foreach ($listSekolah as $s) {
            $acCurr = (int) ($s->is_active ?? 0) === 1 ? 1 : 0;
            $acPrev = (int) ($s->is_ac_previous ?? 0) === 1 ? 1 : 0;

            $raw = trim((string) ($s->kecamatan_name ?? ''));
            $parts = array_values(array_filter(array_map('trim', explode(',', $raw))));
            $kec = $normalizeKec($parts[0] ?? ($raw !== '' ? $raw : 'TANPA KECAMATAN'));
            if ($kec === '') {
                $kec = 'TANPA KECAMATAN';
            }
            $kota = strtoupper(count($parts) > 1 ? implode(', ', array_slice($parts, 1)) : 'TANPA KOTA/KAB');
            $areaName = $s->area_name ?? 'Tanpa Area';
            $cabangName = $s->cabang_name ?? 'Tanpa Cabang';
            $key = $areaName . '|' . $cabangName . '|' . $kota . '|' . $kec;

            if (!isset($map[$key])) {
                $map[$key] = $makeRow(
                    $kec,
                    $kota,
                    $areaName,
                    $cabangName,
                    (int) ($s->area_id ?? 0),
                    (int) ($s->cabang_id ?? 0)
                );
            }

            $map[$key]['ac_prev'] += $acPrev;
            $map[$key]['ac_curr'] += $acCurr;

            // Market share: cust real vs total cust (semua sekolah BOS di kecamatan)
            $map[$key]['total_cust']++;
            $realCurrEks = (float) ($s->real_exemplar_current ?? 0);
            if ($realCurrEks > 0) {
                $map[$key]['cust_real']++;
            }

            $sid = (int) ($s->sales_id ?? 0);
            if ($sid > 0) {
                $sname = trim((string) ($s->sales_name ?? ''));
                $map[$key]['_salesmen'][$sid] = $sname !== '' && $sname !== 'Tanpa Sales'
                    ? $sname
                    : ('Sales #' . $sid);
            }

            if ($acCurr === 1) {
                $map[$key]['total_student'] += (int) ($s->total_student ?? 0);
                $map[$key]['real_exemplar_ym3'] += (int) ($s->real_exemplar_ym3 ?? 0);
                $map[$key]['real_exemplar_ym2'] += (int) ($s->real_exemplar_ym2 ?? 0);
                $map[$key]['potential_exemplar_previous'] += (int) ($s->potential_exemplar_previous ?? 0);
                $map[$key]['sp_exemplar_previous'] += (int) ($s->sp_exemplar_previous ?? 0);
                $map[$key]['real_exemplar_previous'] += (int) ($s->real_exemplar_previous ?? 0);
                $map[$key]['potential_exemplar_current'] += (int) ($s->potential_exemplar_current ?? 0);
                $map[$key]['sp_exemplar_current'] += (int) ($s->sp_exemplar_current ?? 0);
                $map[$key]['real_exemplar_current'] += (int) ($s->real_exemplar_current ?? 0);
                $map[$key]['school_count']++;
            }
        }

        foreach ($map as &$row) {
            $row['is_active'] = ((int) $row['ac_curr']) > 0 ? 1 : 0;
            $totalCust = (int) ($row['total_cust'] ?? 0);
            $custReal = (int) ($row['cust_real'] ?? 0);
            $row['marketshare_pct'] = $totalCust > 0
                ? round(($custReal / $totalCust) * 100, 1)
                : 0.0;
            $salesmen = $row['_salesmen'] ?? [];
            ksort($salesmen);
            $row['salesman_ids'] = array_map('intval', array_keys($salesmen));
            $row['salesman_names'] = array_values($salesmen);
            $row['jumlah_salesman'] = count($salesmen);
            unset($row['_salesmen']);
            $row['growth_ac_pct'] = $pct((float) $row['ac_curr'], (float) $row['ac_prev']);
            $row['growth_real_pct'] = $pct(
                (float) $row['real_exemplar_current'],
                (float) $row['real_exemplar_previous']
            );
        }
        unset($row);

        return array_values($map);
    }

    /**
     * Halaman panduan / daftar isi sistem Yudhistira Monitoring.
     */
    public function daftarIsi()
    {
        return Inertia::render('Monitoring/DaftarIsi', [
            'activeNav' => 'daftar-isi',
        ]);
    }

    /**
     * Tabel Segmen Dana BOS: hierarki Jenjang → Kota/Kab → Kecamatan
     * dengan realisasi YoY (eksemplar + customer) dan growth AC / realisasi.
     */
    private function buildDanaBosTabelSegmen($customers, callable $getPlanRow, int $year, int $prevYear, array $jenjangOrder, array $jenjangColors): array
    {
        $empty = static function () {
            return [
                'sekolah' => 0,
                'ac_prev' => 0,
                'ac_curr' => 0,
                'real_eks_prev' => 0,
                'real_eks_curr' => 0,
                'real_cust_prev' => 0,
                'real_cust_curr' => 0,
            ];
        };

        $pct = static function ($curr, $prev) {
            if ($prev > 0) {
                return round((($curr - $prev) / $prev) * 100, 1);
            }
            return $curr > 0 ? 100.0 : 0.0;
        };

        $withGrowth = static function (array $m) use ($pct) {
            return array_merge($m, [
                'growth_ac_pct' => $pct($m['ac_curr'], $m['ac_prev']),
                'growth_eks_pct' => $pct($m['real_eks_curr'], $m['real_eks_prev']),
                'growth_cust_pct' => $pct($m['real_cust_curr'], $m['real_cust_prev']),
            ]);
        };

        // tree[jenjang][kota][kecamatan] = metrics
        $tree = [];

        foreach ($customers as $c) {
            $j = strtoupper(trim((string) ($c->jenjang ?: '')));
            if (!in_array($j, $jenjangOrder, true)) {
                $j = 'LAINNYA';
            }

            $raw = trim((string) ($c->kecamatan_name ?? ''));
            $parts = array_values(array_filter(array_map('trim', explode(',', $raw)), static fn ($p) => $p !== ''));
            $kecamatan = $raw !== '' ? $raw : 'Tidak Diketahui';
            $kota = count($parts) > 1 ? $parts[count($parts) - 1] : ($raw !== '' ? $raw : 'Tanpa Kota/Kab');

            $currRow = $getPlanRow($c->id, $year);
            $prevRow = $getPlanRow($c->id, $prevYear);

            $isActive = (bool) ($c->is_active ?? false);
            $acCurr = (((int) ($currRow->is_ac ?? 0)) === 1 || $isActive) ? 1 : 0;
            $acPrev = ((int) ($prevRow->is_ac ?? 0)) === 1 ? 1 : 0;
            $eksCurr = (int) ($currRow->real_exemplar ?? 0);
            $eksPrev = (int) ($prevRow->real_exemplar ?? 0);
            $custCurr = $eksCurr > 0 ? 1 : 0;
            $custPrev = $eksPrev > 0 ? 1 : 0;

            if (!isset($tree[$j][$kota][$kecamatan])) {
                $tree[$j][$kota][$kecamatan] = $empty();
            }
            $tree[$j][$kota][$kecamatan]['sekolah']++;
            $tree[$j][$kota][$kecamatan]['ac_prev'] += $acPrev;
            $tree[$j][$kota][$kecamatan]['ac_curr'] += $acCurr;
            $tree[$j][$kota][$kecamatan]['real_eks_prev'] += $eksPrev;
            $tree[$j][$kota][$kecamatan]['real_eks_curr'] += $eksCurr;
            $tree[$j][$kota][$kecamatan]['real_cust_prev'] += $custPrev;
            $tree[$j][$kota][$kecamatan]['real_cust_curr'] += $custCurr;
        }

        $rows = [];
        $order = array_values(array_unique(array_merge($jenjangOrder, ['LAINNYA'])));

        foreach ($order as $j) {
            if (!isset($tree[$j])) {
                continue;
            }

            $jenjangTot = $empty();
            $kotaChildren = [];

            foreach ($tree[$j] as $kota => $kecMap) {
                $kotaTot = $empty();
                $kecChildren = [];

                foreach ($kecMap as $kec => $m) {
                    foreach ($m as $k => $v) {
                        $kotaTot[$k] += $v;
                    }
                    $kecChildren[] = [
                        'level' => 'kecamatan',
                        'key' => $j . '|' . $kota . '|' . $kec,
                        'label' => $kec,
                        'metrics' => $withGrowth($m),
                        'children' => [],
                    ];
                }

                usort($kecChildren, static function ($a, $b) {
                    return $b['metrics']['real_eks_curr'] <=> $a['metrics']['real_eks_curr'];
                });

                foreach ($kotaTot as $k => $v) {
                    $jenjangTot[$k] += $v;
                }

                $kotaChildren[] = [
                    'level' => 'kota',
                    'key' => $j . '|' . $kota,
                    'label' => $kota,
                    'metrics' => $withGrowth($kotaTot),
                    'children' => $kecChildren,
                ];
            }

            usort($kotaChildren, static function ($a, $b) {
                return $b['metrics']['real_eks_curr'] <=> $a['metrics']['real_eks_curr'];
            });

            $rows[] = [
                'level' => 'jenjang',
                'key' => $j,
                'label' => $j,
                'color' => $jenjangColors[$j] ?? '#64748b',
                'metrics' => $withGrowth($jenjangTot),
                'children' => $kotaChildren,
            ];
        }

        return [
            'year' => $year,
            'prev_year' => $prevYear,
            'rows' => $rows,
        ];
    }

    /**
     * API Endpoint: Get Area Dashboard Data for a given set of area IDs and province name.
     */
    private function buildDashboardData($areaIds, $provinceName, $selectedCabang = '')
    {
        if ($provinceName === 'NASIONAL') {
            $salesIds = Customer::pluck('sales_id')->unique();
            $totalSekolah   = Customer::count();
            // Business rules: Customer Aktif = Tahan
            $customerAktif  = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('tahan_customer');
            $targetEksemplar = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)->sum('target_exemplar');
            $realEksemplar  = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('real_exemplar');
            $totalSiswa     = Customer::sum('total_student') ?? 0;
            $totalRencanaJual = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('target_customer');
            $realisasiJual = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('real_customer');
            $cabangs = \App\Models\Cabang::all();
        } else {
            $salesIds = Customer::whereIn('area_id', $areaIds)->pluck('sales_id')->unique();
            $totalSekolah   = Customer::whereIn('area_id', $areaIds)->count();
            // Business rules: Customer Aktif = Tahan
            $customerAktif  = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('tahan_customer');
            $targetEksemplar = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)->sum('target_exemplar');
            $realEksemplar  = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('real_exemplar');
            $totalSiswa     = Customer::whereIn('area_id', $areaIds)->sum('total_student') ?? 0;
            $totalRencanaJual = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('target_customer');
            $realisasiJual = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('real_customer');
            $cabangs = \App\Models\Cabang::whereIn('area_id', $areaIds)->get();
        }
        $cabangIds = $cabangs->pluck('id');

        if ($provinceName === 'NASIONAL') {
            $areas = \App\Models\Area::all();

            $custCounts = \App\Models\Customer::selectRaw('area_id, count(*) as count')
                ->groupBy('area_id')
                ->pluck('count', 'area_id');

            $acCustCounts = \App\Models\Customer::where('is_active', true)
                ->selectRaw('area_id, count(*) as count')
                ->groupBy('area_id')
                ->pluck('count', 'area_id');

            $ranking = [];
            foreach ($areas as $area) {
                $custCount = $custCounts[$area->id] ?? 0;
                $acCust = $acCustCounts[$area->id] ?? 0;

                $ranking[] = [
                    'name'  => $area->name,
                    'cust'  => (int)$acCust,
                    'total' => $custCount,
                    'pct'   => $custCount > 0 ? round(($acCust / $custCount) * 100) : 0,
                ];
            }
        } else {
            $custCounts = \App\Models\Customer::whereIn('cabang_id', $cabangIds)
                ->selectRaw('cabang_id, count(*) as count')
                ->groupBy('cabang_id')
                ->pluck('count', 'cabang_id');

            $acCustCounts = \App\Models\Customer::whereIn('cabang_id', $cabangIds)
                ->where('is_active', true)
                ->selectRaw('cabang_id, count(*) as count')
                ->groupBy('cabang_id')
                ->pluck('count', 'cabang_id');

            $ranking = [];
            foreach ($cabangs as $cabang) {
                $custCount = $custCounts[$cabang->id] ?? 0;
                $acCust = $acCustCounts[$cabang->id] ?? 0;

                $ranking[] = [
                    'name'  => $cabang->nama_cabang,
                    'cust'  => (int)$acCust,
                    'total' => $custCount,
                    'pct'   => $custCount > 0 ? round(($acCust / $custCount) * 100) : 0,
                ];
            }
        }

        // Sort ranking by coverage pct descending
        usort($ranking, function ($a, $b) {
            return $b['pct'] <=> $a['pct'];
        });

        $ranking = array_map(function ($r, $i) {
            return ['no' => $i + 1] + $r;
        }, $ranking, array_keys($ranking));

        /* ── JENJANG (dari market_shares level TOTAL per jenjang) ── */
        $jenjangMap = [
            '1. SD / MI'   => 'SD',
            '1. SD / MIS'  => 'SD',
            '2. SMP / MTS' => 'SMP',
            '2. SMP / MTs' => 'SMP',
            '3. SMA / MA'  => 'SMA',
            '4. SMK'       => 'SMK',
        ];
        $jenjangColors = ['SD' => '#1d4ed8', 'SMP' => '#60a5fa', 'SMA' => '#fbbf24', 'SMK' => '#fb923c'];

        $rawJenjangQuery = MarketShare::whereNull('kecamatan_code')->whereIn('jenjang', array_keys($jenjangMap));
        if ($provinceName !== 'NASIONAL') {
            $rawJenjangQuery->whereIn('area_id', $areaIds);
        }
        $rawJenjang = $rawJenjangQuery->select('jenjang', DB::raw('SUM(dapodik_customer) as total'))
            ->groupBy('jenjang')
            ->get();

        $jenjangAgg = [];
        foreach ($rawJenjang as $row) {
            $key = $jenjangMap[$row->jenjang] ?? $row->jenjang;
            $jenjangAgg[$key] = ($jenjangAgg[$key] ?? 0) + $row->total;
        }
        $totalJenjang = array_sum($jenjangAgg);
        $jenjangData = [];
        foreach (['SD', 'SMP', 'SMA', 'SMK'] as $j) {
            $count = $jenjangAgg[$j] ?? 0;
            $jenjangData[] = [
                'label' => $j,
                'total' => number_format($count, 0, ',', '.'),
                'pct'   => $totalJenjang > 0 ? number_format(($count / $totalJenjang) * 100, 2, ',', '.') : '0,00',
                'color' => $jenjangColors[$j],
            ];
        }
        $jenjangTotal = number_format($totalJenjang, 0, ',', '.');

        /* ── SALES PER JENJANG (Jumlah Sales aktif per jenjang) ── */
        $salesJenjangRaw = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)
            ->whereIn('jenjang', ['SD', 'SMP', 'SMA', 'SMK', 'DLL'])
            ->where('target_customer', '>', 0)
            ->select('jenjang', DB::raw('COUNT(DISTINCT sales_id) as total'))
            ->groupBy('jenjang')
            ->get();

        $salesJenjangColors = ['SD' => '#1d4ed8', 'SMP' => '#60a5fa', 'SMA' => '#fbbf24', 'SMK' => '#fb923c', 'DLL' => '#10b981'];
        $salesJenjangData = [];
        $totalSalesJenjang = $salesJenjangRaw->sum('total');

        foreach (['SD', 'SMP', 'SMA', 'SMK', 'DLL'] as $j) {
            $count = $salesJenjangRaw->firstWhere('jenjang', $j)->total ?? 0;
            $salesJenjangData[] = [
                'label' => $j,
                'total' => number_format($count, 0, ',', '.'),
                'pct'   => $totalSalesJenjang > 0 ? number_format(($count / $totalSalesJenjang) * 100, 2, ',', '.') : '0,00',
                'color' => $salesJenjangColors[$j] ?? '#cbd5e1',
            ];
        }
        $salesJenjangTotal = number_format($totalSalesJenjang, 0, ',', '.');
        $jenjangTotal = number_format($totalJenjang, 0, ',', '.');

        /* ── OPPORTUNITY KECAMATAN ── */
        $allKecamatansQuery = \App\Models\Kecamatan::with('cabang');
        if ($provinceName !== 'NASIONAL') {
            $allKecamatansQuery->whereIn('cabang_id', $cabangs->pluck('id'));
        }
        $allKecamatans = $allKecamatansQuery->get();

        $opp = $allKecamatans->map(function ($kec) {
            $dapodikCust = $kec->dapodik_customer ?? 0;
            $acCust = $kec->ac_customer ?? 0;
            $oppVal = max(0, $dapodikCust - $acCust);
            $pct = $dapodikCust > 0 ? round(($acCust / $dapodikCust) * 100, 2) : 0;

            return [
                'kec' => $kec->camat_name,
                'cabang' => $kec->cabang ? $kec->cabang->nama_cabang : 'Tanpa Cabang',
                'total' => number_format($dapodikCust, 0, ',', '.'),
                'cust' => number_format($acCust, 0, ',', '.'),
                'opp' => number_format($oppVal, 0, ',', '.'),
                'pct' => $pct . '%',
                '_opp_val' => $oppVal
            ];
        })->sortByDesc('_opp_val')->values()->map(function ($r, $i) {
            $r['no'] = $i + 1;
            return $r;
        })->take(10)->toArray();

        /* ── AREA GOVERNANCE ── */
        $govCounts = ['covered' => 0, 'low' => 0, 'opp' => 0, 'high_opp' => 0];
        $tKec = 0;
        foreach ($allKecamatans as $kec) {
            $dCust = $kec->dapodik_customer ?? 0;
            if ($dCust == 0) continue; // Skip kecamatans with no data
            $tKec++;

            $aCust = $kec->ac_customer ?? 0;
            $p = ($aCust / $dCust) * 100;
            if ($p >= 70) $govCounts['covered']++;
            elseif ($p >= 30) $govCounts['low']++;
            elseif ($p >= 10) $govCounts['opp']++;
            else $govCounts['high_opp']++;
        }
        $gov = [
            [
                'label' => 'Covered',
                'sub' => 'Kecamatan dengan coverage ≥ 70%',
                'pct' => $tKec > 0 ? round(($govCounts['covered'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['covered'],
                'color' => '#34d399',
                'icon' => 'bi-shield-fill-check'
            ],
            [
                'label' => 'Low Coverage',
                'sub' => 'Kecamatan dengan coverage 30–70%',
                'pct' => $tKec > 0 ? round(($govCounts['low'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['low'],
                'color' => '#60a5fa',
                'icon' => 'bi-exclamation-triangle-fill'
            ],
            [
                'label' => 'Opportunity',
                'sub' => 'Kecamatan dengan coverage 10–30%',
                'pct' => $tKec > 0 ? round(($govCounts['opp'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['opp'],
                'color' => '#fbbf24',
                'icon' => 'bi-lightbulb-fill'
            ],
            [
                'label' => 'High Opportunity',
                'sub' => 'Kecamatan dengan coverage < 10%',
                'pct' => $tKec > 0 ? round(($govCounts['high_opp'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['high_opp'],
                'color' => '#fb923c',
                'icon' => 'bi-fire'
            ]
        ];

        /* ── STRATEGIC SCHOOLS (top customers by total_student) ── */
        $schoolsQuery = Customer::with('area')->whereNotNull('total_student');
        if ($provinceName !== 'NASIONAL') {
            $schoolsQuery->whereIn('area_id', $areaIds);
        }
        $schools = $schoolsQuery->orderByDesc('total_student')
            ->limit(10)
            ->get()
            ->map(fn($c, $i) => [
                'no'     => $i + 1,
                'name'   => $c->name,
                'branch' => '-',
                'siswa'  => number_format($c->total_student, 0, ',', '.'),
                'status' => $c->is_active ? 'Customer' : 'Prospek',
            ])
            ->values()
            ->toArray();

        /* ── COMPETITOR MARKET SHARE ── */
        $rawCompetitorsQuery = Customer::whereNotNull('penerbit')->where('penerbit', '!=', '');
        if ($provinceName !== 'NASIONAL') {
            $rawCompetitorsQuery->whereIn('area_id', $areaIds);
        }
        $rawCompetitors = $rawCompetitorsQuery->pluck('penerbit');

        $competitorCounts = [];
        foreach ($rawCompetitors as $pStr) {
            $parts = array_map('trim', explode(',', $pStr));
            foreach ($parts as $p) {
                if (!empty($p)) {
                    $competitorCounts[$p] = ($competitorCounts[$p] ?? 0) + 1;
                }
            }
        }
        arsort($competitorCounts);
        $competitors = [];
        $ci = 0;
        $cColors = ['#1d4ed8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#64748b'];
        foreach ($competitorCounts as $label => $count) {
            $competitors[] = [
                'label' => $this->getCompetitorName($label),
                'value' => $count,
                'color' => $cColors[$ci % count($cColors)]
            ];
            $ci++;
        }

        /* ── TRL (Tahan / Rebut / Lepas / Gagal) ── */
        $totalTahan = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('tahan_customer');
        $totalRebut = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('rebut_customer');
        $totalLepas = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('lepas_customer');
        $totalGagal = SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('gagal_customer');

        $tahan = $totalTahan;
        $rebut = $totalRebut;
        $lepas = $totalLepas;
        $gagal = $totalGagal;

        $trl = [
            ['key' => 'tahan', 'label' => 'TAHAN', 'value' => number_format($tahan, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($tahan / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Customer Aktif SP', 'color' => '#10b981', 'icon' => 'bi-shield-check'],
            ['key' => 'rebut', 'label' => 'REBUT', 'value' => number_format($rebut, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($rebut / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Masuk AC baru (SP)', 'color' => '#60a5fa', 'icon' => 'bi-arrow-repeat'],
            ['key' => 'lepas', 'label' => 'LEPAS', 'value' => number_format($lepas, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($lepas / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Tidak masuk AC', 'color' => '#f59e0b', 'icon' => 'bi-box-arrow-right'],
            ['key' => 'gagal', 'label' => 'GAGAL', 'value' => number_format($gagal, 0, ',', '.'), 'pct' => $totalSekolah > 0 ? number_format(($gagal / $totalSekolah) * 100, 2, ',', '.') . '%' : '0%', 'sub' => 'Tidak masuk AC 2 thn', 'color' => '#ef4444', 'icon' => 'bi-x-circle'],
        ];

        /* ── SUMBER DANA (dari SalesCityPlan) ── */
        $bosValue = \App\Models\SalesCityPlan::whereIn('sales_id', $salesIds)->where('sumber_dana', 'BOS')->sum('target_customer');
        $swadanaValue = \App\Models\SalesCityPlan::whereIn('sales_id', $salesIds)->where('sumber_dana', 'SWADANA')->sum('target_customer');

        $totalDana = $bosValue + $swadanaValue;

        if ($totalDana > 0) {
            $danaData = [
                ['label' => 'BOS', 'value' => round(($bosValue / $totalDana) * 100), 'color' => '#1d4ed8', 'sekolah' => number_format($bosValue, 0, ',', '.')],
                ['label' => 'Swadana', 'value' => round(($swadanaValue / $totalDana) * 100), 'color' => '#93c5fd', 'sekolah' => number_format($swadanaValue, 0, ',', '.')]
            ];
        } else {
            $danaData = [
                ['label' => 'BOS', 'value' => 0, 'color' => '#1d4ed8', 'sekolah' => '-'],
                ['label' => 'Swadana', 'value' => 0, 'color' => '#93c5fd', 'sekolah' => '-']
            ];
        }

        /* ── OPPORTUNITY DANA (BELUM DICOVER) ── */
        $uncoveredQuery = Customer::where(function ($q) {
            $q->where('is_active', false)->orWhereNull('is_active');
        });
        if ($provinceName !== 'NASIONAL') {
            $uncoveredQuery->whereIn('area_id', $areaIds);
        }
        $bosUncovered = (clone $uncoveredQuery)->where('sumber_dana', 'BOS')->count();
        $swadanaUncovered = (clone $uncoveredQuery)->where('sumber_dana', 'like', 'SWA%')->count();
        $totalUncoveredDana = $bosUncovered + $swadanaUncovered;

        if ($totalUncoveredDana > 0) {
            $uncoveredDanaData = [
                ['label' => 'Negeri (BOS)', 'value' => round(($bosUncovered / $totalUncoveredDana) * 100, 1), 'color' => '#1d4ed8', 'sekolah' => number_format($bosUncovered, 0, ',', '.')],
                ['label' => 'Swasta', 'value' => round(($swadanaUncovered / $totalUncoveredDana) * 100, 1), 'color' => '#f59e0b', 'sekolah' => number_format($swadanaUncovered, 0, ',', '.')]
            ];
        } else {
            $uncoveredDanaData = [
                ['label' => 'Negeri (BOS)', 'value' => 0, 'color' => '#1d4ed8', 'sekolah' => '-'],
                ['label' => 'Swasta', 'value' => 0, 'color' => '#f59e0b', 'sekolah' => '-']
            ];
        }

        /* ── UNCOVERED AREA ANALYSIS ── */
        $uncoveredAnalysis = [];
        if ($provinceName === 'NASIONAL') {
            $areasMap = \App\Models\Area::all()->keyBy('id');
            $rawUncovered = Customer::where(function ($q) {
                $q->where('is_active', false)->orWhereNull('is_active');
            })
                ->select('area_id', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_student) as potensi'))
                ->groupBy('area_id')
                ->get();
            foreach ($rawUncovered as $r) {
                if (!$r->area_id || !isset($areasMap[$r->area_id])) continue;
                $uncoveredAnalysis[] = [
                    'name' => $areasMap[$r->area_id]->name,
                    'count' => (int)$r->count,
                    'potensi' => (int)$r->potensi
                ];
            }
        } else {
            $cabangsMap = \App\Models\Cabang::all()->keyBy('id');
            $rawUncovered = Customer::where(function ($q) {
                $q->where('is_active', false)->orWhereNull('is_active');
            })
                ->whereIn('area_id', $areaIds)
                ->select('cabang_id', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_student) as potensi'))
                ->groupBy('cabang_id')
                ->get();
            foreach ($rawUncovered as $r) {
                if (!$r->cabang_id || !isset($cabangsMap[$r->cabang_id])) continue;
                $uncoveredAnalysis[] = [
                    'name' => $cabangsMap[$r->cabang_id]->nama_cabang,
                    'count' => (int)$r->count,
                    'potensi' => (int)$r->potensi
                ];
            }
        }
        usort($uncoveredAnalysis, function ($a, $b) {
            return $b['count'] <=> $a['count'];
        });
        foreach ($uncoveredAnalysis as $i => &$v) {
            $v['no'] = $i + 1;
        }

        /* ── TREND (per tahun dari CustomerPlan grouped by year & sumber_dana) ── */
        $trendRaw = \App\Models\CustomerPlan::whereIn('customer_id', function ($q) use ($salesIds) {
            $q->select('id')->from('customers')->whereIn('sales_id', $salesIds);
        })
            ->select('year', 'sumber_dana', DB::raw('SUM(real_exemplar) as total_real'), DB::raw('SUM(target_exemplar) as total_target'))
            ->groupBy('year', 'sumber_dana')
            ->orderBy('year')
            ->get();

        $trendGrouped = [];
        foreach ($trendRaw as $tr) {
            $year = (string) $tr->year;
            if (!isset($trendGrouped[$year])) {
                $trendGrouped[$year] = [
                    'label' => $year,
                    'swa_real' => 0,
                    'bos_real' => 0,
                    'swa_target' => 0,
                    'bos_target' => 0,
                ];
            }
            if ($tr->sumber_dana === 'SWA') {
                $trendGrouped[$year]['swa_real'] = (int) $tr->total_real;
                $trendGrouped[$year]['swa_target'] = (int) $tr->total_target;
            } else if ($tr->sumber_dana === 'BOS') {
                $trendGrouped[$year]['bos_real'] = (int) $tr->total_real;
                $trendGrouped[$year]['bos_target'] = (int) $tr->total_target;
            }
        }
        $trend = array_values($trendGrouped);

        if ($selectedCabang) {
            $totalSekolah = 0;
            $customerAktif = 0;
            $targetEksemplar = 0;
            $realEksemplar = 0;
            $totalSiswa = 0;
            $ranking = [];
            $rankingKecamatanCollection = collect($rankingKecamatan);

            $opp = $rankingKecamatanCollection->map(function ($r) {
                $oppVal = max(0, $r['total'] - $r['cust']);
                return [
                    'kec' => $r['name'],
                    'total' => number_format($r['total'], 0, ',', '.'),
                    'cust' => number_format($r['cust'], 0, ',', '.'),
                    'opp' => number_format($oppVal, 0, ',', '.'),
                    'pct' => $r['pct'] . '%',
                    '_opp_val' => $oppVal
                ];
            })->sortByDesc('_opp_val')->values()->map(function ($r, $i) {
                $r['no'] = $i + 1;
                return $r;
            })->take(10)->toArray();

            // Sort rankingKecamatan by coverage for the Ranking card
            $rankingKecamatan = $rankingKecamatanCollection->sortByDesc('pct')->values()->toArray();
            $jenjangData = [
                ['label' => 'SD', 'total' => '0', 'pct' => '0,00', 'color' => '#1d4ed8'],
                ['label' => 'SMP', 'total' => '0', 'pct' => '0,00', 'color' => '#60a5fa'],
                ['label' => 'SMA', 'total' => '0', 'pct' => '0,00', 'color' => '#fbbf24'],
                ['label' => 'SMK', 'total' => '0', 'pct' => '0,00', 'color' => '#fb923c'],
            ];
            $jenjangTotal = '0';
            $schools = [];
            $trl = [
                ['key' => 'tahan', 'label' => 'TAHAN', 'value' => '0', 'pct' => '0%', 'sub' => 'Customer Aktif SP', 'color' => '#10b981', 'icon' => 'bi-shield-check'],
                ['key' => 'rebut', 'label' => 'REBUT', 'value' => '0', 'pct' => '0%', 'sub' => 'Masuk AC baru (SP)', 'color' => '#60a5fa', 'icon' => 'bi-arrow-repeat'],
                ['key' => 'lepas', 'label' => 'LEPAS', 'value' => '0', 'pct' => '0%', 'sub' => 'Tidak masuk AC', 'color' => '#f59e0b', 'icon' => 'bi-box-arrow-right'],
                ['key' => 'gagal', 'label' => 'GAGAL', 'value' => '0', 'pct' => '0%', 'sub' => 'Tidak masuk AC 2 thn', 'color' => '#ef4444', 'icon' => 'bi-x-circle'],
            ];
            $danaData = [
                ['label' => 'BOS', 'value' => 0, 'color' => '#1d4ed8', 'sekolah' => '-'],
                ['label' => 'Swadana', 'value' => 0, 'color' => '#93c5fd', 'sekolah' => '-']
            ];
            $uncoveredDanaData = [
                ['label' => 'Negeri (BOS)', 'value' => 0, 'color' => '#1d4ed8', 'sekolah' => '-'],
                ['label' => 'Swasta', 'value' => 0, 'color' => '#f59e0b', 'sekolah' => '-']
            ];
            // $trend = []; // Trend is now valid for cabang level too
            $gov = [];
            $competitors = [];
            $uncoveredAnalysis = [];
        }

        return [
            'realStats'      => [
                'total_sekolah'    => $totalSekolah,
                'customer_aktif'   => $customerAktif,
                'target_eksemplar' => $targetEksemplar,
                'real_eksemplar'   => $realEksemplar,
                'total_siswa'      => $totalSiswa,
                'total_rencana_jual' => $totalRencanaJual,
                'realisasi_jual' => $realisasiJual,
            ],
            'ranking'        => $ranking,
            'jenjang'        => $jenjangData,
            'jenjangTotal'   => $jenjangTotal,
            'opp'            => $opp,
            'gagal'          => $gagal,
            'trl'            => $trl,
            'dana'           => $danaData,
            'uncoveredDana'  => $uncoveredDanaData,
            'uncoveredAnalysis' => $uncoveredAnalysis,
            'competitors'    => $competitors,
            'trend'          => $trend,
            'salesJenjangData'  => $salesJenjangData,
            'salesJenjangTotal' => $salesJenjangTotal,
            'salesJenjangTotal' => $salesJenjangTotal,
            'schools'        => $schools ?? [],
            'gov'            => $gov ?? [],
        ];
    }

    /**
     * Dashboard Area for a specific area.
     */
    public function area(\Illuminate\Http\Request $request, $id)
    {
        $user = auth()->user();

        // Authorization check
        if ($user && $user->level === 'area' && $user->area_id != $id) {
            return redirect()->route('monitoring.area', ['id' => $user->area_id]);
        }

        $selectedCabang = $request->query('cabang', '');

        if ($user && $user->level === 'cabang') {
            $cabangObj = \App\Models\Cabang::find($user->cabang_id);
            if ($cabangObj && ($id != $cabangObj->area_id || $selectedCabang != $user->cabang_id)) {
                return redirect()->route('monitoring.area', ['id' => $cabangObj->area_id, 'cabang' => $user->cabang_id]);
            }
            $selectedCabang = $user->cabang_id;
        }

        if ($user && $user->level === 'sales') {
            $salesObj = \App\Models\Sales::with('cabang')->find($user->sales_id);
            if ($salesObj && $salesObj->cabang && ($id != $salesObj->cabang->area_id || $selectedCabang != $salesObj->cabang_id)) {
                return redirect()->route('monitoring.area', ['id' => $salesObj->cabang->area_id, 'cabang' => $salesObj->cabang_id]);
            }
            $selectedCabang = $salesObj->cabang_id ?? $selectedCabang;
        }

        $area = Area::find($id);

        if (!$area) {
            return redirect()->route('monitoring.area.select');
        }

        // Fetch cabangs for the selector
        $cabangs = \App\Models\Cabang::where('area_id', $area->id)->orderBy('nama_cabang')->get();
        $selectedCabang = $request->query('cabang', '');

        if ($selectedCabang) {
            $cabangObj = $cabangs->firstWhere('id', $selectedCabang);
            if ($cabangObj) {
                $isSalesUser = $user && $user->level === 'sales';
                $cfg = \App\Models\Configuration::query()->first(['target_year']);
                $targetYear = (int) ($request->query('tahun') ?: ($cfg->target_year ?? date('Y')));
                $totalSalesQuick = (int) \App\Models\Customer::where('cabang_id', $cabangObj->id)
                    ->whereNotNull('sales_id')
                    ->where('sales_id', '>', 0)
                    ->selectRaw('COUNT(DISTINCT sales_id) as cnt')
                    ->value('cnt');

                return Inertia::render('Monitoring/Cabang', array_merge($this->minimalDashboardLegacyProps(), [
                    'activeNav'    => $isSalesUser ? 'sales' : 'cabang',
                    'pageTitle'    => $isSalesUser ? 'Dashboard Sales' : 'Dashboard Cabang',
                    'cabangName'   => strtoupper('CABANG ' . $cabangObj->nama_cabang),
                    'areaName'     => strtoupper($area->name),
                    'description'  => 'Performa coverage dan opportunity cabang hingga tingkat kecamatan',
                    'provinceCode' => $area->id,
                    'cabangCode'   => $cabangObj->id,
                    'areas'        => \App\Models\Area::orderBy('name')->get(),
                    'cabangs'      => $cabangs,
                    'filters'      => array_merge(
                        $request->only(['kecamatan', 'tahun', 'sumber_dana']),
                        ['tahun' => $targetYear]
                    ),
                    'cabangInsights' => null,
                    'rankingKecamatanRealisasi' => [],
                    'listSalesCabang' => [],
                    'listKecamatan' => [],
                    'marketShareKecamatan' => [],
                    'kpiData' => null,
                    'insights' => null,
                    'jenjangBreakdown' => [],
                    'sumberDanaBreakdown' => [],
                    'gradeRealisasiBreakdown' => [],
                    'activityBreakdown' => [],
                    'resultBreakdown' => [],
                    'listSekolah' => [],
                    'listNonAreaCover' => [],
                    'kegiatanSales' => [],
                    'useSalesStyleDashboard' => true,
                    'dashboardDataPending' => true,
                    'salesProfile' => [
                        'name' => 'CABANG ' . strtoupper((string) $cabangObj->nama_cabang),
                        'code' => (string) $cabangObj->id,
                        'profile_type' => 'cabang',
                        'total_sales' => $totalSalesQuick,
                        'cabang' => [
                            'nama_cabang' => $cabangObj->nama_cabang,
                            'area' => ['name' => $area->name],
                        ],
                    ],
                ]));
            }
        }

        // Shell cepat — data berat di-fetch via monitoring.dashboard-data
        $cfg = \App\Models\Configuration::query()->first(['target_year']);
        $targetYear = (int) ($request->query('tahun') ?: ($cfg->target_year ?? date('Y')));
        $displayName = strtoupper($area->name);
        $areaLabel = preg_match('/^AREA\b/i', $displayName)
            ? $displayName
            : ('AREA ' . $displayName);
        $totalSalesQuick = (int) Customer::query()
            ->where('area_id', $area->id)
            ->whereNotNull('sales_id')
            ->where('sales_id', '>', 0)
            ->selectRaw('COUNT(DISTINCT sales_id) as cnt')
            ->value('cnt');

        return Inertia::render('Monitoring/Cabang', array_merge($this->minimalDashboardLegacyProps(), [
            'isAreaDashboard' => true,
            'activeNav' => 'area',
            'pageTitle' => 'Dashboard Area',
            'cabangName' => $displayName,
            'areaName' => $displayName,
            'description' => 'Ringkasan performa area dan perbandingan antar cabang dalam ' . ucwords(strtolower($area->name)) . '.',
            'provinceCode' => $area->id,
            'cabangCode' => null,
            'selectedCabang' => $selectedCabang,
            'areas' => \App\Models\Area::orderBy('name')->get(),
            'cabangs' => $cabangs,
            'ranking' => [],
            'uncovered' => [],
            'rankingCabangRealisasi' => [],
            'cabangInsights' => null,
            'filters' => array_merge(
                $request->only(['kecamatan', 'tahun', 'sumber_dana']),
                ['tahun' => $targetYear]
            ),
            'listCabangArea' => [],
            'marketShareKecamatan' => [],
            'kpiData' => null,
            'insights' => null,
            'jenjangBreakdown' => [],
            'sumberDanaBreakdown' => [],
            'gradeRealisasiBreakdown' => [],
            'activityBreakdown' => [],
            'resultBreakdown' => [],
            'listSekolah' => [],
            'listNonAreaCover' => [],
            'kegiatanSales' => [],
            'useSalesStyleDashboard' => true,
            'dashboardDataPending' => true,
            'salesProfile' => [
                'name' => $areaLabel,
                'code' => (string) $area->id,
                'profile_type' => 'area',
                'total_sales' => $totalSalesQuick,
                'total_cabang' => (int) $cabangs->count(),
                'cabang' => [
                    'nama_cabang' => $area->name,
                    'area' => ['name' => $area->name],
                ],
            ],
        ]));
    }

    /**
     * Nasional overview.
     */
    public function nasional()
    {
        $user = auth()->user();
        if ($user && $user->level !== 'nasional') {
            return redirect()->route('monitoring.area.select');
        }

        $provinces = DB::table('provinces')
            ->select('province_code', 'province_name')
            ->orderBy('province_name')
            ->get();

        // All areas
        $areaIds = Area::pluck('id');
        $data = $this->buildDashboardData($areaIds, 'NASIONAL');

        // Map markers for all provinces
        $coords = config('province_coords', []);
        // Fetch real stats by Province directly from kecamatans -> city_code (first 2 digits)
        $totalPerProv = \DB::table('kecamatans')
            ->selectRaw('LEFT(city_code, 2) as prov_code, SUM(dapodik_customer) as total')
            ->groupBy('prov_code')
            ->get()
            ->keyBy('prov_code');

        $aktifPerProv = \DB::table('sales_city_plans')
            ->where('sumber_dana', 'TOTAL')
            ->join('cities', 'sales_city_plans.city_name', '=', 'cities.city_name')
            ->selectRaw('cities.province_code as prov_code, SUM(ac_customer) as aktif')
            ->groupBy('prov_code')
            ->get()
            ->keyBy('prov_code');

        $mapMarkers = $provinces->map(function ($p) use ($coords, $totalPerProv, $aktifPerProv) {
            $c = $coords[strtoupper($p->province_name)] ?? ['lat' => -2.5, 'lng' => 118.0];

            $statTotal = $totalPerProv->get($p->province_code);
            $statAktif = $aktifPerProv->get($p->province_code);

            $total = $statTotal ? $statTotal->total : 0;
            $aktif = $statAktif ? $statAktif->aktif : 0;
            $belum = max(0, $total - $aktif);
            $pct = $total > 0 ? round(($aktif / $total) * 100) : 0;

            return [
                'lat' => $c['lat'],
                'lng' => $c['lng'],
                'label' => $p->province_name,
                'pct' => $pct,
                'total' => $total,
                'aktif' => (int)$aktif,
                'belum' => $belum
            ];
        })->toArray();

        return Inertia::render('Monitoring/Area', array_merge($data, [
            'activeNav'    => 'nasional',
            'pageTitle'    => 'Dashboard Nasional',
            'areaName'     => 'NASIONAL',
            'description'  => 'Ringkasan performa secara nasional dari seluruh area dan cabang di Indonesia.',
            'provinceCode' => null,
            'cities'       => collect([]),
            'mapMarkers'   => $mapMarkers,
            'filters'      => $request->only(['kecamatan', 'tahun', 'sumber_dana']),
        ]));
    }

    /* ─────────────────────────────────────────────
       DETAIL PAGES
    ───────────────────────────────────────────── */

    /** GET /monitoring/pengaturan */
    public function pengaturan()
    {
        $config = \App\Models\Configuration::orderBy('id', 'desc')->first();
        $weights = $config
            ? $config->resolvedSalesScoreWeights()
            : \App\Models\Configuration::defaultSalesScoreWeights();
        $schoolGradeThresholds = $config
            ? $config->resolvedSchoolGradeThresholds()
            : \App\Models\Configuration::defaultSchoolGradeThresholds();

        return Inertia::render('Monitoring/Pengaturan', [
            'activeNav' => 'setting',
            'status' => session('status'),
            'salesScoreWeights' => $weights,
            'salesScoreWeightLabels' => \App\Models\Configuration::salesScoreWeightLabels(),
            'canEditSalesScoreWeights' => auth()->user()?->level === 'nasional',
            'schoolGradeThresholds' => $schoolGradeThresholds,
            'canEditSchoolGradeThresholds' => auth()->user()?->level === 'nasional',
        ]);
    }

    /** PUT /monitoring/pengaturan/sales-score-weights */
    public function updateSalesScoreWeights(\Illuminate\Http\Request $request)
    {
        if (auth()->user()?->level !== 'nasional') {
            abort(403, 'Hanya level nasional yang dapat mengubah bobot Sales Score.');
        }

        $keys = array_keys(\App\Models\Configuration::defaultSalesScoreWeights());
        $rules = [];
        foreach ($keys as $key) {
            $rules["weights.{$key}"] = 'required|numeric|min:0|max:100';
        }
        $validated = $request->validate($rules);

        $weights = [];
        foreach ($keys as $key) {
            $weights[$key] = round((float) $validated['weights'][$key], 2);
        }

        $positiveKeys = \App\Models\Configuration::salesScorePositiveKeys();
        $sumPositive = 0.0;
        foreach ($positiveKeys as $key) {
            $sumPositive += $weights[$key] ?? 0;
        }

        if (abs($sumPositive - 100) > 0.05) {
            return back()->withErrors([
                'weights' => "Total bobot 5 indikator positif harus 100%. Saat ini: {$sumPositive}%. Bobot Lepas bersifat eksternal (di luar 100%).",
            ])->withInput();
        }

        $config = \App\Models\Configuration::orderBy('id', 'desc')->first();
        if (!$config) {
            return back()->withErrors(['weights' => 'Konfigurasi belum tersedia.']);
        }

        $config->sales_score_weights = $weights;
        $config->save();

        return back()->with('status', 'sales-score-weights-updated');
    }

    /** PUT /monitoring/pengaturan/school-grade-thresholds */
    public function updateSchoolGradeThresholds(\Illuminate\Http\Request $request)
    {
        if (auth()->user()?->level !== 'nasional') {
            abort(403, 'Hanya level nasional yang dapat mengubah ketentuan grade sekolah.');
        }

        $grades = ['D', 'C', 'B', 'A'];
        $rules = [];
        foreach ($grades as $grade) {
            $rules["thresholds.{$grade}.min"] = 'required|integer|min:0';
            $rules["thresholds.{$grade}.max"] = 'required|integer|min:0';
        }
        $validated = $request->validate($rules);

        $thresholds = [];
        foreach ($grades as $grade) {
            $thresholds[$grade] = [
                'min' => (int) $validated['thresholds'][$grade]['min'],
                'max' => (int) $validated['thresholds'][$grade]['max'],
            ];
        }

        $error = \App\Models\Configuration::validateSchoolGradeThresholds($thresholds);
        if ($error) {
            return back()->withErrors(['thresholds' => $error])->withInput();
        }

        $config = \App\Models\Configuration::orderBy('id', 'desc')->first();
        if (!$config) {
            return back()->withErrors(['thresholds' => 'Konfigurasi belum tersedia.']);
        }

        $config->school_grade_thresholds = $thresholds;
        $config->save();

        return back()->with('status', 'school-grade-thresholds-updated');
    }

    /**
     * Hitung jumlah customer per school grade (SQL) untuk melengkapi lite dashboard.
     */
    private function countCustomersBySchoolGrade(
        ?int $salesId,
        ?int $cabangId,
        ?int $areaId,
        ?string $sumberDana,
        bool $onlyNegeri,
        array $gradeThresholds
    ): array {
        $aMax = (int) ($gradeThresholds['A']['max'] ?? 1000);
        $aMin = (int) ($gradeThresholds['A']['min'] ?? 501);
        $bMin = (int) ($gradeThresholds['B']['min'] ?? 301);
        $bMax = (int) ($gradeThresholds['B']['max'] ?? 500);
        $cMin = (int) ($gradeThresholds['C']['min'] ?? 101);
        $cMax = (int) ($gradeThresholds['C']['max'] ?? 300);
        $dMin = (int) ($gradeThresholds['D']['min'] ?? 0);
        $dMax = (int) ($gradeThresholds['D']['max'] ?? 100);

        $q = \App\Models\Customer::query();
        if ($salesId) {
            $q->where('sales_id', $salesId);
        }
        if ($cabangId) {
            $q->where('cabang_id', $cabangId);
        }
        if ($areaId) {
            $q->where('area_id', $areaId);
        }
        if ($sumberDana) {
            $q->where('sumber_dana', 'like', '%' . $sumberDana . '%');
        }
        if ($onlyNegeri) {
            $this->applySekolahNegeriFilter($q);
        }

        $rows = $q->selectRaw("
                CASE
                    WHEN COALESCE(total_student, 0) > {$aMax} THEN 'A+'
                    WHEN COALESCE(total_student, 0) BETWEEN {$aMin} AND {$aMax} THEN 'A'
                    WHEN COALESCE(total_student, 0) BETWEEN {$bMin} AND {$bMax} THEN 'B'
                    WHEN COALESCE(total_student, 0) BETWEEN {$cMin} AND {$cMax} THEN 'C'
                    WHEN COALESCE(total_student, 0) BETWEEN {$dMin} AND {$dMax} THEN 'D'
                    ELSE 'D'
                END as grade,
                COUNT(*) as cnt
            ")
            ->groupBy('grade')
            ->pluck('cnt', 'grade');

        return $rows->map(fn ($v) => (int) $v)->all();
    }

    /**
     * Agregat total sekolah & siswa per kecamatan (SQL) untuk Top Kecamatan lite mode.
     */
    private function countCustomersByKecamatan(
        ?int $salesId,
        ?int $cabangId,
        ?int $areaId,
        ?string $sumberDana,
        bool $onlyNegeri
    ): array {
        $q = \App\Models\Customer::query();
        if ($salesId) {
            $q->where('sales_id', $salesId);
        }
        if ($cabangId) {
            $q->where('cabang_id', $cabangId);
        }
        if ($areaId) {
            $q->where('area_id', $areaId);
        }
        if ($sumberDana) {
            $q->where('sumber_dana', 'like', '%' . $sumberDana . '%');
        }
        if ($onlyNegeri) {
            $this->applySekolahNegeriFilter($q);
        }

        $rows = $q->selectRaw("
                UPPER(TRIM(
                    CASE
                        WHEN kecamatan_name IS NULL OR TRIM(kecamatan_name) = '' THEN 'TANPA KECAMATAN'
                        WHEN LOCATE(',', kecamatan_name) > 0 THEN SUBSTRING_INDEX(TRIM(kecamatan_name), ',', 1)
                        ELSE TRIM(kecamatan_name)
                    END
                )) as kec,
                COUNT(*) as total_sekolah,
                COALESCE(SUM(total_student), 0) as total_siswa
            ")
            ->groupBy('kec')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $out[(string) $row->kec] = [
                'total_sekolah' => (int) $row->total_sekolah,
                'total_siswa' => (int) $row->total_siswa,
            ];
        }

        return $out;
    }

    /**
     * Build dashboard bundle (kpiData + insights + listSekolah) dengan rumus
     * yang sama seperti Sales Performance Detail, untuk scope sales / cabang / area.
     *
     * @return array{kpiData: array, insights: array, listSekolah: \Illuminate\Support\Collection, jenjangBreakdown: array, sumberDanaBreakdown: array}
     */
    private function buildSalesStyleDashboardBundle(?int $salesId, ?int $cabangId, int $year, string $displayName = 'Dashboard', ?int $areaId = null, ?string $sumberDana = null, bool $onlyNegeri = false, bool $liteMode = false): array
    {
        $prevYear = $year - 1;

        $q = \App\Models\Customer::query()
            ->with(['customerPlans' => function ($q) use ($sumberDana, $year) {
                $q->select('customer_id', 'year', 'sumber_dana', 'real_exemplar', 'target_exemplar', 'sp_exemplar', 'potential_exemplar', 'is_ac')
                    ->whereBetween('year', [$year - 3, $year]);
                if ($sumberDana) {
                    $q->where('sumber_dana', 'like', '%' . $sumberDana . '%');
                }
            }])
            ->select('id', 'name', 'kecamatan_name', 'jenjang', 'is_active', 'total_student', 'penerbit', 'sumber_dana', 'potensi_sekolah', 'sales_id', 'cabang_id', 'area_id');

        if ($salesId) {
            $q->where('sales_id', $salesId);
        }
        if ($cabangId) {
            $q->where('cabang_id', $cabangId);
        }
        if ($areaId) {
            $q->where('area_id', $areaId);
        }
        if ($sumberDana) {
            $q->where('sumber_dana', 'like', '%' . $sumberDana . '%');
        }
        if ($onlyNegeri) {
            $this->applySekolahNegeriFilter($q);
        }

        // Lite: hanya Area Cover tahun berjalan (~5× lebih sedikit baris untuk area besar)
        if ($liteMode) {
            $q->whereExists(function ($sub) use ($year) {
                $sub->selectRaw('1')
                    ->from('customer_plans')
                    ->whereColumn('customer_plans.customer_id', 'customers.id')
                    ->where('customer_plans.year', $year)
                    ->where('customer_plans.is_ac', 1);
            });
        }

        // Lite: skip ORDER BY (hemat sort DB) — list tidak dikirim ke client
        $listSekolah = $liteMode ? $q->get() : $q->orderBy('name')->get();

        $cabangNameById = [];
        $areaNameById = [];
        $salesNameById = [];
        if (!$liteMode && ($areaId || $sumberDana || $listSekolah->isNotEmpty())) {
            $cabangIds = $listSekolah->pluck('cabang_id')->filter()->unique()->values();
            $cabangNameById = \App\Models\Cabang::whereIn('id', $cabangIds)
                ->pluck('nama_cabang', 'id')->all();
            $areaIds = $listSekolah->pluck('area_id')->filter()->unique()->values();
            $areaNameById = \App\Models\Area::whereIn('id', $areaIds)
                ->pluck('name', 'id')->all();
            $salesIds = $listSekolah->pluck('sales_id')->filter()->unique()->values();
            if ($salesIds->isNotEmpty()) {
                $salesNameById = \App\Models\Sales::whereIn('id', $salesIds)
                    ->pluck('name', 'id')->all();
            }
        }

        $totalRealisasiTargetYear = 0;
        $totalRealisasiLaluTargetYear = 0;
        $totalRencanaJualTargetYear = 0;
        $customerWithRealisasi = 0;
        $acCurrCount = 0;

        $gradeThresholds = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
            ?->resolvedSchoolGradeThresholds()
            ?? \App\Models\Configuration::defaultSchoolGradeThresholds();

        $listSekolah->transform(function ($school) use (
            $year,
            $prevYear,
            &$totalRealisasiTargetYear,
            &$totalRealisasiLaluTargetYear,
            &$totalRencanaJualTargetYear,
            &$customerWithRealisasi,
            &$acCurrCount,
            $cabangNameById,
            $areaNameById,
            $salesNameById,
            $gradeThresholds,
            $liteMode
        ) {
            $plans = $school->customerPlans->groupBy('year')->map(function ($group) {
                return (object) [
                    'real_exemplar' => $group->sum('real_exemplar'),
                    'target_exemplar' => $group->sum('target_exemplar'),
                    'sp_exemplar' => $group->sum('sp_exemplar'),
                    'potential_exemplar' => $group->sum('potential_exemplar'),
                    'is_ac' => $group->max('is_ac'),
                ];
            });

            $realisasiTarget = $plans[$year]->real_exemplar ?? 0;
            $realisasiLaluTarget = $plans[$prevYear]->real_exemplar ?? 0;
            $totalRealisasiTargetYear += $realisasiTarget;
            $totalRealisasiLaluTargetYear += $realisasiLaluTarget;
            $totalRencanaJualTargetYear += $plans[$year]->target_exemplar ?? 0;

            if ($realisasiTarget > 0) {
                $customerWithRealisasi++;
            }

            if (isset($plans[$year]) && (int) ($plans[$year]->is_ac ?? 0) === 1) {
                $acCurrCount++;
                $school->is_active = 1;
            } else {
                $school->is_active = 0;
            }
            $school->is_ac_previous = (isset($plans[$prevYear]) && (int) ($plans[$prevYear]->is_ac ?? 0) === 1) ? 1 : 0;

            $school->target_exemplar_current = $plans[$year]->target_exemplar ?? 0;
            $school->real_exemplar_current = $plans[$year]->real_exemplar ?? 0;
            $school->sp_exemplar_current = $plans[$year]->sp_exemplar ?? 0;
            $school->potential_exemplar_current = (int) round((float) ($plans[$year]->potential_exemplar ?? 0));
            $school->real_exemplar_previous = $plans[$prevYear]->real_exemplar ?? 0;
            $school->target_exemplar_previous = $plans[$prevYear]->target_exemplar ?? 0;
            $school->potential_exemplar_previous = (int) round((float) ($plans[$prevYear]->potential_exemplar ?? 0));
            $school->sp_exemplar_previous = $plans[$prevYear]->sp_exemplar ?? 0;
            $school->prev_realisasi = ((float) ($plans[$prevYear]->real_exemplar ?? 0)) > 0;
            $school->school_grade = \App\Models\Configuration::schoolGradeFromSiswa(
                (int) ($school->total_student ?? 0),
                $gradeThresholds
            );

            if (!$liteMode) {
                $school->real_exemplar_ym3 = (int) round((float) ($plans[$year - 3]->real_exemplar ?? 0));
                $school->real_exemplar_ym2 = (int) round((float) ($plans[$year - 2]->real_exemplar ?? 0));
                $school->cabang_name = $cabangNameById[(int) ($school->cabang_id ?? 0)] ?? 'Tanpa Cabang';
                $school->area_name = $areaNameById[(int) ($school->area_id ?? 0)] ?? 'Tanpa Area';
                $sid = (int) ($school->sales_id ?? 0);
                $school->sales_name = $sid > 0
                    ? (string) ($salesNameById[$sid] ?? 'Tanpa Sales')
                    : 'Tanpa Sales';
                $yearPlanRows = $school->customerPlans->where('year', $year);
                $school->potensi_swa = (int) round((float) $yearPlanRows
                    ->filter(fn ($p) => str_starts_with(strtoupper(trim((string) ($p->sumber_dana ?? ''))), 'SWA'))
                    ->sum('potential_exemplar'));
                $school->potensi_bos = (int) round((float) $yearPlanRows
                    ->filter(fn ($p) => str_contains(strtoupper(trim((string) ($p->sumber_dana ?? ''))), 'BOS'))
                    ->sum('potential_exemplar'));
            } else {
                $school->real_exemplar_ym3 = 0;
                $school->real_exemplar_ym2 = 0;
                $school->potensi_swa = 0;
                $school->potensi_bos = 0;
            }

            unset($school->customerPlans);
            return $school;
        });

        $areaCoverSekolah = $listSekolah->where('is_active', 1)->values();

        $countDistinctSales = static function ($group): int {
            return $group->pluck('sales_id')
                ->filter(fn ($id) => $id !== null && $id !== '' && (int) $id > 0)
                ->unique()
                ->count();
        };
        $countDistinctKecamatan = static function ($group): int {
            return $group->map(function ($s) {
                $raw = trim((string) ($s->kecamatan_name ?? ''));
                if ($raw === '') {
                    return '';
                }
                $parts = array_map('trim', explode(',', $raw));

                return strtoupper($parts[0] ?? $raw);
            })->filter()->unique()->count();
        };

        // Seluruh metrik realisasi / target KPI berbasis Area Cover saja
        $totalRealisasiTargetYear = (int) round((float) $areaCoverSekolah->sum(
            fn ($s) => (float) ($s->real_exemplar_current ?? 0)
        ));
        $totalRealisasiLaluTargetYear = (int) round((float) $areaCoverSekolah->sum(
            fn ($s) => (float) ($s->real_exemplar_previous ?? 0)
        ));
        $totalRencanaJualTargetYear = (int) round((float) $areaCoverSekolah->sum(
            fn ($s) => (float) ($s->target_exemplar_current ?? 0)
        ));
        $totalPotensiEksemplar = (int) round((float) $areaCoverSekolah->sum(
            fn ($s) => (float) ($s->potential_exemplar_current ?? 0)
        ));
        $customerWithRealisasi = $areaCoverSekolah
            ->filter(fn ($s) => ((float) ($s->real_exemplar_current ?? 0)) > 0)
            ->count();

        $jenjangColorMap = [
            'SD' => '#1d4ed8',
            'SMP' => '#8b5cf6',
            'SMA' => '#eab308',
            'SMK' => '#f97316',
            'DLL' => '#10b981',
        ];

        $jenjangBreakdown = $areaCoverSekolah->groupBy(fn ($s) => strtoupper(trim($s->jenjang ?: 'Lainnya')))
            ->map(function ($g, $k) use ($jenjangColorMap, $countDistinctSales, $countDistinctKecamatan) {
                return [
                    'label' => $k,
                    'value' => $g->count(),
                    'sales_count' => $countDistinctSales($g),
                    'kecamatan_count' => $countDistinctKecamatan($g),
                    'realisasi' => (int) round((float) $g->sum(fn ($s) => (float) ($s->real_exemplar_current ?? 0))),
                    'sp' => (int) round((float) $g->sum(fn ($s) => (float) ($s->sp_exemplar_current ?? 0))),
                    'sekolah_realisasi' => $g->filter(fn ($s) => ((float) ($s->real_exemplar_current ?? 0)) > 0)->count(),
                    'potensi_siswa' => (int) $g->sum(fn ($s) => (int) ($s->total_student ?? 0)),
                    'color' => $jenjangColorMap[$k] ?? '#64748b',
                ];
            })
            ->values()
            ->sortBy(fn ($item) => ['SD' => 1, 'SMP' => 2, 'SMA' => 3, 'SMK' => 4][$item['label']] ?? 99)
            ->values()
            ->toArray();

        $sdColors = ['#059669', '#2563eb', '#d97706', '#9333ea', '#e11d48', '#0891b2'];
        $sumberDanaBreakdown = $areaCoverSekolah->groupBy(function ($s) {
            $sd = strtoupper(trim((string) ($s->sumber_dana ?? '')));
            return $sd === '' ? 'LAINNYA/KOSONG' : $sd;
        })->map(function ($g, $k) use ($countDistinctSales, $countDistinctKecamatan) {
            return [
                'label' => $k,
                'value' => $g->count(),
                'sales_count' => $countDistinctSales($g),
                'kecamatan_count' => $countDistinctKecamatan($g),
                'realisasi' => (int) round((float) $g->sum(fn ($s) => (float) ($s->real_exemplar_current ?? 0))),
                'sp' => (int) round((float) $g->sum(fn ($s) => (float) ($s->sp_exemplar_current ?? 0))),
                'sekolah_realisasi' => $g->filter(fn ($s) => ((float) ($s->real_exemplar_current ?? 0)) > 0)->count(),
                'potensi_siswa' => (int) $g->sum(fn ($s) => (int) ($s->total_student ?? 0)),
            ];
        })->values()->sortByDesc('value')->values()->toArray();
        foreach ($sumberDanaBreakdown as $i => &$item) {
            $item['color'] = $sdColors[$i % count($sdColors)];
        }
        unset($item);

        // Realisasi vs Area Cover & vs Total Sekolah per grade
        $gradeColors = \App\Models\Configuration::schoolGradeColors();
        $gradeRealisasiBreakdown = [];
        foreach (\App\Models\Configuration::schoolGradeOrder() as $grade) {
            $acGroup = $areaCoverSekolah->filter(
                fn ($s) => ($s->school_grade ?? '') === $grade
            );
            $acCount = $acGroup->count();
            if ($acCount <= 0) {
                continue;
            }
            $allGroup = $listSekolah->filter(
                fn ($s) => ($s->school_grade ?? '') === $grade
            );
            $totalSekolah = $allGroup->count();
            $realCount = $acGroup->filter(
                fn ($s) => ((float) ($s->real_exemplar_current ?? 0)) > 0
            )->count();
            $gradeRealisasiBreakdown[] = [
                'label' => $grade,
                'value' => $realCount,
                'area_cover' => $acCount,
                'total_sekolah' => $totalSekolah,
                'sales_count' => $countDistinctSales($acGroup),
                'kecamatan_count' => $countDistinctKecamatan($acGroup),
                'pct' => round(($realCount / max(1, $acCount)) * 100, 1),
                'pct_total' => round(($realCount / max(1, $totalSekolah)) * 100, 1),
                'sp' => (int) round((float) $acGroup->sum(fn ($s) => (float) ($s->sp_exemplar_current ?? 0))),
                'realisasi' => (int) round((float) $acGroup->sum(fn ($s) => (float) ($s->real_exemplar_current ?? 0))),
                'range' => \App\Models\Configuration::schoolGradeRangeLabel($grade, $gradeThresholds),
                'color' => $gradeColors[$grade] ?? '#64748b',
            ];
        }

        // Lite mode: total sekolah per grade dari SQL (bukan seluruh listSekolah)
        if ($liteMode) {
            $gradeTotalsAll = $this->countCustomersBySchoolGrade(
                $salesId,
                $cabangId,
                $areaId,
                $sumberDana,
                $onlyNegeri,
                $gradeThresholds
            );
            foreach ($gradeRealisasiBreakdown as &$gradeRow) {
                $label = (string) ($gradeRow['label'] ?? '');
                $totalSekolahGrade = (int) ($gradeTotalsAll[$label] ?? 0);
                $gradeRow['total_sekolah'] = $totalSekolahGrade;
                $gradeRow['pct_total'] = round(
                    (((int) ($gradeRow['value'] ?? 0)) / max(1, $totalSekolahGrade)) * 100,
                    1
                );
            }
            unset($gradeRow);
        }

        $acCurr = max(0, (int) $acCurrCount);
        $areaCoverForScore = max(1, $acCurr);
        $realCurr = (float) $totalRealisasiTargetYear;
        $realPrev = (float) $totalRealisasiLaluTargetYear;
        $yoy = $this->scoreRealisasiYoY($realCurr, $realPrev);

        $customerRealisasiCount = (int) $customerWithRealisasi;
        $spVsAcPct = round(($customerRealisasiCount / $areaCoverForScore) * 100, 1);
        $spVsAcScore = min(100, $spVsAcPct);

        $targetTotal = (float) $totalRencanaJualTargetYear;
        $achievementPct = $targetTotal > 0
            ? round(($realCurr / $targetTotal) * 100, 1)
            : ($realCurr > 0 ? 100 : 0);
        $achievementScore = min(100, max(0, $achievementPct));

        $tahanCount = 0;
        $rebutCount = 0;
        $lepasCount = 0;
        $trlgPerJenjang = [];
        foreach ($areaCoverSekolah as $s) {
            $jenjang = strtoupper(trim((string) ($s->jenjang ?: 'Lainnya')));
            if (!isset($trlgPerJenjang[$jenjang])) {
                $trlgPerJenjang[$jenjang] = [
                    'tahan' => 0,
                    'rebut' => 0,
                    'lepas' => 0,
                    'gagal' => 0,
                    'ac' => 0,
                    'sales_count' => 0,
                    'kecamatan_count' => 0,
                    'sekolah_realisasi' => 0,
                    'sp' => 0,
                    'realisasi' => 0,
                ];
            }
            $trlgPerJenjang[$jenjang]['ac']++;
            $prevReal = (bool) ($s->prev_realisasi ?? false);
            $currReal = ((float) ($s->real_exemplar_current ?? 0)) > 0;
            if ($prevReal && $currReal) {
                $tahanCount++;
                $trlgPerJenjang[$jenjang]['tahan']++;
            } elseif (!$prevReal && $currReal) {
                $rebutCount++;
                $trlgPerJenjang[$jenjang]['rebut']++;
            } else {
                $lepasCount++;
                $trlgPerJenjang[$jenjang]['lepas']++;
                if (!$prevReal && !$currReal) {
                    $trlgPerJenjang[$jenjang]['gagal']++;
                }
            }
            if ($currReal) {
                $trlgPerJenjang[$jenjang]['sekolah_realisasi']++;
            }
            $trlgPerJenjang[$jenjang]['sp'] += (int) round((float) ($s->sp_exemplar_current ?? 0));
            $trlgPerJenjang[$jenjang]['realisasi'] += (int) round((float) ($s->real_exemplar_current ?? 0));
        }
        foreach ($trlgPerJenjang as $j => &$trlgRow) {
            $g = $areaCoverSekolah->filter(
                fn ($s) => strtoupper(trim((string) ($s->jenjang ?: 'Lainnya'))) === $j
            );
            $trlgRow['sales_count'] = $countDistinctSales($g);
            $trlgRow['kecamatan_count'] = $countDistinctKecamatan($g);
        }
        unset($trlgRow);

        $tahanVsAcPct = round(($tahanCount / $areaCoverForScore) * 100, 1);
        $rebutVsAcPct = round(($rebutCount / $areaCoverForScore) * 100, 1);
        $lepasVsAcPct = round(($lepasCount / $areaCoverForScore) * 100, 1);

        $scoreWeights = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
            ?->resolvedSalesScoreWeights()
            ?? \App\Models\Configuration::defaultSalesScoreWeights();

        $scoreMap = [
            'realisasi_yoy' => $yoy['score'],
            'sp_vs_ac' => $spVsAcScore,
            'achievement' => $achievementScore,
            'tahan_vs_ac' => min(100, $tahanVsAcPct),
            'rebut_vs_ac' => min(100, $rebutVsAcPct),
            'lepas_vs_ac' => min(100, $lepasVsAcPct),
        ];
        $totalKpiScore = \App\Models\Configuration::computeWeightedSalesScore($scoreMap, $scoreWeights);

        $kpiData = [
            'salesName' => $displayName,
            'totalScore' => $totalKpiScore,
            'grade' => \App\Models\Configuration::salesScoreGrade($totalKpiScore),
            'weights' => $scoreWeights,
            'components' => [
                [
                    'key' => 'realisasi_yoy',
                    'label' => 'Realisasi YoY',
                    'score' => $yoy['score'],
                    'weight' => $scoreWeights['realisasi_yoy'] ?? 0,
                    'detail' => "Realisasi {$prevYear}: " . number_format($realPrev, 0, ',', '.') . " → {$year}: " . number_format($realCurr, 0, ',', '.') . " (" . ($yoy['growth_pct'] >= 0 ? '+' : '') . "{$yoy['growth_pct']}%)",
                    'icon' => 'bi-arrow-left-right',
                    'color' => '#3b82f6',
                    'is_penalty' => false,
                ],
                [
                    'key' => 'sp_vs_ac',
                    'label' => 'Customer Realisasi vs Area Cover',
                    'score' => $spVsAcScore,
                    'weight' => $scoreWeights['sp_vs_ac'] ?? 0,
                    'detail' => "Customer Realisasi {$customerRealisasiCount} vs Area Cover {$acCurr} ({$spVsAcPct}%)",
                    'icon' => 'bi-people-fill',
                    'color' => '#f59e0b',
                    'is_penalty' => false,
                ],
                [
                    'key' => 'achievement',
                    'label' => 'Achievement Target',
                    'score' => $achievementScore,
                    'weight' => $scoreWeights['achievement'] ?? 0,
                    'detail' => "Realisasi " . number_format($realCurr, 0, ',', '.') . " / Target " . number_format($targetTotal, 0, ',', '.') . " ({$achievementPct}%)",
                    'icon' => 'bi-trophy-fill',
                    'color' => '#10b981',
                    'is_penalty' => false,
                ],
                [
                    'key' => 'tahan_vs_ac',
                    'label' => 'Tahan vs Area Cover',
                    'score' => min(100, $tahanVsAcPct),
                    'weight' => $scoreWeights['tahan_vs_ac'] ?? 0,
                    'detail' => "Tahan {$tahanCount} vs Area Cover {$acCurr} ({$tahanVsAcPct}%)",
                    'icon' => 'bi-shield-check',
                    'color' => '#059669',
                    'is_penalty' => false,
                ],
                [
                    'key' => 'rebut_vs_ac',
                    'label' => 'Rebut vs Area Cover',
                    'score' => min(100, $rebutVsAcPct),
                    'weight' => $scoreWeights['rebut_vs_ac'] ?? 0,
                    'detail' => "Rebut {$rebutCount} vs Area Cover {$acCurr} ({$rebutVsAcPct}%)",
                    'icon' => 'bi-arrow-repeat',
                    'color' => '#2563eb',
                    'is_penalty' => false,
                ],
                [
                    'key' => 'lepas_vs_ac',
                    'label' => 'Lepas vs Area Cover',
                    'score' => min(100, $lepasVsAcPct),
                    'weight' => $scoreWeights['lepas_vs_ac'] ?? 0,
                    'detail' => "Lepas {$lepasCount} vs Area Cover {$acCurr} ({$lepasVsAcPct}%) — mengurangi skor",
                    'icon' => 'bi-box-arrow-right',
                    'color' => '#ef4444',
                    'is_penalty' => true,
                ],
            ],
            'year' => $year,
            'identifikasiJenjang' => $jenjangBreakdown,
            'segmenSekolah' => $jenjangBreakdown,
            'sumberDana' => $sumberDanaBreakdown,
            'extraIndicators' => [],
            'areaCover' => $acCurr,
        ];

        if ($sumberDana) {
            $totalSiswaBos = (int) $listSekolah->sum(fn ($s) => (int) ($s->total_student ?? 0));
            $totalSiswaAc = (int) $areaCoverSekolah->sum(fn ($s) => (int) ($s->total_student ?? 0));
            $kpiData['totalSekolahBos'] = $listSekolah->count();
            $kpiData['totalSiswaBos'] = $totalSiswaBos;
            // Rumus Dana BOS saja: potensi = total siswa × 1.5
            $kpiData['potensiBos'] = (int) round($totalSiswaBos * 1.5);
            $kpiData['totalSiswaAcBos'] = $totalSiswaAc;
            $kpiData['potensiAcBos'] = (int) round($totalSiswaAc * 1.5);

            $sumberDanaSet = [];
            $jenjangSet = [];
            $kecamatanSet = [];
            $salesmanSet = [];
            foreach ($listSekolah as $s) {
                $sd = strtoupper(trim((string) ($s->sumber_dana ?? '')));
                if ($sd !== '') {
                    $sumberDanaSet[$sd] = true;
                }
                $j = strtoupper(trim((string) ($s->jenjang ?? '')));
                if ($j !== '') {
                    $jenjangSet[$j] = true;
                }
                $raw = trim((string) ($s->kecamatan_name ?? ''));
                $parts = array_values(array_filter(array_map('trim', explode(',', $raw))));
                $kec = strtoupper($parts[0] ?? ($raw !== '' ? $raw : 'TANPA KECAMATAN'));
                $kecamatanSet[$kec] = true;
                $sid = (int) ($s->sales_id ?? 0);
                if ($sid > 0) {
                    $salesmanSet[$sid] = true;
                }
            }
            $kpiData['bosRingkasan'] = [
                'sumber_dana' => count($sumberDanaSet),
                'sumber_dana_labels' => array_values(array_keys($sumberDanaSet)),
                'salesman' => count($salesmanSet),
                'jenjang' => count($jenjangSet),
                'kecamatan' => count($kecamatanSet),
                'jumlah_sekolah' => (int) $listSekolah->count(),
            ];
        }

        // Dana BOS: Top Cabang; Cabang/Area: Top Kecamatan; Sales: Top Priority School
        if ($sumberDana && !$salesId) {
            $kpiData['priorityMode'] = 'cabang';
            $kpiData['prioritySchools'] = $areaCoverSekolah
                ->groupBy(function ($s) {
                    return $s->cabang_name ?: 'Tanpa Cabang';
                })
                ->map(function ($g, $nama) {
                    return [
                        'name' => $nama,
                        'siswa' => (int) $g->sum(fn ($s) => (int) ($s->total_student ?? 0)),
                        'potensi' => (int) round((float) $g->sum(fn ($s) => (float) ($s->potential_exemplar_current ?? 0))),
                        'sp' => (int) round((float) $g->sum(fn ($s) => (float) ($s->sp_exemplar_current ?? 0))),
                        'realisasi' => (int) round((float) $g->sum(fn ($s) => (float) ($s->real_exemplar_current ?? 0))),
                    ];
                })
                ->sortByDesc('siswa')
                ->take(10)
                ->values()
                ->toArray();
        } elseif (($cabangId || $areaId) && !$salesId) {
            $kpiData['priorityMode'] = 'kecamatan';
            $kecamatanKey = static function ($s): string {
                $raw = trim((string) ($s->kecamatan_name ?? ''));
                if ($raw === '') {
                    return 'TANPA KECAMATAN';
                }
                $parts = array_values(array_filter(array_map('trim', explode(',', $raw))));

                return strtoupper($parts[0] ?? $raw);
            };

            $allByKecamatan = $listSekolah->groupBy($kecamatanKey);
            $kpiData['prioritySchools'] = $areaCoverSekolah
                ->groupBy($kecamatanKey)
                ->map(function ($g, $nama) use ($allByKecamatan) {
                    $all = $allByKecamatan->get($nama, collect());

                    return [
                        'name' => $nama,
                        'total_sekolah' => $all->count(),
                        'total_siswa' => (int) $all->sum(fn ($s) => (int) ($s->total_student ?? 0)),
                        'area_cover' => $g->count(),
                        'siswa' => (int) $g->sum(fn ($s) => (int) ($s->total_student ?? 0)),
                        'potensi' => (int) round((float) $g->sum(fn ($s) => (float) ($s->potential_exemplar_current ?? 0))),
                        'kegiatan_count' => 0,
                        'sp' => (int) round((float) $g->sum(fn ($s) => (float) ($s->sp_exemplar_current ?? 0))),
                        'realisasi' => (int) round((float) $g->sum(fn ($s) => (float) ($s->real_exemplar_current ?? 0))),
                    ];
                })
                ->sortByDesc('siswa')
                ->values()
                ->toArray();

            if ($liteMode) {
                $kecamatanTotals = $this->countCustomersByKecamatan(
                    $salesId,
                    $cabangId,
                    $areaId,
                    $sumberDana,
                    $onlyNegeri
                );
                $kpiData['prioritySchools'] = collect($kpiData['prioritySchools'])
                    ->map(function ($row) use ($kecamatanTotals) {
                        $name = (string) ($row['name'] ?? '');
                        $tot = $kecamatanTotals[$name] ?? ['total_sekolah' => 0, 'total_siswa' => 0];
                        $row['total_sekolah'] = (int) ($tot['total_sekolah'] ?? 0);
                        $row['total_siswa'] = (int) ($tot['total_siswa'] ?? 0);

                        return $row;
                    })
                    ->values()
                    ->toArray();
            }
        } else {
            $kpiData['priorityMode'] = 'school';
            $kpiData['prioritySchools'] = $areaCoverSekolah->sortByDesc('total_student')->take(10)->map(function ($s) {
                $prevReal = (bool) ($s->prev_realisasi ?? false);
                $currReal = ((float) ($s->real_exemplar_current ?? 0)) > 0;
                if ($prevReal && $currReal) {
                    $status = 'Tahan';
                } elseif (!$prevReal && $currReal) {
                    $status = 'Rebut';
                } else {
                    $status = 'Belum Terealisasi';
                }
                return [
                    'id' => (int) ($s->id ?? 0),
                    'name' => $s->name,
                    'jenjang' => $s->jenjang,
                    'siswa' => (int) ($s->total_student ?? 0),
                    'potensi_swa' => (int) ($s->potensi_swa ?? 0),
                    'potensi_bos' => (int) ($s->potensi_bos ?? 0),
                    'status' => $status,
                    'sp' => (int) ($s->sp_exemplar_current ?? 0),
                    'realisasi' => (int) ($s->real_exemplar_current ?? 0),
                ];
            })->values()->toArray();
        }

        // Potensi siswa buckets
        $potensiSiswaDistribution = [
            ['label' => '< 100', 'value' => $areaCoverSekolah->filter(fn ($s) => (int) ($s->total_student ?? 0) < 100)->count()],
            ['label' => '100-300', 'value' => $areaCoverSekolah->filter(fn ($s) => ($n = (int) ($s->total_student ?? 0)) >= 100 && $n <= 300)->count()],
            ['label' => '301-500', 'value' => $areaCoverSekolah->filter(fn ($s) => ($n = (int) ($s->total_student ?? 0)) > 300 && $n <= 500)->count()],
            ['label' => '> 500', 'value' => $areaCoverSekolah->filter(fn ($s) => (int) ($s->total_student ?? 0) > 500)->count()],
        ];
        $siswaColors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'];
        foreach ($potensiSiswaDistribution as $i => &$item) {
            $item['color'] = $siswaColors[$i % count($siswaColors)];
        }
        unset($item);
        $kpiData['potensiSiswa'] = array_values(array_filter($potensiSiswaDistribution, fn ($item) => $item['value'] > 0));

        // Kompetitor (penerbit)
        $competitorMapDistribution = $areaCoverSekolah->groupBy(fn ($s) => $s->penerbit ?: 'Tidak Diketahui')
            ->map(fn ($g, $k) => ['label' => $k, 'value' => $g->count()])
            ->values()->sortByDesc('value')->values()->toArray();
        $compColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        foreach ($competitorMapDistribution as $i => &$item) {
            $item['color'] = $compColors[$i % count($compColors)];
        }
        unset($item);
        $kpiData['competitorMap'] = array_values(array_filter($competitorMapDistribution, fn ($item) => $item['value'] > 0));

        $kpiData['customerStatus'] = [
            ['label' => 'Baru', 'value' => $rebutCount, 'color' => '#10b981'],
            ['label' => 'Retain', 'value' => $tahanCount, 'color' => '#3b82f6'],
            ['label' => 'Loss', 'value' => $lepasCount, 'color' => '#ef4444'],
        ];

        // Aktivitas sales (scope cabang / sales / area)
        $kegiatanQuery = \App\Models\SalesActivity::query()
            ->select([
                'id', 'sales_id', 'customer_id', 'customer_name', 'tanggal',
                'aktivitas', 'hasil', 'keterangan', 'created_at',
            ])
            ->orderBy('id', 'desc');
        if ($salesId) {
            $kegiatanQuery->where('sales_id', $salesId);
        } elseif ($cabangId) {
            $salesIdsInCabang = \App\Models\Customer::where('cabang_id', $cabangId)
                ->whereNotNull('sales_id')
                ->distinct()
                ->pluck('sales_id');
            if ($salesIdsInCabang->isEmpty()) {
                $kegiatanQuery->whereRaw('1 = 0');
            } else {
                $kegiatanQuery->whereIn('sales_id', $salesIdsInCabang);
            }
        } elseif ($areaId) {
            $salesIdsInArea = \App\Models\Customer::where('area_id', $areaId)
                ->whereNotNull('sales_id')
                ->distinct()
                ->pluck('sales_id');
            if ($salesIdsInArea->isEmpty()) {
                $kegiatanQuery->whereRaw('1 = 0');
            } else {
                $kegiatanQuery->whereIn('sales_id', $salesIdsInArea);
            }
        } elseif ($sumberDana) {
            $salesIdsFromSchools = $listSekolah->pluck('sales_id')->filter()->unique()->values();
            if ($salesIdsFromSchools->isEmpty()) {
                $kegiatanQuery->whereRaw('1 = 0');
            } else {
                $kegiatanQuery->whereIn('sales_id', $salesIdsFromSchools);
            }
        } else {
            $kegiatanQuery->whereRaw('1 = 0');
        }
        $kegiatanSales = $kegiatanQuery->get();
        $kpiData['activityDistribution'] = $this->buildFixedSalesActivityBreakdown($kegiatanSales, null, true);

        // Lengkapi jumlah kegiatan per kecamatan untuk Top 10 Kecamatan:
        // sales di kecamatan → total seluruh aktivitas sales tersebut
        if (!$liteMode && ($kpiData['priorityMode'] ?? '') === 'kecamatan' && !empty($kpiData['prioritySchools'])) {
            $kecamatanKey = static function ($s): string {
                $raw = trim((string) ($s->kecamatan_name ?? ''));
                if ($raw === '') {
                    return 'TANPA KECAMATAN';
                }
                $parts = array_values(array_filter(array_map('trim', explode(',', $raw))));

                return strtoupper($parts[0] ?? $raw);
            };

            $salesIdsByKecamatan = [];
            foreach ($listSekolah as $s) {
                $sid = (int) ($s->sales_id ?? 0);
                if ($sid <= 0) {
                    continue;
                }
                $kec = $kecamatanKey($s);
                $salesIdsByKecamatan[$kec][$sid] = true;
            }

            $kegiatanCountBySales = [];
            foreach ($kegiatanSales as $akt) {
                $sid = (int) ($akt->sales_id ?? 0);
                if ($sid <= 0) {
                    continue;
                }
                $kegiatanCountBySales[$sid] = ($kegiatanCountBySales[$sid] ?? 0) + 1;
            }

            $kpiData['prioritySchools'] = collect($kpiData['prioritySchools'])
                ->map(function ($row) use ($salesIdsByKecamatan, $kegiatanCountBySales) {
                    $name = (string) ($row['name'] ?? '');
                    $salesIds = array_keys($salesIdsByKecamatan[$name] ?? []);
                    $total = 0;
                    foreach ($salesIds as $sid) {
                        $total += (int) ($kegiatanCountBySales[$sid] ?? 0);
                    }
                    $row['kegiatan_count'] = $total;

                    return $row;
                })
                ->values()
                ->toArray();
        }

        $activitiesByMonth = $kegiatanSales->groupBy(function ($item) {
            $date = $item->tanggal;
            if (!$date) {
                return 'unknown';
            }
            try {
                if (str_contains((string) $date, '-')) {
                    $d = \Carbon\Carbon::parse($date);
                } else {
                    try {
                        $d = \Carbon\Carbon::createFromFormat('m/d/Y', $date);
                    } catch (\Exception $e) {
                        try {
                            $d = \Carbon\Carbon::createFromFormat('d/m/Y', $date);
                        } catch (\Exception $e2) {
                            $d = \Carbon\Carbon::parse($date);
                        }
                    }
                }
                return $d->format('Y-m');
            } catch (\Exception $e) {
                return 'unknown';
            }
        })->forget('unknown');

        $monthlyActivities = [];
        for ($m = 1; $m <= 12; $m++) {
            $key = sprintf('%04d-%02d', $year, $m);
            $monthItems = $activitiesByMonth->get($key, collect());
            $monthlyActivities[] = [
                'month' => $m,
                'label' => \Carbon\Carbon::create($year, $m, 1)->translatedFormat('M'),
                'total' => $monthItems instanceof \Illuminate\Support\Collection
                    ? $monthItems->count()
                    : count($monthItems),
            ];
        }
        $kpiData['monthlyActivities'] = $monthlyActivities;

        $totalTrlg = $tahanCount + $rebutCount + $lepasCount;
        $pctTrlg = fn (int $count): float => $totalTrlg > 0 ? round(($count / $totalTrlg) * 100, 2) : 0;
        $kpiData['trlg'] = [
            'tahan' => ['count' => $tahanCount, 'pct' => $pctTrlg($tahanCount)],
            'rebut' => ['count' => $rebutCount, 'pct' => $pctTrlg($rebutCount)],
            'lepas' => ['count' => $lepasCount, 'pct' => $pctTrlg($lepasCount)],
            'total' => $totalTrlg,
        ];

        $trlgTable = [];
        foreach (['SD', 'SMP', 'SMA', 'SMK'] as $j) {
            if (isset($trlgPerJenjang[$j])) {
                $trlgTable[] = array_merge(['jenjang' => $j], $trlgPerJenjang[$j]);
                unset($trlgPerJenjang[$j]);
            }
        }
        foreach ($trlgPerJenjang as $j => $counts) {
            if (($counts['tahan'] ?? 0) > 0 || ($counts['rebut'] ?? 0) > 0 || ($counts['lepas'] ?? 0) > 0) {
                $trlgTable[] = array_merge(['jenjang' => $j], $counts);
            }
        }
        $kpiData['trlgPerJenjang'] = $trlgTable;
        $kpiData['gradeRealisasi'] = $gradeRealisasiBreakdown;

        return [
            'kpiData' => $kpiData,
            'insights' => [
                'totalAreaCover' => $acCurr,
                'totalRealisasiTargetYear' => $totalRealisasiTargetYear,
                'totalRealisasiLaluTargetYear' => $totalRealisasiLaluTargetYear,
                'totalRencanaJualTargetYear' => $totalRencanaJualTargetYear,
                'totalPotensiEksemplar' => $totalPotensiEksemplar,
                'customerWithRealisasi' => $customerWithRealisasi,
                'targetYear' => $year,
            ],
            // Lite: jangan kirim list besar — tab lain di-fetch terpisah (section=lists)
            'listSekolah' => $liteMode ? collect() : $listSekolah,
            'jenjangBreakdown' => $jenjangBreakdown,
            'sumberDanaBreakdown' => $sumberDanaBreakdown,
            'gradeRealisasiBreakdown' => $gradeRealisasiBreakdown,
            'kegiatanSales' => $liteMode ? collect() : $kegiatanSales,
            'activityBreakdown' => $kpiData['activityDistribution'],
            'resultBreakdown' => $kpiData['activityDistribution'],
        ];
    }

    /**
     * Breakdown aktivitas sales: urutan tetap Pendekatan → Promosi → SP → Faktur → Penagihan → Gagal.
     * Kategori tanpa data tetap muncul dengan value 0.
     *
     * @param  \Illuminate\Support\Collection|iterable  $kegiatanSales
     * @param  int|null  $spOverride  Jika diisi, value SP diganti (mis. Customer Realisasi)
     */
    private function buildFixedSalesActivityBreakdown($kegiatanSales, ?int $spOverride = null, bool $distinctBySchool = false): array
    {
        $order = ['Pendekatan', 'Promosi', 'SP', 'Faktur', 'Penagihan', 'Gagal'];
        $colors = [
            'Pendekatan' => '#64748b',
            'Promosi' => '#0d9488',
            'SP' => '#1d4ed8',
            'Faktur' => '#16a34a',
            'Penagihan' => '#f59e0b',
            'Gagal' => '#dc2626',
        ];

        $normalizeSchoolName = static function ($name): string {
            $n = strtoupper(trim((string) $name));
            $n = preg_replace('/\s+/u', ' ', $n) ?: '';

            return trim($n);
        };

        $counts = [];
        $seenSchools = [];
        foreach ($order as $label) {
            $counts[strtoupper($label)] = 0;
            $seenSchools[strtoupper($label)] = [];
        }

        foreach ($kegiatanSales as $item) {
            $key = strtoupper(trim((string) ($item->aktivitas ?? '')));
            if ($key === '' || !array_key_exists($key, $counts)) {
                continue;
            }

            if ($distinctBySchool) {
                $customerId = $item->customer_id ?? null;
                $schoolName = $normalizeSchoolName($item->customer_name ?? '');
                if ($customerId !== null && $customerId !== '') {
                    $schoolKey = 'id:' . (string) $customerId;
                } elseif ($schoolName !== '') {
                    // Banyak aktivitas tanpa customer_id — distinct by nama sekolah
                    $schoolKey = 'name:' . $schoolName;
                } else {
                    $schoolKey = 'row:' . (string) ($item->id ?? spl_object_id($item));
                }
                if (isset($seenSchools[$key][$schoolKey])) {
                    continue;
                }
                $seenSchools[$key][$schoolKey] = true;
            }

            $counts[$key]++;
        }

        if ($spOverride !== null) {
            $counts['SP'] = max(0, $spOverride);
        }

        $out = [];
        foreach ($order as $label) {
            $out[] = [
                'label' => $label,
                'value' => (int) ($counts[strtoupper($label)] ?? 0),
                'color' => $colors[$label],
            ];
        }

        return $out;
    }

    /**
     * Realisasi YoY score:
     * - Tahun ini >= tahun lalu → 100
     * - Turun → proporsi realisasi saat ini vs tahun lalu (0–100)
     * - Tahun lalu 0 & tahun ini > 0 → 100
     */
    private function scoreRealisasiYoY(float $realCurr, float $realPrev): array
    {
        $realGrowthPct = $realPrev > 0
            ? round((($realCurr - $realPrev) / $realPrev) * 100, 1)
            : ($realCurr > 0 ? 100.0 : 0.0);

        if ($realPrev <= 0) {
            $score = $realCurr > 0 ? 100.0 : 0.0;
        } elseif ($realCurr >= $realPrev) {
            $score = 100.0;
        } else {
            $score = round(($realCurr / $realPrev) * 100, 1);
        }

        return [
            'score' => $score,
            'growth_pct' => $realGrowthPct,
        ];
    }

    /**
     * Build the "Cabang/Area Score (AI)" KPI insights block: achievement, YoY,
     * sales-need-review, decision notes, and the weighted score (same formula
     * as Sales Score). Shared by the Cabang dashboard (cabang scope) and the
     * Area dashboard (area scope, no cabang selected).
     *
     * @param  array $agg  Pre-computed aggregates for the scope:
     *      totalSekolah, areaCover, potensiEks, realCurr, realPrev, targetEks,
     *      customerWithRealisasi, spCurr (ints),
     *      salesIdsForScore (\Illuminate\Support\Collection of sales ids for TRL score),
     *      salesPerformanceAll (array, e.g. $data['timSalesPerformance']['all']),
     *      excludeSalesNames (array of names to exclude from "tim sales", e.g. the
     *      cabang/area's own "kantor" entry), targetYear, prevYear (ints).
     */
    private function buildScopeKpiInsights(array $agg, string $scopeLabel = 'Cabang'): array
    {
        $scopeLower = strtolower($scopeLabel);
        $targetYear = (int) $agg['targetYear'];
        $prevYear = (int) $agg['prevYear'];
        $excludeSalesNames = array_map(
            fn($n) => strtolower(trim((string) $n)),
            $agg['excludeSalesNames'] ?? []
        );

        $areaCover = (int) ($agg['areaCover'] ?? 0);
        $totalSekolah = (int) ($agg['totalSekolah'] ?? 0);
        $potensiEks = (int) ($agg['potensiEks'] ?? 0);
        $realCurr = (int) ($agg['realCurr'] ?? 0);
        $targetEks = (int) ($agg['targetEks'] ?? 0);
        $realPrev = (int) ($agg['realPrev'] ?? 0);
        $customerWithRealisasi = (int) ($agg['customerWithRealisasi'] ?? 0);
        $spCurr = (int) ($agg['spCurr'] ?? 0);
        $salesIdsForScore = $agg['salesIdsForScore'] ?? collect();

        $achEksPct = $targetEks > 0
            ? round(($realCurr / $targetEks) * 100, 1)
            : ($potensiEks > 0 ? round(($realCurr / $potensiEks) * 100, 1) : 0);
        $achAcPct = $areaCover > 0
            ? round(($customerWithRealisasi / $areaCover) * 100, 1)
            : 0;
        $yoyPct = $realPrev > 0
            ? round((($realCurr - $realPrev) / $realPrev) * 100, 1)
            : ($realCurr > 0 ? 100.0 : 0.0);

        $salesAll = collect($agg['salesPerformanceAll'] ?? [])
            ->filter(function ($s) use ($excludeSalesNames) {
                $sn = strtolower(trim((string) ($s['name'] ?? '')));
                return !in_array($sn, $excludeSalesNames, true) && !empty($s['id']);
            })
            ->values();

        $salesNeedReview = $salesAll->filter(function ($s) {
            $realPct = (float) ($s['realisasi_pct'] ?? 0);
            $cov = (float) ($s['coverage'] ?? 0);
            return $realPct < 40 || $cov < 40;
        })->values();

        $topSales = $salesAll->sortByDesc('realisasi_pct')->first();
        $bottomSales = $salesAll->sortBy('realisasi_pct')->first();

        $decisionNotes = [];
        if ($salesNeedReview->count() > 0) {
            $names = $salesNeedReview->take(3)->pluck('name')->implode(', ');
            $decisionNotes[] = $salesNeedReview->count() . " sales perlu ditinjau (realisasi AC &lt;40% atau coverage &lt;40%): <strong>{$names}</strong>.";
        }
        if ($achAcPct < 40 && $areaCover > 0) {
            $decisionNotes[] = "Achievement Area Cover {$scopeLower} masih <strong>{$achAcPct}%</strong> ({$customerWithRealisasi}/{$areaCover}). Dorong closing di sekolah AC yang belum terealisasi.";
        }
        if ($yoyPct < 0) {
            $decisionNotes[] = "Realisasi eksemplar turun <strong>{$yoyPct}%</strong> vs {$prevYear}. Evaluasi pipeline SP &amp; aktivitas kunjungan.";
        } elseif ($yoyPct >= 20) {
            $decisionNotes[] = "Realisasi eksemplar tumbuh <strong>+{$yoyPct}%</strong> vs {$prevYear}. Pertahankan pola sales yang berkinerja baik.";
        }
        if ($topSales && $bottomSales && ($topSales['id'] ?? null) !== ($bottomSales['id'] ?? null)) {
            $decisionNotes[] = "Benchmark: <strong>{$topSales['name']}</strong> (realisasi AC {$topSales['realisasi_pct']}%) vs <strong>{$bottomSales['name']}</strong> ({$bottomSales['realisasi_pct']}%).";
        }
        if (empty($decisionNotes)) {
            $decisionNotes[] = "Performa {$scopeLower} relatif stabil. Pantau ranking sales &amp; opportunity untuk ekspansi.";
        }

        // ── KPI Score (rumus sama dengan Sales Score) ──
        $tahanCount = (int) \App\Models\SalesPlan::whereIn('sales_id', $salesIdsForScore)
            ->whereNull('jenjang')->sum('tahan_customer');
        $rebutCount = (int) \App\Models\SalesPlan::whereIn('sales_id', $salesIdsForScore)
            ->whereNull('jenjang')->sum('rebut_customer');
        $lepasCount = (int) \App\Models\SalesPlan::whereIn('sales_id', $salesIdsForScore)
            ->whereNull('jenjang')->sum('lepas_customer');

        $yoy = $this->scoreRealisasiYoY((float) $realCurr, (float) $realPrev);
        $realisasiYoyScore = $yoy['score'];
        $realGrowthPct = $yoy['growth_pct'];

        $areaCoverForScore = max(1, $areaCover);
        $spVsAcPct = round(($customerWithRealisasi / $areaCoverForScore) * 100, 1);
        $spVsAcScore = min(100, $spVsAcPct);

        $achievementBase = $targetEks > 0 ? $targetEks : $potensiEks;
        $achievementPct = $achievementBase > 0
            ? round(($realCurr / $achievementBase) * 100, 1)
            : ($realCurr > 0 ? 100.0 : 0.0);
        $achievementScore = min(100, max(0, $achievementPct));

        $tahanVsAcPct = round(($tahanCount / $areaCoverForScore) * 100, 1);
        $tahanVsAcScore = min(100, $tahanVsAcPct);
        $rebutVsAcPct = round(($rebutCount / $areaCoverForScore) * 100, 1);
        $rebutVsAcScore = min(100, $rebutVsAcPct);
        $lepasVsAcPct = round(($lepasCount / $areaCoverForScore) * 100, 1);
        $lepasVsAcScore = min(100, $lepasVsAcPct);

        $scoreWeights = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
            ?->resolvedSalesScoreWeights()
            ?? \App\Models\Configuration::defaultSalesScoreWeights();

        $scoreMap = [
            'realisasi_yoy' => $realisasiYoyScore,
            'sp_vs_ac' => $spVsAcScore,
            'achievement' => $achievementScore,
            'tahan_vs_ac' => $tahanVsAcScore,
            'rebut_vs_ac' => $rebutVsAcScore,
            'lepas_vs_ac' => $lepasVsAcScore,
        ];
        $totalKpiScore = \App\Models\Configuration::computeWeightedSalesScore($scoreMap, $scoreWeights);
        $kpiGrade = \App\Models\Configuration::salesScoreGrade($totalKpiScore);

        $kpiComponents = [
            [
                'key' => 'realisasi_yoy',
                'label' => 'Realisasi YoY',
                'score' => $realisasiYoyScore,
                'weight' => $scoreWeights['realisasi_yoy'] ?? 0,
                'detail' => "Realisasi {$prevYear}: " . number_format($realPrev, 0, ',', '.') . " → {$targetYear}: " . number_format($realCurr, 0, ',', '.') . " (" . ($realGrowthPct >= 0 ? '+' : '') . "{$realGrowthPct}%)",
                'icon' => 'bi-arrow-left-right',
                'color' => '#3b82f6',
                'is_penalty' => false,
            ],
            [
                'key' => 'sp_vs_ac',
                'label' => 'Customer Realisasi vs Area Cover',
                'score' => $spVsAcScore,
                'weight' => $scoreWeights['sp_vs_ac'] ?? 0,
                'detail' => "Customer Realisasi {$customerWithRealisasi} vs Area Cover {$areaCover} ({$spVsAcPct}%)",
                'icon' => 'bi-people-fill',
                'color' => '#f59e0b',
                'is_penalty' => false,
            ],
            [
                'key' => 'achievement',
                'label' => 'Achievement Target',
                'score' => $achievementScore,
                'weight' => $scoreWeights['achievement'] ?? 0,
                'detail' => "Realisasi " . number_format($realCurr, 0, ',', '.') . " / Target " . number_format($achievementBase, 0, ',', '.') . " ({$achievementPct}%)",
                'icon' => 'bi-trophy-fill',
                'color' => '#10b981',
                'is_penalty' => false,
            ],
            [
                'key' => 'tahan_vs_ac',
                'label' => 'Tahan vs Area Cover',
                'score' => $tahanVsAcScore,
                'weight' => $scoreWeights['tahan_vs_ac'] ?? 0,
                'detail' => "Tahan {$tahanCount} vs Area Cover {$areaCover} ({$tahanVsAcPct}%)",
                'icon' => 'bi-shield-check',
                'color' => '#059669',
                'is_penalty' => false,
            ],
            [
                'key' => 'rebut_vs_ac',
                'label' => 'Rebut vs Area Cover',
                'score' => $rebutVsAcScore,
                'weight' => $scoreWeights['rebut_vs_ac'] ?? 0,
                'detail' => "Rebut {$rebutCount} vs Area Cover {$areaCover} ({$rebutVsAcPct}%)",
                'icon' => 'bi-arrow-repeat',
                'color' => '#2563eb',
                'is_penalty' => false,
            ],
            [
                'key' => 'lepas_vs_ac',
                'label' => 'Lepas vs Area Cover',
                'score' => $lepasVsAcScore,
                'weight' => $scoreWeights['lepas_vs_ac'] ?? 0,
                'detail' => "Lepas {$lepasCount} vs Area Cover {$areaCover} ({$lepasVsAcPct}%) — mengurangi skor",
                'icon' => 'bi-box-arrow-right',
                'color' => '#ef4444',
                'is_penalty' => true,
            ],
        ];

        return [
            'targetYear' => $targetYear,
            'prevYear' => $prevYear,
            'totalSekolah' => $totalSekolah,
            'totalAreaCover' => $areaCover,
            'customerWithRealisasi' => $customerWithRealisasi,
            'totalRealisasiTargetYear' => $realCurr,
            'totalRealisasiLaluTargetYear' => $realPrev,
            'totalRencanaJualTargetYear' => $potensiEks,
            'totalSpTargetYear' => $spCurr,
            'targetEksemplar' => $targetEks,
            'achievementEksPct' => $achEksPct,
            'achievementAcPct' => $achAcPct,
            'yoyPct' => $yoyPct,
            'salesCount' => $salesAll->count(),
            'salesNeedReview' => $salesNeedReview->count(),
            'topSales' => $topSales ? [
                'id' => $topSales['id'] ?? null,
                'name' => $topSales['name'] ?? '',
                'realisasi_pct' => $topSales['realisasi_pct'] ?? 0,
            ] : null,
            'bottomSales' => $bottomSales ? [
                'id' => $bottomSales['id'] ?? null,
                'name' => $bottomSales['name'] ?? '',
                'realisasi_pct' => $bottomSales['realisasi_pct'] ?? 0,
            ] : null,
            'decisionNotes' => $decisionNotes,
            'totalScore' => $totalKpiScore,
            'grade' => $kpiGrade,
            'weights' => $scoreWeights,
            'components' => $kpiComponents,
        ];
    }

    /** Resolve scope helper */
    private function getScopeDetails($scopeType, $id = null)
    {
        $user = auth()->user();

        if ($scopeType === 'nasional') {
            if ($user && $user->level !== 'nasional') abort(403, 'Unauthorized access.');
            return [
                'scopeName' => 'NASIONAL',
                'backUrl' => route('monitoring.nasional'),
                'activeNav' => 'nasional',
                'customerQuery' => function ($q) {
                    return $q;
                },
                'salesQuery' => function ($q) {
                    return $q;
                },
            ];
        } elseif ($scopeType === 'area') {
            $area = \App\Models\Area::findOrFail($id);
            if ($user) {
                if ($user->level === 'area' && $user->area_id != $area->id) abort(403, 'Unauthorized access.');
                if (in_array($user->level, ['cabang', 'sales'])) abort(403, 'Unauthorized access.');
            }
            return [
                'scopeName' => 'AREA ' . strtoupper($area->name),
                'backUrl' => route('monitoring.area', $area->id),
                'activeNav' => 'area',
                'customerQuery' => function ($q) use ($area) {
                    return $q->where('area_id', $area->id);
                },
                'salesQuery' => function ($q) use ($area) {
                    $cabangIds = \App\Models\Cabang::where('area_id', $area->id)->pluck('id');
                    return $q->whereHas('cabang', function ($qc) use ($cabangIds) {
                        $qc->whereIn('cabangs.id', $cabangIds);
                    });
                },
            ];
        } else {
            $cabang = \App\Models\Cabang::findOrFail($id);
            if ($user) {
                if ($user->level === 'area' && $user->area_id != $cabang->area_id) abort(403, 'Unauthorized access.');
                if ($user->level === 'cabang' && $user->cabang_id != $cabang->id) abort(403, 'Unauthorized access.');
                if ($user->level === 'sales') {
                    $sales = \App\Models\Sales::find($user->sales_id);
                    if (!$sales || $sales->cabang_id != $cabang->id) abort(403, 'Unauthorized access.');
                }
            }
            return [
                'scopeName' => 'CABANG ' . strtoupper($cabang->nama_cabang),
                'backUrl' => route('monitoring.area.select') . '?cabang=' . $cabang->id,
                'activeNav' => 'cabang',
                'customerQuery' => function ($q) use ($cabang) {
                    return $q->where('cabang_id', $cabang->id);
                },
                'salesQuery' => function ($q) use ($cabang) {
                    return $q->whereHas('cabang', function ($qc) use ($cabang) {
                        $qc->where('cabangs.id', $cabang->id);
                    });
                },
            ];
        }
    }

    private function renderSekolahDetail($scopeType, $id = null, $isKomposisiJenjang = false)
    {
        $scope = $this->getScopeDetails($scopeType, $id);
        $query = \App\Models\Customer::where($scope['customerQuery']);

        $kecamatan = request('kecamatan');
        $jenjang   = request('jenjang');
        if ($kecamatan) $query->where('kecamatan_name', $kecamatan);
        if ($jenjang)   $query->where('jenjang', $jenjang);

        $sekolah = $query->orderBy('name')
            ->select(['id', 'name', 'kecamatan_name', 'jenjang', 'total_student', 'is_active'])
            ->paginate(50)->withQueryString();

        $kecamatanList = \App\Models\Customer::where($scope['customerQuery'])
            ->distinct()->orderBy('kecamatan_name')->pluck('kecamatan_name')->filter()->values();
        $jenjangList   = \App\Models\Customer::where($scope['customerQuery'])
            ->distinct()->orderBy('jenjang')->pluck('jenjang')->filter()->values();

        $jenjangData = [];
        if ($isKomposisiJenjang) {
            $jenjangMap = [
                '1. SD / MI'   => 'SD',
                '1. SD / MIS'  => 'SD',
                '2. SMP / MTS' => 'SMP',
                '2. SMP / MTs' => 'SMP',
                '3. SMA / MA'  => 'SMA',
                '4. SMK'       => 'SMK',
            ];
            $jenjangColors = ['SD' => '#1d4ed8', 'SMP' => '#60a5fa', 'SMA' => '#fbbf24', 'SMK' => '#fb923c'];

            $rawJenjangQuery = \App\Models\MarketShare::whereNull('kecamatan_code')->whereIn('jenjang', array_keys($jenjangMap));
            if ($scopeType === 'area') {
                $rawJenjangQuery->where('area_id', $id);
            } elseif ($scopeType === 'cabang') {
                $rawJenjangQuery->where('cabang_code', $id);
            }
            $rawJenjang = $rawJenjangQuery->select('jenjang', \Illuminate\Support\Facades\DB::raw('SUM(dapodik_customer) as total'))
                ->groupBy('jenjang')->get();

            $jenjangAgg = [];
            foreach ($rawJenjang as $row) {
                $key = $jenjangMap[$row->jenjang] ?? $row->jenjang;
                $jenjangAgg[$key] = ($jenjangAgg[$key] ?? 0) + $row->total;
            }
            $totalJenjang = array_sum($jenjangAgg);

            foreach (['SD', 'SMP', 'SMA', 'SMK'] as $j) {
                $count = $jenjangAgg[$j] ?? 0;
                $jenjangData[] = [
                    'label' => $j,
                    'total' => number_format($count, 0, ',', '.'),
                    'pct'   => $totalJenjang > 0 ? number_format(($count / $totalJenjang) * 100, 2, ',', '.') : '0,00',
                    'color' => $jenjangColors[$j],
                ];
            }
        }

        return \Inertia\Inertia::render('Monitoring/Detail/SekolahDetail', [
            'activeNav'     => $scope['activeNav'],
            'scopeName'     => $scope['scopeName'],
            'backUrl'       => $scope['backUrl'],
            'sekolah'       => $sekolah,
            'filters'       => ['kecamatan' => $kecamatan, 'jenjang' => $jenjang],
            'kecamatanList' => $kecamatanList,
            'jenjangList'   => $jenjangList,
            'isKomposisiJenjang' => $isKomposisiJenjang,
            'jenjangData'   => $jenjangData,
        ]);
    }

    public function detailSekolahNasional()
    {
        return $this->renderSekolahDetail('nasional');
    }
    public function detailSekolahArea($id)
    {
        return $this->renderSekolahDetail('area', $id);
    }
    public function detailSekolah($cabangCode)
    {
        return $this->renderSekolahDetail('cabang', $cabangCode);
    }

    public function detailKomposisiJenjangNasional()
    {
        return $this->renderSekolahDetail('nasional', null, true);
    }
    public function detailKomposisiJenjangArea($id)
    {
        return $this->renderSekolahDetail('area', $id, true);
    }
    public function detailKomposisiJenjang($cabangCode)
    {
        return $this->renderSekolahDetail('cabang', $cabangCode, true);
    }

    private function renderCustomerAktifDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);
        $query = \App\Models\Customer::where($scope['customerQuery'])->where('is_active', true);

        $kecamatan = request('kecamatan');
        $jenjang   = request('jenjang');
        if ($kecamatan) $query->where('kecamatan_name', $kecamatan);
        if ($jenjang)   $query->where('jenjang', $jenjang);

        $customers = $query->orderBy('name')
            ->select(['id', 'name', 'kecamatan_name', 'jenjang', 'total_student', 'is_active'])
            ->paginate(50)->withQueryString();

        $kecamatanList = \App\Models\Customer::where($scope['customerQuery'])->where('is_active', true)
            ->distinct()->orderBy('kecamatan_name')->pluck('kecamatan_name')->filter()->values();
        $jenjangList   = \App\Models\Customer::where($scope['customerQuery'])->where('is_active', true)
            ->distinct()->orderBy('jenjang')->pluck('jenjang')->filter()->values();

        return \Inertia\Inertia::render('Monitoring/Detail/CustomerAktifDetail', [
            'activeNav'     => $scope['activeNav'],
            'scopeName'     => $scope['scopeName'],
            'backUrl'       => $scope['backUrl'],
            'customers'     => $customers,
            'filters'       => ['kecamatan' => $kecamatan, 'jenjang' => $jenjang],
            'kecamatanList' => $kecamatanList,
            'jenjangList'   => $jenjangList,
        ]);
    }
    public function detailCustomerAktifNasional()
    {
        return $this->renderCustomerAktifDetail('nasional');
    }
    public function detailCustomerAktifArea($id)
    {
        return $this->renderCustomerAktifDetail('area', $id);
    }
    public function detailCustomerAktif($cabangCode)
    {
        return $this->renderCustomerAktifDetail('cabang', $cabangCode);
    }

    private function renderCoverageDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);

        if ($scopeType === 'nasional') {
            $kecamatans = \App\Models\Kecamatan::all();
            $salesList = \App\Models\Sales::all();
        } elseif ($scopeType === 'area') {
            $cabangIds = \App\Models\Cabang::where('area_id', $id)->pluck('id');
            $kecamatans = \App\Models\Kecamatan::whereIn('cabang_id', $cabangIds)->get();
            $salesList = \App\Models\Sales::where($scope['salesQuery'])->get();
        } else {
            $kecamatans = \App\Models\Kecamatan::where('cabang_id', $id)->get();
            $salesList = \App\Models\Sales::where($scope['salesQuery'])->get();
        }

        $kecamatanMap = [];
        foreach ($kecamatans as $k) {
            $name = $k->camat_name ?? '-';
            if (!isset($kecamatanMap[$name])) {
                $kecamatanMap[$name] = ['total' => 0, 'aktif' => 0];
            }
            $kecamatanMap[$name]['total'] += (int)($k->dapodik_customer ?? 0);
            $kecamatanMap[$name]['aktif'] += (int)($k->ac_customer ?? 0);
        }

        $kecamatanCoverage = collect($kecamatanMap)->map(function ($data, $name) {
            $total = $data['total'];
            $aktif = $data['aktif'];
            $pct   = $total > 0 ? round(($aktif / $total) * 100, 2) : 0;
            return [
                'kecamatan' => $name,
                'total'     => $total,
                'aktif'     => $aktif,
                'pct'       => $pct,
            ];
        })->values();

        $totalSekolah = $kecamatanCoverage->sum('total');
        $totalAktif   = $kecamatanCoverage->sum('aktif');
        $totalPct     = $totalSekolah > 0 ? round(($totalAktif / $totalSekolah) * 100, 2) : 0;

        $kecamatanCoverage = $kecamatanCoverage->sortByDesc('pct')->values();
        $page = request('page', 1);
        $perPage = 20;
        $paginatedKecamatan = new \Illuminate\Pagination\LengthAwarePaginator(
            $kecamatanCoverage->forPage($page, $perPage)->values(),
            $kecamatanCoverage->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        $salesCoverage = $salesList->map(function ($s) {
            $total = \App\Models\Customer::where('sales_id', $s->id)->count();
            $aktif = \App\Models\Customer::where('sales_id', $s->id)->where('is_active', true)->count();
            $pct   = $total > 0 ? round(($aktif / $total) * 100, 2) : 0;
            return ['sales' => $s->name, 'total' => $total, 'aktif' => $aktif, 'pct' => $pct];
        });

        return \Inertia\Inertia::render('Monitoring/Detail/CoverageDetail', [
            'activeNav'         => $scope['activeNav'],
            'scopeName'         => $scope['scopeName'],
            'backUrl'           => $scope['backUrl'],
            'stats'             => [
                'totalSekolah' => $totalSekolah,
                'totalAktif'   => $totalAktif,
                'totalPct'     => $totalPct,
            ],
            'kecamatanCoverage' => $paginatedKecamatan,
            'salesCoverage'     => $salesCoverage,
        ]);
    }
    public function detailCoverageNasional()
    {
        return $this->renderCoverageDetail('nasional');
    }
    public function detailCoverageArea($id)
    {
        return $this->renderCoverageDetail('area', $id);
    }
    public function detailCoverage($cabangCode)
    {
        return $this->renderCoverageDetail('cabang', $cabangCode);
    }

    private function renderOpportunityDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);

        $query = \App\Models\Customer::where($scope['customerQuery'])
            ->where(function ($q) {
                $q->where('is_active', false)->orWhereNull('is_active');
            });

        $kecamatan = request('kecamatan');
        $jenjang   = request('jenjang');
        if ($kecamatan) $query->where('kecamatan_name', $kecamatan);
        if ($jenjang)   $query->where('jenjang', $jenjang);

        $opportunities = $query->orderByDesc('total_student')
            ->select(['id', 'name', 'kecamatan_name', 'jenjang', 'total_student'])
            ->paginate(50)->withQueryString();

        $kecamatanList = \App\Models\Customer::where($scope['customerQuery'])
            ->distinct()->orderBy('kecamatan_name')->pluck('kecamatan_name')->filter()->values();
        $jenjangList   = \App\Models\Customer::where($scope['customerQuery'])
            ->distinct()->orderBy('jenjang')->pluck('jenjang')->filter()->values();

        return \Inertia\Inertia::render('Monitoring/Detail/OpportunityDetail', [
            'activeNav'     => $scope['activeNav'],
            'scopeName'     => $scope['scopeName'],
            'backUrl'       => $scope['backUrl'],
            'opportunities' => $opportunities,
            'filters'       => ['kecamatan' => $kecamatan, 'jenjang' => $jenjang],
            'kecamatanList' => $kecamatanList,
            'jenjangList'   => $jenjangList,
        ]);
    }
    public function detailOpportunityNasional()
    {
        return $this->renderOpportunityDetail('nasional');
    }
    public function detailOpportunityArea($id)
    {
        return $this->renderOpportunityDetail('area', $id);
    }
    public function detailOpportunity($cabangCode)
    {
        return $this->renderOpportunityDetail('cabang', $cabangCode);
    }

    private function renderTargetEksemplarDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);
        $jenjangList = ['SD', 'SMP', 'SMA', 'SMK', 'DLL', 'TOTAL'];

        $salesList = \App\Models\Sales::where($scope['salesQuery'])->get();
        $salesIdsList = $salesList->pluck('id');

        $allCovers = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIdsList)
            ->whereIn('jenjang', $jenjangList)
            ->get();

        $coversMap = [];
        foreach ($allCovers as $cover) {
            $coversMap[$cover->sales_id][$cover->jenjang] = $cover;
        }

        $rows = $salesList->map(function ($s) use ($jenjangList, $coversMap) {
            $row = ['sales' => $s->name];
            foreach ($jenjangList as $j) {
                $rec = $coversMap[$s->id][$j] ?? null;
                $row[strtolower($j)] = $rec ? [
                    'ac25'   => $rec->ac_customer_prev,
                    'ac26'   => $rec->ac_customer_curr,
                    'target' => $rec->target_customer,
                    'ex'     => $rec->target_exemplar,
                ] : ['ac25' => 0, 'ac26' => 0, 'target' => 0, 'ex' => 0];
            }
            return $row;
        });

        return \Inertia\Inertia::render('Monitoring/Detail/TargetEksemplarDetail', [
            'activeNav'   => $scope['activeNav'],
            'scopeName'   => $scope['scopeName'],
            'backUrl'     => $scope['backUrl'],
            'rows'        => $rows,
            'jenjangList' => ['SD', 'SMP', 'SMA', 'SMK', 'DLL'],
        ]);
    }
    public function detailTargetEksemplarNasional()
    {
        return $this->renderTargetEksemplarDetail('nasional');
    }

    private function renderSumberDanaDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);

        $customerQuery = \App\Models\Customer::where($scope['customerQuery']);
        $salesIds = (clone $customerQuery)->distinct()->pluck('sales_id')->filter();

        $salesList = \App\Models\Sales::whereIn('id', $salesIds)->orderBy('name')->get();

        $rows = $salesList->map(function ($s) {
            $bos = \App\Models\SalesCityPlan::where('sales_id', $s->id)->where('sumber_dana', 'BOS')->sum('target_customer');
            $swadana = \App\Models\SalesCityPlan::where('sales_id', $s->id)->where('sumber_dana', 'SWADANA')->sum('target_customer');
            return [
                'sales_id' => $s->id,
                'sales' => $s->name,
                'bos' => $bos,
                'swadana' => $swadana,
                'total' => $bos + $swadana,
            ];
        })->filter(function ($r) {
            return $r['total'] > 0;
        })->sortByDesc('total')->values();

        return \Inertia\Inertia::render('Monitoring/Detail/SumberDanaDetail', [
            'activeNav' => $scope['activeNav'],
            'scopeName' => $scope['scopeName'],
            'backUrl'   => $scope['backUrl'],
            'rows'      => $rows,
        ]);
    }
    public function detailSumberDanaNasional()
    {
        return $this->renderSumberDanaDetail('nasional');
    }
    public function detailSumberDanaArea($id)
    {
        return $this->renderSumberDanaDetail('area', $id);
    }
    public function detailSumberDana($cabangCode)
    {
        return $this->renderSumberDanaDetail('cabang', $cabangCode);
    }

    private function renderSumberDanaSalesDetail($scopeType, $id = null, $salesId)
    {
        $scope = $this->getScopeDetails($scopeType, $id);
        $sales = \App\Models\Sales::find($salesId);

        $baseQuery = \App\Models\Customer::where($scope['customerQuery'])->where('sales_id', $salesId);

        $sekolah = (clone $baseQuery)->orderBy('name')
            ->select(['id', 'name', 'kecamatan_name', 'jenjang', 'sumber_dana'])
            ->paginate(50)->withQueryString();

        $summaryDana = (clone $baseQuery)->select('sumber_dana', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('sumber_dana')->get()->pluck('total', 'sumber_dana')->toArray();

        $summaryJenjang = (clone $baseQuery)->select('jenjang', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('jenjang')->get()->pluck('total', 'jenjang')->toArray();

        return \Inertia\Inertia::render('Monitoring/Detail/SumberDanaSalesDetail', [
            'activeNav' => $scope['activeNav'],
            'scopeName' => $scope['scopeName'],
            'backUrl'   => $scope['backUrl'],
            'salesName' => $sales ? $sales->name : 'Unknown',
            'sekolah'   => $sekolah,
            'summaryDana' => $summaryDana,
            'summaryJenjang' => $summaryJenjang,
        ]);
    }
    public function detailSumberDanaSalesNasional($salesId)
    {
        return $this->renderSumberDanaSalesDetail('nasional', null, $salesId);
    }
    public function detailSumberDanaSalesArea($id, $salesId)
    {
        return $this->renderSumberDanaSalesDetail('area', $id, $salesId);
    }
    public function detailSumberDanaSalesCabang($cabangCode, $salesId)
    {
        return $this->renderSumberDanaSalesDetail('cabang', $cabangCode, $salesId);
    }
    public function detailTargetEksemplarArea($id)
    {
        return $this->renderTargetEksemplarDetail('area', $id);
    }
    public function detailTargetEksemplar($cabangCode)
    {
        return $this->renderTargetEksemplarDetail('cabang', $cabangCode);
    }

    private function renderSiswaDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);

        $query = \App\Models\Customer::where($scope['customerQuery'])->whereNotNull('total_student')->where('total_student', '>', 0);

        $kecamatan = request('kecamatan');
        $jenjang   = request('jenjang');
        if ($kecamatan) $query->where('kecamatan_name', $kecamatan);
        if ($jenjang)   $query->where('jenjang', $jenjang);

        $siswa = $query->orderByDesc('total_student')
            ->select(['id', 'name', 'kecamatan_name', 'jenjang', 'total_student', 'is_active'])
            ->paginate(50)->withQueryString();

        $kecamatanList = \App\Models\Customer::where($scope['customerQuery'])->whereNotNull('total_student')
            ->distinct()->orderBy('kecamatan_name')->pluck('kecamatan_name')->filter()->values();
        $jenjangList   = \App\Models\Customer::where($scope['customerQuery'])->whereNotNull('total_student')
            ->distinct()->orderBy('jenjang')->pluck('jenjang')->filter()->values();

        $totalSiswa = \App\Models\Customer::where($scope['customerQuery'])->sum('total_student');

        return \Inertia\Inertia::render('Monitoring/Detail/SiswaDetail', [
            'activeNav'     => $scope['activeNav'],
            'scopeName'     => $scope['scopeName'],
            'backUrl'       => $scope['backUrl'],
            'siswa'         => $siswa,
            'filters'       => ['kecamatan' => $kecamatan, 'jenjang' => $jenjang],
            'kecamatanList' => $kecamatanList,
            'jenjangList'   => $jenjangList,
            'totalSiswa'    => $totalSiswa,
        ]);
    }
    public function detailSiswaNasional()
    {
        return $this->renderSiswaDetail('nasional');
    }
    public function detailSiswaArea($id)
    {
        return $this->renderSiswaDetail('area', $id);
    }
    public function detailSiswa($cabangCode)
    {
        return $this->renderSiswaDetail('cabang', $cabangCode);
    }

    private function renderSalesJenjangDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);
        $salesQuery = $scope['salesQuery'](\App\Models\Sales::query());
        $salesIds = $salesQuery->pluck('id')->toArray();

        $jenjangList = ['SD', 'SMP', 'SMA', 'SMK', 'DLL'];

        $baseQuery = \App\Models\SalesAreaCover::with('sales.cabang')
            ->whereIn('sales_id', $salesIds)
            ->whereIn('jenjang', $jenjangList)
            ->where('target_customer', '>', 0);

        // calculate aggregates
        $aggregateData = [];
        foreach ($jenjangList as $j) {
            $jQuery = clone $baseQuery;
            $jQuery->where('jenjang', $j);
            $aggregateData[] = [
                'jenjang' => $j,
                'count' => $jQuery->count(),
                'target' => (int) $jQuery->sum('target_customer'),
            ];
        }

        $salesName = request('sales_name');
        $jenjang = request('jenjang');

        if ($salesName) {
            $baseQuery->whereHas('sales', function ($q) use ($salesName) {
                $q->where('name', 'like', "%{$salesName}%");
            });
        }
        if ($jenjang) {
            $baseQuery->where('jenjang', $jenjang);
        }

        $covers = $baseQuery->paginate(25)->withQueryString()
            ->through(function ($c) {
                return [
                    'id' => $c->id,
                    'sales_name' => $c->sales->name ?? 'Unknown',
                    'cabang' => $c->sales->cabang->nama_cabang ?? '-',
                    'jenjang' => $c->jenjang,
                    'target_customer' => $c->target_customer,
                    'target_exemplar' => $c->target_exemplar,
                ];
            });

        return \Inertia\Inertia::render('Monitoring/Detail/SalesJenjangDetail', [
            'activeNav' => $scope['activeNav'],
            'scopeName' => $scope['scopeName'],
            'backUrl'   => $scope['backUrl'],
            'jenjangList' => $jenjangList,
            'rows' => $covers,
            'aggregateData' => $aggregateData,
            'filters' => ['sales_name' => $salesName, 'jenjang' => $jenjang],
        ]);
    }

    public function detailSalesJenjangNasional()
    {
        return $this->renderSalesJenjangDetail('nasional');
    }
    public function detailSalesJenjangArea($id)
    {
        return $this->renderSalesJenjangDetail('area', $id);
    }
    public function detailSalesJenjang($cabangCode)
    {
        return $this->renderSalesJenjangDetail('cabang', $cabangCode);
    }

    private function renderSalesJenjangKecamatanDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);

        $customerQuery = $scope['customerQuery'](\App\Models\Customer::query());

        $jenjangList = ['SD', 'SMP', 'SMA', 'SMK', 'DLL'];

        $baseQuery = $customerQuery->with('sales.cabang')
            ->selectRaw('kecamatan_name, jenjang, sales_id, count(id) as total_sekolah, sum(total_student) as total_siswa')
            ->whereNotNull('sales_id');

        $salesName = request('sales_name');
        $jenjang = request('jenjang');

        if ($salesName) {
            $baseQuery->whereHas('sales', function ($q) use ($salesName) {
                $q->where('name', 'like', "%{$salesName}%");
            });
        }
        if ($jenjang) {
            $baseQuery->where('jenjang', $jenjang);
        }

        $covers = $baseQuery->groupBy('kecamatan_name', 'jenjang', 'sales_id')
            ->orderBy('kecamatan_name')
            ->paginate(50)->withQueryString()
            ->through(function ($c) {
                return [
                    'id' => $c->kecamatan_name . '_' . $c->jenjang . '_' . $c->sales_id,
                    'kecamatan_name' => $c->kecamatan_name,
                    'jenjang' => $c->jenjang,
                    'sales_name' => $c->sales->name ?? 'Unknown',
                    'cabang' => $c->sales->cabang->nama_cabang ?? '-',
                    'total_sekolah' => $c->total_sekolah,
                    'total_siswa' => $c->total_siswa ?? 0,
                ];
            });

        return \Inertia\Inertia::render('Monitoring/Detail/SalesJenjangKecamatanDetail', [
            'activeNav' => $scope['activeNav'],
            'scopeName' => $scope['scopeName'],
            'backUrl' => $scope['backUrl'],
            'rows' => $covers,
            'jenjangList' => $jenjangList,
            'filters' => ['sales_name' => $salesName, 'jenjang' => $jenjang],
        ]);
    }

    public function detailSalesJenjangKecamatanNasional()
    {
        return $this->renderSalesJenjangKecamatanDetail('nasional');
    }
    public function detailSalesJenjangKecamatanArea($id)
    {
        return $this->renderSalesJenjangKecamatanDetail('area', $id);
    }
    public function detailSalesJenjangKecamatan($cabangCode)
    {
        return $this->renderSalesJenjangKecamatanDetail('cabang', $cabangCode);
    }
    /** GET /monitoring/sekolah/{id}/detail */
    public function showSekolah($id)
    {
        $customer = Customer::with(['cabang', 'area', 'sales'])->findOrFail($id);

        // Ensure user has access based on role
        $user = auth()->user();
        if ($user) {
            if ($user->level === 'area' && $user->area_id != $customer->area_id) {
                abort(403, 'Unauthorized access to this school.');
            }
            if ($user->level === 'cabang' && $user->cabang_id != $customer->cabang_id) {
                abort(403, 'Unauthorized access to this school.');
            }
            if ($user->level === 'sales' && $user->sales_id != $customer->sales_id) {
                abort(403, 'Unauthorized access to this school.');
            }
        }

        // Additional relational or summary data
        // Get sales plans if we want to show historical performance
        $salesPlans = \App\Models\SalesPlan::where('sales_id', $customer->sales_id)
            ->where(function ($q) use ($customer) {
                $q->where('jenjang', $customer->jenjang)->orWhereNull('jenjang');
            })->get();

        return Inertia::render('Monitoring/Detail/SekolahShow', [
            'activeNav'  => 'sekolah',
            'customer'   => $customer,
            'salesPlans' => $salesPlans
        ]);
    }

    public function uncoveredCustomers(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\Customer::with(['cabang', 'area', 'sales'])
            ->where(function ($q) {
                $q->where('is_active', false)->orWhereNull('is_active');
            });

        $user = auth()->user();
        if ($user) {
            if ($user->level === 'area') {
                $query->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $query->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                $query->where('sales_id', $user->sales_id);
            }
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }

        if ($request->filled('sales_id')) {
            $query->where('sales_id', $request->sales_id);
        }

        $customers = $query->orderBy('name')->paginate(15)->appends($request->query());

        $areas = \App\Models\Area::orderBy('name')->get();
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        $sales = \App\Models\Sales::orderBy('name')->get();

        return Inertia::render('Monitoring/UncoveredCustomers', [
            'customers' => $customers,
            'areas' => $areas,
            'cabangs' => $cabangs,
            'sales' => $sales,
            'filters' => $request->only(['search', 'area_id', 'cabang_id', 'sales_id'])
        ]);
    }

    public function detailKompetitorNasional()
    {
        return $this->renderKompetitorDetail('nasional');
    }

    public function detailKompetitorArea($id)
    {
        return $this->renderKompetitorDetail('area', $id);
    }

    public function detailKompetitorCabang($cabangCode)
    {
        return $this->renderKompetitorDetail('cabang', $cabangCode);
    }

    private function renderKompetitorDetail($scopeType, $id = null)
    {
        $scope = $this->getScopeDetails($scopeType, $id);

        $customerQuery = \App\Models\Customer::whereNotNull('penerbit')->where('penerbit', '!=', '');

        if ($scopeType === 'area') {
            $cabangIds = \App\Models\Cabang::where('area_id', $id)->pluck('id');
            $customerQuery->whereIn('cabang_id', $cabangIds);
        } elseif ($scopeType === 'cabang') {
            $customerQuery->where('cabang_id', $id);
        }

        $customers = $customerQuery->get(['penerbit', 'total_student', 'kecamatan_name', 'cabang_id']);

        $cabangIds = $customers->pluck('cabang_id')->unique()->filter();
        $cabangMap = \App\Models\Cabang::whereIn('id', $cabangIds)->pluck('nama_cabang', 'id');

        $kompetitorMap = [];
        foreach ($customers as $c) {
            $parts = array_map('trim', explode(',', $c->penerbit));
            foreach ($parts as $p) {
                if (!empty($p)) {
                    if (!isset($kompetitorMap[$p])) {
                        $kompetitorMap[$p] = [
                            'kompetitor' => $this->getCompetitorName($p),
                            'total_sekolah' => 0,
                            'potensi_siswa' => 0,
                            'kecamatans' => [],
                            'cabangs' => []
                        ];
                    }
                    $kompetitorMap[$p]['total_sekolah'] += 1;
                    $kompetitorMap[$p]['potensi_siswa'] += (int) $c->total_student;

                    if ($c->kecamatan_name) {
                        $kompetitorMap[$p]['kecamatans'][$c->kecamatan_name] = true;
                    }
                    if ($c->cabang_id && isset($cabangMap[$c->cabang_id])) {
                        $kompetitorMap[$p]['cabangs'][$cabangMap[$c->cabang_id]] = true;
                    }
                }
            }
        }

        $kompetitorData = collect($kompetitorMap)->map(function ($data) use ($scopeType) {
            if ($scopeType === 'nasional') {
                $data['jumlah_area'] = count($data['cabangs']) . ' Cabang';
                $areas = array_keys($data['cabangs']);
            } else {
                $data['jumlah_area'] = count($data['kecamatans']) . ' Kecamatan';
                $areas = array_keys($data['kecamatans']);
            }
            $data['area_list'] = implode(', ', array_slice($areas, 0, 5)) . (count($areas) > 5 ? '...' : '');
            unset($data['kecamatans']);
            unset($data['cabangs']);
            return $data;
        })->sortByDesc('total_sekolah')->values();

        $page = request('page', 1);
        $perPage = 20;
        $paginatedData = new \Illuminate\Pagination\LengthAwarePaginator(
            $kompetitorData->forPage($page, $perPage)->values(),
            $kompetitorData->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return \Inertia\Inertia::render('Monitoring/Detail/KompetitorDetail', [
            'activeNav' => $scope['activeNav'],
            'scopeName' => $scope['scopeName'],
            'backUrl'   => $scope['backUrl'],
            'kompetitorData' => $paginatedData,
            'totalKompetitor' => count($kompetitorMap)
        ]);
    }

    public function areaKosong(\Illuminate\Http\Request $request)
    {
        // Area Kosong = Tidak dipegang sales manapun AND tidak dipegang kompetitor manapun
        $query = \App\Models\Customer::with(['cabang', 'area'])
            ->whereNull('sales_id')
            ->where(function ($q) {
                $q->whereNull('penerbit')->orWhere('penerbit', '');
            });

        $user = auth()->user();
        if ($user) {
            if ($user->level === 'area') {
                $query->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $query->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                // If the user is a sales person, they might not see anything here unless it's within their area?
                // Typically sales only see their own assigned customers. 
                // But for "Area Kosong", maybe they shouldn't see it, or they should see their cabang's area kosong.
                // Let's scope it to their cabang if possible.
                $salesData = \App\Models\Sales::find($user->sales_id);
                if ($salesData && $salesData->cabang_id) {
                    $query->where('cabang_id', $salesData->cabang_id);
                } else {
                    $query->where('id', 0); // No access
                }
            }
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }

        $customers = $query->orderBy('name')->paginate(15)->appends($request->query());

        $areas = \App\Models\Area::orderBy('name')->get();
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();

        return Inertia::render('Monitoring/AreaKosong', [
            'customers' => $customers,
            'areas' => $areas,
            'cabangs' => $cabangs,
            'filters' => $request->only(['search', 'area_id', 'cabang_id'])
        ]);
    }

    public function rekapSales(\Illuminate\Http\Request $request)
    {
        $user = auth()->user();

        $query = \App\Models\Customer::with(['sales.cityPlans', 'cabang'])
            ->selectRaw('
                sales_id, 
                COUNT(*) as target, 
                SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as realized
            ')
            ->whereNotNull('sales_id')
            ->groupBy('sales_id');

        if ($user) {
            if ($user->level === 'area') {
                $query->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $query->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                $query->where('sales_id', $user->sales_id);
            }
        }

        if ($request->filled('cabang_id')) {
            $query->where('cabang_id', $request->cabang_id);
        }

        $rekapData = $query->get()->map(function ($row) {
            $gap = $row->target - $row->realized;

            // Get all unique cities for this sales
            $areaCover = '-';
            if ($row->sales && $row->sales->cityPlans) {
                $cities = $row->sales->cityPlans->pluck('city_name')->unique()->filter()->values()->toArray();
                if (count($cities) > 0) {
                    $areaCover = implode(', ', $cities);
                }
            }

            return [
                'sales_id' => $row->sales_id,
                'sales_name' => $row->sales ? $row->sales->name : 'Unknown',
                'area_cover' => $areaCover,
                'target' => (int) $row->target,
                'realized' => (int) $row->realized,
                'gap' => $gap > 0 ? $gap : 0,
            ];
        });

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $rekapData = $rekapData->filter(function ($item) use ($search) {
                return str_contains(strtolower($item['sales_name']), $search);
            });
        }

        $rekapData = $rekapData->sortBy('sales_name')->values();

        // Paginate the collection manually
        $page = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        $perPage = 15;
        $currentItems = $rekapData->slice(($page - 1) * $perPage, $perPage)->values();
        $paginatedData = new \Illuminate\Pagination\LengthAwarePaginator($currentItems, $rekapData->count(), $perPage, $page, [
            'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
            'query' => $request->query(),
        ]);

        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();

        return \Inertia\Inertia::render('Monitoring/RekapSales', [
            'rekapData' => $paginatedData,
            'cabangs' => $cabangs,
            'filters' => $request->only(['search', 'cabang_id'])
        ]);
    }

    public function rekapSalesDetail($id, \Illuminate\Http\Request $request)
    {
        $sales = \App\Models\Sales::with(['cabang.area'])->findOrFail($id);

        if (!$sales->cabang || !$sales->cabang->area) {
            return redirect()->back()->with('error', 'Data Cabang atau Area tidak ditemukan untuk sales ini.');
        }

        $data = $this->buildUniversalDashboardData('CABANG', $sales->cabang_id, $sales->id);
        $cabangs = \App\Models\Cabang::where('area_id', $sales->cabang->area_id)->orderBy('nama_cabang')->get();

        $filterKecamatan = $request->input('kecamatan');
        $filterTahun = $request->input('tahun');

        $listKecQuery = \App\Models\Customer::where('sales_id', $id)
            ->select(
                'kecamatan_name',
                \Illuminate\Support\Facades\DB::raw('count(*) as total_sekolah'),
                \Illuminate\Support\Facades\DB::raw('sum(is_active) as sekolah_aktif'),
                \Illuminate\Support\Facades\DB::raw('sum(total_student) as potensi_siswa')
            )
            ->groupBy('kecamatan_name');

        $listSekolahQuery = \App\Models\Customer::where('sales_id', $id)
            ->select('id', 'name', 'kecamatan_name', 'jenjang', 'is_active', 'total_student', 'penerbit', 'sumber_dana');

        if ($filterKecamatan) {
            $listKecQuery->where('kecamatan_name', $filterKecamatan);
            $listSekolahQuery->where('kecamatan_name', $filterKecamatan);
        }
        if ($filterTahun) {
            $listKecQuery->whereHas('customerPlans', function ($q) use ($filterTahun) {
                $q->where('year', $filterTahun)->where('real_exemplar', '>', 0);
            });
            $listSekolahQuery->whereHas('customerPlans', function ($q) use ($filterTahun) {
                $q->where('year', $filterTahun)->where('real_exemplar', '>', 0);
            });
        }

        $listKecamatan = $listKecQuery->orderBy('kecamatan_name')->get();
        $listKecamatan->map(function ($k) use ($sales) {
            $k->cabang_name = $sales->cabang->nama_cabang ?? 'Tanpa Cabang';
            return $k;
        });
        // Base data sales = Area Cover: hilangkan kecamatan tanpa AC
        $listKecamatan = $listKecamatan
            ->filter(fn ($k) => (int) ($k->sekolah_aktif ?? 0) > 0)
            ->values();
        $listSekolah = $listSekolahQuery->orderBy('name')->get();

        $kegiatanSales = \App\Models\SalesActivity::where('sales_id', $id)->orderBy('id', 'desc')->get();

        // Analytical Data from Sales Activities
        $visitedCount = $kegiatanSales->pluck('customer_id')->filter()->unique()->count();
        $totalCustomers = $listSekolah->count();

        $visitCoverage = [
            ['label' => 'Dikunjungi', 'value' => $visitedCount, 'color' => '#16a34a'],
            ['label' => 'Belum', 'value' => max(0, $totalCustomers - $visitedCount), 'color' => '#e2e8f0'],
        ];

        $activityBreakdown = $this->buildFixedSalesActivityBreakdown($kegiatanSales, null, true);
        $resultBreakdown = $this->buildFixedSalesActivityBreakdown($kegiatanSales);

        $filterOptions = [
            'kecamatans' => \App\Models\Customer::where('sales_id', $id)->whereNotNull('kecamatan_name')->distinct()->pluck('kecamatan_name')->sort()->values(),
            'years' => [2023, 2024, 2025, 2026]
        ];

        // ── EXECUTIVE INSIGHTS ──
        $insights = [];
        $totalSchool = $data['realStats']['total_sekolah'] ?? 0;
        $custAktif = $data['realStats']['customer_aktif'] ?? 0;
        $coverage = $totalSchool > 0 ? round(($custAktif / $totalSchool) * 100, 1) : 0;
        if ($coverage > 50) {
            $insights[] = "Coverage area tergolong baik ({$coverage}%), fokus pada retensi (TAHAN) dan *upselling*.";
        } else {
            $insights[] = "Coverage area masih {$coverage}%. Masih banyak potensi sekolah yang bisa diakuisisi.";
        }

        $bestJenjang = collect($data['jenjang'])->sortByDesc(function ($j) {
            return $j['qty'] ?? 0;
        })->first();
        $worstJenjang = collect($data['jenjang'])->sortBy(function ($j) {
            return $j['qty'] ?? 0;
        })->first();

        if ($bestJenjang && ($bestJenjang['qty'] ?? 0) > 0) {
            $insights[] = "Dominasi terkuat ada di jenjang {$bestJenjang['label']}. Sangat direkomendasikan untuk melakukan penetrasi lebih dalam di jenjang {$worstJenjang['label']} yang masih lemah.";
        }

        $target = $data['realStats']['target_eksemplar'] ?? 0;
        $real = $data['realStats']['real_eksemplar'] ?? 0;
        $pencapaian = $target > 0 ? round(($real / $target) * 100, 1) : 0;
        if ($target > 0) {
            if ($pencapaian < 30) {
                $insights[] = "Pencapaian target eksemplar masih sangat rendah ({$pencapaian}%). Perlu evaluasi strategi penjualan segera.";
            } else if ($pencapaian >= 100) {
                $insights[] = "Luar biasa! Target eksemplar sudah tercapai {$pencapaian}%. Pertimbangkan untuk memberikan *reward/apresiasi*.";
            } else {
                $insights[] = "Pencapaian target eksemplar berada di angka {$pencapaian}%. Terus dorong *closing* penjualan.";
            }
        } else {
            $insights[] = "Belum ada penetapan Rencana Target Eksemplar untuk sales ini.";
        }

        return \Inertia\Inertia::render('Monitoring/Cabang', array_merge($data, [
            'activeNav'    => 'sales-performance',
            'pageTitle'    => 'Detail Sales',
            'cabangName'   => strtoupper($sales->name),
            'areaName'     => strtoupper('Cabang ' . $sales->cabang->nama_cabang),
            'description'  => 'Performa coverage dan opportunity.',
            'provinceCode' => $sales->cabang->area_id,
            'cabangCode'   => $sales->cabang_id,
            'areas'        => \App\Models\Area::orderBy('name')->get(),
            'cabangs'      => $cabangs,
            'hideFilters'  => true,
            'isSalesDetail' => true,
            'backUrl'      => route('monitoring.sales-performance'),
            'listKecamatan' => $listKecamatan,
            'listSekolah'  => $listSekolah,
            'kegiatanSales' => $kegiatanSales,
            'visitCoverage' => $visitCoverage,
            'activityBreakdown' => $activityBreakdown,
            'resultBreakdown' => $resultBreakdown,
            'insights'     => $insights,
            'filterOptions' => $filterOptions,
            'filters'      => $request->only(['kecamatan', 'tahun', 'sumber_dana']),
        ]));
    }

    public function salesPerformance(\Illuminate\Http\Request $request)
    {
        $filterArea = $request->input('area_id');
        $filterCabang = $request->input('cabang_id');
        $filterSales = $request->input('sales_id');
        $filterKecamatan = $request->input('kecamatan');
        $filterTahun = $request->input('tahun');

        $isInitialLoad = !$filterArea && !$filterCabang && !$filterSales && !$filterKecamatan && !$request->has('page') && !$request->has('t1_sort') && !$request->has('search_customer') && !$request->has('cov_page') && !$request->has('uncov_page') && !$request->has('cust_page');

        // Filter options for frontend dropdowns
        $filterOptions = [
            'areas' => \App\Models\Area::select('id', 'name')->orderBy('name')->get(),
            'cabangs' => \App\Models\Cabang::select('id', 'nama_cabang', 'area_id')->orderBy('nama_cabang')->get(),
            'sales' => \App\Models\Sales::with('cabang')->orderBy('name')->get()->unique('name')->values()->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'cabang_id' => $s->cabang_id,
                ];
            }),
            'kecamatans' => \App\Models\Customer::whereNotNull('kecamatan_name')->distinct()->pluck('kecamatan_name')->sort()->values(),
            'years' => [2023, 2024, 2025, 2026]
        ];

        if ($isInitialLoad) {
            return \Inertia\Inertia::render('Monitoring/SalesPerformance', [
                'isInitialLoad' => true,
                'insights' => null,
                'salesData' => null,
                'coveredAreas' => null,
                'uncoveredAreas' => null,
                'customerPerformance' => null,
                'filterOptions' => $filterOptions,
                'filters' => $request->only(['area_id', 'cabang_id', 'sales_id', 'kecamatan', 'tahun', 'search_customer']),
            ]);
        }

        if ($filterSales) {
            $sales = \App\Models\Sales::with(['cabang.area'])->findOrFail($filterSales);

            $data = $this->buildUniversalDashboardData('CABANG', $sales->cabang_id, $sales->id);
            $cabangs = \App\Models\Cabang::where('area_id', $sales->cabang->area_id ?? null)->orderBy('nama_cabang')->get();
            $year = $filterTahun ?: 2026;

            $top10Schools = \App\Models\CustomerPlan::with('customer')
                ->whereHas('customer', function ($q) use ($filterSales) {
                    $q->where('sales_id', $filterSales);
                })
                ->where('year', $year)
                ->orderBy('real_exemplar', 'desc')
                ->take(10)
                ->get()
                ->map(function ($plan) {
                    return [
                        'id' => $plan->customer->id ?? '',
                        'name' => $plan->customer->name ?? '',
                        'kecamatan_name' => $plan->customer->kecamatan_name ?? '',
                        'target_exemplar' => $plan->target_exemplar,
                        'real_exemplar' => $plan->real_exemplar,
                        'persentase' => $plan->target_exemplar > 0 ? round(($plan->real_exemplar / $plan->target_exemplar) * 100, 1) : 0,
                        'updated_at' => $plan->updated_at ? $plan->updated_at->format('Y-m-d H:i') : null,
                    ];
                });

            $id = $sales->id;
            $activeCabangId = $filterCabang ?: $sales->cabang_id;

            $listKecQuery = \App\Models\Customer::where('sales_id', $id)
                ->where('cabang_id', $activeCabangId)
                ->select(
                    'kecamatan_name',
                    \Illuminate\Support\Facades\DB::raw('count(*) as total_sekolah'),
                    \Illuminate\Support\Facades\DB::raw('sum(is_active) as sekolah_aktif'),
                    \Illuminate\Support\Facades\DB::raw('sum(total_student) as potensi_siswa')
                )
                ->groupBy('kecamatan_name');

            $listSekolahQuery = \App\Models\Customer::where('sales_id', $id)
                ->where('cabang_id', $activeCabangId)
                ->with(['customerPlans' => function ($q) {
                    $q->select('customer_id', 'year', 'sumber_dana', 'real_exemplar', 'target_exemplar', 'sp_exemplar', 'potential_exemplar', 'is_ac');
                }])
                ->select('id', 'name', 'kecamatan_name', 'jenjang', 'is_active', 'total_student', 'penerbit', 'sumber_dana', 'potensi_sekolah');

            if ($filterKecamatan) {
                $listKecQuery->where('kecamatan_name', $filterKecamatan);
                $listSekolahQuery->where('kecamatan_name', $filterKecamatan);
            }
            if ($filterTahun) {
                // listKecQuery: tampilkan kecamatan yang punya setidaknya satu sekolah dengan realisasi
                $listKecQuery->whereHas('customerPlans', function ($q) use ($filterTahun) {
                    $q->where('year', $filterTahun)->where('real_exemplar', '>', 0);
                });
            }

            $listKecamatan = $listKecQuery->orderBy('kecamatan_name')->get();
            $listKecamatan->map(function ($k) use ($sales) {
                $k->cabang_name = $sales->cabang->nama_cabang ?? 'Tanpa Cabang';
                return $k;
            });

            // SP, Realisasi, Potensi, Jumlah Siswa — hanya tahun berjalan/filter
            $kecPlanYear = (int) ($filterTahun ?: $year);
            $kecPlanStats = \Illuminate\Support\Facades\DB::table('customers')
                ->join('customer_plans', 'customer_plans.customer_id', '=', 'customers.id')
                ->where('customers.sales_id', $id)
                ->where('customers.cabang_id', $activeCabangId)
                ->where('customer_plans.year', $kecPlanYear)
                ->when($filterKecamatan, function ($q) use ($filterKecamatan) {
                    $q->where('customers.kecamatan_name', $filterKecamatan);
                })
                ->groupBy('customers.kecamatan_name')
                ->select(
                    'customers.kecamatan_name',
                    \Illuminate\Support\Facades\DB::raw('SUM(customer_plans.sp_exemplar) as sp_exemplar'),
                    \Illuminate\Support\Facades\DB::raw('SUM(customer_plans.real_exemplar) as real_exemplar'),
                    \Illuminate\Support\Facades\DB::raw('SUM(customer_plans.potential_exemplar) as potential_exemplar')
                )
                ->get()
                ->keyBy('kecamatan_name');

            // Jumlah siswa hanya dari sekolah yang punya customer_plans di tahun tersebut
            // (hindari double-count SWA/BOS: agregasi di level customer)
            $kecSiswaStats = \Illuminate\Support\Facades\DB::table('customers')
                ->where('customers.sales_id', $id)
                ->where('customers.cabang_id', $activeCabangId)
                ->whereExists(function ($q) use ($kecPlanYear) {
                    $q->select(\Illuminate\Support\Facades\DB::raw(1))
                        ->from('customer_plans')
                        ->whereColumn('customer_plans.customer_id', 'customers.id')
                        ->where('customer_plans.year', $kecPlanYear);
                })
                ->when($filterKecamatan, function ($q) use ($filterKecamatan) {
                    $q->where('customers.kecamatan_name', $filterKecamatan);
                })
                ->groupBy('customers.kecamatan_name')
                ->select(
                    'customers.kecamatan_name',
                    \Illuminate\Support\Facades\DB::raw('SUM(COALESCE(customers.total_student, 0)) as jumlah_siswa')
                )
                ->get()
                ->keyBy('kecamatan_name');

            $listKecamatan->each(function ($k) use ($kecPlanStats, $kecSiswaStats) {
                $stat = $kecPlanStats->get($k->kecamatan_name);
                $siswa = $kecSiswaStats->get($k->kecamatan_name);
                $k->sp_exemplar = (int) ($stat->sp_exemplar ?? 0);
                $k->real_exemplar = (int) ($stat->real_exemplar ?? 0);
                $k->potensi = (int) ($stat->potential_exemplar ?? 0);
                $k->potensi_siswa = (int) ($siswa->jumlah_siswa ?? 0);
            });

            $listSekolah = $listSekolahQuery->orderBy('name')->get();
            
            $targetYear = $filterTahun ?: (int)date('Y');
            $totalRealisasiTargetYear = 0;
            $totalRealisasiLaluTargetYear = 0;
            $totalRencanaJualTargetYear = 0;
            $customerWithRealisasi = 0;
            $totalAreaCoverTargetYear = 0;
            $acCurrCount = 0;
            $acPrevCount = 0;

            $gradeThresholds = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
                ?->resolvedSchoolGradeThresholds()
                ?? \App\Models\Configuration::defaultSchoolGradeThresholds();

            $listSekolah->transform(function ($school) use ($targetYear, &$totalRealisasiTargetYear, &$totalRealisasiLaluTargetYear, &$totalRencanaJualTargetYear, &$customerWithRealisasi, &$totalAreaCoverTargetYear, &$acCurrCount, &$acPrevCount, $year, $gradeThresholds) {
                $plans = $school->customerPlans->groupBy('year')->map(function ($group) {
                    return (object)[
                        'real_exemplar' => $group->sum('real_exemplar'),
                        'target_exemplar' => $group->sum('target_exemplar'),
                        'sp_exemplar' => $group->sum('sp_exemplar'),
                        'potential_exemplar' => $group->sum('potential_exemplar'),
                        'is_ac' => $group->max('is_ac')
                    ];
                });
                
                $realisasiTarget = $plans[$targetYear]->real_exemplar ?? 0;
                $realisasiLaluTarget = $plans[$targetYear - 1]->real_exemplar ?? 0;
                
                $totalRealisasiTargetYear += $realisasiTarget;
                $totalRealisasiLaluTargetYear += $realisasiLaluTarget;
                $totalRencanaJualTargetYear += $plans[$targetYear]->target_exemplar ?? 0;
                
                if ($realisasiTarget > 0) {
                    $customerWithRealisasi++;
                }

                if (isset($plans[$targetYear]) && $plans[$targetYear]->is_ac == 1) {
                    $totalAreaCoverTargetYear++;
                    $acCurrCount++;
                    $school->is_active = 1;
                } else {
                    $school->is_active = 0;
                }

                if (isset($plans[$targetYear - 1]) && $plans[$targetYear - 1]->is_ac == 1) {
                    $acPrevCount++;
                }

                $school->realisasi_2023 = (isset($plans[2023]) && $plans[2023]->real_exemplar > 0);
                $school->realisasi_2024 = (isset($plans[2024]) && $plans[2024]->real_exemplar > 0);
                $school->realisasi_2025 = (isset($plans[2025]) && $plans[2025]->real_exemplar > 0);
                $school->realisasi_2026 = (isset($plans[2026]) && $plans[2026]->real_exemplar > 0);
                
                $school->has_rencana_jual = (isset($plans[$year]) && ($plans[$year]->target_exemplar ?? 0) > 0);
                $school->target_exemplar_current = $plans[$targetYear]->target_exemplar ?? 0;
                $school->real_exemplar_current = $plans[$targetYear]->real_exemplar ?? 0;
                $school->sp_exemplar_current = $plans[$targetYear]->sp_exemplar ?? 0;
                $school->potential_exemplar_current = (int) round((float) ($plans[$targetYear]->potential_exemplar ?? 0));
                $school->real_exemplar_previous = $plans[$targetYear - 1]->real_exemplar ?? 0;
                $school->target_exemplar_previous = $plans[$targetYear - 1]->target_exemplar ?? 0;
                $school->potential_exemplar_previous = (int) round((float) ($plans[$targetYear - 1]->potential_exemplar ?? 0));
                $school->sp_exemplar_previous = $plans[$targetYear - 1]->sp_exemplar ?? 0;
                // Histori realisasi 3 & 2 tahun sebelum tahun berjalan (untuk tab Prospek)
                $school->real_exemplar_ym3 = (int) round((float) ($plans[$year - 3]->real_exemplar ?? 0));
                $school->real_exemplar_ym2 = (int) round((float) ($plans[$year - 2]->real_exemplar ?? 0));
                // TRLG fields: prev realisasi vs current rencana jual
                $school->prev_realisasi = ($plans[$targetYear - 1]->real_exemplar ?? 0) > 0;
                $school->curr_renjual   = (isset($plans[$targetYear]) && ($plans[$targetYear]->target_exemplar ?? 0) > 0);
                $school->school_grade = \App\Models\Configuration::schoolGradeFromSiswa(
                    (int) ($school->total_student ?? 0),
                    $gradeThresholds
                );

                // Potensi eksemplar tahun berjalan dari RJS2 (kolom P=SWA, Q=BOS)
                $yearPlanRows = $school->customerPlans->where('year', (int) $targetYear);
                $school->has_year_plan = $yearPlanRows->isNotEmpty();
                // Jumlah siswa hanya dihitung jika ada plan di tahun berjalan
                $school->jumlah_siswa_current = $school->has_year_plan
                    ? (int) ($school->total_student ?? 0)
                    : 0;
                $school->potensi_swa = (int) round((float) $yearPlanRows
                    ->filter(function ($p) {
                        $sd = strtoupper(trim((string) ($p->sumber_dana ?? '')));
                        return str_starts_with($sd, 'SWA');
                    })
                    ->sum('potential_exemplar'));
                $school->potensi_bos = (int) round((float) $yearPlanRows
                    ->filter(function ($p) {
                        $sd = strtoupper(trim((string) ($p->sumber_dana ?? '')));
                        return str_contains($sd, 'BOS');
                    })
                    ->sum('potential_exemplar'));

                unset($school->customerPlans);
                return $school;
            });

            // Base data sales = Area Cover: hilangkan kecamatan tanpa AC tahun target
            $kecWithAc = $listSekolah
                ->filter(fn ($s) => (int) ($s->is_active ?? 0) === 1)
                ->pluck('kecamatan_name')
                ->unique()
                ->flip();
            $listKecamatan = $listKecamatan
                ->filter(fn ($k) => isset($kecWithAc[$k->kecamatan_name]))
                ->values();

            // Find Non Cover Schools (in same kecamatan, but not handled by this sales)
            $salesKecamatans = \App\Models\Customer::where('sales_id', $id)
                ->where('cabang_id', $activeCabangId)
                ->whereNotNull('kecamatan_name')
                ->distinct()
                ->pluck('kecamatan_name');

            $nonCoverSchoolsQuery = \App\Models\Customer::whereIn('kecamatan_name', $salesKecamatans)
                ->where('cabang_id', $activeCabangId)
                ->where(function ($q) use ($id) {
                    $q->whereNull('sales_id')->orWhere('sales_id', '!=', $id);
                });
            if ($filterKecamatan) {
                $nonCoverSchoolsQuery->where('kecamatan_name', $filterKecamatan);
            }
            $nonCoverSchools = $nonCoverSchoolsQuery->orderBy('name')->get(['id', 'name', 'kecamatan_name', 'jenjang', 'is_active', 'total_student', 'penerbit', 'sumber_dana', 'potensi_sekolah']);

            $areaCoverWithRencanaJual = $listSekolah->where('is_active', 1)->where('has_rencana_jual', true)->count();
            $areaCoverCount = $listSekolah->where('is_active', 1)->count();
            $rencanaJualCoverage = [
                ['label' => 'Ada Rencana Jual', 'value' => $areaCoverWithRencanaJual, 'color' => '#3b82f6'],
                ['label' => 'Tidak Ada Rencana Jual', 'value' => max(0, $areaCoverCount - $areaCoverWithRencanaJual), 'color' => '#e2e8f0'],
            ];

            $kegiatanSales = \App\Models\SalesActivity::where('sales_id', $id)->orderBy('id', 'desc')->get();
            $visitedCount = $kegiatanSales->pluck('customer_id')->filter()->unique()->count();
            $totalCustomers = $listSekolah->count();
            $visitCoverage = [
                ['label' => 'Dikunjungi', 'value' => $visitedCount, 'color' => '#16a34a'],
                ['label' => 'Belum', 'value' => max(0, $totalCustomers - $visitedCount), 'color' => '#e2e8f0'],
            ];

            // Compositions Breakdown
            $colorPalette = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
            $assignColor = function (&$array) use ($colorPalette) {
                $i = 0;
                foreach ($array as &$item) {
                    $item['color'] = $colorPalette[$i % count($colorPalette)];
                    $i++;
                }
                return $array;
            };

            $areaCoverSekolah = $listSekolah->where('is_active', 1);

            $jenjangColorMap = [
                'SD' => '#1d4ed8',
                'SMP' => '#8b5cf6',
                'SMA' => '#eab308',
                'SMK' => '#f97316',
                'DLL' => '#10b981',
            ];

            $jenjangBreakdown = $areaCoverSekolah->groupBy(function ($s) {
                return strtoupper(trim($s->jenjang ?: 'Lainnya'));
            })
                ->map(function ($g, $k) use ($jenjangColorMap) {
                    $realisasi = (float) $g->sum(function ($s) {
                        return (float) ($s->real_exemplar_current ?? 0);
                    });
                    $sp = (float) $g->sum(function ($s) {
                        return (float) ($s->sp_exemplar_current ?? 0);
                    });
                    $sekolahRealisasi = $g->filter(function ($s) {
                        return ((float) ($s->real_exemplar_current ?? 0)) > 0;
                    })->count();

                    return [
                        'label' => $k,
                        'value' => $g->count(),
                        'realisasi' => (int) round($realisasi),
                        'sp' => (int) round($sp),
                        'sekolah_realisasi' => $sekolahRealisasi,
                        'potensi_siswa' => (int) $g->sum(function ($s) {
                            return (int) ($s->total_student ?? 0);
                        }),
                        'color' => $jenjangColorMap[$k] ?? '#64748b',
                    ];
                })
                ->values()
                ->sortBy(function ($item) {
                    $order = ['SD' => 1, 'SMP' => 2, 'SMA' => 3, 'SMK' => 4];
                    return $order[$item['label']] ?? 99;
                })
                ->values()
                ->toArray();

            $sumberDanaBreakdown = $areaCoverSekolah->groupBy(function ($s) {
                return $s->sumber_dana ?: 'Lainnya';
            })
                ->map(function ($g, $k) {
                    return ['label' => $k, 'value' => $g->count()];
                })->values()->toArray();

            $segmenBreakdown = $areaCoverSekolah->groupBy(function ($s) {
                return $s->potensi_sekolah ?: 'Belum Ada';
            })
                ->map(function ($g, $k) {
                    return ['label' => 'Grade ' . $k, 'value' => $g->count()];
                })->values()->toArray();

            $siswaBreakdown = [
                ['label' => '< 100', 'value' => $areaCoverSekolah->filter(function ($s) {
                    return $s->total_student < 100;
                })->count()],
                ['label' => '100-300', 'value' => $areaCoverSekolah->filter(function ($s) {
                    return $s->total_student >= 100 && $s->total_student <= 300;
                })->count()],
                ['label' => '301-500', 'value' => $areaCoverSekolah->filter(function ($s) {
                    return $s->total_student > 300 && $s->total_student <= 500;
                })->count()],
                ['label' => '> 500', 'value' => $areaCoverSekolah->filter(function ($s) {
                    return $s->total_student > 500;
                })->count()],
            ];

            $sumberDanaBreakdown = $assignColor($sumberDanaBreakdown);
            $segmenBreakdown = $assignColor($segmenBreakdown);
            $siswaBreakdown = $assignColor($siswaBreakdown);

            $activityBreakdown = $this->buildFixedSalesActivityBreakdown($kegiatanSales, null, true);
            $resultBreakdown = $this->buildFixedSalesActivityBreakdown($kegiatanSales);

            // ══════════════════════════════════════════════
            // KPI SCORE CALCULATION
            // ══════════════════════════════════════════════

            $currentYear = $filterTahun ?: date('Y');
            $acCurr = $acCurrCount;
            $acPrev = $acPrevCount;

            // Pendukung: Area Cover Growth
            $acGrowthPct = $acPrev > 0
                ? round((($acCurr - $acPrev) / $acPrev) * 100, 1)
                : ($acCurr > 0 ? 100 : 0);
            if ($acGrowthPct >= 20) {
                $acScore = 100;
            } elseif ($acGrowthPct >= 0) {
                $acScore = 50 + ($acGrowthPct / 20) * 50;
            } else {
                $acScore = max(0, 50 + ($acGrowthPct / 20) * 50);
            }
            $acScore = round($acScore, 1);

            // 1. Realisasi tahun lalu vs tahun ini
            $realCurr = (float) $totalRealisasiTargetYear;
            $realPrev = (float) $totalRealisasiLaluTargetYear;
            $yoy = $this->scoreRealisasiYoY($realCurr, $realPrev);
            $realGrowthPct = $yoy['growth_pct'];
            $realisasiYoyScore = $yoy['score'];

            // 2. Customer Realisasi vs Area Cover
            $customerRealisasiCount = (int) $customerWithRealisasi;
            $areaCoverForScore = max(1, (int) $acCurr);
            $spVsAcPct = round(($customerRealisasiCount / $areaCoverForScore) * 100, 1);
            $spVsAcScore = min(100, $spVsAcPct);

            // 3. Achievement Target (realisasi / rencana jual)
            $targetTotal = (float) $totalRencanaJualTargetYear;
            $achievementPct = $targetTotal > 0
                ? round(($realCurr / $targetTotal) * 100, 1)
                : ($realCurr > 0 ? 100 : 0);
            $achievementScore = min(100, max(0, $achievementPct));

            // 4–6. Tahan / Rebut / Lepas vs Area Cover (dihitung dari sekolah AC)
            // Lepas = semua yang tahun ini TIDAK ber-realisasi (termasuk "gagal")
            $tahanCount = 0;
            $rebutCount = 0;
            $lepasCount = 0;
            foreach ($areaCoverSekolah as $s) {
                $prevReal = (bool) ($s->prev_realisasi ?? false);
                $currReal = ((float) ($s->real_exemplar_current ?? 0)) > 0;
                if ($prevReal && $currReal) {
                    $tahanCount++;
                } elseif (!$prevReal && $currReal) {
                    $rebutCount++;
                } else {
                    $lepasCount++;
                }
            }
            $tahanVsAcPct = round(($tahanCount / $areaCoverForScore) * 100, 1);
            $tahanVsAcScore = min(100, $tahanVsAcPct);
            $rebutVsAcPct = round(($rebutCount / $areaCoverForScore) * 100, 1);
            $rebutVsAcScore = min(100, $rebutVsAcPct);
            $lepasVsAcPct = round(($lepasCount / $areaCoverForScore) * 100, 1);
            $lepasVsAcScore = min(100, $lepasVsAcPct);

            // Pendukung: Intensitas aktivitas + chart bulanan
            $activitiesByMonth = $kegiatanSales->groupBy(function ($item) {
                $date = $item->tanggal;
                if (!$date) return 'unknown';
                try {
                    if (str_contains($date, '-')) {
                        $d = \Carbon\Carbon::parse($date);
                    } else {
                        try {
                            $d = \Carbon\Carbon::createFromFormat('m/d/Y', $date);
                        } catch (\Exception $e) {
                            try {
                                $d = \Carbon\Carbon::createFromFormat('d/m/Y', $date);
                            } catch (\Exception $e) {
                                $d = \Carbon\Carbon::parse($date);
                            }
                        }
                    }
                    return $d->format('Y-m');
                } catch (\Exception $e) {
                    return 'unknown';
                }
            })->forget('unknown');

            $totalActivities = $kegiatanSales->count();
            $activeMonths = max(1, $activitiesByMonth->count());
            $avgPerMonth = round($totalActivities / $activeMonths, 1);
            $activityScore = min(100, round(($avgPerMonth / 20) * 100, 1));

            $monthlyActivities = [];
            $monthsToDisplay = [
                10 => 'Okt', 11 => 'Nov', 12 => 'Des',
                1 => 'Jan', 2 => 'Feb', 3 => 'Mar',
                4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
                7 => 'Jul', 8 => 'Agu', 9 => 'Sep'
            ];

            foreach ($monthsToDisplay as $m => $monthName) {
                $y = ($m >= 10) ? $currentYear - 1 : $currentYear;
                $key = $y . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
                $monthItems = $activitiesByMonth->has($key) ? $activitiesByMonth[$key] : collect();
                $breakdown = $monthItems
                    ->groupBy(function ($item) {
                        $label = trim((string) ($item->aktivitas ?? ''));
                        return $label !== '' ? $label : 'Tidak Diketahui';
                    })
                    ->map(fn ($group, $label) => [
                        'label' => $label,
                        'value' => $group->count(),
                    ])
                    ->sortByDesc('value')
                    ->values()
                    ->all();

                $monthlyActivities[] = [
                    'month' => $monthName,
                    'year' => (int) $y,
                    'count' => $monthItems->count(),
                    'breakdown' => $breakdown,
                ];
            }

            // Pendukung: Realisasi Sekolah (sekolah ber-realisasi di Area Cover / Area Cover)
            $areaCoverCount = max(0, (int) $acCurr);
            $sekolahDenganRealisasi = $listSekolah->filter(function ($s) {
                return ((int) ($s->is_active ?? 0) === 1)
                    && (($s->real_exemplar_current ?? 0) > 0);
            })->count();
            $realisasiPct = $areaCoverCount > 0
                ? round(($sekolahDenganRealisasi / $areaCoverCount) * 100, 1)
                : 0;
            $realisasiScore = round($realisasiPct, 1);

            // Indikator aktivitas lain vs Area Cover tidak masuk penilaian
            // (hanya SP yang dihitung di skor utama)

            // Total KPI Score = weighted (Tahan/Rebut menambah, Lepas mengurangi)
            $scoreWeights = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
                ?->resolvedSalesScoreWeights()
                ?? \App\Models\Configuration::defaultSalesScoreWeights();

            $scoreMap = [
                'realisasi_yoy' => $realisasiYoyScore,
                'sp_vs_ac' => $spVsAcScore,
                'achievement' => $achievementScore,
                'tahan_vs_ac' => $tahanVsAcScore,
                'rebut_vs_ac' => $rebutVsAcScore,
                'lepas_vs_ac' => $lepasVsAcScore,
            ];
            $totalKpiScore = \App\Models\Configuration::computeWeightedSalesScore($scoreMap, $scoreWeights);

            $salesRep = \App\Models\Sales::find($id);
            $kpiData = [
                'salesName' => $salesRep ? $salesRep->name : 'Unknown Sales',
                'totalScore' => $totalKpiScore,
                'grade' => \App\Models\Configuration::salesScoreGrade($totalKpiScore),
                'weights' => $scoreWeights,
                'components' => [
                    [
                        'key' => 'realisasi_yoy',
                        'label' => 'Realisasi YoY',
                        'score' => $realisasiYoyScore,
                        'weight' => $scoreWeights['realisasi_yoy'] ?? 0,
                        'detail' => "Realisasi " . ($currentYear - 1) . ": " . number_format($realPrev, 0, ',', '.') . " → {$currentYear}: " . number_format($realCurr, 0, ',', '.') . " (" . ($realGrowthPct >= 0 ? '+' : '') . "{$realGrowthPct}%)",
                        'icon' => 'bi-arrow-left-right',
                        'color' => '#3b82f6',
                        'is_penalty' => false,
                    ],
                    [
                        'key' => 'sp_vs_ac',
                        'label' => 'Customer Realisasi vs Area Cover',
                        'score' => $spVsAcScore,
                        'weight' => $scoreWeights['sp_vs_ac'] ?? 0,
                        'detail' => "Customer Realisasi {$customerRealisasiCount} vs Area Cover {$acCurr} ({$spVsAcPct}%)",
                        'icon' => 'bi-people-fill',
                        'color' => '#f59e0b',
                        'is_penalty' => false,
                    ],
                    [
                        'key' => 'achievement',
                        'label' => 'Achievement Target',
                        'score' => $achievementScore,
                        'weight' => $scoreWeights['achievement'] ?? 0,
                        'detail' => "Realisasi " . number_format($realCurr, 0, ',', '.') . " / Target " . number_format($targetTotal, 0, ',', '.') . " ({$achievementPct}%)",
                        'icon' => 'bi-trophy-fill',
                        'color' => '#10b981',
                        'is_penalty' => false,
                    ],
                    [
                        'key' => 'tahan_vs_ac',
                        'label' => 'Tahan vs Area Cover',
                        'score' => $tahanVsAcScore,
                        'weight' => $scoreWeights['tahan_vs_ac'] ?? 0,
                        'detail' => "Tahan {$tahanCount} vs Area Cover {$acCurr} ({$tahanVsAcPct}%)",
                        'icon' => 'bi-shield-check',
                        'color' => '#059669',
                        'is_penalty' => false,
                    ],
                    [
                        'key' => 'rebut_vs_ac',
                        'label' => 'Rebut vs Area Cover',
                        'score' => $rebutVsAcScore,
                        'weight' => $scoreWeights['rebut_vs_ac'] ?? 0,
                        'detail' => "Rebut {$rebutCount} vs Area Cover {$acCurr} ({$rebutVsAcPct}%)",
                        'icon' => 'bi-arrow-repeat',
                        'color' => '#2563eb',
                        'is_penalty' => false,
                    ],
                    [
                        'key' => 'lepas_vs_ac',
                        'label' => 'Lepas vs Area Cover',
                        'score' => $lepasVsAcScore,
                        'weight' => $scoreWeights['lepas_vs_ac'] ?? 0,
                        'detail' => "Lepas {$lepasCount} vs Area Cover {$acCurr} ({$lepasVsAcPct}%) — mengurangi skor",
                        'icon' => 'bi-box-arrow-right',
                        'color' => '#ef4444',
                        'is_penalty' => true,
                    ],
                ],
                'extraIndicators' => [],
                'monthlyActivities' => $monthlyActivities,
            ];

            // Activity Distribution: distinct sekolah per jenis aktivitas (vs Area Cover)
            $activityDistribution = $this->buildFixedSalesActivityBreakdown($kegiatanSales, null, true);
            $kpiData['activityDistribution'] = $activityDistribution;
            $kpiData['areaCover'] = (int) $acCurr;

            // Sumber Dana Distribution
            $sumberDanaDistribution = collect($areaCoverSekolah)->groupBy(function ($s) {
                $sd = strtoupper(trim($s->sumber_dana ?? ''));
                return empty($sd) ? 'LAINNYA/KOSONG' : $sd;
            })->map(function ($group, $key) {
                return [
                    'label' => $key,
                    'value' => $group->count(),
                    'realisasi' => (int) round((float) $group->sum(function ($s) {
                        return (float) ($s->real_exemplar_current ?? 0);
                    })),
                    'sp' => (int) round((float) $group->sum(function ($s) {
                        return (float) ($s->sp_exemplar_current ?? 0);
                    })),
                    'sekolah_realisasi' => $group->filter(function ($s) {
                        return ((float) ($s->real_exemplar_current ?? 0)) > 0;
                    })->count(),
                    'potensi_siswa' => (int) $group->sum(function ($s) {
                        return (int) ($s->total_student ?? 0);
                    }),
                ];
            })->values()->sortByDesc('value')->values()->toArray();

            $sdColors = ['#059669', '#2563eb', '#d97706', '#9333ea', '#e11d48', '#0891b2'];
            foreach ($sumberDanaDistribution as $index => &$item) {
                $item['color'] = $sdColors[$index % count($sdColors)];
            }
            $kpiData['sumberDana'] = $sumberDanaDistribution;

            // Realisasi vs Area Cover & vs Total Sekolah per grade
            $gradeColors = \App\Models\Configuration::schoolGradeColors();
            $gradeRealisasiBreakdown = [];
            foreach (\App\Models\Configuration::schoolGradeOrder() as $grade) {
                $acGroup = collect($areaCoverSekolah)->filter(
                    fn ($s) => ($s->school_grade ?? '') === $grade
                );
                $acCount = $acGroup->count();
                if ($acCount <= 0) {
                    continue;
                }
                $allGroup = collect($listSekolah)->filter(
                    fn ($s) => ($s->school_grade ?? '') === $grade
                );
                $totalSekolah = $allGroup->count();
                $realCount = $acGroup->filter(
                    fn ($s) => ((float) ($s->real_exemplar_current ?? 0)) > 0
                )->count();
                $gradeRealisasiBreakdown[] = [
                    'label' => $grade,
                    'value' => $realCount,
                    'area_cover' => $acCount,
                    'total_sekolah' => $totalSekolah,
                    'pct' => round(($realCount / max(1, $acCount)) * 100, 1),
                    'pct_total' => round(($realCount / max(1, $totalSekolah)) * 100, 1),
                    'sp' => (int) round((float) $acGroup->sum(fn ($s) => (float) ($s->sp_exemplar_current ?? 0))),
                    'realisasi' => (int) round((float) $acGroup->sum(fn ($s) => (float) ($s->real_exemplar_current ?? 0))),
                    'range' => \App\Models\Configuration::schoolGradeRangeLabel($grade, $gradeThresholds),
                    'color' => $gradeColors[$grade] ?? '#64748b',
                ];
            }
            $kpiData['gradeRealisasi'] = $gradeRealisasiBreakdown;

            // Potensi Siswa (Jumlah Siswa) Distribution
            $potensiSiswaDistribution = [
                ['label' => '< 100', 'value' => collect($areaCoverSekolah)->filter(function ($s) {
                    return $s->total_student < 100;
                })->count()],
                ['label' => '100-300', 'value' => collect($areaCoverSekolah)->filter(function ($s) {
                    return $s->total_student >= 100 && $s->total_student <= 300;
                })->count()],
                ['label' => '301-500', 'value' => collect($areaCoverSekolah)->filter(function ($s) {
                    return $s->total_student > 300 && $s->total_student <= 500;
                })->count()],
                ['label' => '> 500', 'value' => collect($areaCoverSekolah)->filter(function ($s) {
                    return $s->total_student > 500;
                })->count()],
            ];

            $siswaColors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'];
            foreach ($potensiSiswaDistribution as $index => &$item) {
                $item['color'] = $siswaColors[$index % count($siswaColors)];
            }
            // Remove empty categories so donut chart looks cleaner
            $kpiData['potensiSiswa'] = array_values(array_filter($potensiSiswaDistribution, function ($item) {
                return $item['value'] > 0;
            }));

            // Competitor Distribution (Peta Pesaing)
            $competitorMapDistribution = $areaCoverSekolah->groupBy(function ($s) {
                return $s->penerbit ?: 'Tidak Diketahui';
            })
                ->map(function ($g, $k) {
                    return ['label' => $k, 'value' => $g->count()];
                })
                ->values()->sortByDesc('value')->values()->toArray();

            $compColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
            foreach ($competitorMapDistribution as $index => &$item) {
                $item['color'] = $compColors[$index % count($compColors)];
            }
            $kpiData['competitorMap'] = array_values(array_filter($competitorMapDistribution, function ($item) {
                return $item['value'] > 0;
            }));

            // Top 10 Priority School
            $prioritySchools = collect($areaCoverSekolah)->sortByDesc('total_student')->take(10)->map(function ($s) {
                $prevReal = (bool) ($s->prev_realisasi ?? false);
                $currReal = ((float) ($s->real_exemplar_current ?? 0)) > 0;
                if ($prevReal && $currReal) {
                    $status = 'Tahan';
                } elseif (!$prevReal && $currReal) {
                    $status = 'Rebut';
                } else {
                    $status = 'Belum Terealisasi';
                }

                return [
                    'id' => (int) ($s->id ?? 0),
                    'name' => $s->name,
                    'jenjang' => $s->jenjang,
                    'siswa' => (int) ($s->total_student ?? 0),
                    'potensi_swa' => (int) ($s->potensi_swa ?? 0),
                    'potensi_bos' => (int) ($s->potensi_bos ?? 0),
                    'status' => $status,
                    'sp' => (int) ($s->sp_exemplar_current ?? 0),
                    'realisasi' => (int) ($s->real_exemplar_current ?? 0),
                ];
            })->values()->toArray();
            $kpiData['prioritySchools'] = $prioritySchools;

            // Customer Baru vs Loss & TRLG per Jenjang
            $customerBaru = 0;
            $customerLoss = 0;
            $customerRetain = 0;
            $customerGagal = 0;

            $segmentNegeri = 0;
            $segmentSwasta = 0;
            $segmentNegeriRealisasi = 0.0;
            $segmentSwastaRealisasi = 0.0;
            $segmentNegeriSiswa = 0;
            $segmentSwastaSiswa = 0;

            $trlgPerJenjang = [];
            foreach (['SD', 'SMP', 'SMA', 'SMK'] as $jenjang) {
                $trlgPerJenjang[$jenjang] = [
                    'tahan' => 0,
                    'rebut' => 0,
                    'lepas' => 0,
                    'gagal' => 0,
                    'ac' => 0,
                ];
            }

            foreach ($areaCoverSekolah as $s) {
                $jenjang = strtoupper(trim($s->jenjang ?? ''));
                if (empty($jenjang)) $jenjang = 'LAINNYA';
                if (!isset($trlgPerJenjang[$jenjang])) {
                    $trlgPerJenjang[$jenjang] = [
                        'tahan' => 0,
                        'rebut' => 0,
                        'lepas' => 0,
                        'gagal' => 0,
                        'ac' => 0,
                    ];
                }

                $trlgPerJenjang[$jenjang]['ac']++;

                $realCurrVal = (float) ($s->real_exemplar_current ?? 0);
                $siswaVal = (int) ($s->total_student ?? 0);

                $sumberDana = strtoupper(trim($s->sumber_dana ?? ''));
                if ($sumberDana === 'BOS') {
                    $segmentNegeri++;
                    $segmentNegeriRealisasi += $realCurrVal;
                    $segmentNegeriSiswa += $siswaVal;
                } elseif (strpos($sumberDana, 'SWA') === 0) {
                    $segmentSwasta++;
                    $segmentSwastaRealisasi += $realCurrVal;
                    $segmentSwastaSiswa += $siswaVal;
                }

                // Logika TRL (semua sekolah Area Cover harus masuk salah satu):
                // Tahan  = tahun lalu ada realisasi  && tahun ini ada realisasi
                // Rebut  = tahun lalu TIDAK realisasi && tahun ini ada realisasi
                // Lepas  = tahun ini TIDAK ada realisasi (termasuk yang dulu disebut "gagal")
                $prevReal  = $s->prev_realisasi ?? false;
                $currReal  = ($s->real_exemplar_current ?? 0) > 0;

                if ($prevReal && $currReal) {
                    $customerRetain++;
                    $trlgPerJenjang[$jenjang]['tahan']++;
                } elseif (!$prevReal && $currReal) {
                    $customerBaru++;
                    $trlgPerJenjang[$jenjang]['rebut']++;
                } else {
                    // Lepas = tidak ada realisasi tahun ini (ex-customer + belum pernah realisasi)
                    $customerLoss++;
                    $trlgPerJenjang[$jenjang]['lepas']++;
                    if (!$prevReal && !$currReal) {
                        $customerGagal++;
                        $trlgPerJenjang[$jenjang]['gagal'] = ($trlgPerJenjang[$jenjang]['gagal'] ?? 0) + 1;
                    }
                }
            }
            $kpiData['customerStatus'] = [
                ['label' => 'Baru', 'value' => $customerBaru, 'color' => '#10b981'],
                ['label' => 'Retain', 'value' => $customerRetain, 'color' => '#3b82f6'],
                ['label' => 'Loss', 'value' => $customerLoss, 'color' => '#ef4444'],
            ];

            // Tahan - Rebut - Lepas (total = Area Cover; gagal sudah masuk Lepas)
            $totalTrlg = $customerRetain + $customerBaru + $customerLoss;
            $pctTrlg = function (int $count) use ($totalTrlg): float {
                return $totalTrlg > 0 ? round(($count / $totalTrlg) * 100, 2) : 0;
            };
            $kpiData['trlg'] = [
                'tahan' => ['count' => $customerRetain, 'pct' => $pctTrlg($customerRetain)],
                'rebut' => ['count' => $customerBaru, 'pct' => $pctTrlg($customerBaru)],
                'lepas' => ['count' => $customerLoss, 'pct' => $pctTrlg($customerLoss)],
                'total' => $totalTrlg,
            ];

            // Format array for UI table
            $trlgTable = [];
            foreach (['SD', 'SMP', 'SMA', 'SMK'] as $j) {
                if (isset($trlgPerJenjang[$j])) {
                    $trlgTable[] = array_merge(['jenjang' => $j], $trlgPerJenjang[$j]);
                    unset($trlgPerJenjang[$j]);
                }
            }
            foreach ($trlgPerJenjang as $j => $counts) {
                if (($counts['tahan'] ?? 0) > 0 || ($counts['rebut'] ?? 0) > 0 || ($counts['lepas'] ?? 0) > 0) {
                    $trlgTable[] = array_merge(['jenjang' => $j], $counts);
                }
            }
            $kpiData['trlgPerJenjang'] = $trlgTable;

            $kpiData['year'] = $currentYear;
            $kpiData['identifikasiJenjang'] = $jenjangBreakdown;
            // Legacy key (UI diganti ke identifikasijenjang)
            $kpiData['segmenSekolah'] = $jenjangBreakdown;

            $deferredSalesLists = $this->deferDashboardTabLists([
                'listSekolah' => $listSekolah,
                'nonCoverSchools' => $nonCoverSchools,
                'kegiatanSales' => $kegiatanSales,
            ]);

            return \Inertia\Inertia::render('Monitoring/SalesPerformanceDetail', array_merge($data, [
                'kpiData' => $kpiData,
                'activeNav'    => 'sales-performance',
                'pageTitle'    => 'Sales Performance',
                'cabangName'   => strtoupper($sales->name),
                'areaName'     => strtoupper('Cabang ' . ($sales->cabang->nama_cabang ?? '-')),
                'description'  => 'Performa coverage dan opportunity.',
                'provinceCode' => $sales->cabang->area_id ?? null,
                'cabangCode'   => $sales->cabang_id,
                'areas'        => \App\Models\Area::orderBy('name')->get(),
                'cabangs'      => $cabangs,
                'top10Schools' => $top10Schools,
                'hideFilters'  => true,
                'isSalesDetail' => true,
                'backUrl'      => route('monitoring.sales-performance'),
                'isFromSalesPerformance' => true,
                'listKecamatan' => $listKecamatan,
                'visitCoverage' => $visitCoverage,
                'rencanaJualCoverage' => $rencanaJualCoverage,
                'jenjangBreakdown' => $jenjangBreakdown,
                'sumberDanaBreakdown' => $sumberDanaBreakdown,
                'gradeRealisasiBreakdown' => $gradeRealisasiBreakdown,
                'segmenBreakdown' => $segmenBreakdown,
                'siswaBreakdown' => $siswaBreakdown,
                'activityBreakdown' => $activityBreakdown,
                'resultBreakdown' => $resultBreakdown,
                'salesProfile' => $sales,
                'salesPerformanceFilterOptions' => $filterOptions,
                'salesPerformanceFilters' => $request->only(['area_id', 'cabang_id', 'sales_id', 'kecamatan', 'tahun', 'sumber_dana']),
                'filterOptions' => $filterOptions,
                'filters' => $request->only(['kecamatan', 'tahun', 'sumber_dana']),
                'insights' => [
                    'totalAreaCover' => $totalAreaCoverTargetYear,
                    'totalRealisasiTargetYear' => $totalRealisasiTargetYear ?? 0,
                    'totalRealisasiLaluTargetYear' => $totalRealisasiLaluTargetYear ?? 0,
                    'totalRencanaJualTargetYear' => $totalRencanaJualTargetYear ?? 0,
                    'customerWithRealisasi' => $customerWithRealisasi ?? 0,
                    'targetYear' => $targetYear,
                ],
            ], $deferredSalesLists));
        }

        // 1. Table Sales Summary
        $t1_sort = $request->input('t1_sort', 'name');
        $t1_dir = $request->input('t1_dir', 'asc');

        $salesQuery = \App\Models\Sales::query();
        if ($filterSales) {
            $salesQuery->where('id', $filterSales);
        }

        // Aggregates for volume performance
        $salesPlanAgg = \App\Models\SalesPlan::whereNull('jenjang')
            ->selectRaw('sales_id, SUM(real_exemplar) as real_eks, SUM(tahan_customer) as tahan, SUM(rebut_customer) as rebut')
            ->groupBy('sales_id')
            ->get()
            ->keyBy('sales_id');

        $targetAgg = \App\Models\SalesAreaCover::selectRaw('sales_id, SUM(target_exemplar) as target_eks')
            ->groupBy('sales_id')
            ->pluck('target_eks', 'sales_id');

        $salesDataCollection = $salesQuery->get()->map(function ($sales) use ($filterArea, $filterCabang, $filterKecamatan, $filterTahun, $targetAgg, $salesPlanAgg) {
            $customersQuery = \App\Models\Customer::where('sales_id', $sales->id);

            if ($filterArea) $customersQuery->where('area_id', $filterArea);
            if ($filterCabang) $customersQuery->where('cabang_id', $filterCabang);
            if ($filterKecamatan) $customersQuery->where('kecamatan_name', $filterKecamatan);
            if ($filterTahun) {
                $customersQuery->whereHas('customerPlans', function ($q) use ($filterTahun) {
                    $q->where('year', $filterTahun)->where('real_exemplar', '>', 0);
                });
            }
            $total_sekolah = (clone $customersQuery)->count();
            $aktif = (clone $customersQuery)->where('is_active', 1)->count();
            $coverage = $total_sekolah > 0 ? round(($aktif / $total_sekolah) * 100, 2) : 0;

            $status = 'Kurang';
            if ($coverage >= 70) {
                $status = 'Sangat Baik';
            } elseif ($coverage >= 40) {
                $status = 'Baik';
            }

            $target_eksemplar = $targetAgg[$sales->id] ?? 0;
            $planAgg = $salesPlanAgg->get($sales->id);
            $real_eksemplar = $planAgg ? $planAgg->real_eks : 0;
            $tahan = $planAgg ? $planAgg->tahan : 0;
            $rebut = $planAgg ? $planAgg->rebut : 0;
            $pencapaian = $target_eksemplar > 0 ? round(($real_eksemplar / $target_eksemplar) * 100, 2) : 0;

            return [
                'id' => $sales->id,
                'name' => $sales->name,
                'total_cabang' => (clone $customersQuery)->distinct('cabang_id')->count('cabang_id'),
                'total_kecamatan' => (clone $customersQuery)->whereNotNull('kecamatan_name')->distinct('kecamatan_name')->count('kecamatan_name'),
                'total_sekolah' => $total_sekolah,
                'aktif' => $aktif,
                'coverage' => $coverage,
                'target_eksemplar' => (int)$target_eksemplar,
                'real_eksemplar' => (int)$real_eksemplar,
                'pencapaian' => $pencapaian,
                'tahan' => (int)$tahan,
                'rebut' => (int)$rebut,
                'status' => $status
            ];
        });

        if ($t1_dir === 'desc') {
            $salesDataCollection = $salesDataCollection->sortByDesc($t1_sort)->values();
        } else {
            $salesDataCollection = $salesDataCollection->sortBy($t1_sort)->values();
        }

        $pageSales = request('sales_page', 1);
        $salesData = new \Illuminate\Pagination\LengthAwarePaginator(
            $salesDataCollection->forPage($pageSales, 15)->values(),
            $salesDataCollection->count(),
            15,
            $pageSales,
            ['path' => request()->url(), 'query' => request()->query(), 'pageName' => 'sales_page']
        );
        $salesData->onEachSide(1);

        // 2 & 3. Covered & No Covered Area
        $cabangsQuery = \App\Models\Cabang::query();
        if ($filterArea) {
            $cabangsQuery->where('area_id', $filterArea);
        }
        if ($filterCabang) {
            $cabangsQuery->where('id', $filterCabang);
        }

        $cabangs = $cabangsQuery->get()->map(function ($cabang) use ($filterKecamatan, $filterTahun) {
            $custQuery = \App\Models\Customer::where('cabang_id', $cabang->id);
            if ($filterKecamatan) $custQuery->where('kecamatan_name', $filterKecamatan);
            if ($filterTahun) {
                $custQuery->whereHas('customerPlans', function ($q) use ($filterTahun) {
                    $q->where('year', $filterTahun)->where('real_exemplar', '>', 0);
                });
            }

            $totalSekolah = (clone $custQuery)->count();
            $tercover = (clone $custQuery)->where('is_active', 1)->count();
            $persentase = $totalSekolah > 0 ? round(($tercover / $totalSekolah) * 100, 2) : 0;
            return [
                'id' => $cabang->id,
                'area_id' => $cabang->area_id,
                'name' => $cabang->nama_cabang,
                'total_sekolah' => $totalSekolah,
                'tercover' => $tercover,
                'belum_tercover' => $totalSekolah - $tercover,
                'persentase' => $persentase,
            ];
        });

        $t2_sort = $request->input('t2_sort', 'name');
        $t2_dir = $request->input('t2_dir', 'asc');
        $t3_sort = $request->input('t3_sort', 'name');
        $t3_dir = $request->input('t3_dir', 'asc');

        $coveredAreasCollection = $cabangs->where('tercover', '>', 0)->values();
        if ($t2_dir === 'desc') {
            $coveredAreasCollection = $coveredAreasCollection->sortByDesc($t2_sort)->values();
        } else {
            $coveredAreasCollection = $coveredAreasCollection->sortBy($t2_sort)->values();
        }

        $uncoveredAreasCollection = $cabangs->where('tercover', 0)->values();
        if ($t3_dir === 'desc') {
            $uncoveredAreasCollection = $uncoveredAreasCollection->sortByDesc($t3_sort)->values();
        } else {
            $uncoveredAreasCollection = $uncoveredAreasCollection->sortBy($t3_sort)->values();
        }

        $pageCovered = request('cov_page', 1);
        $coveredAreas = new \Illuminate\Pagination\LengthAwarePaginator(
            $coveredAreasCollection->forPage($pageCovered, 15)->values(),
            $coveredAreasCollection->count(),
            15,
            $pageCovered,
            ['path' => request()->url(), 'query' => request()->query(), 'pageName' => 'cov_page']
        );
        $coveredAreas->onEachSide(1);

        $pageUncovered = request('uncov_page', 1);
        $uncoveredAreas = new \Illuminate\Pagination\LengthAwarePaginator(
            $uncoveredAreasCollection->forPage($pageUncovered, 15)->values(),
            $uncoveredAreasCollection->count(),
            15,
            $pageUncovered,
            ['path' => request()->url(), 'query' => request()->query(), 'pageName' => 'uncov_page']
        );
        $uncoveredAreas->onEachSide(1);

        // 4. Sales Performance (Customer Plans / Realizations)
        $t4_sort = $request->input('t4_sort', 'name');
        $t4_dir = $request->input('t4_dir', 'asc');

        $customerQuery = \App\Models\Customer::with(['sales', 'customerPlans', 'cabang', 'area']);

        // Handle sorting for table 4
        if ($t4_sort === 'sales_name') {
            $customerQuery->leftJoin('sales', 'customers.sales_id', '=', 'sales.id')
                ->select('customers.*')
                ->orderBy('sales.name', $t4_dir);
        } else if ($t4_sort === 'cabang_name') {
            $customerQuery->leftJoin('cabangs', 'customers.cabang_id', '=', 'cabangs.id')
                ->select('customers.*')
                ->orderBy('cabangs.nama_cabang', $t4_dir);
        } else {
            // Default or name
            $customerQuery->orderBy('name', $t4_dir);
        }

        if ($filterArea) $customerQuery->where('customers.area_id', $filterArea);
        if ($filterCabang) $customerQuery->where('customers.cabang_id', $filterCabang);
        if ($filterSales) $customerQuery->where('customers.sales_id', $filterSales);
        if ($filterKecamatan) $customerQuery->where('customers.kecamatan_name', $filterKecamatan);
        if ($filterTahun) {
            $customerQuery->whereHas('customerPlans', function ($q) use ($filterTahun) {
                $q->where('year', $filterTahun)->where('real_exemplar', '>', 0);
            });
        }

        $searchCustomer = $request->input('search_customer');
        if ($searchCustomer) {
            $customerQuery->where('customers.name', 'like', "%{$searchCustomer}%");
        }

        $customerPerformance = $customerQuery->paginate(20, ['*'], 'cust_page')
            ->onEachSide(1)
            ->withQueryString()
            ->through(function ($customer) {
                // Determine checkmarks for years. We assume current year is 2026, so 2023-2026.
                $years = [2023, 2024, 2025, 2026];
                $yearChecks = [];
                foreach ($years as $year) {
                    $hasRealization = $customer->customerPlans->where('year', $year)->where('real_exemplar', '>', 0)->isNotEmpty();
                    $yearChecks[$year] = $hasRealization;
                }

                return [
                    'id' => $customer->id,
                    'customer_name' => $customer->name,
                    'sales_id' => $customer->sales_id,
                    'sales_name' => $customer->sales ? $customer->sales->name : '-',
                    'cabang_name' => $customer->cabang ? $customer->cabang->nama_cabang : '-',
                    'area_name' => $customer->area ? $customer->area->name : '-',
                    'kecamatan_name' => $customer->kecamatan_name ?: '-',
                    'years' => $yearChecks,
                ];
            });

        // 5. Calculate Insights for Decision Makers
        $topSales = $salesDataCollection->where('total_sekolah', '>=', 5)->sortByDesc('coverage')->first();
        if (!$topSales) $topSales = $salesDataCollection->sortByDesc('coverage')->first();

        $bottomSales = $salesDataCollection->where('total_sekolah', '>=', 5)->sortBy('coverage')->first();
        if (!$bottomSales) $bottomSales = $salesDataCollection->sortBy('coverage')->first();

        $topCabang = $cabangs->where('total_sekolah', '>=', 5)->sortByDesc('persentase')->first();
        if (!$topCabang) $topCabang = $cabangs->sortByDesc('persentase')->first();

        $oppCabang = $cabangs->sortByDesc('belum_tercover')->first();

        // Total Area Cover: jumlah sekolah yang memiliki sales_id dari filter
        $totalAreaCoverQuery = \App\Models\Customer::query();
        if ($filterSales) {
            $totalAreaCoverQuery->where('sales_id', $filterSales);
        } elseif ($filterCabang) {
            $totalAreaCoverQuery->where('cabang_id', $filterCabang);
        } elseif ($filterArea) {
            $totalAreaCoverQuery->where('area_id', $filterArea);
        }
        // Hanya hitung yang memiliki sales_id (area yang sudah di-cover)
        $totalAreaCoverQuery->whereNotNull('sales_id');
        if ($filterKecamatan) $totalAreaCoverQuery->where('kecamatan_name', $filterKecamatan);
        $totalAreaCover = $totalAreaCoverQuery->count();

        $insights = [
            'topSales' => $topSales,
            'bottomSales' => $bottomSales,
            'topCabang' => $topCabang,
            'oppCabang' => $oppCabang,
            'totalAreaCover' => $totalAreaCover,
        ];

        return \Inertia\Inertia::render('Monitoring/SalesPerformance', [
            'insights' => $insights,
            'salesData' => $salesData,
            'coveredAreas' => $coveredAreas,
            'uncoveredAreas' => $uncoveredAreas,
            'customerPerformance' => $customerPerformance,
            'filterOptions' => $filterOptions,
            'filters' => $request->only(['area_id', 'cabang_id', 'sales_id', 'kecamatan', 'tahun', 'search_customer', 't1_sort', 't1_dir', 't2_sort', 't2_dir', 't3_sort', 't3_dir', 't4_sort', 't4_dir']),
        ]);
    }

    /**
     * Direktori boundary GeoJSON. public_path() dipakai lebih dulu karena pada
     * hosting dengan docroot terpisah (public_html) base_path('public') tidak ada.
     */
    private function geojsonDir(): ?string
    {
        foreach ([public_path('geojson'), base_path('public/geojson')] as $dir) {
            if (is_dir($dir)) {
                return rtrim($dir, '/\\');
            }
        }

        return null;
    }

    /**
     * API endpoint: Return filtered GeoJSON for kecamatan choropleth map
     * Uses kecamatan-level boundaries (indonesia-kecamatan-*.json) when available.
     * Matching by nama + kabupaten/city_code (hindari bentrok nama sama beda kab, mis. Ciawi).
     */
    public function salesPerformanceGeoJson(\Illuminate\Http\Request $request)
    {
        $cacheKey = 'monitoring.geojson.v11.' . md5(json_encode([
            'sales_id' => $request->input('sales_id'),
            'cabang_id' => $request->input('cabang_id'),
            'area_id' => $request->input('area_id'),
            'level' => strtolower(trim((string) $request->input('level', 'kecamatan'))),
            'tahun' => $request->input('tahun'),
        ]));

        if ($cached = Cache::get($cacheKey)) {
            return response()->json($cached)
                ->header('Cache-Control', 'public, max-age=3600')
                ->header('X-Monitoring-Geojson-Cache', 'HIT');
        }

        $response = $this->buildSalesPerformanceGeoJsonResponse($request);
        $payload = json_decode($response->getContent(), true);
        if (is_array($payload)) {
            Cache::put($cacheKey, $payload, now()->addHours(6));
        }

        return response($response->getContent(), $response->getStatusCode(), [
            'Content-Type' => 'application/json',
            'Cache-Control' => 'public, max-age=3600',
            'X-Monitoring-Geojson-Cache' => 'MISS',
        ]);
    }

    private function buildSalesPerformanceGeoJsonResponse(\Illuminate\Http\Request $request)
    {
        // Parsing boundary 3–4 MB butuh ruang lebih dari default shared hosting.
        @ini_set('memory_limit', '512M');
        @set_time_limit(120);

        $salesId = $request->input('sales_id');
        $cabangId = $request->input('cabang_id');
        $areaId = $request->input('area_id');
        $level = strtolower(trim((string) $request->input('level', 'kecamatan')));

        // Mode area (tanpa cabang): polygon per kota/kab
        // Mode cabang: default kecamatan (lihat di bawah); level=kota tetap support via buildCabangKotaGeoJson
        if ($level === 'kota' && !$salesId && ($cabangId || $areaId)) {
            $cfgYears = \App\Models\Configuration::query()->first(['target_year']);
            $planYear = (int) ($request->input('tahun') ?: ($cfgYears->target_year ?? date('Y')));

            return $this->buildCabangKotaGeoJson(
                $cabangId ? (int) $cabangId : null,
                $planYear,
                $areaId ? (int) $areaId : null,
            );
        }

        // Butuh sales_id atau cabang_id untuk peta kecamatan
        if (!$salesId && !$cabangId) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $activeCabangId = $cabangId ? (int) $cabangId : null;
        if ($salesId) {
            $sales = \App\Models\Sales::with('cabang')->find($salesId);
            if (!$sales) {
                return response()->json(['type' => 'FeatureCollection', 'features' => []]);
            }
            $activeCabangId = $activeCabangId ?: (int) $sales->cabang_id;
        }

        if (!$activeCabangId) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $normalizeKec = function ($name) {
            $n = mb_strtolower(trim((string) $name));
            if ($n === '') {
                return '';
            }
            $parts = array_map('trim', explode(',', $n));
            $base = $parts[0] ?? $n;
            $base = preg_replace('/^(kec\.?\s*|kecamatan\s+)/u', '', $base);
            $base = preg_replace('/\s+/u', ' ', $base);
            return trim($base);
        };

        $normalizeKab = function ($kabRaw) {
            $k = mb_strtolower(trim((string) $kabRaw));
            $k = preg_replace('/\s+/u', ' ', $k);
            return trim($k);
        };

        $cities = \DB::table('cities')->get(['city_code', 'city_name']);
        $cityByName = [];
        foreach ($cities as $city) {
            $cityByName[$normalizeKab($city->city_name)] = (int) $city->city_code;
        }

        $kodeToCityCode = function ($kode) {
            // "32.01.24" → 3201 ; "32.71.03" → 3271
            $parts = explode('.', (string) $kode);
            if (count($parts) < 2) {
                return null;
            }
            return (int) ($parts[0] . str_pad($parts[1], 2, '0', STR_PAD_LEFT));
        };

        $resolveCityCode = function ($kecamatanName) use ($normalizeKec, $normalizeKab, $cityByName, $activeCabangId) {
            $full = trim((string) $kecamatanName);
            $parts = array_map('trim', explode(',', $full));
            $base = $normalizeKec($parts[0] ?? $full);
            $kabPart = $normalizeKab($parts[1] ?? '');

            if ($kabPart !== '' && isset($cityByName[$kabPart])) {
                return [$base, $cityByName[$kabPart]];
            }

            if ($base !== '') {
                $kecRow = \DB::table('kecamatans')
                    ->whereRaw('LOWER(camat_name) = ?', [$base])
                    ->when($activeCabangId, function ($q) use ($activeCabangId) {
                        $q->where('cabang_id', $activeCabangId);
                    })
                    ->first();
                if ($kecRow && $kecRow->city_code) {
                    return [$base, (int) $kecRow->city_code];
                }

                $candidates = \DB::table('kecamatans')
                    ->whereRaw('LOWER(camat_name) = ?', [$base])
                    ->pluck('city_code')
                    ->unique()
                    ->values();
                if ($candidates->count() === 1) {
                    return [$base, (int) $candidates->first()];
                }
            }

            return [$base, null];
        };

        $cfgYears = \App\Models\Configuration::query()->first(['target_year']);
        $planYear = (int) ($request->input('tahun') ?: ($cfgYears->target_year ?? date('Y')));

        $customers = \App\Models\Customer::query()
            ->when($salesId, fn ($q) => $q->where('sales_id', $salesId))
            ->where('cabang_id', $activeCabangId)
            ->whereNotNull('kecamatan_name')
            ->get(['id', 'kecamatan_name', 'is_active', 'total_student', 'penerbit', 'jenjang', 'sumber_dana']);

        $plansByCustomer = collect();
        if ($customers->isNotEmpty()) {
            $plansByCustomer = \DB::table('customer_plans')
                ->whereIn('customer_id', $customers->pluck('id'))
                ->where('year', $planYear)
                ->groupBy('customer_id')
                ->selectRaw('customer_id, SUM(real_exemplar) as real_eks, SUM(sp_exemplar) as sp_eks, SUM(potential_exemplar) as pot_eks, MAX(is_ac) as is_ac')
                ->get()
                ->keyBy('customer_id');
        }

        $sortJenjangBreakdown = static function (array $jenjangBreakdown): array {
            $order = ['SD' => 1, 'SMP' => 2, 'SMA' => 3, 'SMK' => 4, 'DLL' => 5];
            uksort($jenjangBreakdown, static function ($a, $b) use ($order) {
                return ($order[$a] ?? 99) <=> ($order[$b] ?? 99) ?: strcmp($a, $b);
            });

            return $jenjangBreakdown;
        };

        $kecamatanData = $customers
            ->groupBy(function ($c) use ($resolveCityCode) {
                [$base, $cityCode] = $resolveCityCode($c->kecamatan_name);
                if ($base === '') {
                    return '';
                }
                return $base . '|' . ($cityCode ?: 'x');
            })
            ->filter(function ($_, $key) {
                return $key !== '';
            })
            ->map(function ($group) use ($resolveCityCode, $plansByCustomer, $sortJenjangBreakdown) {
                $compCounts = [];
                $areaCover = 0;
                $sekolahRealisasi = 0;
                $realEksemplar = 0;
                $spEksemplar = 0;
                $potensiEksemplar = 0;
                $sekolahBos = 0;
                $sekolahSwadana = 0;
                $jenjangBreakdown = [];

                foreach ($group as $c) {
                    $p = $c->penerbit ?: 'Tidak Diketahui';
                    $compCounts[$p] = ($compCounts[$p] ?? 0) + 1;

                    $plan = $plansByCustomer->get($c->id);
                    $isAc = $plan && (int) ($plan->is_ac ?? 0) === 1;
                    if ($plan) {
                        $realEks = (int) ($plan->real_eks ?? 0);
                        $spEks = (int) ($plan->sp_eks ?? 0);
                        $potEks = (int) round((float) ($plan->pot_eks ?? 0));
                        $realEksemplar += $realEks;
                        $spEksemplar += $spEks;
                        $potensiEksemplar += $potEks;
                        if ($isAc) {
                            $areaCover++;
                        }
                        if ($realEks > 0) {
                            $sekolahRealisasi++;
                        }
                    }

                    // Analisa sumber dana & jenjang berbasis Area Cover
                    if ($isAc) {
                        $sd = strtoupper(trim((string) ($c->sumber_dana ?? '')));
                        if (str_contains($sd, 'BOS')) {
                            $sekolahBos++;
                        } elseif (str_contains($sd, 'SWA')) {
                            $sekolahSwadana++;
                        }
                        $j = strtoupper(trim((string) ($c->jenjang ?? ''))) ?: 'Lainnya';
                        $jenjangBreakdown[$j] = ($jenjangBreakdown[$j] ?? 0) + 1;
                    }
                }
                arsort($compCounts);
                $dominantComp = array_key_first($compCounts);
                [$base, $cityCode] = $resolveCityCode($group->first()->kecamatan_name);

                return (object) [
                    'kecamatan_name' => $group->first()->kecamatan_name,
                    'base_name' => $base,
                    'city_code' => $cityCode,
                    'total_sekolah' => $group->count(),
                    'sekolah_aktif' => $group->where('is_active', 1)->count(),
                    'area_cover' => $areaCover,
                    'sekolah_realisasi' => $sekolahRealisasi,
                    'real_exemplar' => $realEksemplar,
                    'sp_exemplar' => $spEksemplar,
                    'potensi_exemplar' => $potensiEksemplar,
                    'sekolah_bos' => $sekolahBos,
                    'sekolah_swadana' => $sekolahSwadana,
                    'jenjang_breakdown' => $sortJenjangBreakdown($jenjangBreakdown),
                    'coverage_pct' => 0, // dihitung ulang vs total AC scope
                    'tahun' => null, // diisi saat append
                    'potensi_siswa' => $group->sum('total_student'),
                    'dominant_competitor' => $dominantComp,
                    'competitors' => $compCounts,
                ];
            });

        // Hanya kecamatan yang punya Area Cover (base data sales)
        $kecamatanData = $kecamatanData
            ->filter(fn ($r) => (int) ($r->area_cover ?? 0) > 0);

        // Share AC per kecamatan terhadap total AC di scope (sales/cabang/area)
        $totalAcScope = (int) $kecamatanData->sum(fn ($r) => (int) ($r->area_cover ?? 0));
        $kecamatanData = $kecamatanData->map(function ($row) use ($totalAcScope) {
            $ac = (int) ($row->area_cover ?? 0);
            $row->coverage_pct = $totalAcScope > 0
                ? (int) round(($ac / $totalAcScope) * 100)
                : 0;
            $row->total_area_cover = $totalAcScope;

            return $row;
        });

        // tempel tahun ke tiap row
        $kecamatanData = $kecamatanData->map(function ($row) use ($planYear) {
            $row->tahun = $planYear;
            return $row;
        });

        if ($kecamatanData->isEmpty()) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
                'meta' => ['kecamatan_count' => 0, 'matched' => 0],
            ]);
        }

        $cityNameByCode = [];
        foreach ($cities as $city) {
            $cityNameByCode[(int) $city->city_code] = $city->city_name;
        }

        $mergedFeatures = [];
        $processedKec = [];
        $osmMatched = 0;
        $localMatched = 0;

        // Alias nama umum (DB vs OSM)
        $aliasKec = function (string $name) use ($normalizeKec) {
            $n = $normalizeKec($name);
            $aliases = [
                'tanah sereal' => 'tanah sareal',
                'tanahsereal' => 'tanahsareal',
                'bojonggede' => 'bojong gede',
                'tajurhalang' => 'tajurhalang',
                'tajur halang' => 'tajurhalang',
            ];
            return $aliases[$n] ?? $n;
        };
        $compactKec = function (string $name) use ($aliasKec) {
            return str_replace(' ', '', $aliasKec($name));
        };
        $kabCore = function (?string $kab) {
            $k = mb_strtolower(trim((string) $kab));
            $k = preg_replace('/^(kabupaten|kota|kab\.?|regency)\s+/u', '', $k);
            return trim(preg_replace('/\s+/u', ' ', $k));
        };

        $appendMatchedFeature = function (
            string $kecKey,
            array $geometry,
            array $props,
            string $source
        ) use (
            &$mergedFeatures,
            &$processedKec,
            &$osmMatched,
            &$localMatched,
            $kecamatanData
        ) {
            if (in_array($kecKey, $processedKec, true)) {
                return;
            }
            $coverageInfo = $kecamatanData->get($kecKey);
            if (!$coverageInfo) {
                return;
            }

            $coords = [];
            if (($geometry['type'] ?? '') === 'Polygon') {
                $coords[] = $geometry['coordinates'];
            } elseif (($geometry['type'] ?? '') === 'MultiPolygon') {
                foreach ($geometry['coordinates'] as $poly) {
                    $coords[] = $poly;
                }
            }
            if (empty($coords)) {
                return;
            }

            $expectedCity = $coverageInfo->city_code ?? null;
            $filtered = [];
            foreach ($coords as $poly) {
                $pt = $poly[0][0] ?? null;
                $lng = is_array($pt) ? (float) $pt[0] : null;
                if ($expectedCity && in_array((int) $expectedCity, [3201, 3271], true) && $lng !== null && $lng > 107.45) {
                    continue;
                }
                $filtered[] = $poly;
            }
            if (empty($filtered)) {
                return;
            }

            $totalSekolah = $coverageInfo->total_sekolah ?? 0;
            $sekolahAktif = $coverageInfo->sekolah_aktif ?? 0;
            $areaCover = (int) ($coverageInfo->area_cover ?? 0);
            $sekolahRealisasi = (int) ($coverageInfo->sekolah_realisasi ?? 0);
            $realExemplar = (int) ($coverageInfo->real_exemplar ?? 0);
            $spExemplar = (int) ($coverageInfo->sp_exemplar ?? 0);
            $potensiExemplar = (int) ($coverageInfo->potensi_exemplar ?? 0);
            $sekolahBos = (int) ($coverageInfo->sekolah_bos ?? 0);
            $sekolahSwadana = (int) ($coverageInfo->sekolah_swadana ?? 0);
            $jenjangBreakdown = $coverageInfo->jenjang_breakdown ?? [];
            $belumTercover = max(0, $totalSekolah - $sekolahAktif);
            $potensiSiswa = $coverageInfo->potensi_siswa ?? 0;
            $coveragePct = (int) ($coverageInfo->coverage_pct ?? 0);

            $processedKec[] = $kecKey;
            if ($source === 'osm') {
                $osmMatched++;
            } else {
                $localMatched++;
            }

            $mergedFeatures[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'MultiPolygon',
                    'coordinates' => $filtered,
                ],
                'properties' => [
                    'kecamatan_name' => $coverageInfo->kecamatan_name,
                    'kabupaten' => $props['WADMKK'] ?? $props['kabupaten'] ?? '',
                    'provinsi' => $props['WADMPR'] ?? 'Jawa Barat',
                    'city_code' => $coverageInfo->city_code,
                    'kode' => $props['kode'] ?? null,
                    'boundary_source' => $source,
                    'tahun' => $coverageInfo->tahun ?? null,
                    'total_sekolah' => $totalSekolah,
                    'sekolah_aktif' => $sekolahAktif,
                    'area_cover' => $areaCover,
                    'sekolah_realisasi' => $sekolahRealisasi,
                    'real_exemplar' => $realExemplar,
                    'sp_exemplar' => $spExemplar,
                    'potensi_exemplar' => $potensiExemplar,
                    'sekolah_bos' => $sekolahBos,
                    'sekolah_swadana' => $sekolahSwadana,
                    'jenjang_breakdown' => $jenjangBreakdown,
                    'belum_tercover' => $belumTercover,
                    'potensi_siswa' => $potensiSiswa,
                    'coverage_pct' => $coveragePct,
                    'total_area_cover' => (int) ($coverageInfo->total_area_cover ?? 0),
                    'dominant_competitor' => $coverageInfo->dominant_competitor ?? 'Tidak Diketahui',
                    'competitors' => $coverageInfo->competitors ?? [],
                    'is_sales_coverage' => true,
                ],
            ];
        };

        $buildLookup = function () use ($kecamatanData, $processedKec, $aliasKec, $compactKec, $kabCore, $cityNameByCode) {
            $lookup = [];
            foreach ($kecamatanData as $key => $info) {
                if (in_array($key, $processedKec, true)) {
                    continue;
                }
                $base = $aliasKec($info->base_name ?? '');
                $compact = $compactKec($info->base_name ?? '');
                if ($info->city_code) {
                    $lookup[$base . '|' . $info->city_code] = $key;
                    $lookup[$compact . '|' . $info->city_code] = $key;
                    $kabLabel = $cityNameByCode[(int) $info->city_code] ?? '';
                    $core = $kabCore($kabLabel);
                    if ($core !== '') {
                        $lookup[$base . '|kab:' . $core] = $key;
                        $lookup[$compact . '|kab:' . $core] = $key;
                    }
                }
            }
            return $lookup;
        };

        $matchFromFiles = function (array $files, string $source) use (
            $buildLookup,
            $normalizeKec,
            $aliasKec,
            $compactKec,
            $kabCore,
            $kodeToCityCode,
            $appendMatchedFeature,
            &$processedKec
        ) {
            $lookup = $buildLookup();
            if (empty($lookup)) {
                return;
            }

            foreach ($files as $file) {
                $geojson = json_decode(file_get_contents($file), true);
                if (!$geojson) {
                    continue;
                }
                $fileFeatures = $geojson['features'] ?? (isset($geojson[0]['type']) ? $geojson : []);
                foreach ($fileFeatures as $feature) {
                    if (!isset($feature['geometry'])) {
                        continue;
                    }
                    $props = $feature['properties'] ?? [];
                    $rawName = $props['WADMKC'] ?? $props['nama'] ?? $props['NAMOBJ'] ?? $props['name'] ?? '';
                    $wadmkc = $aliasKec($rawName);
                    if ($wadmkc === '') {
                        continue;
                    }
                    $compact = $compactKec($rawName);
                    $geoCity = !empty($props['kode']) ? $kodeToCityCode($props['kode']) : null;
                    $geoKab = $kabCore($props['WADMKK'] ?? $props['kabupaten'] ?? '');

                    $canonical = null;
                    if ($geoCity) {
                        $canonical = $lookup[$wadmkc . '|' . $geoCity]
                            ?? $lookup[$compact . '|' . $geoCity]
                            ?? null;
                    }
                    if (!$canonical && $geoKab !== '') {
                        $canonical = $lookup[$wadmkc . '|kab:' . $geoKab]
                            ?? $lookup[$compact . '|kab:' . $geoKab]
                            ?? null;
                    }
                    // OSM tanpa kode: izinkan match nama jika unik di lookup untuk city coverage
                    if (!$canonical && $source === 'osm') {
                        $candidates = [];
                        foreach ($lookup as $lk => $kecKey) {
                            if (str_starts_with($lk, $wadmkc . '|') || str_starts_with($lk, $compact . '|')) {
                                $candidates[$kecKey] = true;
                            }
                        }
                        if (count($candidates) === 1) {
                            $canonical = array_key_first($candidates);
                        }
                    }
                    if (!$canonical) {
                        continue;
                    }

                    $appendMatchedFeature($canonical, $feature['geometry'], $props, $source);
                    // refresh lookup setelah match agar nama kembar tidak double-assign
                    $lookup = $buildLookup();
                    if (empty($lookup)) {
                        unset($geojson, $fileFeatures);

                        return;
                    }
                }
                unset($geojson, $fileFeatures);
            }
        };

        // 1) Prioritas: polygon OSM (selaras garis batas basemap Leaflet/Carto)
        $geoDir = $this->geojsonDir();
        $osmFiles = [];
        $localFiles = [];

        if ($geoDir) {
            $osmFiles = array_values(array_filter(
                glob($geoDir . '/indonesia-kecamatan*-osm-*.json') ?: [],
                fn ($f) => filesize($f) > 1000
            ));
            // juga tangkap pola indonesia-kecamatan-osm-32.json
            foreach (glob($geoDir . '/indonesia-kecamatan-osm*.json') ?: [] as $f) {
                if (filesize($f) > 1000 && !in_array($f, $osmFiles, true)) {
                    $osmFiles[] = $f;
                }
            }

            // 2) Fallback Kepmendagri / lokal non-OSM
            $localFiles = array_values(array_filter(
                glob($geoDir . '/indonesia-kecamatan*.json') ?: [],
                fn ($f) => !str_contains(basename($f), '-osm') && filesize($f) > 1000
            ));
            if (empty($localFiles) && file_exists($geoDir . '/indonesia-districts.json')) {
                $localFiles = [$geoDir . '/indonesia-districts.json'];
            }
        }

        if (!empty($osmFiles)) {
            $matchFromFiles($osmFiles, 'osm');
        }
        if (!empty($localFiles)) {
            $matchFromFiles($localFiles, 'local');
        }
        // Kecamatan tanpa polygon boundary tidak ditampilkan sebagai marker Point

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $mergedFeatures,
            'meta' => [
                'kecamatan_count' => $kecamatanData->count(),
                'matched' => count($processedKec),
                'version' => 7,
                'tahun' => $planYear,
                'osm_matched' => $osmMatched,
                'local_matched' => $localMatched,
                'boundary_dir' => $geoDir,
                'boundary_files' => count($osmFiles) + count($localFiles),
            ],
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
          ->header('Pragma', 'no-cache');
    }

    /**
     * GeoJSON choropleth per kota/kab untuk dashboard cabang.
     * Boundary = polygon utuh kabupaten/kota (indonesia-kabupaten.json).
     */
    private function buildCabangKotaGeoJson(?int $cabangId, int $planYear, ?int $areaId = null)
    {
        $normalizeKec = function ($name) {
            $n = mb_strtolower(trim((string) $name));
            if ($n === '') {
                return '';
            }
            $parts = array_map('trim', explode(',', $n));
            $base = $parts[0] ?? $n;
            $base = preg_replace('/^(kec\.?\s*|kecamatan\s+)/u', '', $base);
            $base = preg_replace('/\s+/u', ' ', $base);

            return trim($base);
        };

        $normalizeKab = function ($kabRaw) {
            $k = mb_strtolower(trim((string) $kabRaw));
            $k = preg_replace('/\s+/u', ' ', $k);

            return trim($k);
        };

        $aliasKec = function (string $name) use ($normalizeKec) {
            $n = $normalizeKec($name);
            $aliases = [
                'tanah sereal' => 'tanah sareal',
                'tanahsereal' => 'tanahsareal',
                'bojonggede' => 'bojong gede',
                'tajurhalang' => 'tajurhalang',
                'tajur halang' => 'tajurhalang',
                'pelabuhan ratu' => 'palabuhanratu',
                'palabuhan ratu' => 'palabuhanratu',
                'bojongpicung' => 'bojong picung',
            ];

            return $aliases[$n] ?? $n;
        };

        $compactKec = function (string $name) use ($aliasKec) {
            return str_replace(' ', '', $aliasKec($name));
        };

        $cities = \DB::table('cities')->get(['city_code', 'city_name']);
        $cityByName = [];
        $cityNameByCode = [];
        foreach ($cities as $city) {
            $cityByName[$normalizeKab($city->city_name)] = (int) $city->city_code;
            $cityNameByCode[(int) $city->city_code] = $city->city_name;
        }

        $resolveCityCode = function ($kecamatanName, $customerCabangId = null) use ($normalizeKec, $normalizeKab, $cityByName, $cabangId) {
            $full = trim((string) $kecamatanName);
            $parts = array_map('trim', explode(',', $full));
            $base = $normalizeKec($parts[0] ?? $full);
            $kabPart = $normalizeKab($parts[1] ?? '');

            if ($kabPart !== '' && isset($cityByName[$kabPart])) {
                return [$base, $cityByName[$kabPart]];
            }

            $cid = $customerCabangId ?: $cabangId;
            if ($base !== '' && $cid) {
                $kecRow = \DB::table('kecamatans')
                    ->whereRaw('LOWER(camat_name) = ?', [$base])
                    ->where('cabang_id', $cid)
                    ->first();
                if ($kecRow && $kecRow->city_code) {
                    return [$base, (int) $kecRow->city_code];
                }
            }

            return [$base, null];
        };

        $customerQuery = \App\Models\Customer::whereNotNull('kecamatan_name');
        if ($cabangId) {
            $customerQuery->where('cabang_id', $cabangId);
        } elseif ($areaId) {
            $customerQuery->where('area_id', $areaId);
        } else {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
                'meta' => ['level' => 'kota', 'kota_count' => 0, 'matched' => 0, 'tahun' => $planYear],
            ]);
        }

        $customers = $customerQuery->get(['id', 'kecamatan_name', 'is_active', 'total_student', 'penerbit', 'cabang_id', 'jenjang', 'sumber_dana']);

        if ($customers->isEmpty()) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
                'meta' => ['level' => 'kota', 'kota_count' => 0, 'matched' => 0, 'tahun' => $planYear],
            ]);
        }

        $plansByCustomer = \DB::table('customer_plans')
            ->whereIn('customer_id', $customers->pluck('id'))
            ->where('year', $planYear)
            ->groupBy('customer_id')
            ->selectRaw('customer_id, SUM(real_exemplar) as real_eks, SUM(sp_exemplar) as sp_eks, SUM(potential_exemplar) as pot_eks, MAX(is_ac) as is_ac')
            ->get()
            ->keyBy('customer_id');

        $sortJenjangBreakdown = static function (array $jenjangBreakdown): array {
            $order = ['SD' => 1, 'SMP' => 2, 'SMA' => 3, 'SMK' => 4, 'DLL' => 5];
            uksort($jenjangBreakdown, static function ($a, $b) use ($order) {
                return ($order[$a] ?? 99) <=> ($order[$b] ?? 99) ?: strcmp($a, $b);
            });

            return $jenjangBreakdown;
        };

        $kotaData = $customers
            ->groupBy(function ($c) use ($resolveCityCode) {
                [, $cityCode] = $resolveCityCode($c->kecamatan_name, $c->cabang_id ?? null);

                return $cityCode ?: '';
            })
            ->filter(function ($_, $key) {
                return $key !== '';
            })
            ->map(function ($group, $cityCode) use ($plansByCustomer, $cityNameByCode, $planYear, $sortJenjangBreakdown) {
                $compCounts = [];
                $areaCover = 0;
                $sekolahRealisasi = 0;
                $realEksemplar = 0;
                $spEksemplar = 0;
                $potensiEksemplar = 0;
                $sekolahBos = 0;
                $sekolahSwadana = 0;
                $jenjangBreakdown = [];

                foreach ($group as $c) {
                    $p = $c->penerbit ?: 'Tidak Diketahui';
                    $compCounts[$p] = ($compCounts[$p] ?? 0) + 1;

                    $plan = $plansByCustomer->get($c->id);
                    $isAc = $plan && (int) ($plan->is_ac ?? 0) === 1;
                    if ($plan) {
                        $realEks = (int) ($plan->real_eks ?? 0);
                        $spEks = (int) ($plan->sp_eks ?? 0);
                        $potEks = (int) round((float) ($plan->pot_eks ?? 0));
                        $realEksemplar += $realEks;
                        $spEksemplar += $spEks;
                        $potensiEksemplar += $potEks;
                        if ($isAc) {
                            $areaCover++;
                        }
                        if ($realEks > 0) {
                            $sekolahRealisasi++;
                        }
                    }

                    if ($isAc) {
                        $sd = strtoupper(trim((string) ($c->sumber_dana ?? '')));
                        if (str_contains($sd, 'BOS')) {
                            $sekolahBos++;
                        } elseif (str_contains($sd, 'SWA')) {
                            $sekolahSwadana++;
                        }
                        $j = strtoupper(trim((string) ($c->jenjang ?? ''))) ?: 'Lainnya';
                        $jenjangBreakdown[$j] = ($jenjangBreakdown[$j] ?? 0) + 1;
                    }
                }
                arsort($compCounts);
                $dominantComp = array_key_first($compCounts);
                $cc = (int) $cityCode;

                return (object) [
                    'city_code' => $cc,
                    'kota_name' => $cityNameByCode[$cc] ?? ('Kota/Kab ' . $cc),
                    'total_sekolah' => $group->count(),
                    'sekolah_aktif' => $group->where('is_active', 1)->count(),
                    'area_cover' => $areaCover,
                    'sekolah_realisasi' => $sekolahRealisasi,
                    'real_exemplar' => $realEksemplar,
                    'sp_exemplar' => $spEksemplar,
                    'potensi_exemplar' => $potensiEksemplar,
                    'sekolah_bos' => $sekolahBos,
                    'sekolah_swadana' => $sekolahSwadana,
                    'jenjang_breakdown' => $sortJenjangBreakdown($jenjangBreakdown),
                    'coverage_pct' => 0,
                    'tahun' => $planYear,
                    'potensi_siswa' => $group->sum('total_student'),
                    'dominant_competitor' => $dominantComp,
                    'competitors' => $compCounts,
                ];
            });

        // Hanya kota/kab yang punya Area Cover
        $kotaData = $kotaData->filter(fn ($r) => (int) ($r->area_cover ?? 0) > 0);

        $totalAcKotaScope = (int) $kotaData->sum(fn ($r) => (int) ($r->area_cover ?? 0));
        $kotaData = $kotaData->map(function ($row) use ($totalAcKotaScope) {
            $ac = (int) ($row->area_cover ?? 0);
            $row->coverage_pct = $totalAcKotaScope > 0
                ? (int) round(($ac / $totalAcKotaScope) * 100)
                : 0;
            $row->total_area_cover = $totalAcKotaScope;

            return $row;
        });

        // Boundary utuh per kota/kab (bukan merge kecamatan)
        $kabCore = function (?string $name) {
            $k = mb_strtolower(trim((string) $name));
            $k = preg_replace('/^(kabupaten|kota|kotamadya|kab\.?|kota\s+adm\.?)\s+/u', '', $k);
            $k = preg_replace('/\s+/u', ' ', $k);

            return trim($k);
        };

        $isKotaLabel = function (?string $name) {
            $n = mb_strtolower(trim((string) $name));

            return (bool) preg_match('/^(kota|kotamadya)\b/u', $n);
        };

        $geoDir = $this->geojsonDir();
        $kabFile = $geoDir ? $geoDir . '/indonesia-kabupaten.json' : '';
        $kabIndex = []; // key: "kota:bogor" | "kab:bogor" => geometry
        if ($kabFile !== '' && is_file($kabFile) && filesize($kabFile) > 1000) {
            $kabGeo = json_decode(file_get_contents($kabFile), true);
            foreach (($kabGeo['features'] ?? []) as $feature) {
                if (!isset($feature['geometry'])) {
                    continue;
                }
                $props = $feature['properties'] ?? [];
                $rawName = $props['NAME_2'] ?? $props['name'] ?? $props['NAMOBJ'] ?? $props['kabupaten'] ?? '';
                $type2 = mb_strtolower((string) ($props['TYPE_2'] ?? $props['ENGTYPE_2'] ?? ''));
                $core = $kabCore($rawName);
                if ($core === '') {
                    continue;
                }
                $isKota = $isKotaLabel($rawName)
                    || str_contains($type2, 'kota')
                    || str_contains($type2, 'municipality');
                $key = ($isKota ? 'kota:' : 'kab:') . $core;
                $kabIndex[$key] = $feature['geometry'];
                // Juga index nama penuh "kota bogor"
                $full = $kabCore($isKota ? ('kota ' . $core) : $core);
                if ($full !== '' && $full !== $core) {
                    $kabIndex[($isKota ? 'kota:' : 'kab:') . $full] = $feature['geometry'];
                }
            }
            unset($kabGeo);
        }

        $mergedFeatures = [];
        $matchedKota = 0;

        foreach ($kotaData as $info) {
            $cityCode = (int) $info->city_code;
            $kotaName = (string) $info->kota_name;
            $core = $kabCore($kotaName);
            $wantKota = $isKotaLabel($kotaName) || in_array($cityCode, [3271, 3272], true);
            $geometry = null;

            if ($wantKota) {
                $geometry = $kabIndex['kota:' . $core]
                    ?? $kabIndex['kota:kota ' . $core]
                    ?? null;
            } else {
                $geometry = $kabIndex['kab:' . $core] ?? null;
            }

            // Fallback: coba kedua tipe jika unique core
            if (!$geometry && $core !== '') {
                $kotaGeom = $kabIndex['kota:' . $core] ?? null;
                $kabGeom = $kabIndex['kab:' . $core] ?? null;
                if ($kotaGeom && !$kabGeom) {
                    $geometry = $kotaGeom;
                } elseif ($kabGeom && !$kotaGeom) {
                    $geometry = $kabGeom;
                } elseif ($wantKota && $kotaGeom) {
                    $geometry = $kotaGeom;
                } elseif (!$wantKota && $kabGeom) {
                    $geometry = $kabGeom;
                }
            }

            if (!$geometry) {
                continue;
            }

            $coords = [];
            if (($geometry['type'] ?? '') === 'Polygon') {
                $coords[] = $geometry['coordinates'];
            } elseif (($geometry['type'] ?? '') === 'MultiPolygon') {
                foreach ($geometry['coordinates'] as $poly) {
                    $coords[] = $poly;
                }
            }
            if (empty($coords)) {
                continue;
            }

            $matchedKota++;
            $totalSekolah = (int) ($info->total_sekolah ?? 0);
            $sekolahAktif = (int) ($info->sekolah_aktif ?? 0);

            $mergedFeatures[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'MultiPolygon',
                    'coordinates' => $coords,
                ],
                'properties' => [
                    'kecamatan_name' => $info->kota_name,
                    'kota_name' => $info->kota_name,
                    'kabupaten' => $info->kota_name,
                    'provinsi' => 'Jawa Barat',
                    'city_code' => $cityCode,
                    'level' => 'kota',
                    'boundary_source' => 'kabupaten',
                    'tahun' => $info->tahun,
                    'total_sekolah' => $totalSekolah,
                    'sekolah_aktif' => $sekolahAktif,
                    'area_cover' => (int) $info->area_cover,
                    'sekolah_realisasi' => (int) $info->sekolah_realisasi,
                    'real_exemplar' => (int) $info->real_exemplar,
                    'sp_exemplar' => (int) $info->sp_exemplar,
                    'potensi_exemplar' => (int) ($info->potensi_exemplar ?? 0),
                    'sekolah_bos' => (int) ($info->sekolah_bos ?? 0),
                    'sekolah_swadana' => (int) ($info->sekolah_swadana ?? 0),
                    'jenjang_breakdown' => $info->jenjang_breakdown ?? [],
                    'belum_tercover' => max(0, $totalSekolah - $sekolahAktif),
                    'potensi_siswa' => (int) $info->potensi_siswa,
                    'coverage_pct' => (int) $info->coverage_pct,
                    'total_area_cover' => (int) ($info->total_area_cover ?? 0),
                    'dominant_competitor' => $info->dominant_competitor ?? 'Tidak Diketahui',
                    'competitors' => $info->competitors ?? [],
                    'is_sales_coverage' => true,
                ],
            ];
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $mergedFeatures,
            'meta' => [
                'level' => 'kota',
                'kota_count' => $kotaData->count(),
                'kecamatan_count' => $kotaData->count(),
                'matched' => $matchedKota,
                'tahun' => $planYear,
                'version' => 9,
                'boundary' => 'kabupaten',
                'boundary_dir' => $geoDir,
                'boundary_files' => (is_string($kabFile) && $kabFile !== '' && is_file($kabFile)) ? 1 : 0,
            ],
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
          ->header('Pragma', 'no-cache');
    }

    /**
     * Report: daftar sales beserta KPI score (sama rumus dengan Sales Performance detail).
     */
    public function report(\Illuminate\Http\Request $request)
    {
        $year = (int) ($request->input('tahun') ?: date('Y'));
        $rows = $this->buildReportRows($request, $year);

        $page = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        $perPage = 20;
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $rows->slice(($page - 1) * $perPage, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            [
                'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
                'query' => $request->query(),
            ]
        );

        $avgScore = $rows->count() > 0
            ? round($rows->avg('total_score'), 1)
            : 0;

        return \Inertia\Inertia::render('Monitoring/Report', [
            'reportData' => $paginated,
            'summary' => [
                'total_sales' => $rows->count(),
                'avg_score' => $avgScore,
                'sangat_baik' => $rows->where('grade', 'Sangat Baik')->count(),
                'baik' => $rows->where('grade', 'Baik')->count(),
                'cukup' => $rows->where('grade', 'Cukup')->count(),
                'kurang' => $rows->where('grade', 'Kurang')->count(),
                'buruk' => $rows->where('grade', 'Buruk')->count(),
            ],
            'filterOptions' => [
                'areas' => \App\Models\Area::select('id', 'name')->orderBy('name')->get(),
                'cabangs' => \App\Models\Cabang::select('id', 'nama_cabang', 'area_id')->orderBy('nama_cabang')->get(),
                'years' => [2023, 2024, 2025, 2026],
            ],
            'filters' => $request->only(['search', 'area_id', 'cabang_id', 'tahun', 'sort', 'dir']),
            'tahun' => $year,
        ]);
    }

    /**
     * Export report sales score ke Excel (mengikuti filter aktif).
     */
    public function reportExport(\Illuminate\Http\Request $request)
    {
        $year = (int) ($request->input('tahun') ?: date('Y'));
        $rows = $this->buildReportRows($request, $year);
        $filename = 'report-sales-score-' . $year . '-' . now()->format('Ymd-His') . '.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\SalesScoreReportExport($rows, $year),
            $filename
        );
    }

    /**
     * Build collection of sales KPI score rows for report / export.
     */
    private function buildReportRows(\Illuminate\Http\Request $request, int $year): \Illuminate\Support\Collection
    {
        $user = auth()->user();
        $prevYear = $year - 1;

        $customerBase = \App\Models\Customer::query()->whereNotNull('sales_id');

        if ($user) {
            if ($user->level === 'area') {
                $customerBase->where('area_id', $user->area_id);
            } elseif ($user->level === 'cabang') {
                $customerBase->where('cabang_id', $user->cabang_id);
            } elseif ($user->level === 'sales') {
                $customerBase->where('sales_id', $user->sales_id);
            }
        }

        if ($request->filled('area_id')) {
            $customerBase->where('area_id', $request->area_id);
        }
        if ($request->filled('cabang_id')) {
            $customerBase->where('cabang_id', $request->cabang_id);
        }

        $salesIds = (clone $customerBase)->distinct()->pluck('sales_id')->filter()->values();

        if ($salesIds->isEmpty()) {
            return collect();
        }

        $salesMeta = (clone $customerBase)
            ->select(
                'sales_id',
                DB::raw('MIN(cabang_id) as cabang_id'),
                DB::raw('MIN(area_id) as area_id'),
                DB::raw('COUNT(*) as total_sekolah')
            )
            ->groupBy('sales_id')
            ->get()
            ->keyBy('sales_id');

        $acRows = DB::table('customers')
            ->join('customer_plans', 'customers.id', '=', 'customer_plans.customer_id')
            ->whereIn('customers.sales_id', $salesIds)
            ->where('customer_plans.is_ac', 1)
            ->whereIn('customer_plans.year', [$year, $prevYear])
            ->when($request->filled('area_id'), fn ($q) => $q->where('customers.area_id', $request->area_id))
            ->when($request->filled('cabang_id'), fn ($q) => $q->where('customers.cabang_id', $request->cabang_id))
            ->groupBy('customers.sales_id', 'customer_plans.year')
            ->select(
                'customers.sales_id',
                'customer_plans.year',
                DB::raw('COUNT(DISTINCT customers.id) as cnt')
            )
            ->get()
            ->groupBy('sales_id');

        $volumeRows = DB::table('customers')
            ->join('customer_plans', 'customers.id', '=', 'customer_plans.customer_id')
            ->whereIn('customers.sales_id', $salesIds)
            ->whereIn('customer_plans.year', [$year, $prevYear])
            ->when($request->filled('area_id'), fn ($q) => $q->where('customers.area_id', $request->area_id))
            ->when($request->filled('cabang_id'), fn ($q) => $q->where('customers.cabang_id', $request->cabang_id))
            ->groupBy('customers.sales_id', 'customer_plans.year')
            ->select(
                'customers.sales_id',
                'customer_plans.year',
                DB::raw('SUM(customer_plans.real_exemplar) as real_sum'),
                DB::raw('SUM(customer_plans.target_exemplar) as target_sum')
            )
            ->get()
            ->groupBy('sales_id');

        $schoolCountRows = DB::table('customers')
            ->whereIn('sales_id', $salesIds)
            ->when($request->filled('area_id'), fn ($q) => $q->where('area_id', $request->area_id))
            ->when($request->filled('cabang_id'), fn ($q) => $q->where('cabang_id', $request->cabang_id))
            ->groupBy('sales_id')
            ->select('sales_id', DB::raw('COUNT(*) as total_sekolah'))
            ->get()
            ->keyBy('sales_id');

        $schoolRealisasiRows = DB::table('customers')
            ->leftJoin('customer_plans', function ($join) use ($year) {
                $join->on('customers.id', '=', 'customer_plans.customer_id')
                    ->where('customer_plans.year', $year);
            })
            ->whereIn('customers.sales_id', $salesIds)
            ->when($request->filled('area_id'), fn ($q) => $q->where('customers.area_id', $request->area_id))
            ->when($request->filled('cabang_id'), fn ($q) => $q->where('customers.cabang_id', $request->cabang_id))
            ->groupBy('customers.sales_id')
            ->select(
                'customers.sales_id',
                DB::raw('COUNT(DISTINCT CASE WHEN customer_plans.real_exemplar > 0 THEN customers.id END) as sekolah_realisasi')
            )
            ->get()
            ->keyBy('sales_id');

        // TRL vs Area Cover: hanya sekolah yang AC di tahun berjalan
        $trlRows = DB::table('customers')
            ->join('customer_plans as cp_curr', function ($join) use ($year) {
                $join->on('customers.id', '=', 'cp_curr.customer_id')
                    ->where('cp_curr.year', $year)
                    ->where('cp_curr.is_ac', 1);
            })
            ->leftJoin('customer_plans as cp_prev', function ($join) use ($prevYear) {
                $join->on('customers.id', '=', 'cp_prev.customer_id')
                    ->where('cp_prev.year', $prevYear);
            })
            ->whereIn('customers.sales_id', $salesIds)
            ->when($request->filled('area_id'), fn ($q) => $q->where('customers.area_id', $request->area_id))
            ->when($request->filled('cabang_id'), fn ($q) => $q->where('customers.cabang_id', $request->cabang_id))
            ->groupBy('customers.sales_id')
            ->select(
                'customers.sales_id',
                DB::raw('COUNT(DISTINCT CASE WHEN COALESCE(cp_prev.real_exemplar, 0) > 0 AND COALESCE(cp_curr.real_exemplar, 0) > 0 THEN customers.id END) as tahan_count'),
                DB::raw('COUNT(DISTINCT CASE WHEN COALESCE(cp_prev.real_exemplar, 0) = 0 AND COALESCE(cp_curr.real_exemplar, 0) > 0 THEN customers.id END) as rebut_count'),
                DB::raw('COUNT(DISTINCT CASE WHEN COALESCE(cp_curr.real_exemplar, 0) = 0 THEN customers.id END) as lepas_count')
            )
            ->get()
            ->keyBy('sales_id');

        $activities = \App\Models\SalesActivity::whereIn('sales_id', $salesIds)
            ->get(['sales_id', 'tanggal', 'aktivitas'])
            ->groupBy('sales_id');

        $salesList = \App\Models\Sales::whereIn('id', $salesIds)->orderBy('name')->get()->keyBy('id');
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get()->keyBy('id');
        $areas = \App\Models\Area::orderBy('name')->get()->keyBy('id');
        $scoreWeights = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
            ?->resolvedSalesScoreWeights()
            ?? \App\Models\Configuration::defaultSalesScoreWeights();

        $rows = $salesIds->map(function ($salesId) use (
            $salesList,
            $salesMeta,
            $acRows,
            $volumeRows,
            $schoolCountRows,
            $schoolRealisasiRows,
            $trlRows,
            $activities,
            $cabangs,
            $areas,
            $year,
            $prevYear,
            $scoreWeights
        ) {
            $sales = $salesList->get($salesId);
            if (!$sales) {
                return null;
            }

            $meta = $salesMeta->get($salesId);
            $cabangId = $meta->cabang_id ?? null;
            $areaId = $meta->area_id ?? null;
            $cabang = $cabangId ? $cabangs->get($cabangId) : null;
            $area = $areaId ? $areas->get($areaId) : null;

            $acForSales = $acRows->get($salesId) ?? collect();
            $acPrev = (int) ($acForSales->firstWhere('year', $prevYear)->cnt ?? 0);
            $acCurr = (int) ($acForSales->firstWhere('year', $year)->cnt ?? 0);

            $volForSales = $volumeRows->get($salesId) ?? collect();
            $realCurr = (float) ($volForSales->firstWhere('year', $year)->real_sum ?? 0);
            $realPrev = (float) ($volForSales->firstWhere('year', $prevYear)->real_sum ?? 0);
            $targetCurr = (float) ($volForSales->firstWhere('year', $year)->target_sum ?? 0);

            $totalSekolah = (int) ($schoolCountRows->get($salesId)->total_sekolah ?? $meta->total_sekolah ?? 0);
            $sekolahRealisasi = (int) ($schoolRealisasiRows->get($salesId)->sekolah_realisasi ?? 0);

            // 1. Realisasi YoY
            $yoy = $this->scoreRealisasiYoY($realCurr, $realPrev);
            $realGrowthPct = $yoy['growth_pct'];
            $realisasiYoyScore = $yoy['score'];

            // 2. Customer Realisasi vs Area Cover
            $customerRealisasiCount = (int) $sekolahRealisasi;
            $spVsAcPct = round(($customerRealisasiCount / max(1, $acCurr)) * 100, 1);
            $spVsAcScore = min(100, $spVsAcPct);

            // 3. Achievement Target
            $achievementPct = $targetCurr > 0
                ? round(($realCurr / $targetCurr) * 100, 1)
                : ($realCurr > 0 ? 100 : 0);
            $achievementScore = min(100, max(0, $achievementPct));

            // 4–6. Tahan / Rebut / Lepas vs Area Cover
            $trl = $trlRows->get($salesId);
            $tahanCount = (int) ($trl->tahan_count ?? 0);
            $rebutCount = (int) ($trl->rebut_count ?? 0);
            $lepasCount = (int) ($trl->lepas_count ?? 0);
            $acDenom = max(1, $acCurr);
            $tahanVsAcPct = round(($tahanCount / $acDenom) * 100, 1);
            $tahanVsAcScore = min(100, $tahanVsAcPct);
            $rebutVsAcPct = round(($rebutCount / $acDenom) * 100, 1);
            $rebutVsAcScore = min(100, $rebutVsAcPct);
            $lepasVsAcPct = round(($lepasCount / $acDenom) * 100, 1);
            $lepasVsAcScore = min(100, $lepasVsAcPct);

            // 4. Area Cover Growth (pendukung legacy)
            $acGrowthPct = $acPrev > 0
                ? round((($acCurr - $acPrev) / $acPrev) * 100, 1)
                : ($acCurr > 0 ? 100 : 0);
            if ($acGrowthPct >= 20) {
                $acScore = 100;
            } elseif ($acGrowthPct >= 0) {
                $acScore = 50 + ($acGrowthPct / 20) * 50;
            } else {
                $acScore = max(0, 50 + ($acGrowthPct / 20) * 50);
            }
            $acScore = round($acScore, 1);

            // 5. Intensitas Aktivitas
            $salesActivities = $activities->get($salesId) ?? collect();
            $parseMonth = function ($date) {
                if (!$date) return null;
                try {
                    if (str_contains($date, '-')) {
                        $d = \Carbon\Carbon::parse($date);
                    } else {
                        try {
                            $d = \Carbon\Carbon::createFromFormat('m/d/Y', $date);
                        } catch (\Exception $e) {
                            try {
                                $d = \Carbon\Carbon::createFromFormat('d/m/Y', $date);
                            } catch (\Exception $e) {
                                $d = \Carbon\Carbon::parse($date);
                            }
                        }
                    }
                    return $d->format('Y-m');
                } catch (\Exception $e) {
                    return null;
                }
            };
            $months = $salesActivities->map(fn ($a) => $parseMonth($a->tanggal))->filter()->unique();
            $totalActivities = $salesActivities->count();
            $activeMonths = max(1, $months->count());
            $avgPerMonth = round($totalActivities / $activeMonths, 1);
            $activityScore = min(100, round(($avgPerMonth / 20) * 100, 1));

            // 6. Realisasi Sekolah (ber-realisasi di AC / Area Cover)
            $realisasiPct = $acCurr > 0
                ? round(($sekolahRealisasi / $acCurr) * 100, 1)
                : 0;
            $realisasiScore = round($realisasiPct, 1);

            $totalScore = \App\Models\Configuration::computeWeightedSalesScore([
                'realisasi_yoy' => $realisasiYoyScore,
                'sp_vs_ac' => $spVsAcScore,
                'achievement' => $achievementScore,
                'tahan_vs_ac' => $tahanVsAcScore,
                'rebut_vs_ac' => $rebutVsAcScore,
                'lepas_vs_ac' => $lepasVsAcScore,
            ], $scoreWeights);
            $grade = \App\Models\Configuration::salesScoreGrade($totalScore);

            return [
                'sales_id' => $salesId,
                'sales_name' => $sales->name,
                'cabang_id' => $cabangId,
                'cabang_name' => $cabang->nama_cabang ?? '-',
                'area_id' => $areaId,
                'area_name' => $area->name ?? '-',
                'total_sekolah' => $totalSekolah,
                'total_score' => $totalScore,
                'grade' => $grade,
                'components' => [
                    'realisasi_yoy_score' => $realisasiYoyScore,
                    'real_prev' => $realPrev,
                    'real_curr' => $realCurr,
                    'real_growth_pct' => $realGrowthPct,
                    'sp_vs_ac_score' => $spVsAcScore,
                    'sp_count' => $customerRealisasiCount,
                    'ac_curr' => $acCurr,
                    'sp_vs_ac_pct' => $spVsAcPct,
                    'achievement_score' => $achievementScore,
                    'target_curr' => $targetCurr,
                    'achievement_pct' => $achievementPct,
                    'tahan_vs_ac_score' => $tahanVsAcScore,
                    'tahan_count' => $tahanCount,
                    'tahan_vs_ac_pct' => $tahanVsAcPct,
                    'rebut_vs_ac_score' => $rebutVsAcScore,
                    'rebut_count' => $rebutCount,
                    'rebut_vs_ac_pct' => $rebutVsAcPct,
                    'lepas_vs_ac_score' => $lepasVsAcScore,
                    'lepas_count' => $lepasCount,
                    'lepas_vs_ac_pct' => $lepasVsAcPct,
                    'ac_score' => $acScore,
                    'ac_prev' => $acPrev,
                    'ac_growth_pct' => $acGrowthPct,
                    'activity_score' => $activityScore,
                    'avg_per_month' => $avgPerMonth,
                    'total_activities' => $totalActivities,
                    'realisasi_score' => $realisasiScore,
                    'sekolah_realisasi' => $sekolahRealisasi,
                    'realisasi_pct' => $realisasiPct,
                ],
            ];
        })->filter()->values();

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $rows = $rows->filter(fn ($item) => str_contains(strtolower($item['sales_name']), $search))->values();
        }

        $sort = $request->input('sort', 'total_score');
        $dir = $request->input('dir', 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['sales_name', 'total_score', 'cabang_name', 'area_name', 'grade'];
        if (!in_array($sort, $allowedSort, true)) {
            $sort = 'total_score';
        }

        return $dir === 'asc'
            ? $rows->sortBy($sort)->values()
            : $rows->sortByDesc($sort)->values();
    }

    /**
     * GET /monitoring/cabang/{cabangCode}/trl-detail
     * Detail TRL per Sales per Jenjang + list sekolah per kategori TRL
     */
    public function detailTrl($cabangCode)
    {
        $cabang = \App\Models\Cabang::findOrFail($cabangCode);

        $user = auth()->user();
        if ($user) {
            if ($user->level === 'area' && $user->area_id != $cabang->area_id) abort(403);
            if ($user->level === 'cabang' && $user->cabang_id != $cabang->id) abort(403);
            if ($user->level === 'sales') {
                $sales = \App\Models\Sales::find($user->sales_id);
                if (!$sales || $sales->cabang_id != $cabang->id) abort(403);
            }
        }

        // salesIds dari customers (karena sales tidak punya kolom cabang_id)
        $salesIds = \App\Models\Customer::where('cabang_id', $cabang->id)
            ->whereNotNull('sales_id')
            ->pluck('sales_id')
            ->unique()
            ->values();
        $jenjangList = ['SD', 'SMP', 'SMA', 'SMK'];

        // — Filter params
        $filterSales  = request('sales_id');
        $filterJenjang = request('jenjang');
        $filterStatus  = request('trl_status'); // tahan|rebut|lepas|gagal

        // — TRL per Sales per Jenjang (aggregasi)
        $planQuery = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)
            ->whereNotNull('jenjang')
            ->selectRaw('sales_id, jenjang,
                SUM(tahan_customer) as tahan,
                SUM(rebut_customer) as rebut,
                SUM(lepas_customer) as lepas,
                SUM(gagal_customer) as gagal')
            ->groupBy('sales_id', 'jenjang');

        if ($filterSales) {
            $planQuery->where('sales_id', $filterSales);
        }
        if ($filterJenjang) {
            $planQuery->where('jenjang', $filterJenjang);
        }

        $planRows = $planQuery->get();
        $salesMap = \App\Models\Sales::whereIn('id', $salesIds->toArray())->pluck('name', 'id');

        $trlBySales = $planRows->map(function ($r) use ($salesMap) {
            return [
                'sales_id'   => $r->sales_id,
                'sales_name' => $salesMap[$r->sales_id] ?? 'Unknown',
                'jenjang'    => $r->jenjang,
                'tahan'      => (int) $r->tahan,
                'rebut'      => (int) $r->rebut,
                'lepas'      => (int) $r->lepas,
                'gagal'      => (int) $r->gagal,
                'total'      => (int)$r->tahan + (int)$r->rebut + (int)$r->lepas + (int)$r->gagal,
            ];
        })->sortBy(['sales_name', 'jenjang'])->values();

        // — List Sekolah dengan TRL status
        // TRL status ditentukan dari field is_active + apakah ada di sales_plan
        // Logika: 
        //   tahan = punya sales + is_active = 1 (customer aktif tahun ini & tahun lalu)
        //   rebut = punya sales + is_active = 1 + baru masuk (tidak ada di prev year)  
        //   lepas = punya sales + is_active = 0 + ada di prev year
        //   gagal = punya sales + is_active = 0 + tidak ada di prev year (2 tahun berturut)
        // Namun karena data trl_status belum ada di customer table,
        // kita gunakan is_active sebagai proxy: aktif=tahan/rebut, tidak aktif=lepas/gagal

        $cfg = \App\Models\Configuration::query()->first(['target_year', 'prev_year']);
        $targetYear = (int) ($cfg->target_year ?? date('Y'));
        $prevYear   = $targetYear - 1;

        $customerQuery = \App\Models\Customer::where('cabang_id', $cabang->id)
            ->whereNotNull('sales_id')
            ->with('sales:id,name');

        if ($filterSales) {
            $customerQuery->where('sales_id', $filterSales);
        }
        if ($filterJenjang) {
            $customerQuery->where('jenjang', $filterJenjang);
        }

        // Determine TRL status per customer:
        // We check customer_plans for prev year and target year real_exemplar > 0
        $customerIds = (clone $customerQuery)->pluck('id');

        // Customers with activity in prevYear
        $activeLastYear = \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->where('year', $prevYear)->where('real_exemplar', '>', 0)
            ->pluck('customer_id')->flip();

        // Customers with activity in targetYear
        $activeThisYear = \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->where('year', $targetYear)->where('real_exemplar', '>', 0)
            ->pluck('customer_id')->flip();

        $sekolah = (clone $customerQuery)
            ->select('id', 'name', 'kecamatan_name', 'jenjang', 'sumber_dana',
                     'is_active', 'total_student', 'sales_id')
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString()
            ->through(function ($c) use ($activeLastYear, $activeThisYear, $filterStatus) {
                $hadLastYear  = isset($activeLastYear[$c->id]);
                $hadThisYear  = isset($activeThisYear[$c->id]);

                // TRL classification
                if ($hadLastYear && $hadThisYear) {
                    $status = 'tahan';
                } elseif (!$hadLastYear && $hadThisYear) {
                    $status = 'rebut';
                } elseif ($hadLastYear && !$hadThisYear) {
                    $status = 'lepas';
                } else {
                    $status = 'gagal';
                }

                return [
                    'id'           => $c->id,
                    'nama_sekolah' => $c->name,
                    'kecamatan'    => $c->kecamatan_name,
                    'kabupaten'    => null,
                    'jenjang'      => $c->jenjang,
                    'sumber_dana'  => $c->sumber_dana,
                    'is_active'    => (bool) $c->is_active,
                    'total_student'=> (int) ($c->total_student ?? 0),
                    'sales_name'   => $c->sales->name ?? 'Unknown',
                    'sales_id'     => $c->sales_id,
                    'trl_status'   => $status,
                ];
            });

        // Filter by trl_status after pagination (apply pre-filter if given)
        // For accurate filtering, re-query with trl_status as computed field:
        if ($filterStatus) {
            // rebuild with status filter — we need all IDs first
            $allCustomers = (clone $customerQuery)
                ->select('id', 'name', 'kecamatan_name', 'jenjang', 'sumber_dana',
                         'is_active', 'total_student', 'sales_id')
                ->orderBy('name')
                ->get();

            $filtered = $allCustomers->filter(function ($c) use ($activeLastYear, $activeThisYear, $filterStatus) {
                $hadLastYear = isset($activeLastYear[$c->id]);
                $hadThisYear = isset($activeThisYear[$c->id]);
                if ($hadLastYear && $hadThisYear) $status = 'tahan';
                elseif (!$hadLastYear && $hadThisYear) $status = 'rebut';
                elseif ($hadLastYear && !$hadThisYear) $status = 'lepas';
                else $status = 'gagal';
                return $status === $filterStatus;
            })->map(function ($c) use ($activeLastYear, $activeThisYear) {
                $hadLastYear = isset($activeLastYear[$c->id]);
                $hadThisYear = isset($activeThisYear[$c->id]);
                if ($hadLastYear && $hadThisYear) $status = 'tahan';
                elseif (!$hadLastYear && $hadThisYear) $status = 'rebut';
                elseif ($hadLastYear && !$hadThisYear) $status = 'lepas';
                else $status = 'gagal';
                return [
                    'id'           => $c->id,
                    'nama_sekolah' => $c->name,
                    'kecamatan'    => $c->kecamatan_name,
                    'kabupaten'    => null,
                    'jenjang'      => $c->jenjang,
                    'sumber_dana'  => $c->sumber_dana,
                    'is_active'    => (bool) $c->is_active,
                    'total_student'=> (int) ($c->total_student ?? 0),
                    'sales_name'   => $c->sales->name ?? 'Unknown',
                    'sales_id'     => $c->sales_id,
                    'trl_status'   => $status,
                ];
            })->values();

            // Manual pagination of filtered result
            $page    = (int) (request('page', 1));
            $perPage = 50;
            $total   = $filtered->count();
            $sekolah = new \Illuminate\Pagination\LengthAwarePaginator(
                $filtered->slice(($page - 1) * $perPage, $perPage)->values(),
                $total, $perPage, $page,
                ['path' => request()->url(), 'query' => request()->query()]
            );
        }

        // — Summary totals
        $allPlan = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang');
        $summary = [
            'tahan' => (int) $allPlan->sum('tahan_customer'),
            'rebut' => (int) (clone $allPlan)->sum('rebut_customer'),
            'lepas' => (int) (clone $allPlan)->sum('lepas_customer'),
            'gagal' => (int) (clone $allPlan)->sum('gagal_customer'),
        ];

        // — Sales list for filter dropdown
        $salesList = \App\Models\Sales::whereIn('id', $salesIds->toArray())
            ->orderBy('name')->get(['id', 'name']);

        return \Inertia\Inertia::render('Monitoring/Detail/TrlDetail', [
            'activeNav'   => 'cabang',
            'cabangName'  => $cabang->nama_cabang,
            'cabangCode'  => $cabang->id,
            'backUrl'     => route('monitoring.area.select') . '?cabang=' . $cabang->id,
            'targetYear'  => $targetYear,
            'prevYear'    => $prevYear,
            'summary'     => $summary,
            'trlBySales'  => $trlBySales,
            'sekolah'     => $sekolah,
            'salesList'   => $salesList,
            'jenjangList' => $jenjangList,
            'filters'     => [
                'sales_id'   => $filterSales,
                'jenjang'    => $filterJenjang,
                'trl_status' => $filterStatus,
            ],
        ]);
    }

    /**
     * TRL detail, scoped to a whole Area — list by Cabang (bukan Sales)
     * saat user klik jenjang/status dari dashboard area.
     */
    public function detailTrlArea($id)
    {
        $area = \App\Models\Area::findOrFail($id);

        $user = auth()->user();
        if ($user) {
            if ($user->level === 'area' && $user->area_id != $area->id) {
                abort(403);
            }
            if ($user->level === 'cabang') {
                $cabangUser = \App\Models\Cabang::find($user->cabang_id);
                if (!$cabangUser || $cabangUser->area_id != $area->id) {
                    abort(403);
                }
            }
            if ($user->level === 'sales') {
                $sales = \App\Models\Sales::with('cabang')->find($user->sales_id);
                if (!$sales || !$sales->cabang || $sales->cabang->area_id != $area->id) {
                    abort(403);
                }
            }
        }

        $cfg = \App\Models\Configuration::query()->first(['target_year', 'prev_year']);
        $targetYear = (int) ($cfg->target_year ?? date('Y'));
        $prevYear = (int) ($cfg->prev_year ?? ($targetYear - 1));

        $filterJenjang = request('jenjang');
        $filterStatus = request('trl_status'); // tahan|rebut|lepas|gagal
        $jenjangList = ['SD', 'SMP', 'SMA', 'SMK'];

        $cabangs = \App\Models\Cabang::where('area_id', $area->id)
            ->orderBy('nama_cabang')
            ->get(['id', 'nama_cabang']);

        // sales_id → cabang_id (cabang dengan customer terbanyak per sales)
        $salesCabangMap = \App\Models\Customer::where('area_id', $area->id)
            ->whereNotNull('sales_id')
            ->whereNotNull('cabang_id')
            ->selectRaw('sales_id, cabang_id, COUNT(*) as cnt')
            ->groupBy('sales_id', 'cabang_id')
            ->get()
            ->groupBy('sales_id')
            ->map(function ($rows) {
                return (int) $rows->sortByDesc('cnt')->first()->cabang_id;
            });

        $salesIds = $salesCabangMap->keys()->values();

        // TRL dari SalesPlan, digroup per cabang (+ filter jenjang)
        $trlAggByCabang = [];
        if ($salesIds->isNotEmpty()) {
            $planQuery = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)
                ->whereNotNull('jenjang')
                ->selectRaw('sales_id, jenjang,
                    SUM(tahan_customer) as tahan,
                    SUM(rebut_customer) as rebut,
                    SUM(lepas_customer) as lepas,
                    SUM(gagal_customer) as gagal')
                ->groupBy('sales_id', 'jenjang');

            if ($filterJenjang) {
                $planQuery->where('jenjang', $filterJenjang);
            }

            foreach ($planQuery->get() as $r) {
                $cabangId = $salesCabangMap[$r->sales_id] ?? null;
                if (!$cabangId) {
                    continue;
                }
                if (!isset($trlAggByCabang[$cabangId])) {
                    $trlAggByCabang[$cabangId] = [
                        'tahan' => 0,
                        'rebut' => 0,
                        'lepas' => 0,
                        'gagal' => 0,
                    ];
                }
                $trlAggByCabang[$cabangId]['tahan'] += (int) $r->tahan;
                $trlAggByCabang[$cabangId]['rebut'] += (int) $r->rebut;
                $trlAggByCabang[$cabangId]['lepas'] += (int) $r->lepas;
                $trlAggByCabang[$cabangId]['gagal'] += (int) $r->gagal;
            }
        }

        // Realisasi tahun ini per cabang (+ filter jenjang)
        $customerBase = \App\Models\Customer::where('area_id', $area->id);
        if ($filterJenjang) {
            $customerBase->where('jenjang', $filterJenjang);
        }

        $realRows = (clone $customerBase)
            ->leftJoin('customer_plans', function ($join) use ($targetYear) {
                $join->on('customers.id', '=', 'customer_plans.customer_id')
                    ->where('customer_plans.year', '=', $targetYear);
            })
            ->selectRaw("
                customers.cabang_id as cabang_id,
                COALESCE(SUM(customer_plans.real_exemplar), 0) as realisasi_eksemplar,
                COUNT(DISTINCT CASE WHEN customer_plans.real_exemplar > 0 THEN customers.id END) as realisasi_customer
            ")
            ->groupBy('customers.cabang_id')
            ->get()
            ->keyBy('cabang_id');

        $trlByCabang = $cabangs->map(function ($cab) use ($trlAggByCabang, $realRows) {
            $trl = $trlAggByCabang[$cab->id] ?? [
                'tahan' => 0,
                'rebut' => 0,
                'lepas' => 0,
                'gagal' => 0,
            ];
            $lepas = (int) $trl['lepas'] + (int) $trl['gagal']; // samakan dashboard (gagal digabung lepas)
            $real = $realRows->get($cab->id);

            return [
                'id' => $cab->id,
                'nama_cabang' => $cab->nama_cabang,
                'tahan' => (int) $trl['tahan'],
                'rebut' => (int) $trl['rebut'],
                'lepas' => $lepas,
                'gagal' => (int) $trl['gagal'],
                'total' => (int) $trl['tahan'] + (int) $trl['rebut'] + $lepas,
                'realisasi_customer' => (int) ($real->realisasi_customer ?? 0),
                'realisasi_eksemplar' => (int) ($real->realisasi_eksemplar ?? 0),
            ];
        })
            ->sortByDesc(function ($r) {
                return $r['tahan'] + $r['rebut'] + $r['lepas'];
            })
            ->values()
            ->map(function ($r, $i) {
                $r['no'] = $i + 1;
                return $r;
            })
            ->toArray();

        // Summary TRL area (null jenjang = total seperti dashboard)
        if ($filterJenjang) {
            $summary = [
                'tahan' => collect($trlByCabang)->sum('tahan'),
                'rebut' => collect($trlByCabang)->sum('rebut'),
                'lepas' => collect($trlByCabang)->sum('lepas'),
                'gagal' => 0,
            ];
        } elseif ($salesIds->isEmpty()) {
            $summary = ['tahan' => 0, 'rebut' => 0, 'lepas' => 0, 'gagal' => 0];
        } else {
            $allPlan = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang');
            $summary = [
                'tahan' => (int) (clone $allPlan)->sum('tahan_customer'),
                'rebut' => (int) (clone $allPlan)->sum('rebut_customer'),
                'lepas' => (int) (clone $allPlan)->sum('lepas_customer')
                    + (int) (clone $allPlan)->sum('gagal_customer'),
                'gagal' => 0,
            ];
        }

        // List sekolah (tetap tersedia di tab kedua)
        $customerQuery = \App\Models\Customer::where('area_id', $area->id)
            ->whereNotNull('sales_id')
            ->with(['sales:id,name', 'cabang:id,nama_cabang']);

        if ($filterJenjang) {
            $customerQuery->where('jenjang', $filterJenjang);
        }

        $customerIds = (clone $customerQuery)->pluck('id');
        $activeLastYear = $customerIds->isEmpty()
            ? collect()
            : \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
                ->where('year', $prevYear)->where('real_exemplar', '>', 0)
                ->pluck('customer_id')->flip();
        $activeThisYear = $customerIds->isEmpty()
            ? collect()
            : \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
                ->where('year', $targetYear)->where('real_exemplar', '>', 0)
                ->pluck('customer_id')->flip();

        $mapSekolah = function ($c) use ($activeLastYear, $activeThisYear) {
            $hadLastYear = isset($activeLastYear[$c->id]);
            $hadThisYear = isset($activeThisYear[$c->id]);
            if ($hadLastYear && $hadThisYear) {
                $status = 'tahan';
            } elseif (!$hadLastYear && $hadThisYear) {
                $status = 'rebut';
            } elseif ($hadLastYear && !$hadThisYear) {
                $status = 'lepas';
            } else {
                $status = 'gagal';
            }

            return [
                'id' => $c->id,
                'nama_sekolah' => $c->name,
                'kecamatan' => $c->kecamatan_name,
                'kabupaten' => null,
                'jenjang' => $c->jenjang,
                'sumber_dana' => $c->sumber_dana,
                'is_active' => (bool) $c->is_active,
                'total_student' => (int) ($c->total_student ?? 0),
                'sales_name' => $c->sales->name ?? 'Unknown',
                'sales_id' => $c->sales_id,
                'cabang_name' => $c->cabang->nama_cabang ?? '-',
                'cabang_id' => $c->cabang_id,
                'trl_status' => $status,
            ];
        };

        if ($filterStatus) {
            $filtered = (clone $customerQuery)->orderBy('name')->get()
                ->map($mapSekolah)
                ->filter(fn ($s) => $s['trl_status'] === $filterStatus)
                ->values();
            $page = (int) request('page', 1);
            $perPage = 50;
            $sekolah = new \Illuminate\Pagination\LengthAwarePaginator(
                $filtered->slice(($page - 1) * $perPage, $perPage)->values(),
                $filtered->count(),
                $perPage,
                $page,
                ['path' => request()->url(), 'query' => request()->query()]
            );
        } else {
            $sekolah = (clone $customerQuery)
                ->orderBy('name')
                ->paginate(50)
                ->withQueryString()
                ->through($mapSekolah);
        }

        return \Inertia\Inertia::render('Monitoring/Detail/TrlDetail', [
            'activeNav' => 'area',
            'isAreaDashboard' => true,
            'areaId' => $area->id,
            'cabangName' => strtoupper($area->name),
            'cabangCode' => null,
            'backUrl' => route('monitoring.area', $area->id),
            'targetYear' => $targetYear,
            'prevYear' => $prevYear,
            'summary' => $summary,
            'trlByCabang' => $trlByCabang,
            'trlBySales' => [],
            'sekolah' => $sekolah,
            'salesList' => [],
            'jenjangList' => $jenjangList,
            'filters' => [
                'sales_id' => null,
                'jenjang' => $filterJenjang,
                'trl_status' => $filterStatus,
            ],
        ]);
    }

    /**
     * Kumpulkan grade unik sekolah ber-realisasi (real_exemplar > 0) per key.
     * @param  \Illuminate\Support\Collection<int, object>  $schools  butuh kecamatan_name + total_student (+ optional cabang_id)
     * @param  callable(object): string  $keyFn
     * @return array<string, list<string>>
     */
    private function collectGradesRealisasiByKey($schools, callable $keyFn, ?array $thresholds = null): array
    {
        $thresholds = $thresholds
            ?: (\App\Models\Configuration::query()->first()?->resolvedSchoolGradeThresholds()
                ?? \App\Models\Configuration::defaultSchoolGradeThresholds());
        $order = \App\Models\Configuration::schoolGradeOrder();
        $map = [];

        foreach ($schools as $s) {
            $key = (string) $keyFn($s);
            if ($key === '') {
                continue;
            }
            $grade = \App\Models\Configuration::schoolGradeFromSiswa(
                (int) ($s->total_student ?? 0),
                $thresholds
            );
            $grade = trim((string) $grade);
            if ($grade === '' || $grade === '-') {
                continue;
            }
            $map[$key][$grade] = true;
        }

        $out = [];
        foreach ($map as $key => $set) {
            $list = array_keys($set);
            usort($list, static function ($a, $b) use ($order) {
                $ia = array_search($a, $order, true);
                $ib = array_search($b, $order, true);
                $oa = $ia === false ? 99 : $ia;
                $ob = $ib === false ? 99 : $ib;
                if ($oa !== $ob) {
                    return $oa <=> $ob;
                }

                return strcmp((string) $a, (string) $b);
            });
            $out[$key] = $list;
        }

        return $out;
    }
}
