import joi from "joi";
import { ValidationError } from "../../domain/errors.js";

// Tipo de datos que devuelve la validación (todo opcional para update)
export type ReturnUserData = Partial<{
    nombre: string;
    correo: string;
    contrasena: string;
    rol: "usuario" | "admin";
    nivel_salud: "bajo" | "medio" | "alto";
    activo: boolean;
}>;

// Esquema de validación para UPDATE (todos opcionales)
const updateUserSchema = joi.object({
    nombre: joi.string()
        .trim()
        .min(3)
        .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)?$/)
        .messages({
            "string.base": "El nombre debe ser un texto",
            "string.empty": "El nombre no puede estar vacío",
            "string.min": "El nombre debe tener al menos 3 caracteres",
            "string.pattern.base": "El nombre debe contener solo letras y espacios"
        }),

    correo: joi.string()
        .email({ tlds: { allow: false } })
        .messages({
            "string.email": "El correo electrónico no es válido",
            "string.empty": "El correo electrónico no puede estar vacío"
        }),

    contrasena: joi.string()
        .min(6)
        .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
        .messages({
            "string.min": "La contraseña debe tener al menos 6 caracteres",
            "string.pattern.base": "La contraseña debe contener letras y números",
            "string.empty": "La contraseña no puede estar vacía"
        }),

    rol: joi.string()
        .valid("usuario", "admin")
        .messages({
            "string.base": "El rol debe ser un texto",
            "any.only": "El rol debe ser 'usuario' o 'admin'",
        }),

    nivel_salud: joi.string()
        .valid("bajo", "medio", "alto")
        .messages({
            "string.base": "El nivel de salud debe ser un texto",
            "any.only": "El nivel de salud debe ser 'bajo', 'medio' o 'alto'",
        }),


    activo: joi.boolean()
        .messages({
            "boolean.base": "El campo activo debe ser verdadero o falso",
        }),

})
    .min(1)
    .unknown(false);

// Función que valida y limpia los datos
export const loadUpdateUserData = (data: any): ReturnUserData => {
    const { error, value } = updateUserSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    if (error) {
        const messages = error.details.map(d => d.message).join(", ");
        throw new ValidationError(messages);
    }

    return value;
};
