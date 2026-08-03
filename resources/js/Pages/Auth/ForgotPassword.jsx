import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import AdminGuestLayout from "@/Layouts/AdminGuestLayout";
import { useForm, Link } from "@inertiajs/react";

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("password.email"));
    };

    return (
        <AdminGuestLayout
            title="Forgot Password"
            subtitle="Account Recovery"
            overview="Secure password recovery for administrator accounts. Follow the verification process to regain access safely."
        >
            <div className="mb-8 text-center">
                <h1
                    className="text-3xl font-bold"
                    style={{
                        color: 'var(--color-text-main)',
                    }}
                >
                    Forgot Password
                </h1>

                <p
                    className="mt-2 text-sm"
                    style={{
                        color: 'var(--color-text-muted)',
                    }}
                >
                    Enter your email address and we'll send you a password reset link.
                </p>
            </div>

            {status && (
                <div
                    className="mb-5 rounded-lg border p-3 text-sm"
                    style={{
                        borderColor: 'var(--color-info)',
                        backgroundColor: 'var(--color-info-bg)',
                        color: 'var(--color-info)',
                    }}
                >
                    {status}
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
                        placeholder="Enter your email address"
                        autoComplete="email"
                        isFocused
                        onChange={(e) =>
                            setData('email', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.email}
                        className="mt-2"
                    />
                </div>

                <PrimaryButton
                    className="w-full justify-center py-3"
                    disabled={processing}
                >
                    {processing
                        ? 'Sending Reset Link...'
                        : 'Send Reset Link'}
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
