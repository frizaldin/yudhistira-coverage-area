import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import AdminGuestLayout from "@/Layouts/AdminGuestLayout";
import { Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login.store"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <AdminGuestLayout
            title="Admin Login"
            subtitle="Welcome Back"
            overview="Manage users, content, settings, and monitor system activities from a centralized dashboard."
        >
            <div className="mb-8 text-center">
                <h1
                    className="text-3xl font-bold"
                    style={{
                        color: "var(--color-text-main)",
                    }}
                >
                    Admin Portal
                </h1>

                <p
                    className="mt-2 text-sm"
                    style={{
                        color: "var(--color-text-muted)",
                    }}
                >
                    Sign in to access the administration panel
                </p>
            </div>

            {status && (
                <div
                    className="mb-5 rounded-lg border p-3 text-sm"
                    style={{
                        borderColor: "var(--color-info)",
                        backgroundColor: "var(--color-info-bg)",
                        color: "var(--color-info)",
                    }}
                >
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="email" value="Email Address" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full form-control"
                        autoComplete="username"
                        placeholder="Enter your email"
                        isFocused
                        onChange={(e) => setData("email", e.target.value)}
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
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        onChange={(e) => setData("password", e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                        />

                        <span
                            className="ms-2 text-sm"
                            style={{
                                color: "var(--color-text-muted)",
                            }}
                        >
                            Remember me
                        </span>
                    </label>
                </div>

                <PrimaryButton
                    className="w-full justify-center py-3"
                    disabled={processing}
                >
                    {processing ? "Signing In..." : "Sign In"}
                </PrimaryButton>

                <div
                    className="text-center text-xs"
                    style={{
                        color: "var(--color-text-muted)",
                    }}
                >
                    Authorized personnel only.
                </div>
            </form>
        </AdminGuestLayout>
    );
}
