'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { communityApi } from '@/lib/api/community'
import { listingApi } from '@/lib/api/listing'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { CURRENCIES, type Currency } from '@/lib/currency'
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/marketplaceConfig'
import { LocationPickerSheet } from '@/components/shared/LocationPicker'
import { CreateCommunityModal } from '@/components/community/CreateCommunityModal'
import type { Community, ListingCategory, ListingCondition, ListingType } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

const MAX_IMAGES = 8

const inputClass = "w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"

type PickerOption = { value: string; label: string }

function CreateListingForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const presetStoreId = searchParams.get('storeId')
    const editListingId = searchParams.get('listingId')
    const isEditing = !!editListingId

    const [stores, setStores] = useState<Community[]>([])
    const [loadingStores, setLoadingStores] = useState(true)
    const [loadingListing, setLoadingListing] = useState(isEditing)
    const [showCreateStore, setShowCreateStore] = useState(false)
    const [storeId, setStoreId] = useState<string | null>(null)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState<Currency>(CURRENCIES[0])
    const [stock, setStock] = useState('1')
    const [type, setType] = useState<ListingType>('FIXED')
    const [category, setCategory] = useState<ListingCategory | null>(null)
    const [condition, setCondition] = useState<ListingCondition | null>(null)
    const [location, setLocation] = useState<string | null>(null)

    const [images, setImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const imageInputRef = useRef<HTMLInputElement>(null)

    const [activeSheet, setActiveSheet] = useState<'store' | 'category' | 'condition' | 'currency' | 'location' | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        communityApi.getMy()
            .then(res => {
                const marketplaceStores: Community[] = res.data.communities
                    .filter((c: Community) => c.type === 'MARKETPLACE' && c.currentUserRole === 'ADMIN')
                setStores(marketplaceStores)
                if (presetStoreId && marketplaceStores.some(s => s.id === presetStoreId)) setStoreId(presetStoreId)
                else if (marketplaceStores.length === 1) setStoreId(marketplaceStores[0].id)
            })
            .catch(console.error)
            .finally(() => setLoadingStores(false))
    }, [presetStoreId])

    useEffect(() => {
        if (!editListingId) return
        listingApi.getById(editListingId)
            .then(res => {
                const listing = res.data
                setStoreId(listing.communityId)
                setTitle(listing.title)
                setDescription(listing.description ?? '')
                setPrice(String(listing.price))
                setCurrency(CURRENCIES.find(c => c.code === listing.currency) ?? CURRENCIES[0])
                setStock(String(listing.stock))
                setType(listing.type)
                setCategory(listing.category)
                setCondition(listing.condition)
                setLocation(listing.location ?? null)
                setImages(listing.images)
            })
            .catch(err => setError(getErrorMessage(err, 'Could not load listing.')))
            .finally(() => setLoadingListing(false))
    }, [editListingId])

    const selectedStore = stores.find(s => s.id === storeId) ?? null

    const canSubmit =
        !!storeId &&
        title.trim().length > 0 &&
        Number(price) > 0 &&
        Number(stock) > 0 &&
        !uploading &&
        !submitting

    const handleImagesPicked = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const room = MAX_IMAGES - images.length
        const picked = Array.from(files).slice(0, room)
        setUploading(true)
        try {
            const results = await Promise.allSettled(picked.map(f => uploadApi.uploadFile(f)))
            const uploaded: string[] = []
            let firstError: unknown
            for (const r of results) {
                if (r.status === 'fulfilled') uploaded.push(r.value.data.url)
                else firstError ??= r.reason
            }
            if (uploaded.length > 0) setImages(prev => [...prev, ...uploaded])
            const failedCount = results.length - uploaded.length
            if (failedCount > 0) {
                alert(getErrorMessage(firstError, `Failed to upload ${failedCount} photo${failedCount > 1 ? 's' : ''}`))
            }
        } finally {
            setUploading(false)
            if (imageInputRef.current) imageInputRef.current.value = ''
        }
    }

    const handleSubmit = async () => {
        if (!canSubmit || !storeId) return
        setError(null)
        setSubmitting(true)
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || undefined,
                price: Number(price),
                currency: currency.code,
                images,
                type,
                category: category ?? undefined,
                condition: condition ?? undefined,
                location: location ?? undefined,
                stock: Number(stock),
            }
            const res = isEditing
                ? await listingApi.edit(editListingId!, payload)
                : await listingApi.create(storeId, payload)
            router.replace(`/listings/${res.data.id}`)
        } catch (err) {
            setError(getErrorMessage(err, `Could not ${isEditing ? 'save changes' : 'create listing'}. Please try again.`))
        } finally {
            setSubmitting(false)
        }
    }

    const categoryLabel = LISTING_CATEGORIES.find(c => c.value === category)?.label ?? 'Select category'
    const conditionLabel = LISTING_CONDITIONS.find(c => c.value === condition)?.label ?? 'Select condition'

    if (loadingListing) {
        return (
            <div className="min-h-screen bg-[#1C1B1A] flex items-center justify-center text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-lg font-semibold">{isEditing ? 'Edit Listing' : 'New Listing'}</h1>
            </div>

            <div className="px-4 space-y-5">
                <Section title="Store">
                    {isEditing ? (
                        <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                            <span className="text-sm text-white">{selectedStore?.name ?? '…'}</span>
                        </div>
                    ) : loadingStores ? (
                        <p className="text-sm text-white/40 px-1">Loading your stores…</p>
                    ) : stores.length === 0 ? (
                        <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-4 space-y-2">
                            <p className="text-sm text-white/60">
                                You need a marketplace store before you can list an item.
                            </p>
                            <button
                                onClick={() => setShowCreateStore(true)}
                                className="text-sm font-semibold text-cyan-400"
                            >
                                Create a store →
                            </button>
                        </div>
                    ) : (
                        <PickerField
                            label={selectedStore?.name ?? 'Select store'}
                            placeholder={!selectedStore}
                            onClick={() => setActiveSheet('store')}
                        />
                    )}
                </Section>

                <Section title="Details">
                    <Field label="Title">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="What are you selling?"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Description (optional)">
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the item..."
                            rows={4}
                            className={`${inputClass} resize-none`}
                        />
                    </Field>

                    <div className="flex gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <label className="text-white/60 text-xs">Price</label>
                            <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                                <button onClick={() => setActiveSheet('currency')} className="text-white/40 text-xs shrink-0 font-mono">
                                    {currency.symbol}
                                </button>
                                <input
                                    value={price}
                                    onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    inputMode="decimal"
                                    className="flex-1 min-w-0 w-full bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <Field label="Stock">
                                <input
                                    value={stock}
                                    onChange={e => setStock(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="1"
                                    inputMode="numeric"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>

                    <Field label="Listing type">
                        <div className="relative flex items-center gap-1 bg-white/5 rounded-full p-1">
                            {(['FIXED', 'AUCTION'] as ListingType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 text-center text-xs font-medium py-1.5 rounded-full transition-colors
                                        ${type === t ? 'bg-cyan-400 text-black' : 'text-white/50'}`}
                                >
                                    {t === 'FIXED' ? 'Fixed price' : 'Auction'}
                                </button>
                            ))}
                        </div>
                    </Field>
                </Section>

                <Section title="Classification">
                    <Field label="Category">
                        <PickerField
                            label={categoryLabel}
                            placeholder={!category}
                            onClick={() => setActiveSheet('category')}
                        />
                    </Field>
                    <Field label="Condition">
                        <PickerField
                            label={conditionLabel}
                            placeholder={!condition}
                            onClick={() => setActiveSheet('condition')}
                        />
                    </Field>
                    <Field label="Location">
                        {location ? (
                            <button
                                onClick={() => setActiveSheet('location')}
                                className="w-full flex items-center justify-between bg-white/5 border border-white/8 rounded-2xl px-4 py-3"
                            >
                                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">
                                    {location}
                                </span>
                                <span className="text-white/30 text-lg">›</span>
                            </button>
                        ) : (
                            <PickerField
                                label="Select location"
                                placeholder
                                onClick={() => setActiveSheet('location')}
                            />
                        )}
                    </Field>
                </Section>

                <Section title="Photos">
                    <div className="flex gap-2 overflow-x-auto">
                        {images.map(url => (
                            <div key={url} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setImages(prev => prev.filter(u => u !== url))}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={e => handleImagesPicked(e.target.files)}
                    />
                    <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading || images.length >= MAX_IMAGES}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                            border border-white/8 text-white/50 text-xs disabled:opacity-30"
                    >
                        {uploading ? 'Uploading…' : `📷 Add photos ${images.length > 0 ? `(${images.length}/${MAX_IMAGES})` : ''}`}
                    </button>
                </Section>

                {error && <p className="text-red-400 text-sm px-1">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
                        ${canSubmit
                            ? 'bg-blue-500 text-white active:bg-blue-600'
                            : 'bg-white/6 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {submitting ? (isEditing ? 'Saving…' : 'Publishing…') : (isEditing ? 'Save changes' : 'Publish listing')}
                </button>
            </div>

            {activeSheet === 'store' && (
                <PickerSheet
                    title="Select store"
                    options={stores.map(s => ({ value: s.id, label: s.name }))}
                    current={storeId}
                    onSelect={v => setStoreId(v)}
                    onClose={() => setActiveSheet(null)}
                />
            )}

            {activeSheet === 'category' && (
                <PickerSheet
                    title="Select category"
                    options={LISTING_CATEGORIES}
                    current={category}
                    onSelect={v => setCategory(v as ListingCategory)}
                    onClose={() => setActiveSheet(null)}
                />
            )}

            {activeSheet === 'condition' && (
                <PickerSheet
                    title="Select condition"
                    options={LISTING_CONDITIONS}
                    current={condition}
                    onSelect={v => setCondition(v as ListingCondition)}
                    onClose={() => setActiveSheet(null)}
                />
            )}

            {activeSheet === 'currency' && (
                <PickerSheet
                    title="Select currency"
                    options={CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol}  ${c.name}` }))}
                    current={currency.code}
                    onSelect={v => setCurrency(CURRENCIES.find(c => c.code === v) ?? CURRENCIES[0])}
                    onClose={() => setActiveSheet(null)}
                />
            )}

            <LocationPickerSheet
                open={activeSheet === 'location'}
                current={location}
                onApply={(v) => setLocation(v)}
                onClose={() => setActiveSheet(null)}
            />

            {showCreateStore && (
                <CreateCommunityModal
                    type="MARKETPLACE"
                    onClose={() => setShowCreateStore(false)}
                    onCreated={community => {
                        setStores(prev => [...prev, community])
                        setStoreId(community.id)
                        setShowCreateStore(false)
                    }}
                />
            )}
        </div>
    )
}

export default function CreateListingPage() {
    return (
        <Suspense fallback={null}>
            <CreateListingForm />
        </Suspense>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h2 className="text-white/40 text-xs font-medium uppercase tracking-wide">{title}</h2>
            {children}
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-white/60 text-xs">{label}</label>
            {children}
        </div>
    )
}

function PickerField({ label, placeholder, onClick }: { label: string; placeholder?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between bg-white/5 border border-white/8 rounded-2xl px-4 py-3"
        >
            <span className={`text-sm ${placeholder ? 'text-white/30' : 'text-white'}`}>{label}</span>
            <span className="text-white/30 text-lg">›</span>
        </button>
    )
}

function PickerSheet({ title, options, current, onSelect, onClose }: {
    title: string
    options: PickerOption[]
    current: string | null
    onSelect: (value: string) => void
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto bg-neutral-900 rounded-3xl px-4 pt-4 pb-6 z-10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 px-1">{title}</p>
                <div className="space-y-1">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onSelect(opt.value); onClose() }}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all
                                ${current === opt.value ? 'bg-white/10 text-white' : 'text-white/60'}`}
                        >
                            <span className="text-sm text-left">{opt.label}</span>
                            {current === opt.value && <span className="text-cyan-400 text-base shrink-0">✓</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
