import jwt from "jsonwebtoken";
import { AuthPayload } from "../domain/Auth.js";

// The secret is validated on startup (environment-vars.ts); here it is read on each use
// so this module does not depend on the load order.
const getSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
};

// Token generation and verification
export class AuthApplication {
    static generateToken(payload: AuthPayload): string {
        return jwt.sign(payload, getSecret(), { algorithm: "HS256", expiresIn: "1h" });
    }

    static verifyToken(token: string): AuthPayload {
        const decoded = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });

        if (
            typeof decoded !== "object" ||
            typeof decoded.id !== "number" ||
            typeof decoded.email !== "string" ||
            (decoded.role !== "user" && decoded.role !== "admin")
        ) {
            throw new Error("Invalid token payload");
        }

        return { id: decoded.id, email: decoded.email, role: decoded.role };
    }
}
