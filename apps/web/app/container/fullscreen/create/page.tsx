'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { NIGERIAN_STATES, type NigerianState } from '@/lib/filterconfig'
import { CURRENCIES, type Currency } from '@/lib/currency'
import { ChevronLeftIcon } from '@/components/ui/Icons'


type SeekType = 'LOOKING_TO_RENT' | 'LOOKING_TO_BUY' | 'PROPERTY_FOR_RENT' | 'PROPERTY_FOR_SALE' | 'INFO'
type PropertyType = 'LOFT' | 'MINI_FLAT' | 'DUPLEX' | 'BUNGALOW' | 'BQ' | 'STORE' | 'OFFICE'
type Urgency = 'NORMAL' | 'URGENT'

interface LocationResult { description: string; city: string; state: string }


const POST_TYPES = [
    {
        type:         'LOOKING_TO_RENT'   as SeekType,
        label:        'Looking to Rent?',
        description:  'I need a place, might be shortlet or longer',
        color:        'bg-blue-400',
        allowedRoles: null as string[] | null,
    },
    {
        type:         'LOOKING_TO_BUY'    as SeekType,
        label:        'Looking to Buy?',
        description:  "I'm looking to purchase Real Estate",
        color:        'bg-emerald-400',
        allowedRoles: null,
    },
    {
        type:         'PROPERTY_FOR_RENT' as SeekType,
        label:        'Property For Rent',
        description:  'I have property for shortlet or longer',
        color:        'bg-purple-400',
        allowedRoles: ['USER', 'DEVELOPER'],
    },
    {
        type:         'PROPERTY_FOR_SALE' as SeekType,
        label:        'Property for Sale',
        description:  'I have property for sale',
        color:        'bg-orange-400',
        allowedRoles: ['USER', 'DEVELOPER'],
    },
    {
        type:         'INFO'              as SeekType,
        label:        'Post Info',
        description:  'Share market insights or information',
        color:        'bg-yellow-400',
        allowedRoles: ['AGENT', 'DESIGNER', 'DEVELOPER'],
    },
]


const PROPERTY_TYPES: { key: PropertyType; label: string }[] = [
    { key: 'LOFT',      label: 'Loft'      },
    { key: 'MINI_FLAT', label: 'Mini Flat' },
    { key: 'DUPLEX',    label: 'Duplex'    },
    { key: 'BUNGALOW',  label: 'Bungalow'  },
    { key: 'BQ',        label: 'Bq'        },
    { key: 'STORE',     label: 'Store'     },
    { key: 'OFFICE',    label: 'Office'    },
]

type Question = { key: string; label: string }

const QUESTIONS: Partial<Record<SeekType, Question[]>> = {
    LOOKING_TO_RENT: [
        { key: 'isSingle',      label: 'Are you single?'          },
        { key: 'hasPets',       label: 'Do you have pets?'        },
        { key: 'hasChildren',   label: 'Do you have children?'    },
        { key: 'isStudent',     label: 'Are you a student?'       },
        { key: 'worksFromHome', label: 'Do you work from home?'   },
    ],
    LOOKING_TO_BUY: [
        { key: 'isSingle',      label: 'Are you single?'                      },
        { key: 'hasChildren',   label: 'Do you have children?'                },
        { key: 'needsMortgage', label: 'Do you need a mortgage?'              },
        { key: 'hasLegalRep',   label: 'Do you have a legal representative?'  },
    ],
    PROPERTY_FOR_RENT: [
        { key: 'allowsSingle',   label: 'Do you accept single tenants?' },
        { key: 'allowsPets',     label: 'Do you allow pets?'            },
        { key: 'allowsChildren', label: 'Do you allow children?'        },
        { key: 'isFurnished',    label: 'Is the property furnished?'    },
        { key: 'hasParking',     label: 'Is there a parking space?'     },
        { key: 'hasGenerator',   label: 'Is there a generator?'         },
        { key: 'hasWater',       label: 'Is water supply reliable?'     },
    ],
    PROPERTY_FOR_SALE: [
        { key: 'isFurnished',        label: 'Is the property furnished?'           },
        { key: 'hasCofO',            label: 'Is there a C of O / documentation?'  },
        { key: 'hasFlexiblePayment', label: 'Is there a flexible payment plan?'   },
        { key: 'hasParking',         label: 'Is there a parking space?'            },
        { key: 'hasGenerator',       label: 'Is there a generator?'                },
    ],
}


function isPermitted(allowedRoles: string[] | null, userRoles: string[]): boolean {
    if (!allowedRoles) return true
    return userRoles.some(r => allowedRoles.includes(r))
}

