<?php
$path = __DIR__ . '/../resources/js/Pages/Monitoring/Tabs/DashboardTab.jsx';
$text = file_get_contents($path);
$old = "                                                                                        {metricCells(\n                                                                                            item,\n                                                                                        )}";
$new = "                                                                                        {metricCells(\n                                                                                            item,\n                                                                                            {\n                                                                                                componentType:\n                                                                                                    \"sumber_dana\",\n                                                                                                componentLabelPrefix:\n                                                                                                    \"Sumber Dana\",\n                                                                                            },\n                                                                                        )}";
$count = substr_count($text, $old);
echo "matches=$count\n";
if ($count < 1) {
    exit(1);
}
// replace only first remaining bare call (sumber)
$pos = strpos($text, $old);
$text = substr_replace($text, $new, $pos, strlen($old));
file_put_contents($path, $text);
echo "ok at $pos\n";
