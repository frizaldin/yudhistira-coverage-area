export default function ConfigurationCard({ title, children }) {
    return (
        <div className="card mb-4">
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
            </div>

            <div className="card-body">
                <div className="row">
                    {children}
                </div>
            </div>
        </div>
    )
}
