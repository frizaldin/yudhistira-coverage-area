import { Link, usePage } from "@inertiajs/react";

const NAV_ITEMS = [
    {
        key: "sales-performance",
        top: "Dashboard",
        bottom: "Sales Performance",
        icon: "bi-house-door-fill",
        routeName: "monitoring.sales-performance",
        hideForLevels: ["area", "cabang", "sales"],
    },
    /*{
        key: "nasional",
        top: "Dashboard",
        bottom: "Nasional",
        icon: "bi-house-door-fill",
        routeName: "monitoring.nasional",
        hideForLevels: ["area", "cabang", "sales"],
    },*/
    {
        key: "area",
        top: "Dashboard",
        bottom: "Area",
        icon: "bi-map",
        routeName: "monitoring.area.select",
        hideForLevels: ["cabang", "sales"],
    },
    {
        key: "cabang",
        top: "Dashboard",
        bottom: "Cabang",
        icon: "bi-building-fill",
        routeName: "monitoring.area.select", // for cabang, clicking this brings them to their cabang
        hideForLevels: ["nasional", "area", "sales"],
    },
    {
        key: "sales",
        top: "Dashboard",
        bottom: "Sales",
        icon: "bi-graph-up-arrow",
        routeName: "monitoring.area.select", // for sales, clicking this brings them to their sales area
        hideForLevels: ["nasional", "area", "cabang"],
    },
    {
        key: "peta",
        top: "Peta",
        bottom: "Coverage",
        icon: "bi-map-fill",
        routeName: "monitoring.peta",
    },
    {
        key: "sekolah",
        top: "Data",
        bottom: "Sekolah",
        icon: "bi-mortarboard-fill",
        routeName: "monitoring.sekolah",
    },
    /*
    {
        key: "uncovered-customers",
        top: "Data",
        bottom: "Gap",
        icon: "bi-person-dash-fill",
        routeName: "monitoring.uncovered-customers",
    },
    {
        key: "area-kosong",
        top: "Data",
        bottom: "Kosong",
        icon: "bi-node-minus-fill",
        routeName: "monitoring.area-kosong",
    },
    {
        key: "rekap-sales",
        top: "Performa",
        bottom: "Sales",
        icon: "bi-person-vcard",
        routeName: "monitoring.rekap-sales",
        hideForLevels: ["sales"], // optionally hide for sales if they only need to see their own
    },
    */
    {
        key: "import",
        top: "Data",
        bottom: "Import",
        icon: "bi-cloud-arrow-up-fill",
        routeName: "monitoring.import",
        hideForLevels: ["area", "cabang", "sales"],
    },
    {
        key: "report",
        top: "Report",
        bottom: "Sales Score",
        icon: "bi-clipboard-data-fill",
        routeName: "monitoring.report",
    },
    {
        key: "setting",
        top: null,
        bottom: "Pengaturan",
        icon: "bi-gear-fill",
        routeName: "monitoring.pengaturan",
    },
];

export default function MonitoringLayout({ children, activeNav = "area" }) {
    const { auth } = usePage().props;
    const userLevel = auth?.user?.level || "nasional";

    // Filter nav items based on user level
    const visibleNavItems = NAV_ITEMS.filter((item) => {
        if (item.hideForLevels && item.hideForLevels.includes(userLevel)) {
            return false;
        }
        return true;
    });

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "#f1f5f9",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            {/* ── SIDEBAR ── */}
            <aside
                style={{
                    width: "118px",
                    minWidth: "118px",
                    background:
                        "linear-gradient(185deg, #1e3268 0%, #0f1e46 100%)",
                    display: "flex",
                    flexDirection: "column",
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    zIndex: 50,
                    overflowY: "auto",
                    scrollbarWidth: "none",
                }}
            >
                {/* Brand */}
                <div
                    style={{
                        padding: "20px 12px 16px",
                        textAlign: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 8px",
                            fontSize: 22,
                        }}
                    >
                        {/* TODO: Insert Logo */}
                        <img
                            src={window.asset("logo-ygi.png")}
                            alt="Yudhistira Logo"
                        />
                    </div>
                    <div
                        style={{
                            fontWeight: 900,
                            fontSize: "10px",
                            letterSpacing: "2px",
                            color: "#bfdbfe",
                        }}
                    >
                        YUDHISTIRA
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, paddingTop: 6 }}>
                    {visibleNavItems.map((item) => {
                        const active = activeNav === item.key;
                        return (
                            <Link
                                key={item.key}
                                href={route(item.routeName)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    padding: "12px 10px 10px",
                                    textDecoration: "none",
                                    background: active
                                        ? "rgba(96,165,250,0.14)"
                                        : "transparent",
                                    borderLeft: `3px solid ${active ? "#60a5fa" : "transparent"}`,
                                    transition: "all 0.15s",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "9px",
                                        background: active
                                            ? "rgba(96,165,250,0.22)"
                                            : "rgba(255,255,255,0.06)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 6,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <i
                                        className={`bi ${item.icon}`}
                                        style={{
                                            fontSize: 17,
                                            color: active
                                                ? "#93c5fd"
                                                : "rgba(255,255,255,0.45)",
                                        }}
                                    />
                                </div>
                                {item.top && (
                                    <span
                                        style={{
                                            fontSize: "8px",
                                            color: active
                                                ? "rgba(255,255,255,0.55)"
                                                : "rgba(255,255,255,0.3)",
                                            lineHeight: 1.2,
                                            textAlign: "center",
                                            display: "block",
                                        }}
                                    >
                                        {item.top}
                                    </span>
                                )}
                                <span
                                    style={{
                                        fontSize: "9.5px",
                                        fontWeight: active ? 700 : 500,
                                        color: active
                                            ? "#ffffff"
                                            : "rgba(255,255,255,0.45)",
                                        lineHeight: 1.2,
                                        textAlign: "center",
                                        display: "block",
                                    }}
                                >
                                    {item.bottom}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div
                    style={{
                        padding: "16px 12px",
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                        textAlign: "center",
                        marginTop: "auto",
                    }}
                >
                    <div className="relative group">
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#fca5a5",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                padding: "12px 0",
                                borderRadius: "8px",
                                width: "100%",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.2)";
                                e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.1)";
                                e.currentTarget.style.color = "#fca5a5";
                            }}
                        >
                            <i
                                className="bi bi-power"
                                style={{ fontSize: "18px" }}
                            ></i>
                        </Link>

                        {/* Tooltip */}
                        <div className="absolute left-[110%] top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-lg z-50 pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-[5px] before:border-transparent before:border-r-gray-800">
                            Logout
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
                {children}
            </main>
        </div>
    );
}
