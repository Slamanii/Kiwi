import { AgreementStage, AgreementItemKind } from '@kiwi/types'

type TemplateItem = {
    stage: AgreementStage
    kind: AgreementItemKind
    order: number
    requirement: string
}

// Hardcoded per-deal checklist grounded in the app's existing PAMilestone
// vocabulary. CHECKPOINT items gate how far the client can see ahead —
// answering GOOD unlocks everything up to the next checkpoint, answering BAD
// re-locks the same item for another 2 days (see answerAgreementItem).
export const AGREEMENT_TEMPLATE: TemplateItem[] = [
    { stage: AgreementStage.BEFORE, kind: AgreementItemKind.CONTENT, order: 0, requirement: 'Has the agent confirmed the property is available and matches the seek?' },
    { stage: AgreementStage.BEFORE, kind: AgreementItemKind.CONTENT, order: 1, requirement: 'Has an inspection been scheduled?' },
    { stage: AgreementStage.DURING, kind: AgreementItemKind.CHECKPOINT, order: 2, requirement: 'Is this deal moving along quickly?' },
    { stage: AgreementStage.DURING, kind: AgreementItemKind.CONTENT, order: 3, requirement: 'Has the inspection been completed?' },
    { stage: AgreementStage.DURING, kind: AgreementItemKind.CONTENT, order: 4, requirement: 'Have all required documents been submitted?' },
    { stage: AgreementStage.DURING, kind: AgreementItemKind.CHECKPOINT, order: 5, requirement: 'Is this deal still moving along quickly?' },
    { stage: AgreementStage.AFTER, kind: AgreementItemKind.CONTENT, order: 6, requirement: 'Has payment been completed?' },
    { stage: AgreementStage.AFTER, kind: AgreementItemKind.CONTENT, order: 7, requirement: 'Has the client taken possession / closed the deal?' },
]
