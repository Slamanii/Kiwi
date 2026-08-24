export interface Currency { code: string; symbol: string; name: string }

export const CURRENCIES: Currency[] = [
    { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira'     },
    { code: 'USD', symbol: '$',   name: 'US Dollar'           },
    { code: 'GBP', symbol: '£',   name: 'British Pound'       },
    { code: 'EUR', symbol: '€',   name: 'Euro'                },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar'     },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi'      },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling'     },
    { code: 'ZAR', symbol: 'R',   name: 'South African Rand'  },
]

export function currencySymbol(code?: string | null): string {
    return CURRENCIES.find(c => c.code === code)?.symbol ?? '₦'
}
