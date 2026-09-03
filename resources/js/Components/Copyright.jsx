export default function Copyright({ className = "", style }) {
    return (
        <span className={className} style={style}>
            Copyright &copy; {new Date().getFullYear()} by Wan Teknologi
        </span>
    );
}
