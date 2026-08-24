import { prisma } from '@kiwi/db'
import { UserRole } from '@kiwi/types'

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.error('Usage: tsx scripts/bootstrapAdmin.ts <email>')
        process.exit(1)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.error(`No user found with email ${email}`)
        process.exit(1)
    }

    if (user.roles.includes(UserRole.ADMIN)) {
        console.log(`${email} is already an admin`)
        process.exit(0)
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { roles: { push: UserRole.ADMIN } }
    })

    console.log(`${email} is now an admin`)
}

main()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
