import { BankDetailsInput } from '@kiwi/types'
import axios from 'axios'
import { config } from '../config.js'

export async function verifyAccountWithPaystack(accountNumber: string, bankCode: string) {
    
    const success = 'done'
    
    return success
}

export async function createPaystackRecipient({ accountNumber, bankCode, accountName }: {
    accountNumber: string
    bankCode: string
    accountName: string
}): Promise<string> {
    const response = await axios.post(
        'https://api.paystack.co/transferrecipient',
        {
            type: 'nuban',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN',
        },
        { headers: { Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}` } }
    )

    return response.data.data.recipient_code
}