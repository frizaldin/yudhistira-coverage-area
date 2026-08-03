import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';

const T = {
    blue:'#1d4ed8', blueSoft:'#3b82f6', green:'#16a34a',
    orange:'#d97706', red:'#dc2626', purple:'#7c3aed',
    slate:'#64748b', text:'#0f172a', border:'#e2e8f0', card:'#ffffff',
};
const S = {
    card:{ background:'#fff', borderRadius:12, boxShadow:'0 1px 6px rgba(15,23,42,.06)', border:`1px solid ${T.border}` },
    th:{ fontSize:10.5, fontWeight:700, color:T.slate, padding:'9px 12px', background:'#f8fafc', borderBottom:`1px solid ${T.border}`, textTransform:'uppercase', letterSpacing:'.3px' },
    td:{ fontSize:12, color:T.text, padding:'8px 12px', borderBottom:`1px solid #f4f6f8` },
};

const jenjangColor = { sd:'#3b82f6', smp:'#8b5cf6', sma:'#eab308', smk:'#f97316', dll:'#10b981' };

function MiniBar({ value, max }) {
    const pct = max > 0 ? Math.min((value/max)*100, 100) : 0;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:4, overflow:'hidden', minWidth:60 }}>
                <div style={{ width:`${pct}%`, height:'100%', background:T.blue, borderRadius:4 }} />
            </div>
            <span style={{ fontSize:10.5, fontWeight:700, color:T.text, minWidth:32, textAlign:'right' }}>{value}</span>
        </div>
    );
}

