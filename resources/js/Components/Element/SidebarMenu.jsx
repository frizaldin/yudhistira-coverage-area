import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function SidebarMenu({ data, children }) {
    const { auth } = usePage().props;

    const canAccess = (menuKey) => {
        const permissions = auth?.user?.role?.permissions || [];

        return permissions.some((p) => {
            return p.menu?.key === menuKey;
        });
    };

    const getMenus = (name) => {
        if (name == "user-management") {
            return "/users,/roles";
        } else if (name == "settings") {
            return "/configuration";
        } else if (name == "products") {
            return "/product-categories,/units";
        } else if (name == "contents") {
            return "/categories,/blogs,/onboardings,/sliders,/divisions";
        } else if (name == "account-center") {
            return "/accounts";
        }
    }

    const canAccessParent = (name) => {
        const menus = getMenus(name)

        const permissions = auth?.user?.role?.permissions || [];

        return permissions.some((p) => {
            return menus.includes('/'+p.menu?.key);
        });
    };

    const { url } = usePage();

    const getBasePath = () => {
        const cleanUrl = url.split("?")[0];
        return "/" + cleanUrl.split("/")[2];
    };

    const isActive = (path) => {
        return getBasePath() === path ? "active" : "";
    };

    const isActiveParent = (name) => {
        const menus = getMenus(name)

        return menus.includes(getBasePath()) ? "menu-open" : "";
    };

    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <>
            {data.parent ? (
                <>
                    {canAccessParent(data.parent) && (
                        <>
                            <li className="nav-header">{data.title} {canAccessParent(data.parent)}</li>
                            {children}
                            <div className="mb-0" style={{
                                fontSize: "6px"
                            }}>&nbsp;</div>
                        </>
                        // <li
                        //     className={`nav-item ${openMenu === data.parent ? "menu-open" : ""} ${isActiveParent(data.parent)}`}
                        // >
                        //     <a
                        //         href="#"
                        //         onClick={(e) => {
                        //             e.preventDefault();
                        //             toggleMenu(data.parent);
                        //         }}
                        //         className={`nav-link ${openMenu === data.parent ? "active" : ""}`}
                        //     >
                        //         <i className={`nav-icon bi ${data.icon}`}></i>
                        //         <p>
                        //             {data.title}
                        //             <i className="nav-arrow bi bi-chevron-right"></i>
                        //         </p>
                        //     </a>

                        //     <ul className="nav nav-treeview">{children}</ul>
                        // </li>
                    )}
                </>
            ) : (
                <>
                    {canAccess(data.code) && (
                        <li className="nav-item">
                            <Link
                                href={route(`${data.route}`)}
                                className={`nav-link ${isActive(`/${data.code}`)}`}
                            >
                                <i className={`nav-icon bi ${data.icon}`}></i>
                                <p>{data.title}</p>
                            </Link>
                        </li>
                    )}
                </>
            )}
        </>
    );
}
