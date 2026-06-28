import { prisma } from '@kiwi/db'
import { UserRole, UpdateProfileInput, BankDetailsInput } from '@kiwi/types'
import { verifyAccountWithPaystack, createPaystackRecipient } from './paystack.js'

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
    const { name, phone, bio, avatarUrl, location, zone, rate, policyNote, inspectionFee } = data

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    })
    if (!user) throw new Error('User not found')
    if (!user.profile) throw new Error('Profile not found')

        const isAgent = user.roles.includes(UserRole.AGENT)

        const profileData: any = {
            bio: bio ?? undefined,
            avatarUrl: avatarUrl ?? undefined,
            location: location ?? undefined,
        }

        if (isAgent) {
            profileData.zone = zone ?? undefined,
            profileData.rate = rate ?? undefined,
            profileData.policyNote = policyNote ?? undefined,
            profileData.inspectionFee = inspectionFee ?? undefined
        }
        const [updatedProfile] = await prisma.$transaction([
            prisma.profile.update({
                where: { userId },
                data: 
                    profileData                    
                
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    name: name ?? undefined,
                    phone: phone ?? undefined,
                }
            })
        ])

        return updatedProfile
}

export async function updateBankDetails(userId: string, data: BankDetailsInput) {
    const { accountNumber, bankCode, accountName } = data

    const verified = await verifyAccountWithPaystack(accountNumber, bankCode) 
    if (!verified) throw new Error('Could not verify bank account')

        const recipientCode = await createPaystackRecipient({
            accountNumber,
            bankCode,
            accountName
        })

        return prisma.user.update({
            where: {id: userId },
            data: {
                accountNumber,
                bankCode,
                accountName,
                paystackRecipientCode: recipientCode
            }
        })
}
