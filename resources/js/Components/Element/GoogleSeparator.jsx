export default function GoogleSeparator() {
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>

            <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs uppercase text-gray-500">
                    Or continue with email
                </span>
            </div>
        </div>
    )
}
