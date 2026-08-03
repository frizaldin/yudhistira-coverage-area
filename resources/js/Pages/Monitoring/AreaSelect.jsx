import { Head, Link } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';

const T = {
    blue:    '#1d4ed8',
    blueSoft:'#3b82f6',
    slate:   '#64748b',
    text:    '#0f172a',
    border:  '#e2e8f0',
    card:    '#ffffff',
};

export default function AreaSelect({ activeNav = 'area', areas = [] }) {
    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title="Pilih Area" />

            {/* HEADER */}
            <div style={{
                background: 'white', padding: '14px 20px',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Dashboard Area
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                    PILIH AREA
                </div>
                <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                    Silakan pilih area untuk melihat dashboard coverage area tersebut.
                </div>
            </div>

            {/* CONTENT */}
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '16px'
                }}>
                    {areas.map(area => (
                        <Link
                            key={area.id}
                            href={route('monitoring.area', area.id)}
                            style={{
                                background: T.card,
                                border: `1px solid ${T.border}`,
                                borderRadius: '12px',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textDecoration: 'none',
                                color: T.text,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = T.blueSoft;
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = T.border;
                                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px',
                                    borderRadius: '8px',
                                    background: '#eff6ff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: T.blue
                                }}>
                                    <i className="bi bi-geo-alt-fill" style={{ fontSize: '16px' }}></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>
                                        {area.name}
                                    </div>
                                </div>
                            </div>
                            <i className="bi bi-chevron-right" style={{ color: T.slate, fontSize: '12px' }}></i>
                        </Link>
                    ))}
                </div>
                
                {areas.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: T.slate }}>
                        <i className="bi bi-inbox" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
                        Data area belum tersedia di database.
                    </div>
                )}
            </div>
        </MonitoringLayout>
    );
}
