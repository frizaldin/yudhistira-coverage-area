import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import ToggleSidebar from './Element/ToggleSidebar';

export default function Navbar() {
    const user = usePage().props.auth.user;

    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <nav className="app-header navbar navbar-expand bg-body">
            <div className="container-fluid">
                <ul className={`navbar-nav ${!sidebarOpen ? 'sm-ml-250' : ''}`}>
                    <li className="nav-item">
                        <ToggleSidebar
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                        />
                    </li>
                </ul>

                <ul className="navbar-nav ms-auto">
                    <li className="nav-item dropdown user-menu" onClick={(e) => {
                        e.preventDefault();
                        toggleMenu('profile');
                    }}>
                        <a href="#"
                            className={`nav-link dropdown-toggle name-navbar ${openMenu === 'profile' ? 'show' : ''}`}
                            aria-expanded={`${openMenu === 'profile' ? 'true' : 'false'}`}>

                            <svg className={`transition arrow ${openMenu === 'profile' ? 'rotate' : ''}`} width="16" height="16" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 13.5L18 22.5L27 13.5" strokeWidth="2" stroke-line-cap="round" stroke-line-join="round"/>
                            </svg>

                            <span className="d-md-inline">{user.name}</span>
                        </a>
                        <ul className={`dropdown-menu dropdown-menu-lg dropdown-menu-end ${openMenu === 'profile' ? 'show' : ''}`}
                            data-bs-popper={`${openMenu === 'profile' ? 'static' : ''}`}>
                            <li className="user-header box-profile">
                                <p>
                                    {user.name}
                                    <small>{user.role.name}</small>
                                    <small>{user.email}</small>
                                </p>
                            </li>
                            <li className="user-footer">
                                <Link href={route('profile.edit')} className="btn btn-outline-secondary">Profile</Link>
                                <Link
                                    method="post"
                                    href={route('logout')}
                                    as="button"
                                    className="btn btn-outline-danger float-end"
                                >
                                    Log Out
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    )
}
