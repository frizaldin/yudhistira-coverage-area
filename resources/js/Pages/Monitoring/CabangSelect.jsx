import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import SelectReact from "@/Components/Element/SelectReact";

const T = {
    blue: "#1d4ed8",
    slate: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
};

export default function CabangSelect({
    activeNav = "cabang",
    areas = [],
    cabangs = [],
    defaultAreaId = null,
}) {
    const [areaId, setAreaId] = useState(defaultAreaId ? String(defaultAreaId) : "");
    const [cabangId, setCabangId] = useState("");

    const availableCabangs = useMemo(() => {
        if (!areaId) return [];
        return (cabangs || []).filter(
            (c) => String(c.area_id) === String(areaId),
        );
    }, [cabangs, areaId]);

    const handleAreaChange = (val) => {
        setAreaId(val || "");
        setCabangId("");
    };

    const applyFilter = (e) => {
        e.preventDefault();
        if (!areaId || !cabangId) return;
        router.get(route("monitoring.area", areaId), {
            cabang: cabangId,
        });
    };

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title="Pilih Parameter - Dashboard Cabang" />

            <div
                style={{
                    background: "white",
                    padding: "14px 20px",
                    borderBottom: `1px solid ${T.border}`,
                }}
            >
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.slate,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                    }}
                >
                    Dashboard Cabang
                </div>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: T.text,
                        letterSpacing: "-0.5px",
                        lineHeight: 1.15,
                    }}
                >
                    PILIH PARAMETER
                </div>
                <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                    Silakan pilih Area dan Cabang untuk melihat dashboard
                    cabang.
                </div>
            </div>

            <div
                style={{
                    padding: "14px 14px",
                    maxWidth: "100%",
                    margin: "0 auto",
                }}
            >
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <form
                        onSubmit={applyFilter}
                        className="flex flex-col md:flex-row items-end gap-4"
                    >
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Area
                            </label>
                            <SelectReact
                                collection={areas}
                                value={areaId}
                                onChange={handleAreaChange}
                                placeholder="Pilih Area"
                            />
                        </div>

                        <div className="flex-1 w-full">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Cabang
                            </label>
                            <SelectReact
                                collection={availableCabangs.map((c) => ({
                                    id: c.id,
                                    name: c.nama_cabang,
                                }))}
                                value={cabangId}
                                onChange={(val) => setCabangId(val || "")}
                                placeholder="Pilih Cabang"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <button
                                type="submit"
                                disabled={!areaId || !cabangId}
                                className="w-full flex items-center justify-center h-[40px] px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tampilkan Dashboard
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MonitoringLayout>
    );
}
