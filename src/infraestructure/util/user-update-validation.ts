import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

// Tipo de datos que devuelve la validación (todo opcional para update)
export type ReturnUserData = Partial<{
    nombre: string;
    correo: string;
    contrasena: string;
    rol: "usuario" | "admin";
    nivel_salud: "bajo" | "medio" | "alto";
    activo: boolean;
    organizacionId: number;
}>;

// Esquema de validación para UPDATE (todos opcionales)
const updateUserSchema = joi.object({
    nombre: joi.string()
        .trim()
        .min(5)
        .max(150)
        .pattern(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\s[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/)
        .messages({
            "string.base": "El nombre debe ser un texto",
            "string.empty": "El nombre no puede estar vacío",
            "string.max": "El nombre debe tener entre 5 y 150 caracteres",
            "string.min": "El nombre debe tener entre 5 y 150 caracteres",
            "string.pattern.base": "El nombre debe contener solo letras y espacios"
        }),

    correo: joi.string()
        .trim()
        .lowercase()
        .max(150)
        .email({ tlds: { allow: false } })
        .messages({
            "string.email": "El correo electrónico no es válido",
            "string.empty": "El correo electrónico no puede estar vacío"
        }),

    contrasena: joi.string()
        .min(8)
        .max(64)
        .pattern(/^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/)
        .messages({
            "string.min": "La contraseña debe tener entre 8 y 64 caracteres",
            "string.pattern.base": "La contraseña debe tener al menos una letra y un número, sin espacios",
            "string.empty": "La contraseña no puede estar vacía",
            "string.max": "La contraseña debe tener entre 8 y 64 caracteres"
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

    organizacionId: joi.number()
        .integer()
        .positive()
        .messages({
            "number.base": "organizacionId debe ser un número",
            "number.integer": "organizacionId debe ser un número entero",
            "number.positive": "organizacionId debe ser mayor a 0",
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
        throw validationErrorFrom(error);
    }

    return value;
};
