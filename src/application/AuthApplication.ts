import jwt from "jsonwebtoken";
import { AuthPayload } from "../domain/Auth.js";

// La clave se valida al arrancar (environment-vars.ts); aquí se lee en cada uso
// para no depender del orden de carga de los módulos.
const getSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET no está configurado");
    }
    return secret;
};

// generación y verificación del token
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
            (decoded.rol !== "usuario" && decoded.rol !== "admin")
        ) {
            throw new Error("Token con formato inválido");
        }

        return { id: decoded.id, email: decoded.email, rol: decoded.rol };
    }
}
