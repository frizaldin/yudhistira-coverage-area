import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AdminGuestLayout from '@/Layouts/AdminGuestLayout';
import { useForm, Link } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AdminGuestLayout
            title="Reset Password"
            subtitle="Account Security"
            overview="Choose a strong password to protect your administrator account and maintain secure access."
        >
            <div className="mb-8 text-center">
                <h1
                    className="text-3xl font-bold"
                    style={{
                        color: 'var(--color-text-main)',
                    }}
                >
                    Reset Password
                </h1>

                <p
                    className="mt-2 text-sm"
                    style={{
                        color: 'var(--color-text-muted)',
                    }}
                >
                    Create a new password to regain access to the administration panel.
                </p>
            </div>

            <form
                onSubmit={submit}
                className="space-y-5"
            >
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Email Address"
                    />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full form-control"
                        autoComplete="username"
                        placeholder="Enter your email address"
                        onChange={(e) =>
                            setData('email', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.email}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password"
                        value="New Password"
                    />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full form-control"
                        autoComplete="new-password"
                        placeholder="Enter your new password"
                        isFocused
                        onChange={(e) =>
                            setData('password', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full form-control"
                        autoComplete="new-password"
                        placeholder="Confirm your new password"
                        onChange={(e) =>
                            setData(
                                'password_confirmation',
                                e.target.value
                            )
                        }
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <PrimaryButton
                    className="w-full justify-center py-3"
                    disabled={processing}
                >
                    {processing
                        ? 'Resetting Password...'
                        : 'Reset Password'}
                </PrimaryButton>

                <div className="text-center">
                    <Link
                        href={route('login.admin')}
                        className="text-sm font-medium"
                        style={{
                            color: 'var(--color-primary)',
                        }}
                    >
                        ← Back to Login
                    </Link>
                </div>

                <div
                    className="text-center text-xs"
                    style={{
                        color: 'var(--color-text-muted)',
                    }}
                >
                    Authorized personnel only.
                </div>
            </form>
        </AdminGuestLayout>
    );

}
