import React, { useEffect, useMemo, useState } from "react";
import { T, Card } from "./SalesPerformanceShared";

const JENJANG_ORDER = ["SD", "SMP", "SMA", "SMK"];

function parseKecamatanName(raw) {
    const full = String(raw || "").trim();
    if (!full) {
        return { base: "TANPA KECAMATAN", kotaKab: null, display: "Tanpa Kecamatan" };
    }
    const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
        const base = parts[0].toUpperCase();
        const kotaKab = parts.slice(1).join(", ").toUpperCase();
        return { base, kotaKab, display: `${base}, ${kotaKab}` };
    }
    return {
        base: parts[0].toUpperCase(),
        kotaKab: null,
        display: parts[0].toUpperCase(),
    };
}

function emptyTotals() {
    return {
        count: 0,
        siswa: 0,
        realYm3: 0,
        realYm2: 0,
        potensiPrev: 0,
        spPrev: 0,
        realPrev: 0,
        potensiCurr: 0,
        spCurr: 0,
        realCurr: 0,
    };
}

function addSchoolToTotals(acc, s) {
    acc.count += 1;
    acc.siswa += Number(s.total_student) || 0;
    acc.realYm3 += Number(s.real_exemplar_ym3) || 0;
    acc.realYm2 += Number(s.real_exemplar_ym2) || 0;
    acc.potensiPrev += Number(s.potential_exemplar_previous) || 0;
    acc.spPrev += Number(s.sp_exemplar_previous) || 0;
    acc.realPrev += Number(s.real_exemplar_previous) || 0;
    acc.potensiCurr += Number(s.potential_exemplar_current) || 0;
    acc.spCurr += Number(s.sp_exemplar_current) || 0;
    acc.realCurr += Number(s.real_exemplar_current) || 0;
    return acc;
}

