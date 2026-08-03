import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';

const T = {
    blue:    '#1d4ed8',
    blueSoft:'#3b82f6',
    green:   '#16a34a',
    orange:  '#d97706',
    red:     '#dc2626',
    teal:    '#0d9488',
    purple:  '#7c3aed',
    slate:   '#64748b',
    text:    '#0f172a',
    border:  '#e2e8f0',
    bg:      '#f1f5f9',
    card:    '#ffffff',
};

const S = {
    card: {
        background: T.card,
        borderRadius: 12,
        boxShadow: '0 1px 6px rgba(15,23,42,0.06)',
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
    },
    input: {
        width: '100%',
        padding: '8px 12px',
        fontSize: '13px',
        border: `1px solid ${T.border}`,
        borderRadius: '6px',
        outline: 'none',
        color: T.text,
    },
    label: {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: T.slate,
        marginBottom: '6px',
    },
    button: {
        padding: '8px 16px',
        background: T.blue,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
    },
};

function ProfileForm({ user, status }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <div style={{ ...S.card, padding: '20px' }}>
            <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${T.border}` }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: T.text, margin: 0 }}>Informasi Profil</h2>
                <p style={{ fontSize: '11px', color: T.slate, margin: '4px 0 0 0' }}>Perbarui informasi profil dan alamat email akun Anda.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label htmlFor="name" style={S.label}>Nama</label>
                    <input
                        id="name"
                        type="text"
                        style={S.input}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    {errors.name && <div style={{ fontSize: '11px', color: T.red, marginTop: '4px' }}>{errors.name}</div>}
                </div>

                <div>
                    <label htmlFor="email" style={S.label}>Email</label>
                    <input
                        id="email"
                        type="email"
                        style={S.input}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && <div style={{ fontSize: '11px', color: T.red, marginTop: '4px' }}>{errors.email}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" style={{ ...S.button, opacity: processing ? 0.7 : 1 }} disabled={processing}>
                        <i className="bi bi-save" /> Simpan Profil
                    </button>
                    {recentlySuccessful && status === 'profile-updated' && (
                        <span style={{ fontSize: '11px', color: T.green, fontWeight: 600 }}>Berhasil disimpan.</span>
                    )}
                </div>
            </form>
        </div>
    );
}

function PasswordForm() {
    const { data, setData, put, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: () => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                }
                if (errors.current_password) {
                    reset('current_password');
                }
            },
        });
    };

    return (
        <div style={{ ...S.card, padding: '20px' }}>
            <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${T.border}` }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: T.text, margin: 0 }}>Ubah Password</h2>
                <p style={{ fontSize: '11px', color: T.slate, margin: '4px 0 0 0' }}>Pastikan akun Anda menggunakan password yang panjang dan acak agar tetap aman.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label htmlFor="current_password" style={S.label}>Password Saat Ini</label>
                    <input
                        id="current_password"
                        type="password"
                        style={S.input}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        required
                    />
                    {errors.current_password && <div style={{ fontSize: '11px', color: T.red, marginTop: '4px' }}>{errors.current_password}</div>}
                </div>

                <div>
                    <label htmlFor="password" style={S.label}>Password Baru</label>
                    <input
                        id="password"
                        type="password"
                        style={S.input}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <div style={{ fontSize: '11px', color: T.red, marginTop: '4px' }}>{errors.password}</div>}
                </div>
                
                <div>
                    <label htmlFor="password_confirmation" style={S.label}>Konfirmasi Password</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        style={S.input}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    {errors.password_confirmation && <div style={{ fontSize: '11px', color: T.red, marginTop: '4px' }}>{errors.password_confirmation}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" style={{ ...S.button, opacity: processing ? 0.7 : 1, background: T.teal }} disabled={processing}>
                        <i className="bi bi-key-fill" /> Ubah Password
                    </button>
                    {recentlySuccessful && !errors.current_password && !errors.password && (
                        <span style={{ fontSize: '11px', color: T.green, fontWeight: 600 }}>Password diperbarui.</span>
                    )}
                </div>
            </form>
        </div>
    );
}

export default function Pengaturan({ activeNav = 'setting', status }) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title="Pengaturan Akun" />

            <div style={{
                background: 'white', padding: '14px 20px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Pengaturan
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                        Profil & Akun
                    </div>
                </div>
            </div>

            <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <ProfileForm user={user} status={status} />
                    </div>
                    <div style={{ flex: '1 1 300px' }}>
                        <PasswordForm />
                    </div>
                </div>
            </div>
        </MonitoringLayout>
    );
}
