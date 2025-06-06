import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "../db/index.js";
import { mailService } from "../services/mail.service.js";
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    rateLimit: {
        customRules: {
            "/forget-password": { window: 10, max: 3 },
            "/sign-in/email": {
                window: 10,
                max: 3,
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            console.log(url);
            await mailService.sendPasswordResetEmail(user.email, url);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            console.log(url);
            await mailService.sendVerificationEmail(user.email, url);
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                default: "USER",
            },
            kyc_verified: {
                type: "boolean",
                default: false,
            },
            is_npo: {
                type: "boolean",
                default: false,
            },
        },
    },
    advanced: {
        defaultCookieAttributes: {
            secure: true,
            httpOnly: true,
            sameSite: "none",
            domain: ".ecohavest.org",
        },
    },
    trustedOrigins: process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL]
        : [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://ecohavest.org",
        ],
    logger: {
        level: "debug",
        log(level, message, ...args) {
            console.log(level, message, ...args);
        },
    },
});