/** Tab Prospek — dashboard Sales (duplikat mandiri dari JenjangFocusTab). */
export default function ProspekTab(props) {
    const {
        listSekolah,
        configuration,
        insights,
        filters,
        groupByCabang = false,
        focusFilter = null,
        kegiatanSales = [],
    } = props;

    const [nameFilter, setNameFilter] = useState("");
    const [kotaFilter, setKotaFilter] = useState("");
    const [cabangFilter, setCabangFilter] = useState("");
    const [sort, setSort] = useState({ key: "name", dir: "asc" });
    // key yang ada di Set = collapsed (disembunyikan)
    const [collapsedCabang, setCollapsedCabang] = useState(() => new Set());
    const [collapsedKota, setCollapsedKota] = useState(() => new Set());
    const [collapsedKec, setCollapsedKec] = useState(() => new Set());
    const [collapsedJenjang, setCollapsedJenjang] = useState(() => new Set());

    useEffect(() => {
        if (!focusFilter) return;
        const kota = String(focusFilter.kotaKab || "").trim();
        const cabang = String(focusFilter.cabang || "").trim();
        if (groupByCabang && cabang) {
            setCabangFilter(cabang);
        }
        if (kota) {
            setKotaFilter(kota);
        }
        setNameFilter("");
        // buka group terkait
        if (groupByCabang && cabang) {
            setCollapsedCabang((prev) => {
                const next = new Set(prev);
                next.delete(cabang);
                return next;
            });
        }
        if (kota) {
            setCollapsedKota((prev) => {
                const next = new Set(prev);
                next.delete(kota);
                next.delete(kota.toUpperCase());
                return next;
            });
        }
    }, [focusFilter, groupByCabang]);

    const toggleCabang = (key) => {
        setCollapsedCabang((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleKota = (key) => {
        setCollapsedKota((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleKec = (kotaKey, kecKey) => {
        const key = `${kotaKey}::${kecKey}`;
        setCollapsedKec((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleJenjang = (kotaKey, kecKey, jenjang) => {
        const key = `${kotaKey}::${kecKey}::${jenjang}`;
        setCollapsedJenjang((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const currYear = Number(
        filters?.tahun ||
            insights?.targetYear ||
            configuration?.target_year ||
            2026,
    );
    const prevYear = currYear - 1;
    const ym2 = currYear - 2;
    const ym3 = currYear - 3;

    const areaCoverSchools = useMemo(
        () => (listSekolah || []).filter((s) => s.is_active == 1),
        [listSekolah],
    );

    const cabangOptions = useMemo(() => {
        if (!groupByCabang) return [];
        const set = new Set();
        areaCoverSchools.forEach((s) => {
            set.add(s.cabang_name || "Tanpa Cabang");
        });
        return [...set].sort((a, b) => a.localeCompare(b, "id"));
    }, [areaCoverSchools, groupByCabang]);

    const kotaOptions = useMemo(() => {
        const set = new Set();
        areaCoverSchools.forEach((s) => {
            if (groupByCabang && cabangFilter) {
                const cn = s.cabang_name || "Tanpa Cabang";
                if (cn !== cabangFilter) return;
            }
            const parsed = parseKecamatanName(s.kecamatan_name);
            set.add(parsed.kotaKab || "TANPA KOTA/KAB");
        });
        return [...set].sort((a, b) => a.localeCompare(b, "id"));
    }, [areaCoverSchools, groupByCabang, cabangFilter]);

    const filteredSorted = useMemo(() => {
        const q = nameFilter.trim().toLowerCase();
        let rows = areaCoverSchools;
        if (groupByCabang && cabangFilter) {
            rows = rows.filter(
                (s) => (s.cabang_name || "Tanpa Cabang") === cabangFilter,
            );
        }
        if (kotaFilter) {
            rows = rows.filter((s) => {
                const parsed = parseKecamatanName(s.kecamatan_name);
                const kota = parsed.kotaKab || "TANPA KOTA/KAB";
                return kota === kotaFilter;
            });
        }
        if (q) {
            rows = rows.filter((s) =>
                String(s.name || "")
                    .toLowerCase()
                    .includes(q),
            );
        }

        const dir = sort.dir === "asc" ? 1 : -1;
        const key = sort.key;
        return [...rows].sort((a, b) => {
            if (key === "name") {
                return (
                    String(a.name || "").localeCompare(String(b.name || ""), "id", {
                        sensitivity: "base",
                    }) * dir
                );
            }
            const av = Number(a[key]) || 0;
            const bv = Number(b[key]) || 0;
            if (av === bv) {
                return String(a.name || "").localeCompare(String(b.name || ""), "id", {
                    sensitivity: "base",
                });
            }
            return (av - bv) * dir;
        });
    }, [areaCoverSchools, nameFilter, kotaFilter, cabangFilter, groupByCabang, sort]);

    const totalItems = filteredSorted.length;

    const grouped = useMemo(() => {
        const sortJenjang = (a, b) => {
            const ia = JENJANG_ORDER.indexOf(a.jenjang);
            const ib = JENJANG_ORDER.indexOf(b.jenjang);
            const oa = ia === -1 ? 99 : ia;
            const ob = ib === -1 ? 99 : ib;
            if (oa !== ob) return oa - ob;
            return a.jenjang.localeCompare(b.jenjang);
        };

        const buildKotaList = (schools) => {
            const kotaMap = {};
            schools.forEach((s) => {
                const parsed = parseKecamatanName(s.kecamatan_name);
                const kotaKey = parsed.kotaKab || "TANPA KOTA/KAB";
                const kotaDisplay = parsed.kotaKab || "Tanpa Kota/Kab";
                const kecKey = parsed.base || "TANPA KECAMATAN";
                const kecDisplay = parsed.base || "Tanpa Kecamatan";

                if (!kotaMap[kotaKey]) {
                    kotaMap[kotaKey] = {
                        key: kotaKey,
                        display: kotaDisplay,
                        kecamatanMap: {},
                        totals: emptyTotals(),
                    };
                }
                if (!kotaMap[kotaKey].kecamatanMap[kecKey]) {
                    kotaMap[kotaKey].kecamatanMap[kecKey] = {
                        key: kecKey,
                        display: kecDisplay,
                        jenjangMap: {},
                        totals: emptyTotals(),
                    };
                }

                const j =
                    String(s.jenjang || "Lainnya").toUpperCase().trim() ||
                    "Lainnya";
                const kec = kotaMap[kotaKey].kecamatanMap[kecKey];
                if (!kec.jenjangMap[j]) {
                    kec.jenjangMap[j] = {
                        jenjang: j,
                        schools: [],
                        totals: emptyTotals(),
                    };
                }
                kec.jenjangMap[j].schools.push(s);
                addSchoolToTotals(kec.jenjangMap[j].totals, s);
                addSchoolToTotals(kec.totals, s);
                addSchoolToTotals(kotaMap[kotaKey].totals, s);
            });

            return Object.values(kotaMap)
                .sort((a, b) => a.display.localeCompare(b.display, "id"))
                .map((kota) => {
                    const kecamatanList = Object.values(kota.kecamatanMap)
                        .sort((a, b) =>
                            a.display.localeCompare(b.display, "id"),
                        )
                        .map((kec) => ({
                            ...kec,
                            jenjangList: Object.values(kec.jenjangMap).sort(
                                sortJenjang,
                            ),
                        }));
                    return { ...kota, kecamatanList };
                });
        };

        if (!groupByCabang) {
            return buildKotaList(filteredSorted).map((kota) => ({
                ...kota,
                _type: "kota",
            }));
        }

        const cabangMap = {};
        filteredSorted.forEach((s) => {
            const cn = s.cabang_name || "Tanpa Cabang";
            if (!cabangMap[cn]) {
                cabangMap[cn] = {
                    key: cn,
                    display: cn,
                    schools: [],
                    totals: emptyTotals(),
                    _type: "cabang",
                };
            }
            cabangMap[cn].schools.push(s);
            addSchoolToTotals(cabangMap[cn].totals, s);
        });

        return Object.values(cabangMap)
            .sort((a, b) => a.display.localeCompare(b.display, "id"))
            .map((cab) => ({
                ...cab,
                kotaList: buildKotaList(cab.schools).map((k) => ({
                    ...k,
                    key: `${cab.key}::${k.key}`,
                })),
            }));
    }, [filteredSorted, groupByCabang]);

    // Nomor berurutan antar group (aman untuk render React)
    const groupedWithNo = useMemo(() => {
        let no = 0;
        const numberKota = (kota) => ({
            ...kota,
            kecamatanList: kota.kecamatanList.map((kec) => ({
                ...kec,
                jenjangList: kec.jenjangList.map((jg) => ({
                    ...jg,
                    schools: jg.schools.map((s) => {
                        no += 1;
                        return { ...s, _rowNo: no };
                    }),
                })),
            })),
        });

        if (!groupByCabang) {
            return grouped.map(numberKota);
        }
        return grouped.map((cab) => ({
            ...cab,
            kotaList: cab.kotaList.map(numberKota),
        }));
    }, [grouped, groupByCabang]);

    const toggleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: key === "name" ? "asc" : "desc" },
        );
    };

    const sortMark = (key) => {
        if (sort.key !== key) return "";
        return sort.dir === "asc" ? " ↑" : " ↓";
    };

    // Tinggi baris 1 thead (group Real / tahun) agar baris 2 sticky tepat di bawahnya
    const TH_ROW1_H = 28;
    const thBase = {
        padding: "5px 6px",
        color: T.slate,
        fontWeight: 700,
        fontSize: 10,
        borderBottom: `1px solid ${T.border}`,
        borderRight: `1px solid ${T.border}`,
        background: "#f8fafc",
        whiteSpace: "nowrap",
        textAlign: "center",
        userSelect: "none",
        position: "sticky",
        zIndex: 4,
    };
    const thLeft = { ...thBase, textAlign: "left" };
    const thCenter = { ...thBase, textAlign: "center" };
    const tdBase = {
        padding: "4px 6px",
        color: T.slate,
        fontSize: 10.5,
        borderRight: `1px solid ${T.border}`,
    };
    const tdCenter = {
        ...tdBase,
        textAlign: "center",
        whiteSpace: "nowrap",
    };
    const tdLeft = {
        ...tdBase,
        textAlign: "left",
    };

    const sortableTh = (label, key, extra = {}) => (
        <th
            onClick={() => toggleSort(key)}
            title="Klik untuk sortir"
            style={{
                ...thCenter,
                top: TH_ROW1_H,
                cursor: "pointer",
                ...extra,
            }}
        >
            {label}
            {sortMark(key)}
        </th>
    );

    const totals = filteredSorted.reduce(
        (acc, s) => addSchoolToTotals(acc, s),
        emptyTotals(),
    );

    const fmt = (n) => new Intl.NumberFormat("id-ID").format(n || 0);
    const color = T.green;
    // No, Nama, Siswa, Real×3, Curr×3, Status, Aktivitas
    const colCount = 11;

    const activityColor = (label) => {
        const map = {
            Pendekatan: "#64748b",
            Promosi: "#0d9488",
            SP: "#1d4ed8",
            Faktur: "#16a34a",
            Penagihan: "#f59e0b",
            Gagal: "#dc2626",
        };
        return map[label] || "#64748b";
    };

    const normalizeSchoolName = (name) =>
        String(name || "")
            .toUpperCase()
            .replace(/\s+/g, " ")
            .trim();

    const activitiesBySchool = useMemo(() => {
        const byId = {};
        const byName = {};
        (kegiatanSales || []).forEach((k) => {
            const akt = String(k.aktivitas || "").trim();
            if (!akt) return;
            const cid = k.customer_id;
            if (cid) {
                if (!byId[cid]) byId[cid] = {};
                byId[cid][akt] = (byId[cid][akt] || 0) + 1;
            }
            const n = normalizeSchoolName(k.customer_name);
            if (n) {
                if (!byName[n]) byName[n] = {};
                byName[n][akt] = (byName[n][akt] || 0) + 1;
            }
        });
        return { byId, byName };
    }, [kegiatanSales]);

    const getSchoolActivities = (s) => {
        const acts =
            (s?.id && activitiesBySchool.byId[s.id]) ||
            activitiesBySchool.byName[normalizeSchoolName(s?.name)] ||
            {};
        return Object.entries(acts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => ({ label, count }));
    };

    /** Tahan = ada real tahun ini; Rekomendasi = ada real di 2 thn sebelumnya; Ambil Alih = tidak ada real 3 thn (ym2–curr) */
    const getSchoolStatus = (s) => {
        const curr = Number(s?.real_exemplar_current) || 0;
        const prev = Number(s?.real_exemplar_previous) || 0;
        const y2 = Number(s?.real_exemplar_ym2) || 0;
        if (curr > 0) return "Tahan";
        if (prev > 0 || y2 > 0) return "Rekomendasi";
        return "Ambil Alih";
    };

    const statusStyle = (status) => {
        if (status === "Tahan") return { bg: "#dcfce7", fg: "#16a34a" };
        if (status === "Rekomendasi") return { bg: "#dbeafe", fg: "#2563eb" };
        return { bg: "#fee2e2", fg: "#dc2626" }; // Ambil Alih
    };

    // Normalisasi: flat (cabang) = list kota; area = list cabang → kotaList
    const renderRoots = groupByCabang
        ? groupedWithNo
        : [
              {
                  key: "__flat__",
                  display: null,
                  kotaList: groupedWithNo,
                  totals: null,
              },
          ];

    const metricCells = (t, opts = {}) => {
        const {
            bold = false,
            lastColor = T.text,
            borderRightLast,
        } = opts;
        const cell = (value, extra = {}) => (
            <td
                style={{
                    ...tdCenter,
                    color: T.text,
                    fontWeight: bold ? 800 : 600,
                    ...extra,
                }}
            >
                {fmt(value)}
            </td>
        );
        return (
            <>
                {cell(t.siswa)}
                {cell(t.realYm3)}
                {cell(t.realYm2)}
                {cell(t.realPrev)}
                {cell(t.potensiCurr)}
                {cell(t.spCurr)}
                {cell(t.realCurr, {
                    color: lastColor,
                    fontWeight: bold ? 800 : 700,
                    ...(borderRightLast !== undefined
                        ? { borderRight: borderRightLast }
                        : {}),
                })}
                <td style={{ ...tdCenter, color: "#94a3b8" }}>—</td>
                <td style={{ ...tdLeft, color: "#94a3b8" }}>—</td>
            </>
        );
    };

    /** Sel kosong untuk baris grup tanpa subtotal (kecamatan / jenjang). */
    const blankMetricCells = () => (
        <>
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} style={tdCenter} />
            ))}
            <td style={tdCenter} />
            <td style={{ ...tdLeft, borderRight: "none" }} />
        </>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                }}
            >
                <div
                    style={{
                        width: 3,
                        height: 18,
                        background: T.blue,
                        borderRadius: 3,
                    }}
                />
                <h2
                    style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: T.text,
                        margin: 0,
                    }}
                >
                    Rekapan Area Cover {currYear}
                </h2>
            </div>

            <Card
                title="Prospek"
                style={{
                    flex: 1,
                    minWidth: 300,
                    display: "flex",
                    flexDirection: "column",
                }}
                noPad
            >
                <div
                    style={{
                        padding: "6px 10px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        background: "#fff",
                    }}
                >
                    <div style={{ fontSize: 10, color: T.slate }}>
                        Menampilkan{" "}
                        <strong style={{ color: T.text }}>{totalItems}</strong>{" "}
                        sekolah (filter) · total AC {areaCoverSchools.length} ·
                        klik Kota/Kab / Kecamatan / Jenjang untuk hide-show · Real{" "}
                        {ym3}–{prevYear} · {currYear} Potensi/SP/Real · Status ·
                        Aktivitas
                        {groupByCabang ? " · grouping Cabang → Kota/Kab" : ""}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        {groupByCabang && (
                            <select
                                value={cabangFilter}
                                onChange={(e) => {
                                    setCabangFilter(e.target.value);
                                    setKotaFilter("");
                                }}
                                style={{
                                    minWidth: 160,
                                    maxWidth: 220,
                                    padding: "5px 8px",
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    fontSize: 11,
                                    outline: "none",
                                    color: T.text,
                                    background: "#f8fafc",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="">Semua Cabang</option>
                                {cabangOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={kotaFilter}
                            onChange={(e) => setKotaFilter(e.target.value)}
                            style={{
                                minWidth: 160,
                                maxWidth: 220,
                                padding: "5px 8px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                fontSize: 11,
                                outline: "none",
                                color: T.text,
                                background: "#f8fafc",
                                cursor: "pointer",
                            }}
                        >
                            <option value="">Semua Kota/Kab</option>
                            {kotaOptions.map((kota) => (
                                <option key={kota} value={kota}>
                                    {kota === "TANPA KOTA/KAB"
                                        ? "Tanpa Kota/Kab"
                                        : kota}
                                </option>
                            ))}
                        </select>
                        <div style={{ position: "relative", minWidth: 180 }}>
                            <i
                                className="bi bi-search"
                                style={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: 11,
                                    color: "#94a3b8",
                                }}
                            />
                            <input
                                type="text"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                placeholder="Filter nama sekolah..."
                                style={{
                                    width: "100%",
                                    padding: "5px 8px 5px 26px",
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    fontSize: 11,
                                    outline: "none",
                                    color: T.text,
                                    background: "#f8fafc",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        overflow: "auto",
                        flex: 1,
                        maxHeight: "calc(100vh - 210px)",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            textAlign: "left",
                            fontSize: 10.5,
                            minWidth: 980,
                        }}
                    >
                        <thead>
                            <tr>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        width: 36,
                                        verticalAlign: "middle",
                                    }}
                                >
                                    No
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("name")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...thLeft,
                                        top: 0,
                                        minWidth: 150,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                    }}
                                >
                                    Nama Sekolah{sortMark("name")}
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("total_student")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...thCenter,
                                        top: 0,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                    }}
                                >
                                    Jml Siswa{sortMark("total_student")}
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        background: "#f1f5f9",
                                        color: T.slate,
                                    }}
                                >
                                    Real
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        background: "#eff6ff",
                                        color: T.blue,
                                    }}
                                >
                                    {currYear}
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        verticalAlign: "middle",
                                        background: "#f8fafc",
                                    }}
                                >
                                    Status
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        verticalAlign: "middle",
                                        background: "#f8fafc",
                                        borderRight: "none",
                                    }}
                                >
                                    Aktivitas
                                </th>
                            </tr>
                            <tr>
                                {sortableTh(String(ym3), "real_exemplar_ym3")}
                                {sortableTh(String(ym2), "real_exemplar_ym2")}
                                {sortableTh(
                                    String(prevYear),
                                    "real_exemplar_previous",
                                )}
                                {sortableTh(
                                    "Potensi",
                                    "potential_exemplar_current",
                                )}
                                {sortableTh("SP", "sp_exemplar_current")}
                                {sortableTh("Real", "real_exemplar_current")}
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                style={{
                                    background: "#eff6ff",
                                    borderBottom: `1px solid ${T.border}`,
                                    fontWeight: 700,
                                }}
                            >
                                <td style={tdBase}>—</td>
                                <td
                                    style={{
                                        ...tdBase,
                                        color: T.blue,
                                        fontWeight: 800,
                                    }}
                                >
                                    Total ({totals.count} sekolah)
                                </td>
                                {metricCells(totals, {
                                    bold: true,
                                    lastColor: color,
                                })}
                            </tr>

                            {groupedWithNo.length > 0 ? (
                                renderRoots.map((root) => {
                                    const showCabang = !!root.display;
                                    const cabangOpen =
                                        !showCabang ||
                                        !collapsedCabang.has(root.key);
                                    return (
                                        <React.Fragment key={root.key}>
                                            {showCabang && (
                                                <tr
                                                    onClick={() =>
                                                        toggleCabang(root.key)
                                                    }
                                                    title={
                                                        cabangOpen
                                                            ? "Klik untuk sembunyikan"
                                                            : "Klik untuk tampilkan"
                                                    }
                                                    style={{
                                                        background: cabangOpen
                                                            ? "#93c5fd"
                                                            : "#94a3b8",
                                                        borderBottom: `1px solid ${T.border}`,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            textAlign: "center",
                                                            color: T.blue,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        <i
                                                            className={`bi bi-chevron-${cabangOpen ? "down" : "right"}`}
                                                            style={{ fontSize: 11 }}
                                                        />
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...tdBase,
                                                            color: "#0f172a",
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 6,
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-diagram-3"
                                                                style={{
                                                                    fontSize: 11,
                                                                }}
                                                            />
                                                            {root.display}
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
                                                                    color: T.slate,
                                                                    fontSize: 10,
                                                                }}
                                                            >
                                                                (
                                                                {
                                                                    root.totals
                                                                        .count
                                                                }{" "}
                                                                sekolah)
                                                            </span>
                                                        </span>
                                                    </td>
                                                    {metricCells(root.totals, {
                                                        bold: true,
                                                        lastColor: color,
                                                    })}
                                                </tr>
                                            )}
                                            {cabangOpen &&
                                                (root.kotaList || []).map(
                                                    (kota) => {
                                                        const kotaOpen =
                                                            !collapsedKota.has(
                                                                kota.key,
                                                            );
                                                        return (
                                                            <React.Fragment
                                                                key={kota.key}
                                                            >
                                            <tr
                                                onClick={() =>
                                                    toggleKota(kota.key)
                                                }
                                                title={
                                                    kotaOpen
                                                        ? "Klik untuk sembunyikan"
                                                        : "Klik untuk tampilkan"
                                                }
                                                style={{
                                                    background: kotaOpen
                                                        ? "#bfdbfe"
                                                        : "#cbd5e1",
                                                    borderBottom: `1px solid ${T.border}`,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: "center",
                                                        color: T.blue,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    <i
                                                        className={`bi bi-chevron-${kotaOpen ? "down" : "right"}`}
                                                        style={{ fontSize: 11 }}
                                                    />
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: "#1e3a8a",
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <i
                                                            className="bi bi-building"
                                                            style={{ fontSize: 11 }}
                                                        />
                                                        {kota.display}
                                                        <span
                                                            style={{
                                                                fontWeight: 600,
                                                                color: T.slate,
                                                                fontSize: 10,
                                                            }}
                                                        >
                                                            ({kota.totals.count}{" "}
                                                            sekolah)
                                                        </span>
                                                    </span>
                                                </td>
                                                {metricCells(kota.totals, {
                                                    bold: true,
                                                    lastColor: color,
                                                })}
                                            </tr>

                                            {kotaOpen &&
                                                kota.kecamatanList.map((kec) => {
                                                    const kecFullKey = `${kota.key}::${kec.key}`;
                                                    const kecOpen =
                                                        !collapsedKec.has(kecFullKey);
                                                    return (
                                                        <React.Fragment
                                                            key={kecFullKey}
                                                        >
                                                            <tr
                                                                onClick={() =>
                                                                    toggleKec(
                                                                        kota.key,
                                                                        kec.key,
                                                                    )
                                                                }
                                                                title={
                                                                    kecOpen
                                                                        ? "Klik untuk sembunyikan"
                                                                        : "Klik untuk tampilkan"
                                                                }
                                                                style={{
                                                                    background: kecOpen
                                                                        ? "#dbeafe"
                                                                        : "#e2e8f0",
                                                                    borderBottom: `1px solid ${T.border}`,
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        ...tdBase,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.blue,
                                                                        fontWeight: 800,
                                                                    }}
                                                                >
                                                                    <i
                                                                        className={`bi bi-chevron-${kecOpen ? "down" : "right"}`}
                                                                        style={{
                                                                            fontSize: 11,
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...tdBase,
                                                                        color: "#1e40af",
                                                                        fontWeight: 800,
                                                                        paddingLeft: 14,
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            display:
                                                                                "inline-flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 6,
                                                                        }}
                                                                    >
                                                                        <i
                                                                            className="bi bi-geo-alt-fill"
                                                                            style={{
                                                                                fontSize: 11,
                                                                            }}
                                                                        />
                                                                        {kec.display}
                                                                        <span
                                                                            style={{
                                                                                fontWeight: 600,
                                                                                color: T.slate,
                                                                                fontSize: 10,
                                                                            }}
                                                                        >
                                                                            (
                                                                            {
                                                                                kec.totals
                                                                                    .count
                                                                            }{" "}
                                                                            sekolah)
                                                                        </span>
                                                                    </span>
                                                                </td>
                                                                {blankMetricCells()}
                                                            </tr>

                                                            {kecOpen &&
                                                                kec.jenjangList.map(
                                                                    (jg) => {
                                                                        const jKey = `${kota.key}::${kec.key}::${jg.jenjang}`;
                                                                        const jOpen =
                                                                            !collapsedJenjang.has(
                                                                                jKey,
                                                                            );
                                                                        return (
                                                                            <React.Fragment
                                                                                key={jKey}
                                                                            >
                                                                                <tr
                                                                                    onClick={() =>
                                                                                        toggleJenjang(
                                                                                            kota.key,
                                                                                            kec.key,
                                                                                            jg.jenjang,
                                                                                        )
                                                                                    }
                                                                                    title={
                                                                                        jOpen
                                                                                            ? "Klik untuk sembunyikan"
                                                                                            : "Klik untuk tampilkan"
                                                                                    }
                                                                                    style={{
                                                                                        background:
                                                                                            jOpen
                                                                                                ? "#f1f5f9"
                                                                                                : "#eef2f7",
                                                                                        borderBottom: `1px solid ${T.border}`,
                                                                                        cursor: "pointer",
                                                                                    }}
                                                                                >
                                                                                    <td
                                                                                        style={{
                                                                                            ...tdBase,
                                                                                            textAlign:
                                                                                                "center",
                                                                                            color: T.slate,
                                                                                        }}
                                                                                    >
                                                                                        <i
                                                                                            className={`bi bi-chevron-${jOpen ? "down" : "right"}`}
                                                                                            style={{
                                                                                                fontSize: 10,
                                                                                            }}
                                                                                        />
                                                                                    </td>
                                                                                    <td
                                                                                        style={{
                                                                                            ...tdBase,
                                                                                            color: T.text,
                                                                                            fontWeight: 800,
                                                                                            paddingLeft: 28,
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            jg.jenjang
                                                                                        }
                                                                                        <span
                                                                                            style={{
                                                                                                marginLeft: 6,
                                                                                                fontWeight: 600,
                                                                                                color: T.slate,
                                                                                                fontSize: 10,
                                                                                            }}
                                                                                        >
                                                                                            (
                                                                                            {
                                                                                                jg
                                                                                                    .totals
                                                                                                    .count
                                                                                            }

                                                                                            )
                                                                                        </span>
                                                                                    </td>
                                                                                    {blankMetricCells()}
                                                                                </tr>

                                                                                {jOpen &&
                                                                                    jg.schools.map(
                                                                                        (
                                                                                            s,
                                                                                        ) => (
                                                                                            <tr
                                                                                                key={
                                                                                                    s.id ||
                                                                                                    `${jKey}-${s._rowNo}`
                                                                                                }
                                                                                                style={{
                                                                                                    borderBottom: `1px solid ${T.border}`,
                                                                                                    transition:
                                                                                                        "background 0.15s",
                                                                                                }}
                                                                                                onMouseEnter={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    (e.currentTarget.style.background =
                                                                                                        "#f8fafc")
                                                                                                }
                                                                                                onMouseLeave={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    (e.currentTarget.style.background =
                                                                                                        "white")
                                                                                                }
                                                                                            >
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...tdBase,
                                                                                                        textAlign:
                                                                                                            "center",
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        s._rowNo
                                                                                                    }
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...tdBase,
                                                                                                        fontWeight: 600,
                                                                                                        color: T.text,
                                                                                                        paddingLeft: 40,
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        s.name
                                                                                                    }
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...tdCenter,
                                                                                                        fontWeight: 600,
                                                                                                    }}
                                                                                                >
                                                                                                    {fmt(
                                                                                                        s.total_student ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td style={tdCenter}>
                                                                                                    {fmt(
                                                                                                        s.real_exemplar_ym3 ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td style={tdCenter}>
                                                                                                    {fmt(
                                                                                                        s.real_exemplar_ym2 ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td style={tdCenter}>
                                                                                                    {fmt(
                                                                                                        s.real_exemplar_previous ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td style={tdCenter}>
                                                                                                    {fmt(
                                                                                                        s.potential_exemplar_current ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td style={tdCenter}>
                                                                                                    {fmt(
                                                                                                        s.sp_exemplar_current ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...tdCenter,
                                                                                                        color,
                                                                                                        fontWeight: 700,
                                                                                                    }}
                                                                                                >
                                                                                                    {fmt(
                                                                                                        s.real_exemplar_current ||
                                                                                                            0,
                                                                                                    )}
                                                                                                </td>
                                                                                                {(() => {
                                                                                                    const status =
                                                                                                        getSchoolStatus(
                                                                                                            s,
                                                                                                        );
                                                                                                    const st =
                                                                                                        statusStyle(
                                                                                                            status,
                                                                                                        );
                                                                                                    return (
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...tdCenter,
                                                                                                                padding:
                                                                                                                    "4px 6px",
                                                                                                            }}
                                                                                                        >
                                                                                                            <span
                                                                                                                style={{
                                                                                                                    padding:
                                                                                                                        "2px 6px",
                                                                                                                    borderRadius: 4,
                                                                                                                    fontSize: 9,
                                                                                                                    fontWeight: 700,
                                                                                                                    background:
                                                                                                                        st.bg,
                                                                                                                    color: st.fg,
                                                                                                                    whiteSpace:
                                                                                                                        "nowrap",
                                                                                                                }}
                                                                                                            >
                                                                                                                {
                                                                                                                    status
                                                                                                                }
                                                                                                            </span>
                                                                                                        </td>
                                                                                                    );
                                                                                                })()}
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...tdLeft,
                                                                                                        maxWidth: 200,
                                                                                                        borderRight:
                                                                                                            "none",
                                                                                                    }}
                                                                                                >
                                                                                                    {(() => {
                                                                                                        const acts =
                                                                                                            getSchoolActivities(
                                                                                                                s,
                                                                                                            );
                                                                                                        if (
                                                                                                            !acts.length
                                                                                                        ) {
                                                                                                            return (
                                                                                                                <span
                                                                                                                    style={{
                                                                                                                        color: "#94a3b8",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    —
                                                                                                                </span>
                                                                                                            );
                                                                                                        }
                                                                                                        return (
                                                                                                            <div
                                                                                                                style={{
                                                                                                                    display:
                                                                                                                        "flex",
                                                                                                                    flexWrap:
                                                                                                                        "wrap",
                                                                                                                    gap: 3,
                                                                                                                }}
                                                                                                            >
                                                                                                                {acts.map(
                                                                                                                    (
                                                                                                                        a,
                                                                                                                    ) => (
                                                                                                                        <span
                                                                                                                            key={
                                                                                                                                a.label
                                                                                                                            }
                                                                                                                            style={{
                                                                                                                                display:
                                                                                                                                    "inline-flex",
                                                                                                                                padding:
                                                                                                                                    "1px 5px",
                                                                                                                                borderRadius: 4,
                                                                                                                                fontSize: 9,
                                                                                                                                fontWeight: 700,
                                                                                                                                background: `${activityColor(a.label)}18`,
                                                                                                                                color: activityColor(
                                                                                                                                    a.label,
                                                                                                                                ),
                                                                                                                                whiteSpace:
                                                                                                                                    "nowrap",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            {
                                                                                                                                a.label
                                                                                                                            }{" "}
                                                                                                                            {
                                                                                                                                a.count
                                                                                                                            }
                                                                                                                        </span>
                                                                                                                    ),
                                                                                                                )}
                                                                                                            </div>
                                                                                                        );
                                                                                                    })()}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ),
                                                                                    )}
                                                                            </React.Fragment>
                                                                        );
                                                                    },
                                                                )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </React.Fragment>
                                                        );
                                                    },
                                                )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={colCount}
                                        style={{
                                            padding: "16px",
                                            textAlign: "center",
                                            color: T.slate,
                                            fontSize: 11,
                                        }}
                                    >
                                        {nameFilter.trim()
                                            ? "Tidak ada sekolah yang cocok dengan filter"
                                            : "Tidak ada data"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
