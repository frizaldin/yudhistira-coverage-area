<?php
$filepath = __DIR__ . '/../resources/js/Pages/Monitoring/Tabs/DashboardTab.jsx';
$content = file_get_contents($filepath);

$start_marker = '                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        padding: "14px 16px",
                                                        gap: 10,
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >';

$end_marker = '                                                </div>
                                            </div>
                                        </div>
                                        {/* Column 3: Grafik Kunjungan */}';

// We need to replace the content between $start_marker and the closing </div> before $end_marker.
// Let's use string manipulation based on known lines.
// Actually, let's just find the start of the <div style={{ flex: 1, ...}}> and the end.

$new_block = '                                                {(() => {
                                                    const r25 = Number(insights?.totalRealisasi2025 || 0);
                                                    const rj26 = Number(insights?.totalRencanaJual2026 || 0);
                                                    const gap = rj26 - r25;
                                                    const gapPercent = r25 > 0 ? (gap / r25) * 100 : (rj26 > 0 ? 100 : 0);
                                                    const gapColor = gap > 0 ? "#10b981" : (gap < 0 ? "#ef4444" : T.slate);
                                                    const gapIcon = gap > 0 ? "bi-arrow-up-right" : (gap < 0 ? "bi-arrow-down-right" : "bi-dash");
                                                    const gapPrefix = gap > 0 ? "+" : "";
                                                    
                                                    return (
                                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 16px", gap: 10, justifyContent: "center" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                                                <div style={{ fontSize: 10, color: T.slate, fontWeight: 600 }}>Realisasi 2025</div>
                                                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{r25.toLocaleString("id-ID")}</div>
                                                            </div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                                                                <div style={{ fontSize: 10, color: T.slate, fontWeight: 600 }}>Rencana 2026</div>
                                                                <div style={{ fontSize: 14, fontWeight: 800, color: "#0ea5e9" }}>{rj26.toLocaleString("id-ID")}</div>
                                                            </div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #e2e8f0", paddingTop: 8, marginTop: 2 }}>
                                                                <div style={{ fontSize: 10, color: T.slate, fontWeight: 600 }}>Gap</div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                    <div style={{ fontSize: 12, fontWeight: 800, color: gapColor }}>
                                                                        {gapPrefix}{gap.toLocaleString("id-ID")}
                                                                    </div>
                                                                    <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${gapColor}15`, color: gapColor, display: "flex", alignItems: "center" }}>
                                                                        <i className={`bi ${gapIcon}`} style={{ fontSize: 9, marginRight: 4 }} />
                                                                        {gapPrefix}{gapPercent.toFixed(1)}%
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}';

// Let's normalize the file content to find the block
$content = str_replace("\r\n", "\n", $content);
$start_marker = str_replace("\r\n", "\n", $start_marker);

$pos_start = strpos($content, $start_marker);
if ($pos_start !== false) {
    // Find where the column ends
    $end_search = '                                            </div>
                                        </div>
                                        {/* Column 3: Grafik Kunjungan */}';
    
    $pos_end = strpos($content, $end_search, $pos_start);
    if ($pos_end !== false) {
        $content = substr_replace($content, $new_block . "\n", $pos_start, $pos_end - $pos_start);
        file_put_contents($filepath, $content);
        echo "SUCCESS";
    } else {
        echo "END MARKER NOT FOUND";
    }
} else {
    echo "START MARKER NOT FOUND";
}
