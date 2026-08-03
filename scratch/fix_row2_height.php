<?php
$file = __DIR__ . '/../resources/js/Pages/Monitoring/Tabs/DashboardTab.jsx';
$content = file_get_contents($file);

// We need to replace the style block for the card in Column 3, 4, 5, 6
// Let's use preg_replace for each column

// Column 3
$col3_pattern = '/({\/\* Column 3: Grafik Kunjungan \*\/}.*?style={{.*?)(height:\s*"100%",\s*)?(\s*}})/s';
$content = preg_replace_callback('/({\/\* Column 3: Grafik Kunjungan \*\/}.*?)({\s*\.\.\.S\.card,\s*padding:\s*0,\s*overflow:\s*"hidden",\s*display:\s*"flex",\s*flexDirection:\s*"column",)(\s*height:\s*"100%",)?(\s*}})/s', function($matches) {
    return $matches[1] . $matches[2] . "\n                                                        flex: 1," . $matches[4];
}, $content, 1);

// Column 4
$content = preg_replace_callback('/({\/\* Column 4: Distribusi Aktivitas \*\/}.*?)({\s*\.\.\.S\.card,\s*padding:\s*0,\s*overflow:\s*"hidden",\s*display:\s*"flex",\s*flexDirection:\s*"column",)(\s*}})/s', function($matches) {
    return $matches[1] . $matches[2] . "\n                                                        flex: 1," . $matches[3];
}, $content, 1);

// Column 5
$content = preg_replace_callback('/({\/\* Column 5: Segmen Sekolah \(Negeri\/Swasta\) \*\/}.*?)({\s*\.\.\.S\.card,\s*padding:\s*0,\s*overflow:\s*"hidden",\s*display:\s*"flex",\s*flexDirection:\s*"column",)(\s*}})/s', function($matches) {
    return $matches[1] . $matches[2] . "\n                                                        flex: 1," . $matches[3];
}, $content, 1);

// Column 6
$content = preg_replace_callback('/({\/\* Column 6: Sumber Dana \(Komposisi Anggaran\) \*\/}.*?)({\s*\.\.\.S\.card,\s*padding:\s*0,\s*overflow:\s*"hidden",\s*display:\s*"flex",\s*flexDirection:\s*"column",)(\s*}})/s', function($matches) {
    return $matches[1] . $matches[2] . "\n                                                        flex: 1," . $matches[3];
}, $content, 1);

file_put_contents($file, $content);
echo "SUCCESS";
