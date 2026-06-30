import { prisma } from '@kiwi/db'
import { hashPassword, comparePassword } from '../utils/hash.js'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js'
import { UserRole } from '@kiwi/types'
import { config } from '../config.js'
import type { SignupInput, LoginInput, BecomeAnAgentRequest } from '@kiwi/types'
import crypto from 'crypto'
import { sendPasswordResetEmail, sendEmailVerificationEmail } from './email.js'
import { JwtPayload } from 'jsonwebtoken'
import jwt  from 'jsonwebtoken'
import bcrypt from 'bcrypt'




 function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
    ).join('')
}

export async function signUp(input: SignupInput) {
    const { name, email, password } = input

    const existing = await prisma.user.findUnique({ where: { email }})
    if (existing) {
        return login({ email, password })
    }

    const passwordHash = await hashPassword(password) 
    const newReferralCode = generateReferralCode()

    const user = await prisma.$transaction(async (tx: any) => {
        const created = await tx.user.create({
            data: {
                name,
                email,
                password: passwordHash,
                roles: [UserRole.CLIENT],
                referralCode: newReferralCode,
                referredBy: null,
                profile: {
                    create: {}
                }
            },
            include: { profile: true }            
        })
       
        return created
    })

        const tokens = signTokens(user.id, user.roles)

        return { user, tokens }
    
}

export async function requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email }})

    if (!user) return

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
        where: { email },
        data: { resetToken, resetTokenExpiry }
    })

    await sendPasswordResetEmail(email, resetToken)

}



export async function resetPassword(email: string, newPassword:string, resetToken: string) {

    const user = await prisma.user.findUnique({
        where: { email }
    })

        if (!user || user.resetToken !== resetToken) {
            throw new Error("Invalid email or reset token");    
        }

        if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            throw new Error('Reset token has expired')
        }

        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { email },
            data: { password: passwordHash, resetToken: null, resetTokenExpiry: null }
        })
        
    }

export async function refreshToken(token: string) {
    let payload: JwtPayload
    try {
        payload = jwt.verify(token, config.REFRESH_TOKEN_SECRET) as JwtPayload
    } catch {
        throw new Error('Invalid or expired refresh token')
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, roles: true, refreshToken: true }
    })
    if (!user || user.refreshToken !== token) throw new Error('Refresh token revoked')

        const tokens = signTokens(user.id, user.roles)

        await prisma.user.update({
            where: { id: user.id },
            data:  { refreshToken: tokens.refreshToken }
    })
        return tokens
}

export async function changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string}
) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
    })
    if (!user) throw new Error('User not found')

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!valid) throw new Error('Incorrect password')

    const passwordHash = await bcrypt.hash(data.newPassword, 10)

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
    })
}

export async function requestEmailUpdate(userId: string, newEmail: string) {
    const existing = await prisma.user.findUnique({ where: { email: newEmail } })
    if (existing) throw new Error('email already in use')

        const token = crypto.randomBytes(32).toString('hex')
        const expires = new Date((Date.now() + 1000 * 60 * 60))

        await prisma.user.update({
            where: { id: userId },
            data: {
                pendingEmail: newEmail,
                emailVerifyToken: token,
                emailVerifyExpires: expires,
            }
        })

        await sendEmailVerificationEmail(newEmail, token)
}

export async function verifyEmailUpdate(token: string) {
    const user = await prisma.user.findFirst({
        where: {
            emailVerifyToken: token,
            emailVerifyExpires: { gt: new Date() }
        }
    })
    
    if (!user) throw new Error('Invalid or expired token')
    if (!user.pendingEmail) throw new Error('No pending email change')

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                emailVerifyToken: null,
                emailVerifyExpires: null,
            }
        })
}

export async function login(input: LoginInput) {
    const { email, password } = input

    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true}
    })

    if (!user) throw new Error('Invalid email or password')

        const valid = await comparePassword(password, user.passwordHash)
        if (!valid) throw new Error("Invalid email or password")

            const access_tokens = signTokens(user.id, user.roles)

        return { user, access_tokens }
} 

function signTokens(userId: string, roles: UserRole[]) {
    const payload = { userId, roles }

    const accessToken = generateAccessToken(
        payload,
        config.JWT_SECRET,
        '15m'
    )

    const refreshToken = generateRefreshToken(
        payload,
        config.JWT_SECRET,
        '30d'
    )

    return { accessToken, refreshToken}
}

export async function becomeAnAgent(request: BecomeAnAgentRequest) {
    const { userId, zone, rate, policyNote, idType, idNumber, idDocumentUrl, bio, phone, agentReferralCode } = request

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })
    if (!user) throw new Error("User not found")
        
    if (user.roles.includes(UserRole.AGENT)) {
        throw new Error("User is already an agent")
    }

    const existingApplication = await prisma.agentApplication.findUnique({ where: { userId } })
    if (existingApplication) {
        throw new Error("Application already Submitted, sit tight😁")
    }
    let referrer = null

        if (agentReferralCode) {
            referrer = await prisma.user.findFirst({ where: { referralCode: agentReferralCode, roles: { has: UserRole.AGENT} } })
            if (!referrer) throw new Error("Invalid referral Code")
        }

    const application = await prisma.$transaction(async (tx: any) => {
        const app = await tx.agentApplication.create({
            data: {
                userId,
                zone,
                rate,
                policyNote,
                idType,
                idNumber,
                idDocumentUrl,
                agentReferralCode,
            }
        })


        await tx.profile.update({
            where: { userId },
            data: {
                bio: bio ?? undefined,
                zone,
                rate,
                policyNote,
            }
        })
        if (referrer) {
            await tx.referral.create({
                data: {
                    referrerId: referrer.id,
                    referredId: userId
                }
            })

            await tx.user.update({
                where: { id: referrer.id},
                data: { referralCount: { increment: 1} }
            })
        }
        await tx.user.update({
            where: { id: userId },
            data: {
                phone: phone ?? undefined,
                referredBy: referrer?.id ?? undefined
            }
        })

        return app
    })

    return application
}

export async function approveAgentApplication(applicationId: string) {
    const application = await prisma.agentApplication.findUnique({
        where: { id: applicationId }
    })

    if (!application) throw new Error('Application not found')
    if (application.status !== 'PENDING') throw new Error('Application already reviewed')

        await prisma.$transaction(async (tx: any) => {
            await tx.agentApplication.update({
                where: { id: applicationId },
                data: { status: 'APPROVED', reviewedAt: new Date() }
            })

            await tx.user.update({
                where: { id: application.userId },
                data: {
                    roles: { push: UserRole.AGENT }
                }
            })
        })
}

//delete account