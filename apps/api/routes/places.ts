import { Router } from 'express'

const router = Router()

router.get('/reverse', async (req, res) => {
    const { lat, lng } = req.query
    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng are required' })
    }

    const key = process.env.GOOGLE_MAPS_API_KEY
    if (!key) {
        return res.status(500).json({ error: 'Google Maps API key not configured' })
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
        const response = await fetch(url)
        const data: any = await response.json()

        if (data.status !== 'OK' || !data.results?.length) {
            return res.status(404).json({ error: 'Could not resolve location' })
        }

        const result = data.results[0]
        const components: { long_name: string; types: string[] }[] = result.address_components ?? []

        const city =
            components.find(c => c.types.includes('locality'))?.long_name ??
            components.find(c => c.types.includes('administrative_area_level_2'))?.long_name ??
            ''
        const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name ?? ''

        res.json({ description: result.formatted_address as string, city, state })
    } catch (err: any) {
        console.error('[places/reverse]', err)
        res.status(502).json({ error: 'Failed to resolve location' })
    }
})

export default router
