import { Link } from "@inertiajs/react";

export default function FooterButton({ url, rm_back = false }) {
    return (
        <>
            {!rm_back ? (
                <Link href={route(url)} className="btn btn-secondary">
                    <i className="bi bi-chevron-left mr-1"></i> Back
                </Link>
            ) : (
                null
            )}

            <button type="submit" className="btn btn-primary">
                <i className="bi bi-save mr-3"></i>
                Save
            </button>
        </>
    );
}
