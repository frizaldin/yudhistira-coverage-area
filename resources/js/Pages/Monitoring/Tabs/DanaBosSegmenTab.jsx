import React, { useCallback, useMemo, useState } from "react";
import { T, Card } from "./SalesPerformanceShared";

function emptyTotals() {
    return {
        count: 0,
        siswa: 0,
        realYm3: 0,
        realYm2: 0,
        spPrev: 0,
        realPrev: 0,
        spCurr: 0,
        realCurr: 0,
        acPrev: 0,
        acCurr: 0,
        custReal: 0,
        totalCust: 0,
        salesmen: {},
    };
}

function mergeSalesmenInto(target, ids, names) {
    const idArr = Array.isArray(ids) ? ids : [];
    const nameArr = Array.isArray(names) ? names : [];
    if (idArr.length > 0) {
        idArr.forEach((id, i) => {
            const n = Number(id);
            if (!(n > 0)) return;
            const nm = String(nameArr[i] || target[n] || "").trim();
            target[n] = nm || `Sales #${n}`;
        });
        return target;
    }
    nameArr.forEach((name) => {
        const nm = String(name || "").trim();
        if (!nm) return;
        target[`n:${nm}`] = nm;
    });
    return target;
}

function salesmanNamesFromMap(map) {
    return Object.values(map || {})
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b), "id"));
}

function addRowToTotals(acc, s) {
    acc.count += 1;
    acc.siswa += Number(s.total_student) || 0;
    acc.realYm3 += Number(s.real_exemplar_ym3) || 0;
    acc.realYm2 += Number(s.real_exemplar_ym2) || 0;
    acc.spPrev += Number(s.sp_exemplar_previous) || 0;
    acc.realPrev += Number(s.real_exemplar_previous) || 0;
    acc.spCurr += Number(s.sp_exemplar_current) || 0;
    acc.realCurr += Number(s.real_exemplar_current) || 0;
    acc.acPrev += Number(s.ac_prev) || 0;
    acc.acCurr += Number(s.ac_curr) || Number(s.school_count) || 0;
    acc.custReal += Number(s.cust_real) || 0;
    acc.totalCust += Number(s.total_cust) || 0;
    mergeSalesmenInto(acc.salesmen, s.salesman_ids, s.salesman_names);
    return acc;
}

function areaToTotals(a) {
    const salesmen = {};
    mergeSalesmenInto(salesmen, a.salesman_ids, a.salesman_names);
    return {
        count: Number(a.count) || 0,
        siswa: Number(a.total_student) || 0,
        realYm3: Number(a.real_exemplar_ym3) || 0,
        realYm2: Number(a.real_exemplar_ym2) || 0,
        spPrev: Number(a.sp_exemplar_previous) || 0,
        realPrev: Number(a.real_exemplar_previous) || 0,
        spCurr: Number(a.sp_exemplar_current) || 0,
        realCurr: Number(a.real_exemplar_current) || 0,
        acPrev: Number(a.ac_prev) || 0,
        acCurr: Number(a.ac_curr) || 0,
        custReal: Number(a.cust_real) || 0,
        totalCust: Number(a.total_cust) || 0,
        salesmen,
    };
}

function marketsharePct(custReal, totalCust) {
    const den = Number(totalCust) || 0;
    if (den <= 0) return 0;
    return Math.round(((Number(custReal) || 0) / den) * 1000) / 10;
}

function potensiFromSiswa(siswa) {
    return Math.round((Number(siswa) || 0) * 1.5);
}

function realVsPotensiPct(real, siswa) {
    const pot = potensiFromSiswa(siswa);
    if (pot <= 0) return 0;
    return Math.round(((Number(real) || 0) / pot) * 1000) / 10;
}

