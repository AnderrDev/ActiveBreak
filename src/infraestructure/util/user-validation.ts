//Este archivo se encarga de validar los datos de entrada del usuario utilizando la librería Joi

import joi from 'joi';

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
            .min(3)
            .required()
            .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)?$/)
            .messages({
                'string.base': 'El nombre debe ser un texto',
                'string.empty   ': 'El nombre no puede estar vacío',
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.pattern.base': 'El nombre debe contener solo letras y espacios'
            }),

        correo: joi.string().
            email({ tlds: { allow: false } })
            .messages({
                'string.email': 'El correo electrónico no es válido',
                'string.empty': 'El correo electrónico no puede estar vacío'
            })
            .required(),

        contrasena: joi
            .string()
            .min(6)
            .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener al menos 6 caracteres',
                'string.pattern.base': 'La contraseña debe contener letras y números',
                'string.empty': 'La es requerida',
            }),
        // "rol" y "activo" NO se aceptan en el registro: los asigna el servidor
        // (rol "usuario", activo true) para impedir que alguien se registre como admin.
        rol: joi.forbidden().messages({
            "any.unknown": "El rol no se puede asignar al registrarse",
        }),
        activo: joi.forbidden().messages({
            "any.unknown": "El estado no se puede asignar al registrarse",
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
        //Une todos los mensajes de error en una sola cadena separada por comas
        const messages = result.error.details.map(d => d.message).join(', ');
        throw new Error(messages);
    }
    return result.value;
}

export const loadLoginData = (data: any) => {
    const { correo, contrasena } = data;

    if (!correo || !contrasena) {
        throw new Error("correo y contraseña son obligatorios");
    }

    return { correo, contrasena };
};