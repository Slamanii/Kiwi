import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { ListingType, ListingStatus, ListingCategory, ListingCondition } from '@kiwi/types'
import {
  addListing,
  editListing,
  delist,
  setToSoldOut,
  createFavorite,
  removeFavorite,
  getMyFavorites,
  getListings,
  getListingCategories,
  getListingById,
} from '../services/listing.js'

const router = Router()

const addListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().optional(),
  images: z.array(z.string()).optional(),
  type: z.nativeEnum(ListingType).optional(),
  category: z.nativeEnum(ListingCategory).optional(),
  condition: z.nativeEnum(ListingCondition).optional(),
  location: z.string().optional(),
  stock: z.number().int().positive().optional(),
})

const editListingSchema = addListingSchema.partial().extend({
  status: z.nativeEnum(ListingStatus).optional(),
})

const browseSchema = z.object({
  // 'ALL', 'JOINED', or a specific communityId (store picked via search/select)
  scope: z.string().optional(),
  category: z.nativeEnum(ListingCategory).optional(),
  condition: z.nativeEnum(ListingCondition).optional(),
  location: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

// browse/filter listings - primary scope (All / Joined / a specific store), then category/condition/location/q
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = browseSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const { scope, category, condition, location, q, cursor, limit } = parsed.data
    const result = await getListings(userId, { scope, category, condition, location, q, cursor, limit })
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// category chips available for the given scope
router.get('/categories', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const scope = typeof req.query.scope === 'string' ? req.query.scope : 'ALL'
    const categories = await getListingCategories(userId, scope)
    return res.status(200).json(categories)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// caller's favorited listings — must stay ahead of the /:communityId POST-only param route,
// but since this is a GET it also needs to come before any future GET /:id single-listing route
router.get('/favorites/mine', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const favorites = await getMyFavorites(userId)
    return res.status(200).json(favorites)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// single-listing detail — must stay after /categories and /favorites/mine (both GETs)
// so those literal segments aren't swallowed as an :id param
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const listing = await getListingById(req.params.id, userId)
    return res.status(200).json(listing)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/:communityId', requireAuth, async (req: Request, res: Response) => {
  const parsed = addListingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const listing = await addListing(req.params.communityId, userId, parsed.data)
    return res.status(201).json(listing)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const parsed = editListingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const listing = await editListing(req.params.id, userId, parsed.data)
    return res.status(200).json(listing)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const listing = await delist(req.params.id, userId)
    return res.status(200).json(listing)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/:id/sold-out', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const listing = await setToSoldOut(req.params.id, userId)
    return res.status(200).json(listing)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/:id/favorite', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const favorite = await createFavorite(userId, req.params.id)
    return res.status(201).json(favorite)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/:id/favorite', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await removeFavorite(userId, req.params.id)
    return res.status(200).json({ message: 'Removed from favorites' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export default router
