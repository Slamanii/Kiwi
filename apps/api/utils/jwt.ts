import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'

export function generateAccessToken(
    payload: object,
    secret: Secret,
    expiresIn: SignOptions['expiresIn'],
) {
    return jwt.sign(payload, secret, { expiresIn })
}