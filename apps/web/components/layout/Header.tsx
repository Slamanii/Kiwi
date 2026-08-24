export function Header({ left, center, right }: {
    left?: React.ReactNode
    center?: React.ReactNode
    right?: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between px-4 h-14 shrink-0 bg-white border-b border-gray-100">
            <div className="w-10 flex items-center">{left}</div>
            <div className="flex-1 flex justify-center">{center}</div>
            <div className="w-10 flex items-center justify-end">{right}</div>
        </div>
    )
}