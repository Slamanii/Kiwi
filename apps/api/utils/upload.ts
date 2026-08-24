import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import { supabase } from '../services/supabase.js'

const router = Router()

// matches the Supabase 'uploads' bucket's own 50MB cap, so oversized files are rejected
// immediately instead of being buffered into memory and failing later at the storage call
const MAX_FILE_SIZE = 50 * 1024 * 1024

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
})

function handleUploadError(err: any, _req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File is larger than the 50MB limit'
            : 'Could not process upload'
        return res.status(400).json({ error: message })
    }
    if (err) return res.status(400).json({ error: 'Could not process upload' })
    next()
}

router.post(
    '/upload',
    requireAuth as unknown as RequestHandler,
    upload.single('file') as unknown as RequestHandler,
    handleUploadError as unknown as RequestHandler,
    async (req: Request, res: Response) => {
        try {
            const file = req.file
            if (!file) return res.status(400).json({ error: 'No file provided' })

            // fall back to the type relayed explicitly by the client when the multipart
            // part itself didn't carry one (seen on some mobile video captures)
            const relayedType = typeof req.body?.type === 'string' ? req.body.type : undefined
            const contentType = file.mimetype || relayedType || 'application/octet-stream'

            const fileName = `${Date.now()}-${file.originalname}`

            const { error } = await supabase.storage
                .from('uploads')
                .upload(fileName, file.buffer, { contentType })

            if (error) {
                console.error('[upload] Supabase upload failed:', error)
                return res.status(502).json({ error: 'Failed to store file. Please try again.' })
            }

            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName)

            return res.status(200).json({
                url: publicUrl,
                size: file.size,
                fileName: file.originalname,
                type: contentType,
            })
        } catch (err) {
            console.error('[upload] unexpected error:', err)
            return res.status(500).json({ error: 'Something went wrong while uploading. Please try again.' })
        }
    }
)

export default router
