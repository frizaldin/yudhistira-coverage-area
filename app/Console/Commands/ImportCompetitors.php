<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Competitor;

class ImportCompetitors extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-competitors';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import competitors from m_competitor.xlsx';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = base_path('database/data/m_competitor.xlsx');
        if (!file_exists($filePath)) {
            $this->error('File not found: ' . $filePath);
            return;
        }

        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        $count = 0;
        foreach ($rows as $index => $row) {
            if ($index == 0) continue; // Skip header

            $id = $row[0] ?? null; // ID / Kode
            $nama = $row[1] ?? null; // Nama Competitor

            if ($id && $nama) {
                Competitor::updateOrCreate(
                    ['id' => trim($id)],
                    ['nama' => trim($nama)]
                );
                $count++;
            }
        }

        $this->info("Successfully imported {$count} competitors!");
    }
}
