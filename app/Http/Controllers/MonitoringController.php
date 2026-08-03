<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Area;
use App\Models\Customer;
use App\Models\SalesPlan;
use App\Models\MarketShare;
use App\Models\Sales;

class MonitoringController extends Controller
{
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
     * Build dashboard data specifically for a Cabang
     */

    private function buildUniversalDashboardData($scope = 'CABANG', $scopeId = null, $overrideSalesId = null)
    {
        $user = auth()->user();
        $isSales = $overrideSalesId || ($user && $user->level === 'sales' && $user->sales_id);

        $customerQuery = \App\Models\Customer::query();
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
        $realEksemplar = \App\Models\SalesPlan::whereIn('sales_id', $salesIds)->whereNull('jenjang')->sum('real_exemplar');
        $totalSiswa = (clone $customerQuery)->sum('total_student') ?? 0;

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

        $targetAgg = \App\Models\SalesAreaCover::whereIn('sales_id', $salesIds)
            ->selectRaw('sales_id, SUM(target_exemplar) as target_eks')
            ->groupBy('sales_id')
            ->pluck('target_eks', 'sales_id');

        $timSalesPerformance = $mySalesList->map(function ($sales) use ($targetAgg, $salesPlanAgg2, $scope, $scopeId) {
            $q = \App\Models\Customer::where('sales_id', $sales->id);
            if ($scope === 'CABANG') $q->where('cabang_id', $scopeId);
            elseif ($scope === 'AREA') $q->where('area_id', $scopeId);

            $ts = (clone $q)->count();
            $ak = (clone $q)->where('is_active', 1)->count();
            $coverage = $ts > 0 ? round(($ak / $ts) * 100, 2) : 0;

            $status = 'Kurang';
            if ($coverage >= 70) $status = 'Sangat Baik';
            elseif ($coverage >= 40) $status = 'Baik';

            $target_eksemplar = $targetAgg[$sales->id] ?? 0;
            $planAgg = $salesPlanAgg2->get($sales->id);
            $real_eksemplar = $planAgg ? $planAgg->real_eks : 0;
            $tahan = $planAgg ? $planAgg->tahan : 0;
            $rebut = $planAgg ? $planAgg->rebut : 0;
            $pencapaian = $target_eksemplar > 0 ? round(($real_eksemplar / $target_eksemplar) * 100, 2) : 0;

            return [
                'id' => $sales->id,
                'name' => $sales->name,
                'total_sekolah' => $ts,
                'aktif' => $ak,
                'coverage' => $coverage,
                'target_eksemplar' => (int)$target_eksemplar,
                'real_eksemplar' => (int)$real_eksemplar,
                'pencapaian' => $pencapaian,
                'tahan' => (int)$tahan,
                'rebut' => (int)$rebut,
                'status' => $status,
                'score' => $ak
            ];
        })->toArray();

        usort($timSalesPerformance, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });
        $timSalesPerformanceWorst = array_slice(array_reverse($timSalesPerformance), 0, 5);
        $timSalesPerformance = array_slice($timSalesPerformance, 0, 10);

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

