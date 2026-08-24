import { NotificationType, ThreadStatus, AgreementStatus } from '@kiwi/types'
import { prisma } from '@kiwi/db'
import { notify } from './notification.js'
import axios from 'axios'
import { config } from '../config.js'

export async function getReferralStats(userId: string) {
    const [total, paid, pending] = await Promise.all([
        prisma.referral.count({ where: { referrerId: userId } }),
        prisma.referral.count({ where: { referrerId: userId, paid: true } }),
        prisma.referral.count({ where: { referrerId: userId, paid: false } }),
    ])

    return { total, paid, pending }
}

export async function triggerReferralPayout(referralId: string) {
    const referral = await prisma.referral.findUnique({
        where: { id: referralId },
        include: {
            referrer: {
                select: { id: true, paystackRecipientCode: true }
            }
        }
    })
    if (!referral) throw new Error('Referral not found')
    if (referral.paid) throw new Error('Referral already paid out')
    if (!referral.referrer.paystackRecipientCode) {
        throw new Error('Referrer has no bank details on file')
    }

    // initiate Paystack transfer
    await axios.post(
        'https://api.paystack.co/transfer',
        {
            source: 'balance',
            amount: Number(config.REFERRAL_PAYOUT_AMOUNT) * 100, // kobo
            recipient: referral.referrer.paystackRecipientCode,
            reason: 'Kiwi referral payout',
        },
        { headers: { Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}` } }
    )

    await prisma.referral.update({
        where: { id: referralId },
        data: { paid: true, paidAt: new Date() }
    })

    await notify({
        userId: referral.referrerId,
        type: NotificationType.REFERRAL_PAID,
        title: "Referral payout",
        body: 'Your referral bonus has been sent to your bank account',
        metadata: { referralId }
    })
}

export async function getMyReferrals(userId: string, cursor?: string, limit = 20) {
    const referrals = await prisma.referral.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
            referred: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    })

    const hasMore = referrals.length > limit
    if (hasMore) referrals.pop()

    return {
        referrals: referrals.map(r => ({
            id: r.id,
            paid: r.paid,
            paidAt: r.paidAt,
            createdAt: r.createdAt,
            referred: r.referred
        })),
        nextCursor: hasMore ? referrals[referrals.length - 1].id : null
    }
}