export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-medium form-label ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
