import ApplicationLogo from "@/Components/ApplicationLogo";
import MetaTags from "@/Components/MetaTags";
import { Link } from "@inertiajs/react";
import Copyright from "@/Components/Copyright";

export default function AdminGuestLayout({
    children,
    title,
    subtitle,
    overview,
}) {
    return (
        <>
            <MetaTags title={title?.toUpperCase()} />

            <div
                className="min-h-screen grid lg:grid-cols-2"
                style={{
                    background: "var(--color-bg-main)",
                }}
            >
                {/* LEFT SIDE */}
                <div
                    className="hidden lg:flex relative items-center justify-center overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(135deg,var(--color-primary-bg),var(--color-bg-secondary))",
                    }}
                >
                    <div className="relative z-10 max-w-lg px-10 text-center">
                        <img
                            src={window.asset("logo-yudhistira.webp")}
                            alt="logo"
                        />
                        {/* <ApplicationLogo className="mx-auto h-24 mb-8" /> */}

                        <h2
                            className="text-4xl font-bold"
                            style={{
                                color: "var(--color-text-main)",
                            }}
                        >
                            {subtitle}
                        </h2>

                        <p
                            className="mt-4"
                            style={{
                                color: "var(--color-text-muted)",
                            }}
                        >
                            {overview}
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="mb-8 text-center lg:hidden">
                            <Link href="/">
                                <ApplicationLogo className="mx-auto h-16" />
                            </Link>
                        </div>

                        {children}

                        <footer
                            className="mt-8 text-center text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            <Copyright />
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
