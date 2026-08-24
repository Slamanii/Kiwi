import type { Seek } from '@/types'
import type { AppliedFilters } from '@/lib/filterconfig'

export function applySeekFilters(seeks: Seek[], filters: AppliedFilters): Seek[] {
    return seeks.filter(seek => {
        const { budget, type, rooms, status, city, listingType } = filters

        if (budget) {
            const amt = seek.budget ?? 0
            if (budget.min && amt < budget.min) return false
            if (budget.max && amt > budget.max) return false
        }
        if (type        && seek.propertyType !== type.value)                   return false
        if (rooms && (seek.rooms === undefined || seek.rooms < rooms.min || seek.rooms > rooms.max)) return false
        if (status      && seek.urgency      !== status.value)                 return false
        if (city        && !seek.location?.startsWith(city.cityLabel))         return false
        if (listingType) {
            const isRentType = ['LOOKING_TO_RENT', 'PROPERTY_FOR_RENT'].includes(seek.type)
            const isSaleType = ['LOOKING_TO_BUY',  'PROPERTY_FOR_SALE'].includes(seek.type)
            if (listingType.value === 'SHORTLET' && !(isRentType && seek.isShortlet))  return false
            if (listingType.value === 'RENT'     && !(isRentType && !seek.isShortlet)) return false
            if (listingType.value === 'SALE'     && !isSaleType)                       return false
        }
        return true
    })
}
