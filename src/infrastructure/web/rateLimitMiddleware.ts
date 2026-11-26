// Per-IP request limits for the public routes (in memory: one API instance)
import { rateLimit } from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const errorBody = (message: string) => ({ success: false, message, errors: [] });

// Login: only failed attempts count
export const loginLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: errorBody("Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos"),
});

// Registration
export const registerLimiter = rateLimit({
    windowMs: ONE_HOUR,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: errorBody("Demasiados registros desde esta IP. Inténtalo de nuevo más tarde"),
});

// API documentation (Swagger): public read-only route
export const docsLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: errorBody("Demasiadas peticiones a la documentación. Inténtalo de nuevo más tarde"),
});
