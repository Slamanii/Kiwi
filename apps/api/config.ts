import { z } from "zod"
import "dotenv/config"

const schema = z.object({
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    FLW_SECRET_KEY: z.string(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.string().default("3001"),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string().default('587'),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    APP_URL: z.string()
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format())
    process.exit(1)
}

export const config = parsed.data