// ─── Types ────────────────────────────────────────────────
export type BudgetFilter = { min?: number; max?: number; label: string }
export type TypeFilter   = { value: string; label: string }
export type RoomsFilter  = { min: number; max: number; label: string }
export type StatusFilter = { value: string; label: string }
export type CityFilter   = {
    state: string; stateLabel: string
    city: string;  cityLabel: string
    label: string
}
export type ListingTypeFilter = { value: 'RENT' | 'SALE' | 'SHORTLET'; label: string }

export type AppliedFilters = {
    budget?:      BudgetFilter
    type?:        TypeFilter
    rooms?:       RoomsFilter
    status?:      StatusFilter
    city?:        CityFilter
    listingType?: ListingTypeFilter   // ← add
}

export type FilterKey = keyof AppliedFilters

// ─── Budget ────────────────────────────────────────────────
export const BUDGET_MAX  = 50_000_000
export const BUDGET_STEP = 100_000

export const BUDGET_PRESETS = [
    { label: 'Under ₦300K',      min: 0,          max: 300_000                            },
    { label: '₦300K – ₦500K',    min: 300_000,    max: 500_000           },
    { label: '₦500K – ₦1.2M',    min: 500_000,    max: 1_200_000         },
    { label: '₦1.2M – ₦2M',      min: 1_200_000,  max: 2_000_000         },
    { label: '₦2M – ₦3M',        min: 2_000_000,  max: 3_000_000         },
    { label: '₦3M – ₦5M',        min: 3_000_000,  max: 5_000_000         },
    { label: '₦5M – ₦10M',       min: 5_000_000,  max: 10_000_000        },
    { label: '₦10M – ₦20M',      min: 10_000_000, max: 20_000_000        },
    { label: 'Above ₦20M',       min: 20_000_000                         },
] as const

// ─── Property Type ─────────────────────────────────────────
export const PROPERTY_TYPES = [
    { value: 'LOFT',      label: 'Loft'      },
    { value: 'MINI_FLAT', label: 'Mini Flat' },
    { value: 'DUPLEX',    label: 'Duplex'    },
    { value: 'BUNGALOW',  label: 'Bungalow'  },
    { value: 'BQ',        label: 'BQ'        },
    { value: 'STORE',     label: 'Store'     },
    { value: 'OFFICE',    label: 'Office'    },
]

// ─── Status ────────────────────────────────────────────────
export const STATUS_OPTIONS = [
    { value: 'URGENT', label: 'Urgent', desc: 'Needs a place as soon as possible' },
    { value: 'NORMAL', label: 'Normal', desc: 'Looking at their own pace'         },
]

// ─── Nigerian States + Cities ──────────────────────────────
export type NigerianCity  = { value: string; label: string }
export type NigerianState = { value: string; label: string; cities: NigerianCity[] }

export const NIGERIAN_STATES: NigerianState[] = [
    {
        value: 'lagos', label: 'Lagos',
        cities: [
            { value: 'ikeja',           label: 'Ikeja'           },
            { value: 'lekki',           label: 'Lekki'           },
            { value: 'victoria_island', label: 'Victoria Island' },
            { value: 'ikoyi',           label: 'Ikoyi'           },
            { value: 'surulere',        label: 'Surulere'        },
            { value: 'yaba',            label: 'Yaba'            },
            { value: 'ajah',            label: 'Ajah'            },
            { value: 'gbagada',         label: 'Gbagada'         },
            { value: 'maryland',        label: 'Maryland'        },
            { value: 'apapa',           label: 'Apapa'           },
            { value: 'festac',          label: 'Festac'          },
            { value: 'mushin',          label: 'Mushin'          },
            { value: 'oshodi',          label: 'Oshodi'          },
            { value: 'agege',           label: 'Agege'           },
            { value: 'badagry',         label: 'Badagry'         },
            { value: 'alimosho',        label: 'Alimosho'        },
        ],
    },
    {
        value: 'abuja', label: 'Abuja',
        cities: [
            { value: 'maitama',   label: 'Maitama'   },
            { value: 'asokoro',   label: 'Asokoro'   },
            { value: 'wuse',      label: 'Wuse'      },
            { value: 'garki',     label: 'Garki'     },
            { value: 'gwarinpa',  label: 'Gwarinpa'  },
            { value: 'kubwa',     label: 'Kubwa'     },
            { value: 'jabi',      label: 'Jabi'      },
            { value: 'utako',     label: 'Utako'     },
            { value: 'apo',       label: 'Apo'       },
            { value: 'gudu',      label: 'Gudu'      },
            { value: 'lokogoma',  label: 'Lokogoma'  },
            { value: 'life_camp', label: 'Life Camp' },
        ],
    },
    {
        value: 'rivers', label: 'Rivers',
        cities: [
            { value: 'port_harcourt', label: 'Port Harcourt' },
            { value: 'obio_akpor',    label: 'Obio/Akpor'   },
            { value: 'eleme',         label: 'Eleme'         },
            { value: 'ikwerre',       label: 'Ikwerre'       },
        ],
    },
    {
        value: 'ogun', label: 'Ogun',
        cities: [
            { value: 'abeokuta',  label: 'Abeokuta'  },
            { value: 'sagamu',    label: 'Sagamu'    },
            { value: 'ijebu_ode', label: 'Ijebu-Ode' },
            { value: 'ota',       label: 'Ota'       },
        ],
    },
    {
        value: 'oyo', label: 'Oyo',
        cities: [
            { value: 'ibadan',    label: 'Ibadan'    },
            { value: 'ogbomoso',  label: 'Ogbomoso'  },
            { value: 'oyo_town',  label: 'Oyo'       },
        ],
    },
    {
        value: 'kano', label: 'Kano',
        cities: [
            { value: 'kano_municipal', label: 'Kano Municipal' },
            { value: 'nasarawa_kano',  label: 'Nasarawa'       },
            { value: 'fagge',          label: 'Fagge'          },
        ],
    },
    {
        value: 'delta', label: 'Delta',
        cities: [
            { value: 'warri',    label: 'Warri'   },
            { value: 'asaba',    label: 'Asaba'   },
            { value: 'effurun',  label: 'Effurun' },
        ],
    },
    {
        value: 'anambra', label: 'Anambra',
        cities: [
            { value: 'awka',     label: 'Awka'     },
            { value: 'onitsha',  label: 'Onitsha'  },
            { value: 'nnewi',    label: 'Nnewi'    },
        ],
    },
    {
        value: 'enugu', label: 'Enugu',
        cities: [
            { value: 'enugu_north', label: 'Enugu North' },
            { value: 'enugu_south', label: 'Enugu South' },
            { value: 'nsukka',      label: 'Nsukka'      },
        ],
    },
    {
        value: 'edo', label: 'Edo',
        cities: [
            { value: 'benin_city', label: 'Benin City' },
            { value: 'ekpoma',     label: 'Ekpoma'     },
            { value: 'auchi',      label: 'Auchi'      },
        ],
    },
]

export const LISTING_TYPE_OPTIONS = [
    { value: 'RENT'     as const, label: 'Rent',     desc: 'Long-term rental — annual or bi-annual contracts' },
    { value: 'SALE'     as const, label: 'Sale',     desc: 'Looking to buy or selling a property'            },
    { value: 'SHORTLET' as const, label: 'Shortlet', desc: 'Short-term furnished stays — nightly or weekly'  },
]

// ─── Utility ───────────────────────────────────────────────
export function formatNaira(v: number): string {
    if (v >= 1_000_000) return `₦${+(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `₦${Math.round(v / 1_000)}K`
    return `₦${v}`
}