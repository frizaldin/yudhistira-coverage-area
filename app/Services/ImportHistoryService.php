<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImportHistoryService
{
    public static function fileTypeLabels(): array
    {
        return [
            'rekap_kota' => 'Rekap Kota/Kab',
            'rekap_ac' => 'Rekap Area Cover',
            'rjs' => 'RJS',
            'rjs2' => 'RJS 2',
            'tar' => 'TAR',
            'marketshare_kota' => 'Marketshare Kota',
            'marketshare_kec' => 'Marketshare Kecamatan',
            'data_cabang' => 'Data Cabang',
            'data_customer_cabang' => 'Data Customer Cabang',
            'aktivitas_sales' => 'Aktivitas Sales',
            'master_dapodik' => 'Master Dapodik',
            'province' => 'Provinsi (CSV)',
            'city' => 'Kota/Kab (CSV)',
            'kecamatan' => 'Kecamatan (CSV)',
            'bulk' => 'Import Folder (Bulk)',
        ];
    }

    public static function labelFor(?string $fileType): string
    {
        $labels = self::fileTypeLabels();

        return $labels[$fileType] ?? ($fileType ?: 'Tidak diketahui');
    }

    public static function tablesReady(): bool
    {
        try {
            return Schema::hasTable('import_files') && Schema::hasTable('import_batches');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Parse tanggal cutoff dari nama file, contoh:
     * "RJS 2 - 31 Juli 2026 - Bogor.xls" → 2026-07-31
     * Jika tidak ketemu → null.
     */
    public static function parseCutoffDateFromFilename(?string $filename): ?Carbon
    {
        $name = trim((string) $filename);
        if ($name === '') {
            return null;
        }

        $months = [
            'januari' => 1, 'january' => 1, 'jan' => 1,
            'februari' => 2, 'february' => 2, 'feb' => 2,
            'maret' => 3, 'march' => 3, 'mar' => 3,
            'april' => 4, 'apr' => 4,
            'mei' => 5, 'may' => 5,
            'juni' => 6, 'june' => 6, 'jun' => 6,
            'juli' => 7, 'july' => 7, 'jul' => 7,
            'agustus' => 8, 'august' => 8, 'agu' => 8, 'aug' => 8,
            'september' => 9, 'sep' => 9, 'sept' => 9,
            'oktober' => 10, 'october' => 10, 'okt' => 10, 'oct' => 10,
            'november' => 11, 'nov' => 11,
            'desember' => 12, 'december' => 12, 'des' => 12, 'dec' => 12,
        ];

        // "31 Juli 2026" / "31 July 2026"
        if (preg_match('/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/u', $name, $m)) {
            $day = (int) $m[1];
            $monthKey = mb_strtolower($m[2]);
            $year = (int) $m[3];
            $month = $months[$monthKey] ?? null;
            if ($month && checkdate($month, $day, $year)) {
                return Carbon::create($year, $month, $day, 0, 0, 0, config('app.timezone'));
            }
        }

        // "31-07-2026" / "31/07/2026"
        if (preg_match('/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/', $name, $m)) {
            $day = (int) $m[1];
            $month = (int) $m[2];
            $year = (int) $m[3];
            if (checkdate($month, $day, $year)) {
                return Carbon::create($year, $month, $day, 0, 0, 0, config('app.timezone'));
            }
        }

        // "2026-07-31"
        if (preg_match('/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/', $name, $m)) {
            $year = (int) $m[1];
            $month = (int) $m[2];
            $day = (int) $m[3];
            if (checkdate($month, $day, $year)) {
                return Carbon::create($year, $month, $day, 0, 0, 0, config('app.timezone'));
            }
        }

        return null;
    }

    /**
     * Ambil cutoff dari file RJS 2 / TAR di database/data.
     * Pilih tanggal cutoff terbaru; jika tidak ada tanggal di nama → hari ini.
     *
     * @return array{cutoff: Carbon, filename: string, file_type: string}|null
     */
    public static function cutoffFromDataFolder(): ?array
    {
        $dir = base_path('database/data');
        if (!is_dir($dir)) {
            return null;
        }

        $candidates = [];
        foreach (scandir($dir) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $full = $dir . DIRECTORY_SEPARATOR . $entry;
            if (!is_file($full)) {
                continue;
            }

            $base = pathinfo($entry, PATHINFO_FILENAME);
            $lower = mb_strtolower($base);
            $fileType = null;
            if (preg_match('/^rjs\s*2\b/u', $lower) || str_starts_with($lower, 'rjs 2') || str_starts_with($lower, 'rjs2')) {
                $fileType = 'rjs2';
            } elseif (preg_match('/^tar\b/u', $lower) || str_starts_with($lower, 'tar ')) {
                $fileType = 'tar';
            }
            if (!$fileType) {
                continue;
            }

            $cutoff = self::parseCutoffDateFromFilename($entry);
            $candidates[] = [
                'filename' => $entry,
                'file_type' => $fileType,
                'cutoff' => $cutoff,
                'mtime' => @filemtime($full) ?: 0,
            ];
        }

        if ($candidates === []) {
            return null;
        }

        // Prefer file yang punya tanggal parseable, lalu cutoff terbaru, lalu mtime terbaru
        usort($candidates, static function ($a, $b) {
            $aHas = $a['cutoff'] instanceof Carbon ? 1 : 0;
            $bHas = $b['cutoff'] instanceof Carbon ? 1 : 0;
            if ($aHas !== $bHas) {
                return $bHas <=> $aHas;
            }
            if ($aHas && $bHas) {
                $cmp = $b['cutoff']->timestamp <=> $a['cutoff']->timestamp;
                if ($cmp !== 0) {
                    return $cmp;
                }
            }

            return $b['mtime'] <=> $a['mtime'];
        });

        $best = $candidates[0];
        $cutoff = $best['cutoff'] instanceof Carbon
            ? $best['cutoff']
            : Carbon::now(config('app.timezone'))->startOfDay();

        return [
            'cutoff' => $cutoff,
            'filename' => $best['filename'],
            'file_type' => $best['file_type'],
        ];
    }

    /**
     * Stamp global di semua halaman.
     * Tanggal = cutoff dari nama file RJS 2 / TAR di database/data;
     * jika tidak ada tanggal di nama → hari ini.
     */
    public static function latest(): ?array
    {
        $fromFolder = self::cutoffFromDataFolder();
        if ($fromFolder) {
            $at = $fromFolder['cutoff'];

            return [
                'id' => 0,
                'filename' => $fromFolder['filename'],
                'file_type' => $fromFolder['file_type'],
                'file_type_label' => self::labelFor($fromFolder['file_type']),
                'batch_id' => null,
                'batch_status' => null,
                'batch_type' => null,
                'batch_year' => (int) $at->format('Y'),
                'batch_month' => (int) $at->format('n'),
                'imported_at' => $at->toDateTimeString(),
                'imported_at_label' => $at->format('d/m/Y'),
                'is_cutoff' => true,
            ];
        }

        // Fallback: hari ini jika folder kosong
        $today = Carbon::now(config('app.timezone'))->startOfDay();

        return [
            'id' => 0,
            'filename' => '',
            'file_type' => '',
            'file_type_label' => null,
            'batch_id' => null,
            'batch_status' => null,
            'batch_type' => null,
            'batch_year' => (int) $today->format('Y'),
            'batch_month' => (int) $today->format('n'),
            'imported_at' => $today->toDateTimeString(),
            'imported_at_label' => $today->format('d/m/Y'),
            'is_cutoff' => true,
        ];
    }

    /**
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public static function paginate(int $perPage = 30)
    {
        $paginator = DB::table('import_files as f')
            ->leftJoin('import_batches as b', 'b.id', '=', 'f.batch_id')
            ->orderByDesc('f.created_at')
            ->orderByDesc('f.id')
            ->select([
                'f.id',
                'f.filename',
                'f.file_type',
                'f.created_at',
                'f.updated_at',
                'b.id as batch_id',
                'b.status as batch_status',
                'b.type as batch_type',
                'b.year as batch_year',
                'b.month as batch_month',
            ])
            ->paginate($perPage);

        $paginator->getCollection()->transform(fn ($row) => self::formatRow($row));

        return $paginator;
    }

    public static function record(
        string $filename,
        string $fileType,
        string $batchType = 'yearly',
        string $status = 'success'
    ): int {
        $batchId = DB::table('import_batches')->insertGetId([
            'type' => $batchType,
            'year' => (int) date('Y'),
            'month' => $batchType === 'monthly' ? (int) date('n') : null,
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('import_files')->insert([
            'batch_id' => $batchId,
            'filename' => $filename,
            'file_type' => $fileType,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $batchId;
    }

    private static function formatRow(object $row): array
    {
        $filename = (string) ($row->filename ?? '');
        $fileType = (string) ($row->file_type ?? '');
        $cutoff = null;

        // Untuk RJS / RJS 2 / TAR: tampilkan tanggal cutoff dari nama file bila ada
        if (in_array($fileType, ['rjs2', 'tar', 'rjs'], true)) {
            $cutoff = self::parseCutoffDateFromFilename($filename);
        }

        if ($cutoff) {
            $at = $cutoff;
            $label = $at->format('d/m/Y');
        } else {
            $atRaw = $row->created_at ?? null;
            $at = $atRaw
                ? Carbon::parse($atRaw)->timezone(config('app.timezone'))
                : null;
            $label = $at ? $at->format('d/m/Y H:i') : null;
        }

        return [
            'id' => (int) ($row->id ?? 0),
            'filename' => $filename,
            'file_type' => $fileType,
            'file_type_label' => self::labelFor($fileType ?: null),
            'batch_id' => isset($row->batch_id) ? (int) $row->batch_id : null,
            'batch_status' => $row->batch_status ?? null,
            'batch_type' => $row->batch_type ?? null,
            'batch_year' => isset($row->batch_year) ? (int) $row->batch_year : null,
            'batch_month' => isset($row->batch_month) ? (int) $row->batch_month : null,
            'imported_at' => $at ? $at->toDateTimeString() : null,
            'imported_at_label' => $label,
            'is_cutoff' => (bool) $cutoff,
        ];
    }
}
