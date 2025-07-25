import { join } from "path";
export const productionConfig = {
    port: process.env.PORT || 5000,
    cors: {
        origin: [
            process.env.FRONTEND_URL,
            "https://www.ecohavest.org",
            "https://ecohavest.org",
        ],
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    },
    storage: {
        kycImages: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "kyc-images")
            : join(process.cwd(), "storage", "kyc-images"),
        walletImages: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "wallet-images")
            : join(process.cwd(), "storage", "wallet-images"),
        profileImages: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "profile-images")
            : join(process.cwd(), "storage", "profile-images"),
        productImages: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "product-images")
            : join(process.cwd(), "storage", "product-images"),
        depositProofs: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "deposit-proofs")
            : join(process.cwd(), "storage", "deposit-proofs"),
        paypalProofs: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "paypal-proofs")
            : join(process.cwd(), "storage", "paypal-proofs"),
        bankProofs: process.env.STORAGE_PATH
            ? join(process.env.STORAGE_PATH, "bank-proofs")
            : join(process.cwd(), "storage", "bank-proofs"),
    },
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png"],
        imageProcessing: {
            maxWidth: 800,
            maxHeight: 800,
            quality: 80,
        },
    },
};
