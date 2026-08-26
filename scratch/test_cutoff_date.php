<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\ImportHistoryService;

$parsed = ImportHistoryService::parseCutoffDateFromFilename('RJS 2 - 31 Juli 2026 - Bogor.xls');
echo 'Parse: ' . ($parsed ? $parsed->format('Y-m-d') : 'null') . PHP_EOL;

$from = ImportHistoryService::cutoffFromDataFolder();
echo 'Folder: ' . json_encode([
    'filename' => $from['filename'] ?? null,
    'file_type' => $from['file_type'] ?? null,
    'cutoff' => isset($from['cutoff']) ? $from['cutoff']->format('Y-m-d') : null,
], JSON_PRETTY_PRINT) . PHP_EOL;

$latest = ImportHistoryService::latest();
echo 'Latest label: ' . ($latest['imported_at_label'] ?? 'null') . PHP_EOL;
echo 'Latest file: ' . ($latest['filename'] ?? '') . PHP_EOL;
echo 'Latest type: ' . ($latest['file_type_label'] ?? '') . PHP_EOL;
