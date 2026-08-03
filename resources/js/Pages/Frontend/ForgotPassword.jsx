import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { useForm, Link, usePage } from "@inertiajs/react";

export default function ForgotPassword() {

    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("front.password.email"));

    };

    return (
        <GuestLayout title="Forgot Password">
            <div className="mb-8 text-center">
                <h1
                    className="text-3xl font-bold"
                    style={{
                        color: 'var(--color-text-main)',
                    }}
                >
                    Forgot Your Password?
                </h1>

                <p
                    className="mt-2 text-sm"
                    style={{
                        color: 'var(--color-text-muted)',
                    }}
                >
                    No worries. Enter your email address and we'll send you a
                    password reset link.
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
