<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Competitor;

class ImportCompetitor extends Command
{
    protected $signature = 'import:competitor';
    protected $description = 'Import competitors from excel';

    public function handle()
    {
        $path = database_path('data/m_competitor.xlsx');
        if (!file_exists($path)) {
            $this->error('File not found at ' . $path);
            return;
        }

        $spreadsheet = IOFactory::load($path);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        array_shift($rows); // remove header

        foreach ($rows as $row) {
            if (empty($row[0])) continue;
            Competitor::updateOrCreate(
                ['id' => $row[0]],
                ['nama' => $row[1], 'no' => $row[2]]
            );
        }

        $this->info('Competitors imported successfully.');
    }
}
