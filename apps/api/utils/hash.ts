import bcrypt from 'bcrypt'

export const SALT_ROUNDS = 12;

export  function hashPassword(password: string): Promise<string> {

    const hash =   bcrypt.hash(password, SALT_ROUNDS);

    if (!hash) {
        throw new Error("Failed to hash Password");
    } else {
        return hash
    }
}

export  function comparePassword(password: string, hash: string): Promise<boolean> {
     
    const valid =  bcrypt.compare(password, hash)

    if (!valid) {
        throw new Error("Password does not match");
    } else {
        return valid
    }
}