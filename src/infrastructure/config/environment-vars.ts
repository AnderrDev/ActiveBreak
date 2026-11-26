// Loads and validates the environment variables on startup: the server does not start with a bad configuration
import joi from "joi";
import "dotenv/config";

export type NodeEnv = "development" | "production" | "test";

export interface EnvironmentVars {
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
    API_DOCS_ENABLED: boolean;
}

const envSchema = joi.object({
    NODE_ENV: joi.string().valid("development", "production", "test").default("development"),
    PORT: joi.number().required(),
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().default(5432),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.string().allow("").default(""),
    DB_NAME: joi.string().required(),
    // JWT signing key: required and with a minimum length to avoid weak keys
    JWT_SECRET: joi.string().min(32).required().messages({
        "string.min": "JWT_SECRET debe tener al menos 32 caracteres",
        "any.required": "JWT_SECRET es obligatorio",
    }),
    // Allowed origins separated by commas (e.g. "http://localhost:4200,https://app.example.com")
    CORS_ORIGINS: joi.string().allow("").default(""),
    // Number of reverse proxies in front of the API (0 = direct connection)
    TRUST_PROXY: joi.number().integer().min(0).default(0),
    // Publishes the Swagger documentation at /api/docs
    API_DOCS_ENABLED: joi.boolean().default(true),
}).unknown(true); // Other environment variables are allowed

const loadEnvVars = (): EnvironmentVars => {
    const { error, value } = envSchema.validate(process.env);
    if (error) {
        throw new Error(error.message);
    }
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
            .map((origin: string) => origin.trim())
            .filter((origin: string) => origin.length > 0),
        TRUST_PROXY: value.TRUST_PROXY,
        API_DOCS_ENABLED: value.API_DOCS_ENABLED,
    };
};

const envs = loadEnvVars();
export default envs;
