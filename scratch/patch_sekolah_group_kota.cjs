const fs = require("fs");
const path = require("path");

const files = [
    "resources/js/Pages/Monitoring/Tabs/SekolahTabCabang.jsx",
    "resources/js/Pages/Monitoring/Tabs/NonAreaCoverTab.jsx",
];

const startMarker = "                                            // Group: Kecamatan → Jenjang → sekolah";
const endMarker = "                                        })()}";

const newBlock = `                                            // Group: Kota/Kab → Kecamatan → Jenjang → sekolah
                                            const byKota = {};
                                            pageItems.forEach((s) => {
                                                const raw =
                                                    String(
                                                        s.kecamatan_name || "",
                                                    ).trim() ||
                                                    "Tanpa Kecamatan";
                                                const parts = raw
                                                    .split(",")
                                                    .map((p) => p.trim())
                                                    .filter(Boolean);
                                                const kecKey = (
                                                    parts[0] || raw
                                                ).toUpperCase();
                                                const kotaKey =
                                                    parts.length > 1
                                                        ? parts
                                                              .slice(1)
                                                              .join(", ")
                                                              .toUpperCase()
                                                        : "TANPA KOTA/KAB";
                                                const j =
                                                    s.jenjang || "Lainnya";

                                                if (!byKota[kotaKey]) {
                                                    byKota[kotaKey] = {
                                                        label: kotaKey,
                                                        kecamatan: {},
                                                    };
                                                }
                                                if (
                                                    !byKota[kotaKey].kecamatan[
                                                        kecKey
                                                    ]
                                                ) {
                                                    byKota[kotaKey].kecamatan[
                                                        kecKey
                                                    ] = {
                                                        label: kecKey,
                                                        jenjang: {},
                                                    };
                                                }
                                                const kecNode =
                                                    byKota[kotaKey].kecamatan[
                                                        kecKey
                                                    ];
                                                if (!kecNode.jenjang[j]) {
                                                    kecNode.jenjang[j] = [];
                                                }
                                                kecNode.jenjang[j].push(s);
                                            });

                                            const sumMetrics = (schools) => ({
                                                count: schools.length,
                                                ac: schools.filter((s) =>
                                                    isAreaCoverSchool(s),
                                                ).length,
                                                siswa: schools.reduce(
                                                    (a, s) =>
                                                        a +
                                                        (Number(
                                                            s.total_student,
                                                        ) || 0),
                                                    0,
                                                ),
                                                realisasi: schools.reduce(
                                                    (a, s) =>
                                                        a +
                                                        (Number(
                                                            s.real_exemplar_current,
                                                        ) || 0),
                                                    0,
                                                ),
                                                sp: schools.reduce(
                                                    (a, s) =>
                                                        a +
                                                        (Number(
                                                            s.sp_exemplar_current,
                                                        ) || 0),
                                                    0,
                                                ),
                                            });

                                            const renderMetricCells = (
                                                total,
                                                bg,
                                                accent,
                                            ) => (
                                                <>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "center",
                                                            fontWeight: 800,
                                                            color: accent,
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        AC {total.ac}
                                                    </td>
                                                    <td
                                                        colSpan="2"
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                        }}
                                                    />
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "right",
                                                            fontWeight: 800,
                                                            color: accent,
                                                        }}
                                                    >
                                                        {formatNumber(
                                                            total.siswa,
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                        }}
                                                    />
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "right",
                                                            fontWeight: 800,
                                                            color:
                                                                bg === "#1e3a8a"
                                                                    ? "#e9d5ff"
                                                                    : "#7c3aed",
                                                        }}
                                                    >
                                                        {formatNumber(total.sp)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "right",
                                                            fontWeight: 800,
                                                            color:
                                                                bg === "#f1f5f9"
                                                                    ? "#2563eb"
                                                                    : accent,
                                                        }}
                                                    >
                                                        {formatNumber(
                                                            total.realisasi,
                                                        )}
                                                    </td>
                                                </>
                                            );

                                            const sortedKota = Object.keys(
                                                byKota,
                                            ).sort((a, b) =>
                                                a.localeCompare(b, "id", {
                                                    sensitivity: "base",
                                                }),
                                            );

                                            let globalIndex =
                                                (sekolahPage - 1) *
                                                sekolahPerPage;

                                            return sortedKota.map((kotaKey) => {
                                                const kota = byKota[kotaKey];
                                                const sortedKec = Object.keys(
                                                    kota.kecamatan,
                                                ).sort((a, b) =>
                                                    a.localeCompare(b, "id", {
                                                        sensitivity: "base",
                                                    }),
                                                );
                                                const allKotaSchools =
                                                    sortedKec.flatMap(
                                                        (kecKey) =>
                                                            Object.values(
                                                                kota.kecamatan[
                                                                    kecKey
                                                                ].jenjang,
                                                            ).flat(),
                                                    );
                                                const kotaTotal =
                                                    sumMetrics(allKotaSchools);
                                                const kotaLabel =
                                                    kotaKey === "TANPA KOTA/KAB"
                                                        ? "Tanpa Kota/Kab"
                                                        : kota.label;

                                                return (
                                                    <React.Fragment
                                                        key={kotaKey}
                                                    >
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    nameGroupColSpan
                                                                }
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 800,
                                                                    backgroundColor:
                                                                        "#1e3a8a",
                                                                    color: "#fff",
                                                                    textAlign:
                                                                        "left",
                                                                    letterSpacing:
                                                                        "0.02em",
                                                                }}
                                                            >
                                                                Kota/Kab:{" "}
                                                                {kotaLabel}
                                                                <span
                                                                    style={{
                                                                        marginLeft: 8,
                                                                        fontWeight: 600,
                                                                        fontSize: 11,
                                                                        color: "#bfdbfe",
                                                                    }}
                                                                >
                                                                    (
                                                                    {
                                                                        kotaTotal.count
                                                                    }{" "}
                                                                    sekolah · AC{" "}
                                                                    {
                                                                        kotaTotal.ac
                                                                    }
                                                                    )
                                                                </span>
                                                            </td>
                                                            {renderMetricCells(
                                                                kotaTotal,
                                                                "#1e3a8a",
                                                                "#fff",
                                                            )}
                                                        </tr>
                                                        {sortedKec.map(
                                                            (kecKey) => {
                                                                const kec =
                                                                    kota
                                                                        .kecamatan[
                                                                        kecKey
                                                                    ];
                                                                const jenjangKeys =
                                                                    Object.keys(
                                                                        kec.jenjang,
                                                                    ).sort(
                                                                        (
                                                                            a,
                                                                            b,
                                                                        ) =>
                                                                            (jenjangOrder[
                                                                                a
                                                                            ] ||
                                                                                99) -
                                                                            (jenjangOrder[
                                                                                b
                                                                            ] ||
                                                                                99),
                                                                    );
                                                                const allKecSchools =
                                                                    jenjangKeys.flatMap(
                                                                        (jk) =>
                                                                            kec
                                                                                .jenjang[
                                                                                jk
                                                                            ],
                                                                    );
                                                                const kecTotal =
                                                                    sumMetrics(
                                                                        allKecSchools,
                                                                    );

                                                                return (
                                                                    <React.Fragment
                                                                        key={`${kotaKey}-${kecKey}`}
                                                                    >
                                                                        <tr>
                                                                            <td
                                                                                colSpan={
                                                                                    nameGroupColSpan
                                                                                }
                                                                                style={{
                                                                                    ...S.td,
                                                                                    fontWeight: 800,
                                                                                    backgroundColor:
                                                                                        "#dbeafe",
                                                                                    color: "#1e40af",
                                                                                    textAlign:
                                                                                        "left",
                                                                                    letterSpacing:
                                                                                        "0.02em",
                                                                                    paddingLeft: 16,
                                                                                }}
                                                                            >
                                                                                Kecamatan:{" "}
                                                                                {
                                                                                    kec.label
                                                                                }
                                                                                <span
                                                                                    style={{
                                                                                        marginLeft: 8,
                                                                                        fontWeight: 600,
                                                                                        fontSize: 11,
                                                                                        color: "#1d4ed8",
                                                                                    }}
                                                                                >
                                                                                    (
                                                                                    {
                                                                                        kecTotal.count
                                                                                    }{" "}
                                                                                    sekolah · AC{" "}
                                                                                    {
                                                                                        kecTotal.ac
                                                                                    }
                                                                                    )
                                                                                </span>
                                                                            </td>
                                                                            {renderMetricCells(
                                                                                kecTotal,
                                                                                "#dbeafe",
                                                                                "#1e40af",
                                                                            )}
                                                                        </tr>
                                                                        {jenjangKeys.map(
                                                                            (
                                                                                jenjangKey,
                                                                            ) => {
                                                                                const schools =
                                                                                    kec
                                                                                        .jenjang[
                                                                                        jenjangKey
                                                                                    ];
                                                                                const jTotal =
                                                                                    sumMetrics(
                                                                                        schools,
                                                                                    );

                                                                                return (
                                                                                    <React.Fragment
                                                                                        key={`${kotaKey}-${kecKey}-${jenjangKey}`}
                                                                                    >
                                                                                        <tr>
                                                                                            <td
                                                                                                colSpan={
                                                                                                    nameGroupColSpan
                                                                                                }
                                                                                                style={{
                                                                                                    ...S.td,
                                                                                                    fontWeight: 700,
                                                                                                    backgroundColor:
                                                                                                        "#f1f5f9",
                                                                                                    color: T.slate,
                                                                                                    textAlign:
                                                                                                        "left",
                                                                                                    paddingLeft: 28,
                                                                                                }}
                                                                                            >
                                                                                                Jenjang:{" "}
                                                                                                <span
                                                                                                    style={{
                                                                                                        color: T.blue,
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        jenjangKey
                                                                                                    }
                                                                                                </span>
                                                                                                <span
                                                                                                    style={{
                                                                                                        marginLeft: 8,
                                                                                                        fontWeight: 600,
                                                                                                        fontSize: 11,
                                                                                                        color: T.slate,
                                                                                                    }}
                                                                                                >
                                                                                                    (
                                                                                                    {
                                                                                                        jTotal.count
                                                                                                    }{" "}
                                                                                                    sekolah · AC{" "}
                                                                                                    {
                                                                                                        jTotal.ac
                                                                                                    }
                                                                                                    )
                                                                                                </span>
                                                                                            </td>
                                                                                            {renderMetricCells(
                                                                                                jTotal,
                                                                                                "#f1f5f9",
                                                                                                T.slate,
                                                                                            )}
                                                                                        </tr>
                                                                                        {schools.map(
                                                                                            (
                                                                                                s,
                                                                                                idx,
                                                                                            ) => {
                                                                                                globalIndex++;
                                                                                                return (
                                                                                                    <tr
                                                                                                        key={`${kotaKey}-${kecKey}-${jenjangKey}-${idx}`}
                                                                                                        className="table-row-hover"
                                                                                                    >
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "center",
                                                                                                                color: T.slate,
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                globalIndex
                                                                                                            }
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                fontWeight: 700,
                                                                                                                paddingLeft: 28,
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                s.name
                                                                                                            }
                                                                                                        </td>
                                                                                                        {showSalesColumn && (
                                                                                                            <td
                                                                                                                style={{
                                                                                                                    ...S.td,
                                                                                                                    fontWeight: 600,
                                                                                                                    color: T.blue,
                                                                                                                    whiteSpace:
                                                                                                                        "nowrap",
                                                                                                                }}
                                                                                                            >
                                                                                                                {s.sales_name ||
                                                                                                                    "Tanpa Sales"}
                                                                                                            </td>
                                                                                                        )}
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "center",
                                                                                                                whiteSpace:
                                                                                                                    "nowrap",
                                                                                                            }}
                                                                                                        >
                                                                                                            {isAreaCoverSchool(
                                                                                                                s,
                                                                                                            ) ? (
                                                                                                                <span
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            "inline-block",
                                                                                                                        padding:
                                                                                                                            "2px 8px",
                                                                                                                        borderRadius: 6,
                                                                                                                        fontSize: 10,
                                                                                                                        fontWeight: 800,
                                                                                                                        color: "#059669",
                                                                                                                        background:
                                                                                                                            "#05966918",
                                                                                                                        border: "1px solid #05966944",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Area Cover
                                                                                                                </span>
                                                                                                            ) : (
                                                                                                                <span
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            "inline-block",
                                                                                                                        padding:
                                                                                                                            "2px 8px",
                                                                                                                        borderRadius: 6,
                                                                                                                        fontSize: 10,
                                                                                                                        fontWeight: 800,
                                                                                                                        color: "#e11d48",
                                                                                                                        background:
                                                                                                                            "#e11d4818",
                                                                                                                        border: "1px solid #e11d4844",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Non Area Cover
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                            }}
                                                                                                        >
                                                                                                            {s.sumber_dana ||
                                                                                                                "-"}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                            }}
                                                                                                        >
                                                                                                            {s.penerbit ||
                                                                                                                "-"}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "right",
                                                                                                                fontWeight: 600,
                                                                                                            }}
                                                                                                        >
                                                                                                            {formatNumber(
                                                                                                                s.total_student,
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "center",
                                                                                                            }}
                                                                                                        >
                                                                                                            {renderGradeBadge(
                                                                                                                s.school_grade,
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "right",
                                                                                                                fontWeight: 700,
                                                                                                                color: "#7c3aed",
                                                                                                            }}
                                                                                                        >
                                                                                                            {formatNumber(
                                                                                                                s.sp_exemplar_current ??
                                                                                                                    0,
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "right",
                                                                                                                fontWeight: 700,
                                                                                                                color:
                                                                                                                    (Number(
                                                                                                                        s.real_exemplar_current,
                                                                                                                    ) ||
                                                                                                                        0) >
                                                                                                                    0
                                                                                                                        ? T.green
                                                                                                                        : T.slate,
                                                                                                            }}
                                                                                                        >
                                                                                                            {formatNumber(
                                                                                                                s.real_exemplar_current ??
                                                                                                                    0,
                                                                                                            )}
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                );
                                                                                            },
                                                                                        )}
                                                                                    </React.Fragment>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            },
                                                        )}
                                                    </React.Fragment>
                                                );
                                            });
`;

for (const rel of files) {
    const full = path.join(process.cwd(), rel);
    let src = fs.readFileSync(full, "utf8");
    const start = src.indexOf(startMarker);
    const end = src.indexOf(endMarker, start);
    if (start < 0 || end < 0) {
        console.error("markers not found in", rel, { start, end });
        process.exit(1);
    }
    src = src.slice(0, start) + newBlock + src.slice(end);
    fs.writeFileSync(full, src);
    console.log("patched", rel);
}