export default function TargetEksemplarDetail({ activeNav, scopeName, backUrl, rows, jenjangList }) {
    const { configuration } = usePage().props;
    const targetYear = configuration?.target_year || '2026';
    const fmt = n => new Intl.NumberFormat('id-ID').format(n||0);
    const maxEx = Math.max(...rows.map(r => r.total?.ex || 0), 1);

    const totals = jenjangList.reduce((acc, j) => {
        const k = j.toLowerCase();
        acc[k] = {
            ac25:   rows.reduce((s,r) => s + (r[k]?.ac25   || 0), 0),
            ac26:   rows.reduce((s,r) => s + (r[k]?.ac26   || 0), 0),
            target: rows.reduce((s,r) => s + (r[k]?.target || 0), 0),
            ex:     rows.reduce((s,r) => s + (r[k]?.ex     || 0), 0),
        };
        return acc;
    }, {});
    const totalEx = rows.reduce((s,r) => s + (r.total?.ex || 0), 0);

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Target Eksemplar - ${scopeName}`} />
            <div style={{ padding:'20px 24px', maxWidth:1400, margin:'0 auto' }}>

                <div style={{ marginBottom:20 }}>
                    <button onClick={()=>router.visit(backUrl || route('monitoring.area.select'))}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:T.blueSoft, fontSize:12, fontWeight:600, padding:0 }}>
                        <i className="bi bi-arrow-left" /> Kembali ke Dashboard
                    </button>
                    <h1 style={{ fontSize:22, fontWeight:800, color:T.text, margin:'8px 0 4px' }}>
                        Target Eksemplar — {scopeName}
                    </h1>
                    <p style={{ fontSize:12, color:T.slate, margin:0 }}>Rencana jual {targetYear} per Sales dan per Jenjang (dari Rekap Area Cover)</p>
                </div>

                {/* Summary cards per jenjang */}
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                    {jenjangList.map(j => {
                        const k = j.toLowerCase();
                        const c = jenjangColor[k] || T.slate;
                        return (
                            <div key={j} style={{ ...S.card, padding:'14px 18px', flex:1, minWidth:140 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                                    <div style={{ width:8, height:8, borderRadius:2, background:c }} />
                                    <span style={{ fontSize:11, fontWeight:700, color:c }}>{j}</span>
                                </div>
                                <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{fmt(totals[k]?.target || 0)}</div>
                                <div style={{ fontSize:10, color:T.slate }}>Target Customer</div>
                                <div style={{ fontSize:13, fontWeight:700, color:T.purple, marginTop:4 }}>{fmt(totals[k]?.ex || 0)}</div>
                                <div style={{ fontSize:10, color:T.slate }}>Target Eksemplar</div>
                            </div>
                        );
                    })}
                    <div style={{ ...S.card, padding:'14px 18px', flex:1, minWidth:140, borderLeft:`3px solid ${T.blue}` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.blue, marginBottom:6 }}>GRAND TOTAL</div>
                        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{fmt(totalEx)}</div>
                        <div style={{ fontSize:10, color:T.slate }}>Total Eksemplar</div>
                    </div>
                </div>

                {/* Main table */}
                <div style={{ ...S.card, overflow:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
                        <thead>
                            <tr>
                                <th style={{ ...S.th }}>Sales</th>
                                {jenjangList.map(j => (
                                    <th key={j} colSpan={2} style={{ ...S.th, textAlign:'center', borderLeft:`2px solid ${T.border}`,
                                        color:jenjangColor[j.toLowerCase()]||T.slate }}>
                                        {j}
                                    </th>
                                ))}
                                <th colSpan={2} style={{ ...S.th, textAlign:'center', borderLeft:`2px solid ${T.blue}`, color:T.blue }}>TOTAL</th>
                            </tr>
                            <tr>
                                <th style={{ ...S.th, fontWeight:500 }}></th>
                                {[...jenjangList, 'TOTAL'].map(j => (
                                    <>
                                        <th key={j+'_c'} style={{ ...S.th, fontWeight:500, textAlign:'right', borderLeft:`2px solid ${T.border}` }}>Cust</th>
                                        <th key={j+'_e'} style={{ ...S.th, fontWeight:500, textAlign:'right' }}>Eks</th>
                                    </>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r,i) => (
                                <tr key={i} style={{ background:i%2===0?'white':'#fafbfc' }}>
                                    <td style={{ ...S.td, fontWeight:700 }}>{r.sales}</td>
                                    {jenjangList.map(j => {
                                        const k = j.toLowerCase();
                                        const c = jenjangColor[k]||T.slate;
                                        return (
                                            <>
                                                <td key={j+'_c'} style={{ ...S.td, textAlign:'right', borderLeft:`2px solid #f4f6f8`, fontWeight:600, color:c }}>
                                                    {fmt(r[k]?.target || 0)}
                                                </td>
                                                <td key={j+'_e'} style={{ ...S.td, textAlign:'right', color:T.purple, fontWeight:600 }}>
                                                    {fmt(r[k]?.ex || 0)}
                                                </td>
                                            </>
                                        );
                                    })}
                                    <td style={{ ...S.td, textAlign:'right', borderLeft:`2px solid #e2e8f0`, fontWeight:800, color:T.blue }}>
                                        {fmt(r.total?.target || 0)}
                                    </td>
                                    <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.purple }}>
                                        {fmt(r.total?.ex || 0)}
                                    </td>
                                </tr>
                            ))}
                            {/* Total row */}
                            <tr style={{ background:'#f0f7ff', borderTop:`2px solid ${T.blue}` }}>
                                <td style={{ ...S.td, fontWeight:800, color:T.blue }}>GRAND TOTAL</td>
                                {jenjangList.map(j => {
                                    const k = j.toLowerCase();
                                    return (
                                        <>
                                            <td key={j+'_tc'} style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.blue, borderLeft:`2px solid #e2e8f0` }}>
                                                {fmt(totals[k]?.target || 0)}
                                            </td>
                                            <td key={j+'_te'} style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.purple }}>
                                                {fmt(totals[k]?.ex || 0)}
                                            </td>
                                        </>
                                    );
                                })}
                                <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.blue, borderLeft:`2px solid #e2e8f0` }}>
                                    {fmt(rows.reduce((s,r)=>s+(r.total?.target||0),0))}
                                </td>
                                <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.purple }}>
                                    {fmt(totalEx)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </MonitoringLayout>
    );
}
