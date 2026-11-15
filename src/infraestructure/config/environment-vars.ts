import joi from 'joi';
import "dotenv/config";

export type NodeEnv = "development" | "production" | "test";

export type ReturnEnvironmentVars = {
    NODE_ENV: NodeEnv;
    PORT: number;
    DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    JWT_SECRET: string;
    CORS_ORIGINS: string[];
    TRUST_PROXY: number;
}

type ValidationENvironmentVars = { // Estructura que almacena el resultado de validacion de las variables de entorno
    error: joi.ValidationError | undefined,
    value: ReturnEnvironmentVars
}

function validateEnVars(vars: NodeJS.ProcessEnv): ValidationENvironmentVars {
    const envSchema = joi.object({
        NODE_ENV: joi.string().valid("development", "production", "test").default("development"),
        PORT: joi.number().required(),
        DB_HOST: joi.string().required(),
        DB_PORT: joi.number().default(5432),
        DB_USER: joi.string().required(),
        DB_PASSWORD: joi.string().allow("").optional(),
        DB_NAME: joi.string().required(),
        // Clave de firma JWT: obligatoria y con longitud mínima para evitar claves débiles
        JWT_SECRET: joi.string().min(32).required().messages({
            "string.min": "JWT_SECRET debe tener al menos 32 caracteres",
            "any.required": "JWT_SECRET es obligatorio",
        }),
        // Orígenes permitidos separados por comas (p. ej. "http://localhost:5173,https://app.midominio.com")
        CORS_ORIGINS: joi.string().allow("").default(""),
        // Número de proxies inversos delante de la API (0 = conexión directa)
        TRUST_PROXY: joi.number().integer().min(0).default(0),
    }).unknown(true); // Permite otras variables de entorno que no estén definidas en el esquema
    const { error, value } = envSchema.validate(vars);
    return { error, value }
}

const loadEnvVars = (): ReturnEnvironmentVars => {
    //validar los datos
    const result = validateEnVars(process.env);
    if (result.error) {
        throw new Error(result.error.message);
    }
    const value = result.value;
    return {
        NODE_ENV: value.NODE_ENV,
        PORT: value.PORT,
        DB_HOST: value.DB_HOST,
        DB_PORT: value.DB_PORT,
        DB_USER: value.DB_USER,
        DB_PASSWORD: value.DB_PASSWORD,
        DB_NAME: value.DB_NAME,
        JWT_SECRET: value.JWT_SECRET,
        CORS_ORIGINS: String(value.CORS_ORIGINS)
            .split(",")
            .map(origin => origin.trim())
            .filter(origin => origin.length > 0),
        TRUST_PROXY: value.TRUST_PROXY
    }
}

const envs = loadEnvVars();
export default envs;