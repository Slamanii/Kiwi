import { z } from "zod"
import "dotenv/config"

const schema = z.object({
    SUPABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    FLW_SECRET_KEY: z.string(),
    NODE_ENV: z.enum(["developement", "production", "test"]),
    PORT: z.string().default("3001"),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string(),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    APP_URl: z.string()
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format())
    process.exit(1)
}

export const config = parsed.data