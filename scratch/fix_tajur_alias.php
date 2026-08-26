<?php
$path = __DIR__ . '/../app/Http/Controllers/MonitoringController.php';
$c = file_get_contents($path);
$keySpace = 'tajur' . ' ' . 'halang';

// Fix only the duplicate inside buildCabangKotaGeoJson
$needle = "private function buildCabangKotaGeoJson";
$pos = strpos($c, $needle);
if ($pos === false) {
    fwrite(STDERR, "method not found\n");
    exit(1);
}

$before = substr($c, 0, $pos);
$after = substr($c, $pos);

$old = "'tajurhalang' => 'tajurhalang',\n                'tajurhalang' => 'tajurhalang',";
$new = "'tajurhalang' => 'tajurhalang',\n                '{$keySpace}' => 'tajurhalang',";

$count = 0;
$after2 = str_replace($old, $new, $after, $count);
echo "replacements=$count key=[$keySpace]\n";
if ($count > 0) {
    file_put_contents($path, $before . $after2);
    echo "ok\n";
} else {
    // show nearby lines
    if (preg_match_all("/'tajur[^']*halang' => '[^']*'/", $after, $m)) {
        foreach ($m[0] as $line) {
            echo $line . ' hex=' . bin2hex($line) . "\n";
        }
    }
}
