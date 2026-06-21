import nodemailer from 'nodemailer'
import { config } from '../config.js'

const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT, 
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
    }
})

export async function sendPasswordResetEmail(email: string, resetToken: string) {

    const resetUrl = `${config.APP_URl}/reset-password?token=${resetToken}&email=${email}`

    await transporter.sendMail({
        from: `"Kiwi" <no-reply@kiwi.com>`,
        to: email,
        subject: 'Reset your password',
        html: `
            <p>You requested a password rreset.</p>
            <p.Click the link below to reset your password. It expires in 1 hour.</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>If you didn't request this, ignore this email.</p>
        ` 
    })
}