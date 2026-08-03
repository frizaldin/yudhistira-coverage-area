import { useEffect } from 'react';

export default function ToggleSidebar({
    sidebarOpen,
    setSidebarOpen
}) {

    useEffect(() => {
        const isMobile = window.innerWidth < 992;

        if (isMobile) {
            if (sidebarOpen) {
                document.body.classList.remove("sidebar-open");
            } else {
                document.body.classList.add("sidebar-open");
            }
        } else {
            if (sidebarOpen) {
                document.body.classList.remove("sidebar-collapse");
            } else {
                document.body.classList.add("sidebar-collapse");
            }
        }
    }, [sidebarOpen]);

    return (
        <a
            className="nav-link"
            href="#"
            role="button"
            onClick={(e) => {
                e.preventDefault();
                setSidebarOpen(!sidebarOpen);
            }}
        >
            <i className="bi bi-list"></i>
        </a>
    );
}
