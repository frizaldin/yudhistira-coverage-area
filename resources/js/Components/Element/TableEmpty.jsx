export default function TableEmpty({ colSpan, text = "No data available." }) {
    return (
        <tr>
            <td colSpan={colSpan} className="text-center text-muted">
                {text}
            </td>
        </tr>
    );
}