function parseKota(raw) {
    const full = String(raw || "").trim();
    if (!full) return { kec: "TANPA KECAMATAN", kota: "TANPA KOTA/KAB" };
    const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
        return {
            kec: parts[0].toUpperCase(),
            kota: parts.slice(1).join(", ").toUpperCase(),
        };
    }
    return { kec: parts[0].toUpperCase(), kota: "TANPA KOTA/KAB" };
}

function groupRowsByHierarchy(list) {
    const areaMap = {};
    list.forEach((s) => {
        const an = s.area_name || "Tanpa Area";
        const cn = s.cabang_name || "Tanpa Cabang";
        const { kota, kec } = parseKota(s.kecamatan_name);
        const kotaKey = kota;
        const kotaDisplay =
            kota === "TANPA KOTA/KAB" ? "Tanpa Kota/Kab" : kota;

        if (!areaMap[an]) {
            areaMap[an] = {
                key: an,
                display: an,
                totals: emptyTotals(),
                cabangMap: {},
            };
        }
        if (!areaMap[an].cabangMap[cn]) {
            areaMap[an].cabangMap[cn] = {
                key: `${an}::${cn}`,
                display: cn,
                totals: emptyTotals(),
                kotaMap: {},
            };
        }
        const cab = areaMap[an].cabangMap[cn];
        if (!cab.kotaMap[kotaKey]) {
            cab.kotaMap[kotaKey] = {
                key: `${an}::${cn}::${kotaKey}`,
                display: kotaDisplay,
                totals: emptyTotals(),
                rows: [],
            };
        }
        cab.kotaMap[kotaKey].rows.push({
            ...s,
            _kecDisplay: kec === "TANPA KECAMATAN" ? "Tanpa Kecamatan" : kec,
        });
        addRowToTotals(cab.kotaMap[kotaKey].totals, s);
        addRowToTotals(cab.totals, s);
        addRowToTotals(areaMap[an].totals, s);
    });

    let no = 0;
    return Object.values(areaMap)
        .sort((a, b) => a.display.localeCompare(b.display, "id"))
        .map((area) => ({
            ...area,
            cabangList: Object.values(area.cabangMap)
                .sort((a, b) => a.display.localeCompare(b.display, "id"))
                .map((cab) => ({
                    ...cab,
                    kotaList: Object.values(cab.kotaMap)
                        .sort((a, b) =>
                            a.display.localeCompare(b.display, "id"),
                        )
                        .map((kota) => ({
                            ...kota,
                            rows: kota.rows.map((r) => {
                                no += 1;
                                return { ...r, _rowNo: no };
                            }),
                        })),
                })),
        }));
}

/**
 * Tabel Segmen Dana BOS — initial load Area saja; anak lazy-load saat expand.
 */
