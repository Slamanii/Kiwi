import { prisma } from '@kiwi/db'
import { UserRole } from '@kiwi/types'


export async function getProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roles: true,
                    verificationStatus: true,
                    subscriptionTier: true,
                    referralCode: true,
                    createdAt: true,
                }
            }
        }
    })

    if (!profile) throw new Error('Profile not found')
        return profile
}


export async function updateProfile(userId: string, data: UpdateProfileInput) {
    const { name, phone, bio, avatarUrl, location, zone, rate, policyNote } = data

    const profile = await prisma.profile.findUnique({
        where: { userId }
    })
    if (!profile) throw new Error('Profile not found')

        const [updatedProfile] = await prisma.$transaction([
            prisma.profile.update({
                where: { userId },
                data: {
                    bio: bio ?? undefined,
                    avatarUrl: avatarUrl ?? undefined,
                    location: location ?? undefined,
                    zone: zone ?? undefined,
                    rate: rate ?? undefined,
                    policyNote: policyNote ?? undefined,
                }
            })
        ])
}
