//Este archivo se encarga de validar los datos de entrada del usuario utilizando la librería Joi

import joi from 'joi';
import { ValidationError } from "../../domain/errors.js";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnUserData = {
    nombre: string;
    correo: string;
    contrasena: string;
    nivel_salud: "bajo" | "medio" | "alto";
}

//almacenar el resultado de la validación de los datos de entrada del usuario
type validationUserData = {
    error: joi.ValidationError | undefined,
    value: ReturnUserData
}

//funcion clasica
function validateUserData(data: any): validationUserData {
    const userSchema = joi.object({
        nombre: joi.string()
            .trim()
            .min(5)
            .max(150)
            .required()
            .pattern(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\s[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/)
            .messages({
                'string.base': 'El nombre debe ser un texto',
                'string.empty': 'El nombre no puede estar vacío',
                'string.max': 'El nombre debe tener entre 5 y 150 caracteres',
                'string.min': 'El nombre debe tener entre 5 y 150 caracteres',
                'string.pattern.base': 'El nombre debe contener solo letras y espacios'
            }),

        // Los correos se guardan en minúsculas para que no haya duplicados por mayúsculas
        correo: joi.string()
            .trim()
            .lowercase()
            .max(150)
            .email({ tlds: { allow: false } })
            .messages({
                'string.email': 'El correo electrónico no es válido',
                'string.empty': 'El correo electrónico no puede estar vacío',
                'string.max': 'El correo electrónico debe tener máximo 150 caracteres'
            })
            .required(),

        contrasena: joi
            .string()
            .min(8)
            .max(64)
            .pattern(/^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener entre 8 y 64 caracteres',
                'string.pattern.base': 'La contraseña debe tener al menos una letra y un número, sin espacios',
                'string.empty': 'La contraseña es obligatoria',
                'string.max': 'La contraseña debe tener entre 8 y 64 caracteres',
            }),
        // "rol" y "activo" NO se aceptan en el registro: los asigna el servidor
        // (rol "usuario", activo true) para impedir que alguien se registre como admin.
        rol: joi.forbidden().messages({
            "any.unknown": "El rol no se puede asignar al registrarse",
        }),
        activo: joi.forbidden().messages({
            "any.unknown": "El estado no se puede asignar al registrarse",
        }),
        organizacionId: joi.forbidden().messages({
            "any.unknown": "La organización la asigna un administrador",
        }),
        nivel_salud: joi.string()
            .valid("bajo", "medio", "alto")
            .required()
            .messages({
                "string.base": "El nivel de salud debe ser un texto",
                "any.only": "El nivel de salud debe ser 'bajo', 'medio' o 'alto'",
                "any.required": "El nivel de salud es obligatorio",
            }),
    }).unknown(false);
    const { error, value } = userSchema.validate(data,
        {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
    return { error, value };
}

//funcion de carga
export const loadUserData = (data: any): ReturnUserData => {
    const result = validateUserData(data);
    if (result.error) {
        throw validationErrorFrom(result.error);
    }
    return result.value;
}

export type ReturnLoginData = {
    correo: string;
    contrasena: string;
};

// Login: solo se comprueba el tipo y la presencia; las reglas de formato de la
// contraseña no se revelan aquí para no dar pistas a un atacante.
const loginSchema = joi.object({
    correo: joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required(),
    contrasena: joi.string().min(1).max(128).required(),
}).unknown(false).messages({
    "any.required": "correo y contraseña son obligatorios",
    "string.empty": "correo y contraseña son obligatorios",
    "string.base": "correo y contraseña deben ser texto",
    "string.email": "El correo electrónico no es válido",
    "string.max": "Credenciales inválidas",
    "object.unknown": "Solo se permiten los campos correo y contraseña",
});

export const loadLoginData = (data: any): ReturnLoginData => {
    const { error, value } = loginSchema.validate(data, { abortEarly: true, convert: true });
    if (error) {
        throw new ValidationError(error.details[0]?.message ?? "Datos de login inválidos");
    }
    return value;
};
