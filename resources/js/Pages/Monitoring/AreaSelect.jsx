import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import SelectReact from "@/Components/Element/SelectReact";

const T = {
    blue: "#1d4ed8",
    slate: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
};

export default function AreaSelect({ activeNav = "area", areas = [] }) {
    const [areaId, setAreaId] = useState("");

    const applyFilter = (e) => {
        e.preventDefault();
        if (!areaId) return;
        router.get(route("monitoring.area", areaId));
    };

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title="Pilih Parameter - Dashboard Area" />

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
                    Dashboard Area
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
                    Silakan pilih Area untuk melihat dashboard coverage area.
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
                                onChange={(val) => setAreaId(val || "")}
                                placeholder="Pilih Area"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <button
                                type="submit"
                                disabled={!areaId}
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
