import type { ListingCategory, ListingCondition, CommunityCategory } from '@/types'

export type LabeledOption<T extends string> = { value: T; label: string }

export function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|webm|m4v)$/i.test(url)
}

// ─── Listing Category (Marketplace tab) ────────────────────
export const LISTING_CATEGORIES: LabeledOption<ListingCategory>[] = [
    { value: 'FURNITURE',        label: 'Furniture'       },
    { value: 'ELECTRONICS',      label: 'Electronics'     },
    { value: 'COMPUTING',        label: 'Computing'       },
    { value: 'GADGETS',          label: 'Gadgets'         },
    { value: 'FASHION',          label: 'Fashion'         },
    { value: 'BEAUTY',           label: 'Beauty'          },
    { value: 'HOME_APPLIANCES',  label: 'Home Appliances' },
    { value: 'TOOLS_EQUIPMENT',  label: 'Tools & Equipment' },
    { value: 'VEHICLES',         label: 'Vehicles'        },
    { value: 'REAL_ESTATE',      label: 'Real Estate'     },
    { value: 'BOOKS_MEDIA',      label: 'Books & Media'   },
    { value: 'GAMING',           label: 'Gaming'          },
    { value: 'SPORTING_GOODS',   label: 'Sporting Goods'  },
    { value: 'SERVICES',         label: 'Services'        },
    { value: 'FOOD_GROCERY',     label: 'Food & Grocery'  },
    { value: 'OTHER',            label: 'Other'           },
]

// ─── Listing Condition (badge on listing card/modal) ───────
export const LISTING_CONDITIONS: LabeledOption<ListingCondition>[] = [
    { value: 'NEW',         label: 'New'         },
    { value: 'FAIRLY_USED',  label: 'Fairly Used' },
    { value: 'USED',        label: 'Used'        },
]

export function conditionLabel(condition: ListingCondition): string {
    return LISTING_CONDITIONS.find(c => c.value === condition)?.label ?? condition
}

// ─── Community Category (Groups tab) ───────────────────────
export const COMMUNITY_CATEGORIES: LabeledOption<CommunityCategory>[] = [
    { value: 'NEIGHBORHOOD',          label: 'Neighborhood'          },
    { value: 'REAL_ESTATE',           label: 'Real Estate'           },
    { value: 'INTERIOR_DESIGN',       label: 'Interior Design'       },
    { value: 'PROPERTY_INVESTMENT',   label: 'Property Investment'   },
    { value: 'AGENTS_PROFESSIONALS',  label: 'Agents & Professionals' },
    { value: 'STUDENT_HOUSING',       label: 'Student Housing'       },
    { value: 'HOME_SERVICES',         label: 'Home Services'         },
    { value: 'GENERAL',               label: 'General'               },
]
