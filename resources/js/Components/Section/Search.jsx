
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Search({ filters, url, placeholder = 'name, email, or role...' }) {
    const [search, setSearch] = useState(filters.search || "");

    useEffect(() => {
        if (search === (filters.search || "")) return;

        const delay = setTimeout(() => {
            router.get(
                route(`${url}.index`),
                {
                    search,
                    status: filters.status
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }, 500);

        return () => clearTimeout(delay);
    }, [search]);

    return (
        <form className="mb-0 d-flex p-3">
            <div className="input-group mb-3">
                <span className="input-group-text">
                    <i className="bi bi-search"></i>
                </span>
                <input
                    type="text"
                    className="form-control"
                    placeholder={`Search ${placeholder}`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </form>
    );
}
