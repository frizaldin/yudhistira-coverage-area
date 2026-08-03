<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesScoreReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        protected Collection $rows,
        protected int $year,
    ) {}

    public function collection(): Collection
    {
        return $this->rows->values()->map(function ($row, $index) {
            $row['_no'] = $index + 1;
            return $row;
        });
    }

    public function title(): string
    {
        return 'Sales Score ' . $this->year;
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Sales',
            'Area',
            'Cabang',
            'Total Sekolah',
            'Score',
            'Grade',
            'Realisasi YoY',
            'Realisasi vs AC',
            'Achievement Target',
            'Tahan vs AC',
            'Rebut vs AC',
            'Lepas vs AC (−)',
        ];
    }

    public function map($row): array
    {
        $c = $row['components'] ?? [];

        return [
            $row['_no'] ?? '',
            $row['sales_name'] ?? '',
            $row['area_name'] ?? '',
            $row['cabang_name'] ?? '',
            $row['total_sekolah'] ?? 0,
            $row['total_score'] ?? 0,
            $row['grade'] ?? '',
            $c['realisasi_yoy_score'] ?? 0,
            $c['sp_vs_ac_score'] ?? 0,
            $c['achievement_score'] ?? 0,
            $c['tahan_vs_ac_score'] ?? 0,
            $c['rebut_vs_ac_score'] ?? 0,
            $c['lepas_vs_ac_score'] ?? 0,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
            ],
        ];
    }
}
