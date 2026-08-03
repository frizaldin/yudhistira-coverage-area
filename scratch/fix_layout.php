<?php
$file = __DIR__ . '/../resources/js/Layouts/MonitoringLayout.jsx';
$content = file_get_contents($file);
// Add back the trailing comma (without the ,22)
$fixed = str_replace('"monitoring.sales-performance"' . "\r\n        hideForLevels", '"monitoring.sales-performance",' . "\r\n        hideForLevels", $content);
if ($content === $fixed) {
    // Try LF only
    $fixed = str_replace('"monitoring.sales-performance"' . "\n        hideForLevels", '"monitoring.sales-performance",' . "\n        hideForLevels", $content);
}
file_put_contents($file, $fixed);
echo $content === $fixed ? 'NO_CHANGE' : 'FIXED';
