import { Head } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';

const T = {
    slate:   '#64748b',
    text:    '#0f172a',
    border:  '#e2e8f0',
    card:    '#ffffff',
};

export default function NoData({ activeNav = 'sales' }) {
    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title="Belum Ada Data" />

            <div style={{
                background: 'white', padding: '14px 20px',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Dashboard Sales
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                    BELUM ADA DATA
                </div>
                <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                    Anda belum memiliki data coverage atau penugasan cabang.
                </div>
            </div>

            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: T.slate, background: T.card, padding: '40px', borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', maxWidth: '500px', width: '100%' }}>
                    <i className="bi bi-folder-x" style={{ fontSize: '48px', display: 'block', marginBottom: '16px', color: '#cbd5e1' }}></i>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>Data Coverage Kosong</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                        Saat ini Anda belum ditugaskan ke cabang manapun dan belum memiliki data pelanggan. Silakan hubungi Administrator untuk mengatur penugasan area kerja Anda.
                    </p>
                </div>
            </div>
        </MonitoringLayout>
    );
}
