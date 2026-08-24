type AvatarProps = {
    src?: string | null
    name?: string
    size?: 'sm' | 'md' | 'lg'
}

const PALETTE = ['bg-orange-500', 'bg-teal-400', 'bg-yellow-400', 'bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-emerald-500']

function colorFor(name?: string) {
    if (!name) return PALETTE[0]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
    return PALETTE[hash % PALETTE.length]
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }
    const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    if (src) {
        return <img src={src} className={`${sizes[size]} rounded-full object-cover`} alt={name} />
    }

    return (
        <div className={`${sizes[size]} rounded-full ${colorFor(name)} text-white flex items-center justify-center font-medium`}>
            {initials ?? '?'}
        </div>
    )
}