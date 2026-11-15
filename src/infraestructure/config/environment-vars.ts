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
        JWT_SECRET: value.JWT_SECRET
    }
}

const envs = loadEnvVars();
export default envs;