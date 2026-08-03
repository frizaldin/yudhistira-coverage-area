import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { showError } from "@/Utils/swal";
import GoogleSeparator from '@/Components/Element/GoogleSeparator';

export default function SignUp({ configuration }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [agree, setAgree] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route("front.register.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const handleGoogleLogin = (e) => {
    if (!agree) {
        e.preventDefault();

        showError(
            "Please accept the Terms & Conditions first."
        );

        return;
    }

    window.location.href = route("google.redirect");
};

    return (
        <GuestLayout title="Create Account">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    Create Account
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Join us and start your journey today
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="name" value="Full Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full form-control"
                        placeholder="Enter your full name"
                        autoComplete="name"
                        isFocused
                        onChange={(e) => setData("name", e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email Address" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full form-control"
                        placeholder="Enter your email"
                        autoComplete="username"
                        onChange={(e) => setData("email", e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full form-control"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        onChange={(e) => setData("password", e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
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
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-1 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">
                        I agree to the{" "}
                        <Link
                            href={route("terms-conditions")}
                            target="_blank"
                            className="font-medium text-primary hover:underline"
                        >
                            Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                            href={route("privacy-policy")}
                            target="_blank"
                            className="font-medium text-primary hover:underline"
                        >
                            Privacy Policy
                        </Link>
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
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
                </button>
                <div className="separator">
                    <span>Or</span>
                </div>
                <PrimaryButton
                    className="w-full justify-center py-3"
                    disabled={processing || !agree}
                >
                    {processing ? "Creating Account..." : "Create Account"}
                </PrimaryButton>

                <div className="text-center">
                    <span className="text-sm text-gray-500">
                        Already have an account?{" "}
                    </span>

                    <Link
                        href={route("login")}
                        className="font-medium text-primary hover:underline"
                    >
                        Sign In
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
