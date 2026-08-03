import { router } from "@inertiajs/react"

export default function Pagination({ collection }) {
    return (
        <div className="card-footer d-flex" style={{
            gap: "10px"
        }}>
            {collection.links.map((link, i) => (
                <button
                    key={i}
                    disabled={!link.url}
                    onClick={() => router.visit(link.url)}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`btn btn-sm ${link.active ? 'btn-primary' : 'btn-light'}`}
                />
            ))}
        </div>
    )
}
