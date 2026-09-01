import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";

const JWT_SECRET = process.env.MARKETER_JWT_SECRET || "default_marketer_secret_key_change_in_production";
const JWT_EXPIRES_IN = "7d";

export const marketerAuth = {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  signToken(marketerId: string): string {
    return jwt.sign({ id: marketerId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  verifyToken(token: string): { id: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (error) {
      return null;
    }
  },
};