function amountLabel(type: SeekType | null) {
    return type === 'PROPERTY_FOR_RENT' || type === 'PROPERTY_FOR_SALE' ? 'Price' : 'Budget'
}


export default function CreatePostPage() {
    return (
        <Suspense fallback={null}>
            <CreatePostPageInner />
        </Suspense>
    )
}

function CreatePostPageInner() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const { user }     = useAuth()
    const userRoles    = (user?.roles as string[]) ?? ['USER']

    const [seekType,           setSeekType]           = useState<SeekType | null>(null)
    const [description,        setDescription]        = useState('')
    const [selectedLocation,   setSelectedLocation]   = useState<LocationResult | null>(null)
    const [locating,           setLocating]           = useState(false)
    const [locationError,      setLocationError]      = useState<string | null>(null)
    const [showLocationModal,  setShowLocationModal]  = useState(false)
    const [currency,           setCurrency]           = useState<Currency>(CURRENCIES[0])
    const [amount,             setAmount]             = useState('')
    const [rooms,              setRooms]              = useState(1)
    const [propertyType,       setPropertyType]       = useState<PropertyType | null>(null)
    const [urgency,            setUrgency]            = useState<Urgency>('NORMAL')
    const [answers,            setAnswers]            = useState<Record<string, boolean | null>>({})
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
    const [loading,            setLoading]            = useState(false)

    useEffect(() => {
        const t = searchParams.get('type') as SeekType | null
        if (t && POST_TYPES.some(p => p.type === t)) setSeekType(t)
    }, [searchParams])

    useEffect(() => {
        setAnswers({})
        setPropertyType(null)
    }, [seekType])

    function useCurrentLocation() {
        setLocationError(null)
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported on this device')
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords
                    const res = await api.get(`/places/reverse?lat=${latitude}&lng=${longitude}`)
                    setSelectedLocation(res.data)
                } catch (err: any) {
                    setLocationError(err?.response?.data?.error ?? 'Could not detect your location')
                } finally {
                    setLocating(false)
                }
            },
            () => {
                setLocationError('Location permission denied')
                setLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    function toggleAnswer(key: string, value: boolean) {
        setAnswers(prev => ({ ...prev, [key]: prev[key] === value ? null : value }))
    }

    async function handleSubmit() {
        if (!seekType || description.trim().length < 10) return
        setLoading(true)
        try {
            await api.post('/seeks', {
                type:         seekType,
                content:      description.trim(),
                isReseek:     false,
                location:     selectedLocation?.description,
                city:         selectedLocation?.city,
                state:        selectedLocation?.state,
                currency:     currency.code,
                budget:       amount ? Number(amount.replace(/,/g, '')) : undefined,
                rooms:        seekType !== 'INFO' ? rooms : undefined,
                propertyType: propertyType ?? undefined,
                urgency:      seekType !== 'INFO' ? urgency : undefined,
                ...answers,
            })
            router.back()
        } catch (err: any) {
            alert(err?.response?.data?.error ?? 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const questions  = seekType ? QUESTIONS[seekType] ?? [] : []
    const isInfoPost = seekType === 'INFO'
    const canSubmit  = seekType !== null && description.trim().length >= 10

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">

            {/* Header */}
            <header className="flex items-center gap-4 px-5 pt-14 pb-4">
                <button onClick={() => router.back()} className="text-white/60" aria-label="Back">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold">Create Post</h1>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-6">

                {/* Type selector */}
                <div>
                    <p className="text-white/40 text-sm mb-3">what type of post is this?</p>
                    <div className="space-y-2.5">
                        {POST_TYPES.map(pt => {
                            const permitted = isPermitted(pt.allowedRoles, userRoles)
                            const selected  = seekType === pt.type
                            return (
                                <button
                                    key={pt.type}
                                    onClick={() => { if (permitted) setSeekType(pt.type) }}
                                    disabled={!permitted}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left
                                        ${selected
                                            ? 'border-blue-500 bg-blue-500/8'
                                            : permitted
                                                ? 'border-white/8 bg-white/4 active:scale-[0.98]'
                                                : 'border-white/4 bg-white/2 opacity-35 cursor-not-allowed'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl shrink-0 ${pt.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-base text-white">{pt.label}</p>
                                        <p className="text-sm text-white/50 mt-0.5">{pt.description}</p>
                                    </div>
                                    {selected && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Description */}
                {seekType && (
                    <div>
                        <p className="text-white/40 text-sm mb-2">Describe your request</p>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={
                                isInfoPost
                                    ? 'Share insights, tips, or market information...'
                                    : 'Describe your request: include details such as size, location, budget, non negotiables...'
                            }
                            rows={5}
                            className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5
                                text-white/80 text-sm placeholder:text-white/25
                                resize-none focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                )}

                {/* Housing fields — hidden for INFO */}
                {seekType && !isInfoPost && (
                    <>
                        {/* Urgency */}
                        <div>
                            <p className="text-white/40 text-sm mb-2">Urgency</p>
                            <div className="flex gap-2">
                                {(['NORMAL', 'URGENT'] as const).map(u => (
                                    <button
                                        key={u}
                                        onClick={() => setUrgency(u)}
                                        className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all border
                                            ${urgency === u
                                                ? u === 'URGENT'
                                                    ? 'border-red-500 bg-red-500/10 text-red-400'
                                                    : 'border-blue-500 bg-blue-500/8 text-white'
                                                : 'border-white/8 bg-white/4 text-white/40'
                                            }`}
                                    >
                                        {u === 'URGENT' ? 'Urgent' : 'Normal'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <p className="text-white/40 text-sm mb-2">Location</p>
                            <div className="flex items-center gap-3 bg-white/5 border border-green-500/40 rounded-2xl px-4 py-3.5">
                                <button
                                    onClick={useCurrentLocation}
                                    disabled={locating}
                                    className="flex-1 flex items-center gap-3 min-w-0 text-left"
                                >
                                    <span className="text-green-400 shrink-0">📍</span>
                                    <span className={`text-sm truncate ${selectedLocation ? 'text-white/80' : 'text-green-400/60'}`}>
                                        {locating ? 'Locating...' : selectedLocation?.description ?? 'Use Current Location'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setShowLocationModal(true)}
                                    className="text-white/40 px-1 shrink-0"
                                >
                                    ▾
                                </button>
                            </div>
                            {locationError && (
                                <p className="text-red-400 text-xs mt-1.5 px-1">{locationError}</p>
                            )}
                        </div>

                        {/* Currency */}
                        <div>
                            <p className="text-white/40 text-sm mb-2">Currency</p>
                            <button
                                onClick={() => setShowCurrencyPicker(true)}
                                className="w-full flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5"
                            >
                                <span className="text-white/50 font-mono text-sm">{currency.symbol}</span>
                                <span className="flex-1 text-left text-white/80 text-sm">{currency.name}</span>
                                <span className="text-white/25 text-xs">▾</span>
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5">
                            <span className="text-white/40 font-mono text-sm">{currency.symbol}</span>
                            <input
                                value={amount}
                                onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                                placeholder={`Enter ${amountLabel(seekType)}`}
                                inputMode="numeric"
                                className="flex-1 bg-transparent text-white/80 text-sm placeholder:text-white/25 focus:outline-none"
                            />
                        </div>

                        {/* Rooms stepper */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setRooms(r => Math.max(1, r - 1))}
                                className="w-9 h-9 rounded-full bg-white/8 text-white font-medium flex items-center justify-center"
                            >
                                −
                            </button>
                            <span className="text-white text-lg font-semibold w-4 text-center">{rooms}</span>
                            <button
                                onClick={() => setRooms(r => r + 1)}
                                className="w-9 h-9 rounded-full bg-white/8 text-white font-medium flex items-center justify-center"
                            >
                                +
                            </button>
                            <span className="text-white/40 text-sm">number of rooms</span>
                        </div>

                        {/* Property type chips */}
                        <div className="flex flex-wrap gap-2">
                            {PROPERTY_TYPES.map(pt => (
                                <button
                                    key={pt.key}
                                    onClick={() => setPropertyType(prev => prev === pt.key ? null : pt.key)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                                        ${propertyType === pt.key
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-white/8 text-white/55 border border-white/8'
                                        }`}
                                >
                                    {pt.label}
                                </button>
                            ))}
                        </div>

                        {/* Yes/No questions */}
                        {questions.length > 0 && (
                            <div className="space-y-3.5">
                                {questions.map(q => (
                                    <div key={q.key} className="flex items-center justify-between gap-4">
                                        <span className="text-white/50 text-sm flex-1">{q.label}</span>
                                        <div className="flex gap-2 shrink-0">
                                            {([true, false] as const).map(val => (
                                                <button
                                                    key={String(val)}
                                                    onClick={() => toggleAnswer(q.key, val)}
                                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                                                        ${answers[q.key] === val
                                                            ? 'bg-teal-500 text-white'
                                                            : 'bg-white/8 text-white/40'
                                                        }`}
                                                >
                                                    {val ? 'yes' : 'no'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Currency picker — bottom sheet */}
            {showCurrencyPicker && (
                <div className="fixed inset-0 z-50 flex items-end">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowCurrencyPicker(false)} />
                    <div className="relative w-full bg-neutral-900 rounded-t-3xl px-4 pt-4 pb-10 z-10">
                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-3 px-1">Select Currency</p>
                        <div className="space-y-1">
                            {CURRENCIES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => { setCurrency(c); setShowCurrencyPicker(false) }}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all
                                        ${currency.code === c.code ? 'bg-white/10 text-white' : 'text-white/60'}`}
                                >
                                    <span className="font-mono text-sm w-8 shrink-0">{c.symbol}</span>
                                    <span className="text-sm flex-1 text-left">{c.name}</span>
                                    <span className="text-xs text-white/25">{c.code}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Location picker — state/city or custom */}
            <LocationPickerModal
                open={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelect={loc => { setSelectedLocation(loc); setLocationError(null) }}
            />

            {/* Submit */}
            {seekType && (
                <div className="fixed bottom-0 left-0 right-0 px-4 pt-4
                    pb-[max(2rem,env(safe-area-inset-bottom))]
                    bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || loading}
                        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all
                            ${canSubmit && !loading
                                ? 'bg-white text-black active:scale-[0.97]'
                                : 'bg-white/8 text-white/20 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            )}
        </div>
    )
}

function LocationPickerModal({ open, onClose, onSelect }: {
    open: boolean
    onClose: () => void
    onSelect: (loc: { description: string; city: string; state: string }) => void
}) {
    const [selectedState, setSelectedState] = useState<NigerianState | null>(null)
    const [customMode,    setCustomMode]    = useState(false)
    const [customCity,    setCustomCity]    = useState('')
    const [customState,   setCustomState]   = useState('')

    function reset() {
        setSelectedState(null)
        setCustomMode(false)
        setCustomCity('')
        setCustomState('')
    }

    function close() {
        reset()
        onClose()
    }

    function pickCity(state: NigerianState, city: { value: string; label: string }) {
        onSelect({ description: `${city.label}, ${state.label}`, city: city.label, state: state.label })
        close()
    }

    function submitCustom() {
        if (!customCity.trim()) return
        const description = customState.trim() ? `${customCity.trim()}, ${customState.trim()}` : customCity.trim()
        onSelect({ description, city: customCity.trim(), state: customState.trim() })
        close()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={close} />
            <div className="relative w-full bg-neutral-900 rounded-t-3xl px-4 pt-4 pb-10 z-10 max-h-[75vh] overflow-y-auto">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

                {customMode ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => setCustomMode(false)}
                            className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium mb-1"
                        >
                            <span className="text-lg">‹</span> Back
                        </button>
                        <p className="text-white/40 text-xs uppercase tracking-widest px-1">Custom Location</p>
                        <input
                            value={customCity}
                            onChange={e => setCustomCity(e.target.value)}
                            placeholder="City / area"
                            className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5
                                text-white/80 text-sm placeholder:text-white/25 focus:outline-none"
                        />
                        <input
                            value={customState}
                            onChange={e => setCustomState(e.target.value)}
                            placeholder="State (optional)"
                            className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5
                                text-white/80 text-sm placeholder:text-white/25 focus:outline-none"
                        />
                        <button
                            onClick={submitCustom}
                            disabled={!customCity.trim()}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all
                                ${customCity.trim() ? 'bg-cyan-400 text-black' : 'bg-white/8 text-white/20 cursor-not-allowed'}`}
                        >
                            Use this location
                        </button>
                    </div>
                ) : selectedState ? (
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedState(null)}
                            className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium mb-3"
                        >
                            <span className="text-lg">‹</span> {selectedState.label}
                        </button>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-2 px-1">Select City</p>
                        {selectedState.cities.map(city => (
                            <button
                                key={city.value}
                                onClick={() => pickCity(selectedState, city)}
                                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                    border border-white/8 bg-white/4 text-white/70 active:opacity-60"
                            >
                                <span className="text-sm font-medium">{city.label}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <button
                            onClick={() => setCustomMode(true)}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 active:opacity-60 mb-2"
                        >
                            <span className="text-sm font-medium">Custom location</span>
                            <span className="text-lg">✎</span>
                        </button>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-2 px-1">Select State</p>
                        {NIGERIAN_STATES.map(state => (
                            <button
                                key={state.value}
                                onClick={() => setSelectedState(state)}
                                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                    border border-white/8 bg-white/4 text-white/70 active:opacity-60"
                            >
                                <span className="text-sm font-medium">{state.label}</span>
                                <span className="text-white/30 text-lg">›</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
