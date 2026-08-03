<?php
require 'vendor/autoload.php';
$file = 'database/data/Data Customer Cabang - Bogor.xlsx';
$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file);
$data = array_slice($spreadsheet->getActiveSheet()->toArray(), 0, 5);
print_r($data);
