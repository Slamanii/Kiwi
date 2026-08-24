import Link from 'next/link'

type BidSeekHeaderProps = {
    seekId: string
    content: string
    type: string
    location?: string
}

export function BidSeekHeader({ seekId, content, type, location }: BidSeekHeaderProps) {
    return (
        <Link href={`/seek/${seekId}`} className="block px-1">
            <p className="text-[11px] text-white/40 truncate">
                <span className="text-white/60 font-medium">{type.replace(/_/g, ' ')}</span>
                {location ? ` · ${location}` : ''}
            </p>
            <p className="text-xs text-white/50 truncate">{content}</p>
        </Link>
    )
}
