import MetaTags from "@/Components/MetaTags";
import { Link, router } from "@inertiajs/react";

export default function Welcome({
    configuration,
    user,
}) {

    const handleLogout = () => {
        router.post(route('front.logout'));
    };

    return (
        <>
            <MetaTags title={configuration.title} />

            <div className="landing-page">
                {/* NAVBAR */}
                <header className="landing-header">
                    <div className="container">
                        <div className="navbar">
                            <Link
                                href="/"
                                className="brand"
                            >
                                <img
                                    src={
                                        configuration?.url_logo ??
                                        "/dist/img/logo.png"
                                    }
                                    alt={configuration.title}
                                />

                                <span>
                                    {configuration.title}
                                </span>
                            </Link>

                            <div className="navbar-actions">
                                {user ? (
                                    <>
                                        <span className="user-name">
                                            {user.name}
                                        </span>

                                        <button
                                            onClick={handleLogout}
                                            className="btn-outline"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    null
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* HERO */}
                <section className="hero">
                    <div className="container">
                        <div className="hero-content">
                            <div className="hero-badge">
                                Modern Digital Platform
                            </div>

                            <h1>
                                Welcome to
                                <br />
                                {configuration.title}
                            </h1>

                            <p>
                                {configuration.about_us ||
                                    "A modern platform designed to streamline workflows and improve productivity."}
                            </p>

                            <div className="hero-buttons">
                                {!user ? (
                                    <>
                                        <Link
                                            href={route("register")}
                                            className="btn-primary btn-inline"
                                        >
                                            Create Account
                                        </Link>

                                        <Link
                                            href={route("login")}
                                            className="btn-outline"
                                        >
                                            Sign In
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href={route("dashboard")}
                                        className="btn-primary"
                                    >
                                        Go To Dashboard
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CONTACT */}
                <section className="contact-section">
                    <div className="container">
                        <div className="contact-card">
                            <h2>Contact Information</h2>

                            <div className="contact-grid">
                                <div>
                                    <span>Address</span>
                                    <strong>
                                        {configuration.address}
                                    </strong>
                                </div>

                                <div>
                                    <span>Phone</span>
                                    <strong>
                                        {configuration.phone}
                                    </strong>
                                </div>

                                <div>
                                    <span>Email</span>
                                    <strong>
                                        {configuration.email}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="footer">
                    <div className="container">
                        © {new Date().getFullYear()}{" "}
                        {configuration.title}
                    </div>
                </footer>
            </div>
        </>
    );

}
