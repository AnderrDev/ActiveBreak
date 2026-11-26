import joi from 'joi';
import { validationErrorFrom } from "./joi-error.js";

export type ReturnEmail = {
    email: string;
};

//estructura del resultado de validación
type ValidationEmail = {
    error: joi.ValidationError | undefined,
    value: ReturnEmail
}

function validateEmail(data: any): ValidationEmail {
    const emailSchema = joi.object({
        // la clave debe coincidir con el parámetro de la ruta /users/email/:email
        email: joi
            .string()
            .trim()
            .lowercase()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                "string.email": " El correo electrónico no es válido",
                "string.empty": " El correo electrónico no puede estar vacío",
            }),
    }).unknown(false);
    const { error, value } = emailSchema.validate(data, { abortEarly: false, convert: true });
    return { error, value };
}

//funcion de carga
export const loadEmail = (data: any): ReturnEmail => {
    const result = validateEmail(data);
    if (result.error) {
        throw validationErrorFrom(result.error);
    }
    return result.value;
}