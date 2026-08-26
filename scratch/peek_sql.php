<?php
echo file_get_contents(__DIR__ . '/ddl_wilayah.sql');
echo "\n====\n";
$s = file_get_contents(__DIR__ . '/../public/geojson/wilayah_boundaries_kec_32.sql');
$p = strpos($s, 'INSERT');
echo substr($s, $p, 800) . "\n";
