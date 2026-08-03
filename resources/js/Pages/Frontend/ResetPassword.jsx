import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useForm, Link, usePage } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('front.password.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title="Reset Password">
            <div className="mb-8 text-center">
                <h1
                    className="text-3xl font-bold"
                    style={{
                        color: 'var(--color-text-main)',
                    }}
                >
                    Create New Password
                </h1>

                <p
                    className="mt-2 text-sm"
                    style={{
                        color: 'var(--color-text-muted)',
                    }}
                >
                    Choose a strong password to secure your account.
                </p>
            </div>

            {flash.status && (
                <div
                    className="mb-5 rounded-lg border p-3 text-sm"
                    style={{
                        borderColor: 'var(--color-info)',
                        backgroundColor: 'var(--color-info-bg)',
                        color: 'var(--color-info)',
                    }}
                >
                    {flash.status}
                </div>
            )}

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
                        href={route('login')}
                        className="text-sm font-medium"
                        style={{
                            color: 'var(--color-primary)',
                        }}
                    >
                        ← Back to Sign In
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );

}
