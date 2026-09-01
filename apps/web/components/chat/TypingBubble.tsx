import { Avatar } from '@/components/ui/Avatar'

type TypingBubbleProps = {
    avatarUrl?: string | null
    name?: string
}

export default function TypingBubble({ avatarUrl, name }: TypingBubbleProps) {
    return (
        <div className="flex px-4 py-1 gap-2 justify-start">
            <div className="shrink-0 self-end">
                <Avatar src={avatarUrl} name={name} size="sm" />
            </div>
            <div className="bg-[#1c1c1e] rounded-[18px_18px_18px_4px] px-4 py-3.5 flex items-center gap-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/50" style={{ animationDelay: '0ms' }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/50" style={{ animationDelay: '160ms' }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/50" style={{ animationDelay: '320ms' }} />
            </div>
        </div>
    )
}
