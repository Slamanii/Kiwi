import { Avatar } from '@/components/ui/Avatar'
import { formatNaira } from '@/lib/filterconfig'
import type { Order } from '@/types'

type OrderCardProps = {
    order: Order
    currentUserId?: string
    onFollowUp?: () => void
    onCancel?: () => void
    loading?: boolean
    /** Renders as a plain summary with no action button — used inline in a conversation. */
    readOnly?: boolean
}

const STATUS_LABEL: Record<Order['status'], string> = {
    PENDING: 'Pending',
    ADMIN_CONTACTED: 'Contacted',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
}

export function OrderCard({ order, currentUserId, onFollowUp, onCancel, loading, readOnly }: OrderCardProps) {
    const buyer = order.buyer ?? { id: order.buyerId, name: 'Unknown' }
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const isPending = order.status === 'PENDING'
    const isClosed = order.status === 'COMPLETED' || order.status === 'CANCELLED'
    const isMyOrder = currentUserId === order.buyerId

    return (
        <div className={`bg-[#1c1c1e] rounded-2xl p-4 space-y-3 border transition-colors
            ${isPending ? 'border-cyan-400/20' : isClosed ? 'border-white/5 opacity-60' : 'border-cyan-400/40'}
        `}>
            <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full
                ${order.status === 'COMPLETED' ? 'bg-cyan-400/20 text-cyan-300'
                    : order.status === 'CANCELLED' ? 'bg-white/8 text-white/30'
                    : order.status === 'DISPUTED' ? 'bg-red-500/20 text-red-300'
                    : 'bg-white/8 text-white/50'}
            `}>
                {STATUS_LABEL[order.status]}
            </span>

            <div className="flex items-center gap-3">
                <Avatar src={buyer.profile?.avatarUrl} name={buyer.name} size="md" />
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{buyer.name}</span>
                    <span className="text-xs text-white/40">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
                <p className="text-sm text-cyan-400 font-bold shrink-0">{formatNaira(total)}</p>
            </div>

            <div className="space-y-1 border-t border-white/5 pt-3">
                {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/60 truncate">
                            {item.quantity}× {item.listing?.title ?? 'Item'}
                        </span>
                        <span className="text-white/40 shrink-0">{formatNaira(item.price * item.quantity)}</span>
                    </div>
                ))}
            </div>

            {order.description && (
                <p className="text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">
                    {order.description}
                </p>
            )}

            {!isClosed && !readOnly && (
                isMyOrder ? (
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400
                            text-sm active:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                        Cancel Order
                    </button>
                ) : (
                    <button
                        onClick={onFollowUp}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-cyan-400 text-black text-sm font-medium
                            active:bg-cyan-300 transition-colors disabled:opacity-40"
                    >
                       Follow up
                    </button>
                )
            )}
        </div>
    )
}
