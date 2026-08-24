import { Skeleton } from '../../components/ui/Skeleton'

export function SeekCardSkeleton() {
    return (
        <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-16 h-2" />
                </div>
            </div>
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-full h-16" />
            <div className="flex gap-2">
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            <Skeleton className="w-full h-10 rounded-xl" />

        </div>
    )
}