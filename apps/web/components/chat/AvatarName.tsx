import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

type AvatarNameProps = {
    name: string
    avatarUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
    subtitle?: string
    subtitleClassName?: string
    verified?: boolean
}

export default function AvatarName({
    name,
    avatarUrl,
    size = 'md',
    subtitle,
    subtitleClassName,
    verified,
}: AvatarNameProps) {
    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <Avatar src={avatarUrl} name={name} size={size} />

            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-white font-semibold text-[15px] truncate">
                    {name}
                    {verified && <VerifiedBadge size="sm" />}
                </div>
                {subtitle && (
                    <div className={`text-xs truncate ${subtitleClassName ?? 'text-white/40'}`}>{subtitle}</div>
                )}
            </div>
        </div>
    )
}
