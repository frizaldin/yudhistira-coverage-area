import { usePage } from "@inertiajs/react";

export default function Footer() {
    const { configuration } = usePage().props

    return (
        <footer className="app-footer">
            <div className="float-end d-none d-sm-inline">v1.0.0</div>
            {configuration.footer_copyright}
        </footer>
    );
}
