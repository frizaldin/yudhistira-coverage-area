<?php

require __DIR__ . '/../vendor/autoload.php';

$reader = new \PhpOffice\PhpSpreadsheet\Reader\Xlsx();
$reader->setReadDataOnly(true);
$ss = $reader->load(__DIR__ . '/../database/data/m_dapodik.xlsx');
$sheet = $ss->getActiveSheet();
$rows = $sheet->toArray(null, true, true, true);

echo 'rows=' . count($rows) . PHP_EOL;
echo 'header: ' . json_encode(array_values($rows[1] ?? []), JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo 'sample2: ' . json_encode(array_values($rows[2] ?? []), JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo 'sample3: ' . json_encode(array_values($rows[3] ?? []), JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo 'sample10: ' . json_encode(array_values($rows[10] ?? []), JSON_UNESCAPED_UNICODE) . PHP_EOL;
