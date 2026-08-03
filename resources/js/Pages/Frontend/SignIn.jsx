import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import GoogleSeparator from '@/Components/Element/GoogleSeparator';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function SignIn() {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('front.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');

    return (
        <GuestLayout title="Sign In">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome Back
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Sign in to continue to your account
                </p>
            </div>

            {verified && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    Your email has been verified successfully.
                </div>
            )}

            {flash.status && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {flash.status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <a
                    href={route('google.redirect')}
                    className="google-btn"
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 48 48"
                    >
                        <path
                            fill="#FFC107"
                            d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
                        />
                    </svg>

                    Continue with Google
                </a>
                <div className="separator">
                    <span>Or continue with email</span>
                </div>
                <div>
                    <InputLabel htmlFor="email" value="Email Address" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full form-control"
                        placeholder="you@example.com"
                        autoComplete="username"
                        isFocused
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError
                        message={errors.email}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full form-control"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        onChange={(e) =>
                            setData('password', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    e.target.checked
                                )
                            }
                        />

                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>

                    <Link
                        href={route('front.password.request')}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <PrimaryButton
                    className="w-full justify-center py-3"
                    disabled={processing}
                >
                    {processing
                        ? 'Signing In...'
                        : 'Sign In'}
                </PrimaryButton>

                <div className="separator">
                    <span>Or</span>
                </div>

                <div className="text-center">
                    <span className="text-sm text-gray-500">
                        Don't have an account?
                    </span>

                    <Link
                        href={route('register')}
                        className="ml-1 font-medium text-primary hover:underline"
                    >
                        Create Account
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
