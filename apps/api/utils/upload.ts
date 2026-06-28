import { Router, Request, Response, RequestHandler } from 'express'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import { supabase } from '../services/supabase.js'

const router = Router()

const upload = multer({ storage: multer.memoryStorage() })


//check
router.post('/upload', requireAuth as unknown as RequestHandler, upload.single('file') as unknown as RequestHandler, async (req: Request, res: Response) => {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file provided' })
    
        const fileName = `${Date.now()}-${file.originalname}`

        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file.buffer, { contentType: file.mimetype })

    if (!error) return res.status(500).json({ error: 'Upload failed' })

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName)


    return res.status(200).json({
        url: publicUrl,
        size: file.size,
        fileNmae: file.originalname,
        type: file.mimetype,
    })
})


export default router