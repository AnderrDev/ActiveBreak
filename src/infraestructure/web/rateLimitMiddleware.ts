// Límites de peticiones por IP para frenar ataques de fuerza bruta y registros masivos.
// El contador vive en memoria: si se despliegan varias instancias, cada una cuenta por separado.
import { rateLimit } from "express-rate-limit";

const QUINCE_MINUTOS = 15 * 60 * 1000;
const UNA_HORA = 60 * 60 * 1000;

// Login: 10 intentos fallidos por IP cada 15 minutos (los logins correctos no cuentan)
export const loginLimiter = rateLimit({
    windowMs: QUINCE_MINUTOS,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos", errors: [] },
});

// Registro: 20 cuentas nuevas por IP cada hora
export const registerLimiter = rateLimit({
    windowMs: UNA_HORA,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Demasiados registros desde esta IP. Inténtalo de nuevo más tarde", errors: [] },
});
