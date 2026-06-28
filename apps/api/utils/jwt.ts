import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'

export function generateAccessToken(
    payload: object,
    secret: Secret,
    expiresIn: SignOptions['expiresIn'],
) {
    return jwt.sign(payload, secret, { expiresIn })
}

export function verifyAccessToken(token: string, secret: Secret) {
    
    return jwt.verify(token, secret)
}

export function generateRefreshToken(payload: object, secret: Secret, expiresIn: SignOptions['expiresIn']) {

    return jwt.sign(payload, secret, {expiresIn})
}