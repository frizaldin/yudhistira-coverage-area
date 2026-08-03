<?php
$provUrl = "https://raw.githubusercontent.com/ans-4175/peta-indonesia-geojson/master/indonesia-prov.geojson";
$kabUrl = "https://raw.githubusercontent.com/ans-4175/peta-indonesia-geojson/master/indonesia-kab.geojson";
// For kecamatan (which is often used for Cabang dashboard), let's try a known kecamatan source or just rely on kabupaten.
// Actually, Cabang dashboard uses "kecamatan_name" for map ranking!
// So we really need a Kecamatan level geojson if possible.
// Wait, ans-4175 repo does not have indonesia-kec.geojson, but there are others. Let's try downloading from:
$kecUrl = "https://raw.githubusercontent.com/Vian21/geojson-indonesia/master/kecamatan.geojson"; 
// Or let's just write to public directly in powershell using curl if it's easier.
// Let's use this script to try a few known repos.

function downloadFile($url, $dest) {
    echo "Downloading $url...\n";
    $ch = curl_init($url);
    $fp = fopen($dest, 'w+');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);
    if ($statusCode == 200) {
        echo "Success.\n";
    } else {
        echo "Failed with status $statusCode.\n";
    }
}

downloadFile("https://raw.githubusercontent.com/ans-4175/peta-indonesia-geojson/master/indonesia-prov.geojson", __DIR__ . '/../public/geojson/indonesia-provinces.json');

// Try a known kecamatan repo, if not fallback to kabupaten
downloadFile("https://raw.githubusercontent.com/Vian21/geojson-indonesia/master/kecamatan.geojson", __DIR__ . '/../public/geojson/indonesia-districts.json');

