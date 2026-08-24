import type { AgreementItem as AgreementItemType, AgreementSentiment, AgreementStage } from '@/types'
import { AgreementItem } from './AgreementItem'

const STAGE_LABELS: Record<AgreementStage, string> = {
    BEFORE: 'Before the deal',
    DURING: 'During the deal',
    AFTER: 'After the deal',
}

interface StageSectionProps {
    stage: AgreementStage
    items: AgreementItemType[]
    onAnswer: (itemId: string, sentiment: AgreementSentiment, answer?: string) => Promise<void>
}

export function StageSection({ stage, items, onAnswer }: StageSectionProps) {
    if (items.length === 0) return null

    return (
        <div className="space-y-2.5">
            <p className="text-cyan-400/50 text-[10px] font-semibold tracking-widest uppercase px-4">
                {STAGE_LABELS[stage]}
            </p>
            <div className="space-y-2">
                {items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                        <AgreementItem key={item.id} item={item} onAnswer={onAnswer} />
                    ))}
            </div>
        </div>
    )
}
