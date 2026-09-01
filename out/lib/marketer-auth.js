import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.MARKETER_JWT_SECRET || "default_marketer_secret_key_change_in_production";
const JWT_EXPIRES_IN = "7d";
export const marketerAuth = {
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    },
    signToken(marketerId) {
        return jwt.sign({ id: marketerId }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
    },
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    },
};
