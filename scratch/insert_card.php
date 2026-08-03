<?php
$filepath = __DIR__ . '/../resources/js/Pages/Monitoring/Tabs/DashboardTab.jsx';
$content = file_get_contents($filepath);

// Detect line ending
$lineEnding = (strpos($content, "\r\n") !== false) ? "\r\n" : "\n";
$le = $lineEnding;

// Build marker - end of Column 6 div, then Row 1 closing div, before Row 2 comment
// Line 1416: "                                            </div>"
// Line 1417: "                                        </div>"
// Line 1418: ""
// Line 1419: "                                        {/* Row 2:"
$marker = '                                            </div>' . $le
        . '                                        </div>' . $le
        . $le
        . '                                        {/* Row 2:';

$newCard = '                                            </div>' . $le
         . $le
         . '                                            {/* Column 7: Total Area Cover */}' . $le
         . '                                            <div' . $le
         . '                                                style={{' . $le
         . '                                                    flex: "0 0 140px",' . $le
         . '                                                    display: "flex",' . $le
         . '                                                    flexDirection: "column",' . $le
         . '                                                    minWidth: 130,' . $le
         . '                                                }}' . $le
         . '                                            >' . $le
         . '                                                <div' . $le
         . '                                                    style={{' . $le
         . '                                                        ...S.card,' . $le
         . '                                                        padding: 0,' . $le
         . '                                                        overflow: "hidden",' . $le
         . '                                                        flex: 1,' . $le
         . '                                                        display: "flex",' . $le
         . '                                                        flexDirection: "column",' . $le
         . '                                                    }}' . $le
         . '                                                >' . $le
         . '                                                    <div' . $le
         . '                                                        style={{' . $le
         . '                                                            padding: "10px 14px",' . $le
         . '                                                            borderBottom: `1px solid ${T.border}`,' . $le
         . '                                                            display: "flex",' . $le
         . '                                                            alignItems: "center",' . $le
         . '                                                            gap: 8,' . $le
         . '                                                            background: "#f8fafc",' . $le
         . '                                                        }}' . $le
         . '                                                    >' . $le
         . '                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>' . $le
         . '                                                            <i className="bi bi-building-check" style={{ fontSize: 12, color: "#7c3aed" }} />' . $le
         . '                                                        </div>' . $le
         . '                                                        <div>' . $le
         . '                                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>Total Area Cover</div>' . $le
         . '                                                            <div style={{ fontSize: 9.5, color: T.slate, marginTop: 1 }}>Sekolah ter-cover sales</div>' . $le
         . '                                                        </div>' . $le
         . '                                                    </div>' . $le
         . '                                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 12px", gap: 6 }}>' . $le
         . '                                                        <div style={{ fontSize: 40, fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>' . $le
         . '                                                            {insights?.totalAreaCover ?? listSekolah?.length ?? 0}' . $le
         . '                                                        </div>' . $le
         . '                                                        <div style={{ fontSize: 10, color: T.slate, fontWeight: 500 }}>Sekolah</div>' . $le
         . '                                                        <div style={{ padding: "3px 10px", borderRadius: 20, background: "#ede9fe", color: "#7c3aed", fontSize: 10, fontWeight: 700 }}>Area Cover</div>' . $le
         . '                                                    </div>' . $le
         . '                                                </div>' . $le
         . '                                            </div>' . $le
         . '                                        </div>' . $le
         . $le
         . '                                        {/* Row 2:';

if (strpos($content, $marker) !== false) {
    $newContent = str_replace($marker, $newCard, $content);
    file_put_contents($filepath, $newContent);
    echo 'SUCCESS: Card inserted!' . PHP_EOL;
    echo 'File size changed from ' . strlen($content) . ' to ' . strlen($newContent) . ' bytes.' . PHP_EOL;
} else {
    echo 'MARKER_NOT_FOUND' . PHP_EOL;
    echo 'Line ending type: ' . ($lineEnding === "\r\n" ? 'CRLF' : 'LF') . PHP_EOL;

    // Debug: show what we actually have around line 1415-1420
    $lines = explode($lineEnding, $content);
    echo 'Lines around 1415-1420:' . PHP_EOL;
    for ($i = 1413; $i <= 1419; $i++) {
        echo "[$i]: " . json_encode($lines[$i] ?? 'N/A') . PHP_EOL;
    }
}
