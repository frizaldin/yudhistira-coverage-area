<?php
$filepath = __DIR__ . '/../resources/js/Pages/Monitoring/Tabs/DashboardTab.jsx';
$content = file_get_contents($filepath);

$bad_chunk = '                                return (
                                    <div
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: "16px 12px",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                }}
                                            >';

$good_chunk = '                                return (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {/* Row 1: Gauge + KPI Cards */}
                                        <div
                                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[10px]"
                                            style={{
                                                alignItems: "stretch",
                                            }}
                                        >
                                            {/* Gauge Card */}
                                            <div
                                                style={{
                                                    ...S.card,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: "16px 12px",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                }}
                                            >';

// Handle line endings
$bad_chunk = str_replace("\r\n", "\n", $bad_chunk);
$good_chunk = str_replace("\r\n", "\n", $good_chunk);
$content = str_replace("\r\n", "\n", $content);

if (strpos($content, $bad_chunk) !== false) {
    $content = str_replace($bad_chunk, $good_chunk, $content);
} else {
    echo "BAD CHUNK NOT FOUND\n";
}

// Now we also want to remove 'flex: "0 0 200px"', 'flex: 1', 'minWidth: 140' etc. from the 8 columns inside Row 1.
// Since we don't want to break other rows (like Row 2), we will isolate the row 1 chunk.
// Row 1 starts at "Row 1: Gauge + KPI Cards" and ends at "{/* Row 2: "
$row1_start = strpos($content, 'Row 1: Gauge + KPI Cards');
$row2_start = strpos($content, 'Row 2: TRLG & TRLG Per Jenjang');

if ($row1_start !== false && $row2_start !== false) {
    $row1_content = substr($content, $row1_start, $row2_start - $row1_start);
    
    // Remove fixed flex constraints inside row1:
    // flex: 1,
    // flex: "0 0 200px",
    // flex: "0 0 140px",
    // minWidth: 220,
    // minWidth: 200,
    // minWidth: 140,
    // minWidth: 130,
    // minWidth: 180
    $patterns = [
        '/flex:\s*1,\s*\n/i',
        '/flex:\s*"0 0 \d+px",\s*\n/i',
        '/minWidth:\s*\d+,\s*\n/i',
        '/minWidth:\s*0,\s*\n/i', // for minWidth: 0
    ];
    
    $row1_new = preg_replace($patterns, '', $row1_content);
    
    $content = substr_replace($content, $row1_new, $row1_start, $row2_start - $row1_start);
    echo "FLEX constraints removed from Row 1.\n";
} else {
    echo "COULD NOT FIND ROW 1 / ROW 2 boundaries.\n";
}

file_put_contents($filepath, $content);
echo "SUCCESS";