export default function DanaBosSegmenTab({
    listSegmenArea = [],
    configuration,
    insights,
    filters,
}) {
    const currYear = Number(
        filters?.tahun ||
            insights?.targetYear ||
            configuration?.target_year ||
            new Date().getFullYear(),
    );
    const prevYear = currYear - 1;
    const ym2 = currYear - 2;
    const ym3 = currYear - 3;

    const [areaFilter, setAreaFilter] = useState("");
    const [expandArea, setExpandArea] = useState(() => new Set());
    const [expandCabang, setExpandCabang] = useState(() => new Set());
    const [expandKota, setExpandKota] = useState(() => new Set());
    const [childrenByArea, setChildrenByArea] = useState({});
    const [loadingAreas, setLoadingAreas] = useState(() => new Set());

    const areas = useMemo(() => {
        let list = Array.isArray(listSegmenArea) ? listSegmenArea : [];
        if (areaFilter) {
            list = list.filter((a) => (a.display || a.area_name) === areaFilter);
        }
        return [...list].sort((a, b) =>
            String(a.display || a.area_name || "").localeCompare(
                String(b.display || b.area_name || ""),
                "id",
            ),
        );
    }, [listSegmenArea, areaFilter]);

    const areaOptions = useMemo(() => {
        const set = new Set();
        (listSegmenArea || []).forEach((a) =>
            set.add(a.display || a.area_name || "Tanpa Area"),
        );
        return [...set].sort((a, b) => a.localeCompare(b, "id"));
    }, [listSegmenArea]);

    const totals = useMemo(() => {
        return (listSegmenArea || []).reduce((acc, a) => {
            const t = areaToTotals(a);
            acc.count += t.count;
            acc.siswa += t.siswa;
            acc.realYm3 += t.realYm3;
            acc.realYm2 += t.realYm2;
            acc.spPrev += t.spPrev;
            acc.realPrev += t.realPrev;
            acc.spCurr += t.spCurr;
            acc.realCurr += t.realCurr;
            acc.acPrev += t.acPrev;
            acc.acCurr += t.acCurr;
            acc.custReal += t.custReal;
            acc.totalCust += t.totalCust;
            Object.entries(t.salesmen || {}).forEach(([id, name]) => {
                acc.salesmen[id] = name;
            });
            return acc;
        }, emptyTotals());
    }, [listSegmenArea]);

    const loadAreaChildren = useCallback(
        async (area) => {
            const key = area.key || area.display || area.area_name;
            if (childrenByArea[key] || loadingAreas.has(key)) return;

            setLoadingAreas((prev) => new Set(prev).add(key));
            try {
                const params = new URLSearchParams();
                params.set("tahun", String(currYear));
                params.set("area_name", area.display || area.area_name || "");
                if (area.area_id !== undefined && area.area_id !== null) {
                    params.set("area_id", String(area.area_id));
                }
                if (filters?.cabang_id) {
                    params.set("cabang_id", String(filters.cabang_id));
                }
                const url =
                    (typeof route === "function"
                        ? route("monitoring.dana-bos.segmen-children")
                        : "/monitoring/dana-bos/segmen-children") +
                    `?${params.toString()}`;
                const res = await fetch(url, {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    credentials: "same-origin",
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const rows = Array.isArray(data?.rows) ? data.rows : [];
                setChildrenByArea((prev) => ({
                    ...prev,
                    [key]: groupRowsByHierarchy(rows),
                }));
            } catch (e) {
                console.error(e);
                setChildrenByArea((prev) => ({ ...prev, [key]: [] }));
            } finally {
                setLoadingAreas((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        },
        [childrenByArea, loadingAreas, currYear, filters?.cabang_id],
    );

    const toggleArea = (area) => {
        const key = area.key || area.display || area.area_name;
        setExpandArea((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else {
                next.add(key);
                loadAreaChildren(area);
            }
            return next;
        });
    };

    const toggle = (setter) => (key) => {
        setter((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };
    const toggleCabang = toggle(setExpandCabang);
    const toggleKota = toggle(setExpandKota);

    const fmt = (n) => new Intl.NumberFormat("id-ID").format(n || 0);
    const fmtPct = (n) =>
        `${new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(Number(n) || 0)}%`;
    const color = T.green;
    const colCount = 12;

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
    };
    const thLeft = { ...thBase, textAlign: "left" };
    const tdBase = {
        padding: "4px 6px",
        color: T.slate,
        fontSize: 10.5,
        borderRight: `1px solid ${T.border}`,
    };
    const tdCenter = { ...tdBase, textAlign: "center", whiteSpace: "nowrap" };

    const salesmanCell = (t, opts = {}) => {
        const { bold = false } = opts;
        const names = Array.isArray(t?.salesmanNames)
            ? t.salesmanNames
            : salesmanNamesFromMap(t?.salesmen);
        const count = names.length;
        const full = names.join(", ");
        const short =
            names.length <= 2
                ? full
                : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
        return (
            <td
                style={{
                    ...tdBase,
                    minWidth: 140,
                    maxWidth: 220,
                    fontWeight: bold ? 700 : 600,
                    color: count > 0 ? T.text : T.slate,
                    whiteSpace: "normal",
                    lineHeight: 1.25,
                }}
                title={full || "Tidak ada salesman"}
            >
                <div style={{ fontWeight: bold ? 800 : 700, color: "#0369a1" }}>
                    {fmt(count)}
                </div>
                <div
                    style={{
                        fontSize: 9.5,
                        color: T.slate,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                    }}
                >
                    {short || "—"}
                </div>
            </td>
        );
    };

    const metricCells = (t, opts = {}) => {
        const { bold = false, lastColor = color } = opts;
        const pot = potensiFromSiswa(t.siswa);
        const pctCurr = realVsPotensiPct(t.realCurr, t.siswa);
        const ms = marketsharePct(t.custReal, t.totalCust);
        const cell = (v, extra = {}) => (
            <td
                style={{
                    ...tdCenter,
                    fontWeight: bold ? 700 : 600,
                    ...extra,
                }}
            >
                {fmt(v)}
            </td>
        );
        const pctCell = (v, extra = {}) => (
            <td
                style={{
                    ...tdCenter,
                    fontWeight: bold ? 800 : 700,
                    color:
                        v >= 70
                            ? "#16a34a"
                            : v >= 40
                              ? "#ca8a04"
                              : v > 0
                                ? "#dc2626"
                                : T.slate,
                    ...extra,
                }}
            >
                {fmtPct(v)}
            </td>
        );
        return (
            <>
                {salesmanCell(t, { bold })}
                {cell(t.siswa)}
                {cell(pot)}
                {cell(t.realYm3)}
                {cell(t.realYm2)}
                {cell(t.realPrev)}
                {cell(t.spCurr)}
                {cell(t.realCurr, {
                    color: lastColor,
                    fontWeight: bold ? 800 : 700,
                })}
                {pctCell(pctCurr)}
                {pctCell(ms, {
                    borderRight: "none",
                    color: "#0369a1",
                })}
            </>
        );
    };

    const groupRow = (opts) => {
        const {
            open,
            onToggle,
            label,
            countLabel,
            totals: t,
            bgOpen,
            bgClosed,
            icon,
            padLeft = 0,
            color: labelColor = "#1e3a8a",
            loading = false,
        } = opts;
        return (
            <tr
                onClick={onToggle}
                title={open ? "Klik untuk sembunyikan" : "Klik untuk tampilkan"}
                style={{
                    background: open ? bgOpen : bgClosed,
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
                    {loading ? (
                        <i
                            className="bi bi-arrow-repeat"
                            style={{ fontSize: 11 }}
                        />
                    ) : (
                        <i
                            className={`bi bi-chevron-${open ? "down" : "right"}`}
                            style={{ fontSize: 11 }}
                        />
                    )}
                </td>
                <td
                    style={{
                        ...tdBase,
                        color: labelColor,
                        fontWeight: 800,
                        paddingLeft: padLeft || 6,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <i className={`bi ${icon}`} style={{ fontSize: 11 }} />
                        {label}
                        <span
                            style={{
                                fontWeight: 600,
                                color: T.slate,
                                fontSize: 10,
                            }}
                        >
                            ({countLabel})
                        </span>
                    </span>
                </td>
                {metricCells(t, { bold: true, lastColor: color })}
            </tr>
        );
    };

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
                    Tabel Segmen BOS · {currYear}
                </h2>
            </div>

            <Card title="Area Cover per Kecamatan" noPad>
                <div
                    style={{
                        padding: "8px 12px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        background: "#fff",
                    }}
                >
                    <div style={{ fontSize: 10.5, color: T.slate }}>
                        Initial load: Area saja · Klik Area untuk load Cabang →
                        Kota/Kab → Kecamatan · Salesman = PIC unik sekolah BOS ·
                        Potensi = Siswa × 1.5 · Market Share = Cust Real ÷ Total
                        Cust × 100
                    </div>
                    <select
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        style={selStyle}
                    >
                        <option value="">Semua Area</option>
                        {areaOptions.map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ overflowX: "auto", flex: 1 }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                            fontSize: 10.5,
                            minWidth: 1100,
                        }}
                    >
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...thBase, width: 36 }}>
                                    No
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{ ...thLeft, minWidth: 150 }}
                                >
                                    Kecamatan
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thLeft,
                                        minWidth: 140,
                                        background: "#e0f2fe",
                                        color: "#0369a1",
                                    }}
                                    title="Jumlah & nama salesman unik (PIC sekolah BOS)"
                                >
                                    Salesman
                                </th>
                                <th rowSpan={2} style={thBase}>
                                    Siswa
                                </th>
                                <th
                                    rowSpan={2}
                                    style={thBase}
                                    title="Siswa × 1.5"
                                >
                                    Potensi
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        background: "#f1f5f9",
                                    }}
                                >
                                    {ym3} Real
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        background: "#f1f5f9",
                                    }}
                                >
                                    {ym2} Real
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        background: "#f1f5f9",
                                    }}
                                >
                                    {prevYear} Real
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        ...thBase,
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
                                        background: "#e0f2fe",
                                        color: "#0369a1",
                                        borderRight: "none",
                                    }}
                                    title="Market Share = Cust Real ÷ Total Cust × 100"
                                >
                                    Market
                                    <br />
                                    Share
                                </th>
                            </tr>
                            <tr>
                                <th style={thBase}>SP</th>
                                <th style={thBase}>Real</th>
                                <th style={thBase}>Real vs Potensi %</th>
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
                                    Total ({totals.count} kecamatan)
                                </td>
                                {metricCells(totals, {
                                    bold: true,
                                    lastColor: color,
                                })}
                            </tr>

                            {areas.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={colCount}
                                        style={{
                                            padding: 16,
                                            textAlign: "center",
                                            color: T.slate,
                                            fontSize: 11,
                                        }}
                                    >
                                        Tidak ada data
                                    </td>
                                </tr>
                            )}

                            {areas.map((area) => {
                                const key =
                                    area.key ||
                                    area.display ||
                                    area.area_name;
                                const areaOpen = expandArea.has(key);
                                const loading = loadingAreas.has(key);
                                const children = childrenByArea[key];
                                const areaNode =
                                    Array.isArray(children) && children[0]
                                        ? children[0]
                                        : null;
                                const cabangList = areaNode?.cabangList || [];
                                const areaTotals = areaToTotals(area);

                                return (
                                    <React.Fragment key={key}>
                                        {groupRow({
                                            open: areaOpen,
                                            onToggle: () => toggleArea(area),
                                            label:
                                                area.display || area.area_name,
                                            countLabel: `${areaTotals.count} kecamatan`,
                                            totals: areaTotals,
                                            bgOpen: "#7dd3fc",
                                            bgClosed: "#94a3b8",
                                            icon: "bi-globe2",
                                            color: "#0c4a6e",
                                            loading,
                                        })}
                                        {areaOpen && loading && (
                                            <tr>
                                                <td
                                                    colSpan={colCount}
                                                    style={{
                                                        padding: "10px 16px",
                                                        fontSize: 11,
                                                        color: T.slate,
                                                        paddingLeft: 28,
                                                    }}
                                                >
                                                    Memuat data cabang /
                                                    kecamatan…
                                                </td>
                                            </tr>
                                        )}
                                        {areaOpen &&
                                            !loading &&
                                            cabangList.map((cab) => {
                                                const cabOpen =
                                                    expandCabang.has(cab.key);
                                                return (
                                                    <React.Fragment
                                                        key={cab.key}
                                                    >
                                                        {groupRow({
                                                            open: cabOpen,
                                                            onToggle: () =>
                                                                toggleCabang(
                                                                    cab.key,
                                                                ),
                                                            label: cab.display,
                                                            countLabel: `${cab.totals.count} kecamatan`,
                                                            totals: cab.totals,
                                                            bgOpen: "#93c5fd",
                                                            bgClosed: "#cbd5e1",
                                                            icon: "bi-diagram-3",
                                                            padLeft: 14,
                                                            color: "#0f172a",
                                                        })}
                                                        {cabOpen &&
                                                            cab.kotaList.map(
                                                                (kota) => {
                                                                    const kotaOpen =
                                                                        expandKota.has(
                                                                            kota.key,
                                                                        );
                                                                    return (
                                                                        <React.Fragment
                                                                            key={
                                                                                kota.key
                                                                            }
                                                                        >
                                                                            {groupRow(
                                                                                {
                                                                                    open: kotaOpen,
                                                                                    onToggle:
                                                                                        () =>
                                                                                            toggleKota(
                                                                                                kota.key,
                                                                                            ),
                                                                                    label: kota.display,
                                                                                    countLabel: `${kota.totals.count} kecamatan`,
                                                                                    totals: kota.totals,
                                                                                    bgOpen: "#bfdbfe",
                                                                                    bgClosed:
                                                                                        "#e2e8f0",
                                                                                    icon: "bi-building",
                                                                                    padLeft: 22,
                                                                                },
                                                                            )}
                                                                            {kotaOpen &&
                                                                                kota.rows.map(
                                                                                    (
                                                                                        r,
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={
                                                                                                r.id ||
                                                                                                r._rowNo
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
                                                                                                    r._rowNo
                                                                                                }
                                                                                            </td>
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdBase,
                                                                                                    color: T.text,
                                                                                                    fontWeight: 600,
                                                                                                    paddingLeft: 36,
                                                                                                }}
                                                                                            >
                                                                                                {r._kecDisplay ||
                                                                                                    r.name}
                                                                                            </td>
                                                                                            {metricCells(
                                                                                                {
                                                                                                    siswa:
                                                                                                        Number(
                                                                                                            r.total_student,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    realYm3:
                                                                                                        Number(
                                                                                                            r.real_exemplar_ym3,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    realYm2:
                                                                                                        Number(
                                                                                                            r.real_exemplar_ym2,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    spPrev:
                                                                                                        Number(
                                                                                                            r.sp_exemplar_previous,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    realPrev:
                                                                                                        Number(
                                                                                                            r.real_exemplar_previous,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    spCurr:
                                                                                                        Number(
                                                                                                            r.sp_exemplar_current,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    realCurr:
                                                                                                        Number(
                                                                                                            r.real_exemplar_current,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    acPrev:
                                                                                                        Number(
                                                                                                            r.ac_prev,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    acCurr:
                                                                                                        Number(
                                                                                                            r.ac_curr,
                                                                                                        ) ||
                                                                                                        Number(
                                                                                                            r.school_count,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    custReal:
                                                                                                        Number(
                                                                                                            r.cust_real,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    totalCust:
                                                                                                        Number(
                                                                                                            r.total_cust,
                                                                                                        ) ||
                                                                                                        0,
                                                                                                    salesmanNames:
                                                                                                        Array.isArray(
                                                                                                            r.salesman_names,
                                                                                                        )
                                                                                                            ? r.salesman_names
                                                                                                            : [],
                                                                                                },
                                                                                            )}
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
                                        {areaOpen &&
                                            !loading &&
                                            childrenByArea[key] &&
                                            cabangList.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={colCount}
                                                        style={{
                                                            padding:
                                                                "8px 16px 8px 28px",
                                                            fontSize: 11,
                                                            color: T.slate,
                                                        }}
                                                    >
                                                        Tidak ada data di bawah
                                                        area ini
                                                    </td>
                                                </tr>
                                            )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

const selStyle = {
    minWidth: 140,
    maxWidth: 200,
    padding: "5px 8px",
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    fontSize: 11,
    outline: "none",
    color: T.text,
    background: "#f8fafc",
    cursor: "pointer",
};