        $schools = (clone $customerQuery)
            ->with('cabang')
            ->whereNotNull('total_student')
            ->orderBy('total_student', 'desc')
            ->take(10)
            ->get()
            ->map(function ($c, $i) {
                return [
                    'no' => $i + 1,
                    'name' => $c->name,
                    'grade' => $c->jenjang ?: 'N/A',
                    'branch' => $c->cabang ? $c->cabang->nama_cabang : ($c->kecamatan_name ?: 'N/A'),
                    'siswa' => number_format($c->total_student, 0, ',', '.'),
                    'status' => $c->is_active ? 'Customer' : 'Belum Customer',
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
        }, $timSalesPerformance, array_keys($timSalesPerformance));

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

        return [
            'realStats' => [
                'total_sekolah' => $totalSekolah,
                'customer_aktif' => $customerAktif,
                'target_eksemplar' => $targetEksemplar,
                'real_eksemplar' => $realEksemplar,
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
            'mapMarkers' => $mapMarkers,
            'schools' => $schools,
            'dana' => $danaData,
            'uncoveredDana' => $uncoveredDanaData,
            'jenjang' => $jenjangData,
            'trend' => \App\Models\SalesPlan::whereIn('sales_id', $salesIds)
                ->whereNull('jenjang')
                ->select('year', \DB::raw('SUM(real_customer) as total_real'), \DB::raw('SUM(target_customer) as total_target'))
                ->groupBy('year')
                ->orderBy('year')
                ->get()
                ->map(fn($r) => [
                    'label'  => (string) $r->year,
                    'target' => (int) $r->total_target,
                    'real'   => (int) $r->total_real,
                    'uncov'  => max(0, (int)$r->total_target - (int)$r->total_real),
                    'v'      => $r->total_target > 0 ? round(($r->total_real / $r->total_target) * 100, 2) : 0,
                ])
                ->toArray(),
            'competitors' => $competitors,
            'leaderboard' => $leaderboard,
            'uncovered' => $uncovered,
            'salesJenjangData' => $salesJenjangData,
            'salesJenjangTotal' => $salesJenjangTotal,
            // also need uncoveredAnalysis as a fallback? In new component, we just use uncovered?
            // Actually the components in Area.jsx expect "top10Schools" for schools, or "schools".
            // It expects "salesPerformance" instead of "timSalesPerformance" or they are mapped?
            // In Cabang.jsx: it passes "timSalesPerformance". Area.jsx expects it too since it's a clone.
            // Also need "salesPerformance" which is different.
            // I'll ensure all keys are preserved.
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
                $data = $this->buildUniversalDashboardData('CABANG', $cabangObj->id);
                $isSalesUser = $user && $user->level === 'sales';
                return Inertia::render('Monitoring/Cabang', array_merge($data, [
                    'activeNav'    => $isSalesUser ? 'sales' : 'cabang',
                    'pageTitle'    => $isSalesUser ? 'Dashboard Sales' : 'Dashboard Cabang',
                    'cabangName'   => strtoupper('CABANG ' . $cabangObj->nama_cabang),
                    'areaName'     => strtoupper($area->name),
                    'description'  => 'Performa coverage dan opportunity cabang hingga tingkat kecamatan',
                    'provinceCode' => $area->id,
                    'cabangCode'   => $cabangObj->id,
                    'areas'        => \App\Models\Area::orderBy('name')->get(),
                    'cabangs'      => $cabangs,
                ]));
            }
        }

        // Foundation: same pipeline as Cabang/Sales (AREA scope)
        $data = $this->buildUniversalDashboardData('AREA', $area->id);

        /* ── Ranking Cabang (unik level Area) ── */
        $custCounts = Customer::whereIn('cabang_id', $cabangs->pluck('id'))
            ->selectRaw('cabang_id, count(*) as count')
            ->groupBy('cabang_id')
            ->pluck('count', 'cabang_id');

        $acCustCounts = Customer::whereIn('cabang_id', $cabangs->pluck('id'))
            ->where('is_active', true)
            ->selectRaw('cabang_id, count(*) as count')
            ->groupBy('cabang_id')
            ->pluck('count', 'cabang_id');

        $salesCountPerCabang = Customer::whereIn('cabang_id', $cabangs->pluck('id'))
            ->whereNotNull('sales_id')
            ->selectRaw('cabang_id, COUNT(DISTINCT sales_id) as cnt')
            ->groupBy('cabang_id')
            ->pluck('cnt', 'cabang_id');

        $ranking = [];
        foreach ($cabangs as $cabang) {
            $custCount = $custCounts[$cabang->id] ?? 0;
            $acCust = $acCustCounts[$cabang->id] ?? 0;
            $ranking[] = [
                'id' => $cabang->id,
                'name' => $cabang->nama_cabang,
                'cust' => (int) $acCust,
                'total' => (int) $custCount,
                'pct' => $custCount > 0 ? round(($acCust / $custCount) * 100) : 0,
                'sales_count' => (int) ($salesCountPerCabang[$cabang->id] ?? 0),
            ];
        }
        usort($ranking, fn($a, $b) => $b['pct'] <=> $a['pct']);
        $ranking = array_map(fn($r, $i) => ['no' => $i + 1] + $r, $ranking, array_keys($ranking));

        /* ── Uncovered per Cabang ── */
        $cabangsMap = $cabangs->keyBy('id');
        $rawUncovered = Customer::where(function ($q) {
                $q->where('is_active', false)->orWhereNull('is_active');
            })
            ->where('area_id', $area->id)
            ->select('cabang_id', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_student) as potensi'))
            ->groupBy('cabang_id')
            ->get();

        $uncovered = [];
        foreach ($rawUncovered as $r) {
            if (!$r->cabang_id || !isset($cabangsMap[$r->cabang_id])) {
                continue;
            }
            $uncovered[] = [
                'name' => $cabangsMap[$r->cabang_id]->nama_cabang,
                'count' => (int) $r->count,
                'potensi' => (int) $r->potensi,
            ];
        }
        usort($uncovered, fn($a, $b) => $b['count'] <=> $a['count']);
        foreach ($uncovered as $i => &$v) {
            $v['no'] = $i + 1;
        }
        unset($v);

        /* ── Area Governance (dari ranking kecamatan) ── */
        $govCounts = ['covered' => 0, 'low' => 0, 'opp' => 0, 'high_opp' => 0];
        $tKec = 0;
        foreach ($data['rankingKecamatan'] ?? [] as $kec) {
            $dCust = $kec['total'] ?? 0;
            if ($dCust == 0) {
                continue;
            }
            $tKec++;
            $p = $kec['pct'] ?? 0;
            if ($p >= 70) {
                $govCounts['covered']++;
            } elseif ($p >= 30) {
                $govCounts['low']++;
            } elseif ($p >= 10) {
                $govCounts['opp']++;
            } else {
                $govCounts['high_opp']++;
            }
        }
        $gov = [
            [
                'label' => 'Covered',
                'sub' => 'Kecamatan dengan coverage ≥ 70%',
                'pct' => $tKec > 0 ? round(($govCounts['covered'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['covered'],
                'color' => '#34d399',
                'icon' => 'bi-shield-fill-check',
            ],
            [
                'label' => 'Low Coverage',
                'sub' => 'Kecamatan dengan coverage 30–70%',
                'pct' => $tKec > 0 ? round(($govCounts['low'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['low'],
                'color' => '#60a5fa',
                'icon' => 'bi-exclamation-triangle-fill',
            ],
            [
                'label' => 'Opportunity',
                'sub' => 'Kecamatan dengan coverage 10–30%',
                'pct' => $tKec > 0 ? round(($govCounts['opp'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['opp'],
                'color' => '#fbbf24',
                'icon' => 'bi-lightbulb-fill',
            ],
            [
                'label' => 'High Opportunity',
                'sub' => 'Kecamatan dengan coverage < 10%',
                'pct' => $tKec > 0 ? round(($govCounts['high_opp'] / $tKec) * 100) . '%' : '0%',
                'count' => $govCounts['high_opp'],
                'color' => '#fb923c',
                'icon' => 'bi-fire',
            ],
        ];

        /* ── KPI strip agregat area (tanpa skor pribadi) ── */
        $configYear = optional(\App\Models\Configuration::first())->target_year;
        $targetYear = (int) ($request->query('tahun') ?: ($configYear ?: date('Y')));
        $prevY = $targetYear - 1;
        $customerIds = Customer::where('area_id', $area->id)->pluck('id');

        $planAgg = \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->whereIn('year', [$targetYear, $prevY])
            ->selectRaw('year, SUM(real_exemplar) as real_sum, SUM(target_exemplar) as target_sum')
            ->groupBy('year')
            ->get()
            ->keyBy('year');

        $totalRealisasiTargetYear = (int) ($planAgg[$targetYear]->real_sum ?? 0);
        $totalRealisasiLaluTargetYear = (int) ($planAgg[$prevY]->real_sum ?? 0);
        $totalRencanaJualTargetYear = (int) ($planAgg[$targetYear]->target_sum ?? 0);

        $totalAreaCover = (int) \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->where('year', $targetYear)
            ->where('is_ac', 1)
            ->distinct('customer_id')
            ->count('customer_id');

        $customerWithRealisasi = (int) \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->where('year', $targetYear)
            ->where('real_exemplar', '>', 0)
            ->distinct('customer_id')
            ->count('customer_id');

        $salesIdsInArea = Customer::where('area_id', $area->id)
            ->whereNotNull('sales_id')
            ->distinct()
            ->pluck('sales_id');
        $activityCount = (int) \App\Models\SalesActivity::whereIn('sales_id', $salesIdsInArea)->count();

        /* ── Komposisi pasar area (fase 3) ── */
        $segmenBreakdown = [
            [
                'label' => 'Negeri (BOS)',
                'value' => (int) Customer::where('area_id', $area->id)->where('sumber_dana', 'BOS')->count(),
                'color' => '#1d4ed8',
            ],
            [
                'label' => 'Swasta',
                'value' => (int) Customer::where('area_id', $area->id)->where('sumber_dana', 'like', 'SWA%')->count(),
                'color' => '#f59e0b',
            ],
        ];

        $prevRealIds = \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->where('year', $prevY)
            ->where('real_exemplar', '>', 0)
            ->pluck('customer_id')
            ->unique();
        $currRealIds = \App\Models\CustomerPlan::whereIn('customer_id', $customerIds)
            ->where('year', $targetYear)
            ->where('real_exemplar', '>', 0)
            ->pluck('customer_id')
            ->unique();

        $customerStatusBreakdown = [
            [
                'label' => 'Baru',
                'value' => $currRealIds->diff($prevRealIds)->count(),
                'color' => '#10b981',
            ],
            [
                'label' => 'Retain',
                'value' => $prevRealIds->intersect($currRealIds)->count(),
                'color' => '#3b82f6',
            ],
            [
                'label' => 'Loss',
                'value' => $prevRealIds->diff($currRealIds)->count(),
                'color' => '#ef4444',
            ],
        ];

        $salesScoreRanking = $this->buildReportRows(
            new \Illuminate\Http\Request([
                'area_id' => $area->id,
                'sort' => 'total_score',
                'dir' => 'desc',
            ]),
            $targetYear
        )->take(10)->values()->all();

        $pageTitle = 'Dashboard Area';
        $displayName = strtoupper($area->name);
        $description = 'Ringkasan performa area dan perbandingan antar cabang dalam ' . ucwords(strtolower($area->name)) . '.';

        return Inertia::render('Monitoring/Area', array_merge($data, [
            'activeNav' => 'area',
            'pageTitle' => $pageTitle,
            'cabangName' => $displayName,
            'areaName' => $displayName,
            'description' => $description,
            'provinceCode' => $area->id,
            'cities' => collect([]),
            'cabangs' => $cabangs,
            'selectedCabang' => $selectedCabang,
            'ranking' => $ranking,
            'uncovered' => $uncovered,
            'gov' => $gov,
            'segmenBreakdown' => $segmenBreakdown,
            'customerStatusBreakdown' => $customerStatusBreakdown,
            'salesScoreRanking' => $salesScoreRanking,
            'insights' => [
                'totalAreaCover' => $totalAreaCover,
                'totalRealisasiTargetYear' => $totalRealisasiTargetYear,
                'totalRealisasiLaluTargetYear' => $totalRealisasiLaluTargetYear,
                'totalRencanaJualTargetYear' => $totalRencanaJualTargetYear,
                'customerWithRealisasi' => $customerWithRealisasi,
                'targetYear' => $targetYear,
                'activityCount' => $activityCount,
                'totalSekolah' => $data['realStats']['total_sekolah'] ?? 0,
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

        return Inertia::render('Monitoring/Pengaturan', [
            'activeNav' => 'setting',
            'status' => session('status'),
            'salesScoreWeights' => $weights,
            'salesScoreWeightLabels' => \App\Models\Configuration::salesScoreWeightLabels(),
            'canEditSalesScoreWeights' => auth()->user()?->level === 'nasional',
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

        $sum = array_sum($weights);
        if (abs($sum - 100) > 0.05) {
            return back()->withErrors([
                'weights' => "Total bobot harus 100%. Saat ini: {$sum}%.",
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
        $listSekolah = $listSekolahQuery->orderBy('name')->get();

        $kegiatanSales = \App\Models\SalesActivity::where('sales_id', $id)->orderBy('id', 'desc')->get();

        // Analytical Data from Sales Activities
        $visitedCount = $kegiatanSales->pluck('customer_id')->filter()->unique()->count();
        $totalCustomers = $listSekolah->count();

        $visitCoverage = [
            ['label' => 'Dikunjungi', 'value' => $visitedCount, 'color' => '#16a34a'],
            ['label' => 'Belum', 'value' => max(0, $totalCustomers - $visitedCount), 'color' => '#e2e8f0'],
        ];

        $activityBreakdown = $kegiatanSales->groupBy('aktivitas')->map(function ($group, $key) {
            $key = empty($key) ? 'Tidak Diketahui' : $key;
            return [
                'label' => $key,
                'value' => $group->count()
            ];
        })->values()->sortByDesc('value')->take(5)->values()->toArray();

        // Define colors for activity breakdown dynamically
        $colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
        foreach ($activityBreakdown as $index => &$item) {
            $item['color'] = $colors[$index % count($colors)];
        }

        $resultBreakdown = $kegiatanSales->groupBy(function ($item) {
            $aktivitas = empty($item->aktivitas) ? 'Tidak Diketahui' : $item->aktivitas;
            $hasil = empty($item->hasil) ? 'Belum Ada Hasil' : $item->hasil;
            return $aktivitas . ' - ' . $hasil;
        })->map(function ($group, $key) {
            return [
                'label' => $key,
                'value' => $group->count()
            ];
        })->values()->sortByDesc('value')->take(5)->values()->toArray();

        $resultColors = ['#10b981', '#8b5cf6', '#f43f5e', '#6366f1', '#eab308'];
        foreach ($resultBreakdown as $index => &$item) {
            $item['color'] = $resultColors[$index % count($resultColors)];
        }

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
            'filters'      => $request->only(['kecamatan', 'tahun']),
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
                    $q->select('customer_id', 'year', 'real_exemplar', 'target_exemplar', 'is_ac');
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
            $listSekolah = $listSekolahQuery->orderBy('name')->get();
            
            $targetYear = $filterTahun ?: (int)date('Y');
            $totalRealisasiTargetYear = 0;
            $totalRealisasiLaluTargetYear = 0;
            $totalRencanaJualTargetYear = 0;
            $customerWithRealisasi = 0;
            $totalAreaCoverTargetYear = 0;
            $acCurrCount = 0;
            $acPrevCount = 0;

            $listSekolah->transform(function ($school) use ($targetYear, &$totalRealisasiTargetYear, &$totalRealisasiLaluTargetYear, &$totalRencanaJualTargetYear, &$customerWithRealisasi, &$totalAreaCoverTargetYear, &$acCurrCount, &$acPrevCount, $year) {
                $plans = $school->customerPlans->groupBy('year')->map(function ($group) {
                    return (object)[
                        'real_exemplar' => $group->sum('real_exemplar'),
                        'target_exemplar' => $group->sum('target_exemplar'),
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
                $school->target_exemplar_current = $plans[$year]->target_exemplar ?? 0;
                $school->real_exemplar_current = $plans[$year]->real_exemplar ?? 0;
                $school->real_exemplar_previous = $plans[$year - 1]->real_exemplar ?? 0;
                // TRLG fields: prev realisasi vs current rencana jual
                $school->prev_realisasi = ($plans[$year - 1]->real_exemplar ?? 0) > 0;
                $school->curr_renjual   = (isset($plans[$year]) && ($plans[$year]->target_exemplar ?? 0) > 0);
                unset($school->customerPlans);
                return $school;
            });

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

            $jenjangBreakdown = $areaCoverSekolah->groupBy(function ($s) {
                return $s->jenjang ?: 'Lainnya';
            })
                ->map(function ($g, $k) {
                    return ['label' => $k, 'value' => $g->count()];
                })->values()->toArray();

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

            $jenjangBreakdown = $assignColor($jenjangBreakdown);
            $sumberDanaBreakdown = $assignColor($sumberDanaBreakdown);
            $segmenBreakdown = $assignColor($segmenBreakdown);
            $siswaBreakdown = $assignColor($siswaBreakdown);

            $activityBreakdown = $kegiatanSales->groupBy('aktivitas')->map(function ($group, $key) {
                $key = empty($key) ? 'Tidak Diketahui' : $key;
                return ['label' => $key, 'value' => $group->count()];
            })->values()->sortByDesc('value')->take(5)->values()->toArray();
            $colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
            foreach ($activityBreakdown as $index => &$item) {
                $item['color'] = $colors[$index % count($colors)];
            }

            $resultBreakdown = $kegiatanSales->groupBy(function ($item) {
                $aktivitas = empty($item->aktivitas) ? 'Tidak Diketahui' : $item->aktivitas;
                $hasil = empty($item->hasil) ? 'Belum Ada Hasil' : $item->hasil;
                return $aktivitas . ' - ' . $hasil;
            })->map(function ($group, $key) {
                return ['label' => $key, 'value' => $group->count()];
            })->values()->sortByDesc('value')->take(5)->values()->toArray();

            $resultColors = ['#10b981', '#8b5cf6', '#f43f5e', '#6366f1', '#eab308'];
            foreach ($resultBreakdown as $index => &$item) {
                $item['color'] = $resultColors[$index % count($resultColors)];
            }

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

            // 1. Realisasi tahun lalu vs tahun ini (growth volume eksemplar)
            $realCurr = (float) $totalRealisasiTargetYear;
            $realPrev = (float) $totalRealisasiLaluTargetYear;
            $realGrowthPct = $realPrev > 0
                ? round((($realCurr - $realPrev) / $realPrev) * 100, 1)
                : ($realCurr > 0 ? 100 : 0);
            if ($realGrowthPct >= 20) {
                $realisasiYoyScore = 100;
            } elseif ($realGrowthPct >= 0) {
                $realisasiYoyScore = 50 + ($realGrowthPct / 20) * 50;
            } else {
                $realisasiYoyScore = max(0, 50 + ($realGrowthPct / 20) * 50);
            }
            $realisasiYoyScore = round($realisasiYoyScore, 1);

            // 2. Aktivitas SP vs Area Cover
            $spCount = $kegiatanSales->filter(function ($item) {
                return strtoupper(trim((string) ($item->aktivitas ?? ''))) === 'SP';
            })->count();
            $areaCoverForScore = max(1, (int) $acCurr);
            $spVsAcPct = round(($spCount / $areaCoverForScore) * 100, 1);
            $spVsAcScore = min(100, $spVsAcPct);

            // 3. Achievement Target (realisasi / rencana jual)
            $targetTotal = (float) $totalRencanaJualTargetYear;
            $achievementPct = $targetTotal > 0
                ? round(($realCurr / $targetTotal) * 100, 1)
                : ($realCurr > 0 ? 100 : 0);
            $achievementScore = min(100, max(0, $achievementPct));

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

            // Total KPI Score = weighted average of 6 indicators
            $scoreWeights = optional(\App\Models\Configuration::orderBy('id', 'desc')->first())
                ?->resolvedSalesScoreWeights()
                ?? \App\Models\Configuration::defaultSalesScoreWeights();

            $scoreMap = [
                'realisasi_yoy' => $realisasiYoyScore,
                'sp_vs_ac' => $spVsAcScore,
                'achievement' => $achievementScore,
                'ac_growth' => $acScore,
                'activity' => $activityScore,
                'realisasi_sekolah' => $realisasiScore,
            ];
            $totalKpiScore = \App\Models\Configuration::computeWeightedSalesScore($scoreMap, $scoreWeights);

            $salesRep = \App\Models\Sales::find($id);
            $kpiData = [
                'salesName' => $salesRep ? $salesRep->name : 'Unknown Sales',
                'totalScore' => $totalKpiScore,
                'grade' => $totalKpiScore >= 80 ? 'Sangat Baik' : ($totalKpiScore >= 60 ? 'Baik' : ($totalKpiScore >= 40 ? 'Cukup' : 'Kurang')),
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
                    ],
                    [
                        'key' => 'sp_vs_ac',
                        'label' => 'SP vs Area Cover',
                        'score' => $spVsAcScore,
                        'weight' => $scoreWeights['sp_vs_ac'] ?? 0,
                        'detail' => "SP {$spCount} vs Area Cover {$acCurr} ({$spVsAcPct}%)",
                        'icon' => 'bi-lightning-charge-fill',
                        'color' => '#f59e0b',
                    ],
                    [
                        'key' => 'achievement',
                        'label' => 'Achievement Target',
                        'score' => $achievementScore,
                        'weight' => $scoreWeights['achievement'] ?? 0,
                        'detail' => "Realisasi " . number_format($realCurr, 0, ',', '.') . " / Target " . number_format($targetTotal, 0, ',', '.') . " ({$achievementPct}%)",
                        'icon' => 'bi-trophy-fill',
                        'color' => '#10b981',
                    ],
                    [
                        'key' => 'ac_growth',
                        'label' => 'Area Cover Growth',
                        'score' => $acScore,
                        'weight' => $scoreWeights['ac_growth'] ?? 0,
                        'detail' => "AC " . ($currentYear - 1) . ": {$acPrev} → AC {$currentYear}: {$acCurr} (" . ($acGrowthPct >= 0 ? '+' : '') . "{$acGrowthPct}%)",
                        'icon' => 'bi-graph-up-arrow',
                        'color' => '#0d9488',
                    ],
                    [
                        'key' => 'activity',
                        'label' => 'Intensitas Aktivitas',
                        'score' => $activityScore,
                        'weight' => $scoreWeights['activity'] ?? 0,
                        'detail' => "Rata-rata {$avgPerMonth} aktivitas/bulan ({$totalActivities} total)",
                        'icon' => 'bi-activity',
                        'color' => '#a855f7',
                    ],
                    [
                        'key' => 'realisasi_sekolah',
                        'label' => 'Realisasi Sekolah',
                        'score' => $realisasiScore,
                        'weight' => $scoreWeights['realisasi_sekolah'] ?? 0,
                        'detail' => "{$sekolahDenganRealisasi} dari {$areaCoverCount} Area Cover ({$realisasiPct}%)",
                        'icon' => 'bi-check2-all',
                        'color' => '#ef4444',
                    ],
                ],
                'extraIndicators' => [],
                'monthlyActivities' => $monthlyActivities,
            ];

            // Activity Distribution for Pie Chart
            $activityDistribution = collect($kegiatanSales)->groupBy('aktivitas')->map(function ($group, $key) {
                return ['label' => empty($key) ? 'Tidak Diketahui' : $key, 'value' => $group->count()];
            })->values()->sortByDesc('value')->values()->toArray();

            $pieColors = ['#1d4ed8', '#0d9488', '#f59e0b', '#dc2626', '#8b5cf6', '#10b981'];
            foreach ($activityDistribution as $index => &$item) {
                $item['color'] = $pieColors[$index % count($pieColors)];
            }
            $kpiData['activityDistribution'] = $activityDistribution;
            $kpiData['areaCover'] = (int) $acCurr;

            // Sumber Dana Distribution
            $sumberDanaDistribution = collect($areaCoverSekolah)->groupBy(function ($s) {
                $sd = strtoupper(trim($s->sumber_dana ?? ''));
                return empty($sd) ? 'LAINNYA/KOSONG' : $sd;
            })->map(function ($group, $key) {
                return ['label' => $key, 'value' => $group->count()];
            })->values()->sortByDesc('value')->values()->toArray();

            $sdColors = ['#059669', '#2563eb', '#d97706', '#9333ea', '#e11d48', '#0891b2'];
            foreach ($sumberDanaDistribution as $index => &$item) {
                $item['color'] = $sdColors[$index % count($sdColors)];
            }
            $kpiData['sumberDana'] = $sumberDanaDistribution;

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
                return [
                    'name' => $s->name,
                    'jenjang' => $s->jenjang,
                    'siswa' => $s->total_student,
                    'status' => ($s->real_exemplar_current > 0) ? 'Customer' : 'Prospek',
                    'grade' => $s->potensi_sekolah ?? '-',
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

            $trlgPerJenjang = [];
            foreach (['SD', 'SMP', 'SMA', 'SMK'] as $jenjang) {
                $trlgPerJenjang[$jenjang] = ['tahan' => 0, 'rebut' => 0, 'lepas' => 0, 'gagal' => 0];
            }

            foreach ($areaCoverSekolah as $s) {
                $jenjang = strtoupper(trim($s->jenjang ?? ''));
                if (empty($jenjang)) $jenjang = 'LAINNYA';
                if (!isset($trlgPerJenjang[$jenjang])) {
                    $trlgPerJenjang[$jenjang] = ['tahan' => 0, 'rebut' => 0, 'lepas' => 0];
                }

                $sumberDana = strtoupper(trim($s->sumber_dana ?? ''));
                if ($sumberDana === 'BOS') {
                    $segmentNegeri++;
                } elseif (strpos($sumberDana, 'SWA') === 0) {
                    $segmentSwasta++;
                }

                // Logika TRLG sesuai RJS:
                // Tahan  = tahun lalu ada realisasi  && tahun ini ada realisasi
                // Rebut  = tahun lalu TIDAK realisasi && tahun ini ada realisasi
                // Lepas  = tahun lalu ada realisasi  && tahun ini TIDAK ada realisasi
                // Gagal  = tahun lalu TIDAK realisasi && tahun ini TIDAK ada realisasi
                $prevReal  = $s->prev_realisasi ?? false;
                $currReal  = ($s->real_exemplar_current ?? 0) > 0;

                if ($prevReal && $currReal) {
                    $customerRetain++;
                    $trlgPerJenjang[$jenjang]['tahan']++;
                } elseif (!$prevReal && $currReal) {
                    $customerBaru++;
                    $trlgPerJenjang[$jenjang]['rebut']++;
                } else {
                    $customerLoss++;
                    $trlgPerJenjang[$jenjang]['lepas']++;
                }
            }
            $kpiData['customerStatus'] = [
                ['label' => 'Baru', 'value' => $customerBaru, 'color' => '#10b981'],
                ['label' => 'Retain', 'value' => $customerRetain, 'color' => '#3b82f6'],
                ['label' => 'Loss', 'value' => $customerLoss, 'color' => '#ef4444'],
            ];

            // Tahan - Rebut - Lepas (TRL)
            $totalTrlg = $customerRetain + $customerBaru + $customerLoss;
            $kpiData['trlg'] = [
                'tahan' => ['count' => $customerRetain, 'pct' => $totalTrlg > 0 ? round(($customerRetain / $totalTrlg) * 100, 2) : 0],
                'rebut' => ['count' => $customerBaru, 'pct' => $totalTrlg > 0 ? round(($customerBaru / $totalTrlg) * 100, 2) : 0],
                'lepas' => ['count' => $customerLoss, 'pct' => $totalTrlg > 0 ? round(($customerLoss / $totalTrlg) * 100, 2) : 0],
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
                if ($counts['tahan'] > 0 || $counts['rebut'] > 0 || $counts['lepas'] > 0) {
                    $trlgTable[] = array_merge(['jenjang' => $j], $counts);
                }
            }
            $kpiData['trlgPerJenjang'] = $trlgTable;

            $kpiData['year'] = $currentYear;
            $kpiData['segmenSekolah'] = [
                ['label' => 'Negeri (BOS)', 'value' => $segmentNegeri, 'color' => '#1d4ed8'],
                ['label' => 'Swasta', 'value' => $segmentSwasta, 'color' => '#f59e0b']
            ];

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
                'listSekolah' => $listSekolah,
                'nonCoverSchools' => $nonCoverSchools,
                'kegiatanSales' => $kegiatanSales,
                'visitCoverage' => $visitCoverage,
                'rencanaJualCoverage' => $rencanaJualCoverage,
                'jenjangBreakdown' => $jenjangBreakdown,
                'sumberDanaBreakdown' => $sumberDanaBreakdown,
                'segmenBreakdown' => $segmenBreakdown,
                'siswaBreakdown' => $siswaBreakdown,
                'activityBreakdown' => $activityBreakdown,
                'resultBreakdown' => $resultBreakdown,
                'salesProfile' => $sales,
                'salesPerformanceFilterOptions' => $filterOptions,
                'salesPerformanceFilters' => $request->only(['area_id', 'cabang_id', 'sales_id', 'kecamatan', 'tahun']),
                'filterOptions' => $filterOptions,
                'filters' => $request->only(['kecamatan', 'tahun']),
                'insights' => [
                    'totalAreaCover' => $totalAreaCoverTargetYear,
                    'totalRealisasiTargetYear' => $totalRealisasiTargetYear ?? 0,
                    'totalRealisasiLaluTargetYear' => $totalRealisasiLaluTargetYear ?? 0,
                    'totalRencanaJualTargetYear' => $totalRencanaJualTargetYear ?? 0,
                    'customerWithRealisasi' => $customerWithRealisasi ?? 0,
                    'targetYear' => $targetYear,
                ],
            ]));
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
     * API endpoint: Return filtered GeoJSON for kecamatan choropleth map
     * Merges desa/kelurahan polygons into kecamatan-level MultiPolygons
     */
    public function salesPerformanceGeoJson(\Illuminate\Http\Request $request)
    {
        $salesId = $request->input('sales_id');
        $cabangId = $request->input('cabang_id');

        if (!$salesId) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $sales = \App\Models\Sales::with('cabang')->find($salesId);
        if (!$sales) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $activeCabangId = $cabangId ?: $sales->cabang_id;

        // Get coverage data per kecamatan for this sales
        $kecamatanData = \App\Models\Customer::where('sales_id', $salesId)
            ->where('cabang_id', $activeCabangId)
            ->whereNotNull('kecamatan_name')
            ->get(['id', 'kecamatan_name', 'is_active', 'total_student', 'penerbit'])
            ->groupBy(function ($c) {
                return mb_strtolower(trim($c->kecamatan_name));
            })
            ->map(function ($group) {
                $compCounts = [];
                foreach ($group as $c) {
                    $p = $c->penerbit ?: 'Tidak Diketahui';
                    $compCounts[$p] = ($compCounts[$p] ?? 0) + 1;
                }
                arsort($compCounts);
                $dominantComp = array_key_first($compCounts);

                return (object)[
                    'kecamatan_name' => $group->first()->kecamatan_name,
                    'total_sekolah' => $group->count(),
                    'sekolah_aktif' => $group->where('is_active', 1)->count(),
                    'potensi_siswa' => $group->sum('total_student'),
                    'dominant_competitor' => $dominantComp,
                    'competitors' => $compCounts,
                ];
            });

        if ($kecamatanData->isEmpty()) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $kecamatanNames = $kecamatanData->keys()->toArray();

        // Read GeoJSON file
        $geojsonPath = base_path('public/geojson/indonesia-districts.json');
        if (!file_exists($geojsonPath)) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $geojsonContent = file_get_contents($geojsonPath);
        $geojson = json_decode($geojsonContent, true);

        if (!$geojson || !isset($geojson['features'])) {
            // Try as FeatureCollection wrapper or array of features
            // The file might be a top-level array of Feature objects
            if (is_array($geojson) && isset($geojson[0]['type'])) {
                $features = $geojson;
            } else {
                return response()->json(['type' => 'FeatureCollection', 'features' => []]);
            }
        } else {
            $features = $geojson['features'];
        }

        // Group desa features by kecamatan name (WADMKC)
        $kecamatanFeatures = [];
        foreach ($features as $feature) {
            if (!isset($feature['properties']['WADMKC']) || !$feature['geometry']) {
                continue;
            }

            $wadmkc = mb_strtolower(trim($feature['properties']['WADMKC']));

            if (!in_array($wadmkc, $kecamatanNames)) {
                continue;
            }

            if (!isset($kecamatanFeatures[$wadmkc])) {
                $kecamatanFeatures[$wadmkc] = [
                    'coordinates' => [],
                    'properties' => $feature['properties'],
                ];
            }

            // Collect all polygon coordinates
            $geom = $feature['geometry'];
            if ($geom['type'] === 'Polygon') {
                $kecamatanFeatures[$wadmkc]['coordinates'][] = $geom['coordinates'];
            } elseif ($geom['type'] === 'MultiPolygon') {
                foreach ($geom['coordinates'] as $poly) {
                    $kecamatanFeatures[$wadmkc]['coordinates'][] = $poly;
                }
            }
        }

        // Build merged GeoJSON features (Polygons)
        $mergedFeatures = [];
        $processedKec = [];
        foreach ($kecamatanFeatures as $kecKey => $kecData) {
            $processedKec[] = $kecKey;
            $coverageInfo = $kecamatanData->get($kecKey);
            $totalSekolah = $coverageInfo->total_sekolah ?? 0;
            $sekolahAktif = $coverageInfo->sekolah_aktif ?? 0;
            $belumTercover = max(0, $totalSekolah - $sekolahAktif);
            $potensiSiswa = $coverageInfo->potensi_siswa ?? 0;
            $coveragePct = $totalSekolah > 0 ? round(($sekolahAktif / $totalSekolah) * 100) : 0;

            $mergedFeatures[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'MultiPolygon',
                    'coordinates' => $kecData['coordinates'],
                ],
                'properties' => [
                    'kecamatan_name' => $coverageInfo->kecamatan_name ?? ucwords($kecKey),
                    'kabupaten' => $kecData['properties']['WADMKK'] ?? '',
                    'provinsi' => $kecData['properties']['WADMPR'] ?? '',
                    'total_sekolah' => $totalSekolah,
                    'sekolah_aktif' => $sekolahAktif,
                    'belum_tercover' => $belumTercover,
                    'potensi_siswa' => $potensiSiswa,
                    'coverage_pct' => $coveragePct,
                    'dominant_competitor' => $coverageInfo->dominant_competitor ?? 'Tidak Diketahui',
                    'competitors' => $coverageInfo->competitors ?? [],
                ],
            ];
        }

        // Add fallback Point features for kecamatans not found in GeoJSON
        foreach ($kecamatanData as $kecKey => $coverageInfo) {
            if (!in_array($kecKey, $processedKec)) {
                // Try to get lat/lng from kecamatans table
                $originalName = $coverageInfo->kecamatan_name;
                $parts = explode(',', $originalName);
                $kecOnly = trim($parts[0]);

                $kecDb = \DB::table('kecamatans')->whereRaw('LOWER(camat_name) = ?', [mb_strtolower($kecOnly)])->first();
                if ($kecDb && $kecDb->geomap) {
                    $geomap = json_decode($kecDb->geomap, true);
                    if ($geomap && isset($geomap['lat']) && isset($geomap['lng'])) {
                        $totalSekolah = $coverageInfo->total_sekolah ?? 0;
                        $sekolahAktif = $coverageInfo->sekolah_aktif ?? 0;
                        $belumTercover = max(0, $totalSekolah - $sekolahAktif);
                        $potensiSiswa = $coverageInfo->potensi_siswa ?? 0;
                        $coveragePct = $totalSekolah > 0 ? round(($sekolahAktif / $totalSekolah) * 100) : 0;

                        $mergedFeatures[] = [
                            'type' => 'Feature',
                            'geometry' => [
                                'type' => 'Point',
                                'coordinates' => [$geomap['lng'], $geomap['lat']], // GeoJSON uses [lng, lat]
                            ],
                            'properties' => [
                                'kecamatan_name' => $originalName,
                                'kabupaten' => '',
                                'provinsi' => '',
                                'total_sekolah' => $totalSekolah,
                                'sekolah_aktif' => $sekolahAktif,
                                'belum_tercover' => $belumTercover,
                                'potensi_siswa' => $potensiSiswa,
                                'coverage_pct' => $coveragePct,
                                'dominant_competitor' => $coverageInfo->dominant_competitor ?? 'Tidak Diketahui',
                                'competitors' => $coverageInfo->competitors ?? [],
                            ],
                        ];
                    }
                }
            }
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $mergedFeatures,
        ]);
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
                DB::raw('COUNT(DISTINCT CASE WHEN customer_plans.is_ac = 1 AND customer_plans.real_exemplar > 0 THEN customers.id END) as sekolah_realisasi')
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
            $realGrowthPct = $realPrev > 0
                ? round((($realCurr - $realPrev) / $realPrev) * 100, 1)
                : ($realCurr > 0 ? 100 : 0);
            if ($realGrowthPct >= 20) {
                $realisasiYoyScore = 100;
            } elseif ($realGrowthPct >= 0) {
                $realisasiYoyScore = 50 + ($realGrowthPct / 20) * 50;
            } else {
                $realisasiYoyScore = max(0, 50 + ($realGrowthPct / 20) * 50);
            }
            $realisasiYoyScore = round($realisasiYoyScore, 1);

            // 2. SP vs Area Cover
            $salesActivities = $activities->get($salesId) ?? collect();
            $spCount = $salesActivities->filter(function ($a) {
                return strtoupper(trim((string) ($a->aktivitas ?? ''))) === 'SP';
            })->count();
            $spVsAcPct = round(($spCount / max(1, $acCurr)) * 100, 1);
            $spVsAcScore = min(100, $spVsAcPct);

            // 3. Achievement Target
            $achievementPct = $targetCurr > 0
                ? round(($realCurr / $targetCurr) * 100, 1)
                : ($realCurr > 0 ? 100 : 0);
            $achievementScore = min(100, max(0, $achievementPct));

            // 4. Area Cover Growth
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
                'ac_growth' => $acScore,
                'activity' => $activityScore,
                'realisasi_sekolah' => $realisasiScore,
            ], $scoreWeights);
            $grade = $totalScore >= 80
                ? 'Sangat Baik'
                : ($totalScore >= 60 ? 'Baik' : ($totalScore >= 40 ? 'Cukup' : 'Kurang'));

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
                    'sp_count' => $spCount,
                    'ac_curr' => $acCurr,
                    'sp_vs_ac_pct' => $spVsAcPct,
                    'achievement_score' => $achievementScore,
                    'target_curr' => $targetCurr,
                    'achievement_pct' => $achievementPct,
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
}
