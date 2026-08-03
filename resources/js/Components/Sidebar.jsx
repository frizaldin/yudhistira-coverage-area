import { Link, usePage } from "@inertiajs/react";
import SidebarMenu from "./Element/SidebarMenu";

export default function Sidebar() {
    const { configuration, menuIcons } = usePage().props

    return (
        <aside
            className="app-sidebar bg-body-secondary shadow"
            data-bs-theme="dark"
        >
            <div className="sidebar-brand">
                <Link href={route('dashboard')} className="brand-link">
                    <img src={configuration.favicon} alt="logo"
                        className="brand-image shadow block h-9 w-auto fill-current text-gray-800" />
                    <span className="ml-3 text-uppercase"
                        style={{
                            fontWeight: '700',
                            letterSpacing: '1px',
                            color: 'var(--color-sidebar-text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: '100%'
                        }}>{configuration.title}</span>
                </Link>
            </div>
            <div className="sidebar-wrapper">
                <nav className="mt-2">
                    <ul
                        className="nav sidebar-menu flex-column"
                        data-lte-toggle="treeview"
                        role="navigation"
                        aria-label="Main navigation"
                        data-accordion="false"
                        id="navigation"
                    >
                        <SidebarMenu
                            data={{
                                code: "monitoring.nasional",
                                title: "Monitoring",
                                icon: menuIcons.dashboard,
                                route: "monitoring.nasional"
                            }}
                        />
                        <div className="mb-0" style={{
                            fontSize: "6px"
                        }}>&nbsp;</div>

                        {/* ACCESS CONTROL */}
                        <SidebarMenu
                            data={{
                                parent: "user-management",
                                title: "ACCESS CONTROL",
                            }}
                        >
                            <SidebarMenu
                                data={{
                                    code: "users",
                                    title: "Users",
                                    icon: menuIcons.users,
                                    route: "users.index"
                                }}
                            />
                            <SidebarMenu
                                data={{
                                    code: "roles",
                                    title: "Roles",
                                    icon: menuIcons.roles,
                                    route: "roles.index"
                                }}
                            />
                        </SidebarMenu>

                        {/* SETTINGS */}
                        <SidebarMenu
                            data={{
                                parent: "settings",
                                title: "SETTINGS",
                            }}
                        >
                            <SidebarMenu
                                data={{
                                    code: "configuration",
                                    title: "Configuration",
                                    icon: menuIcons.configuration,
                                    route: "configuration.index",
                                }}
                            />

                            <SidebarMenu
                                data={{
                                    code: "terms-conditions",
                                    title: "Terms & Conditions",
                                    icon: menuIcons.terms_conditions,
                                    route: "terms-conditions.index",
                                }}
                            />

                            <SidebarMenu
                                data={{
                                    code: "privacy-policy",
                                    title: "Privacy Policy",
                                    icon: menuIcons.privacy_policy,
                                    route: "privacy-policy.index",
                                }}
                            />
                        </SidebarMenu>
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
