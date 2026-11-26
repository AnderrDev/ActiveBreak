import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnMeta = {
    usuarioId: number;
    pausasObjetivo: number;
    fechaInicio: string;
    fechaFin: string;
};

export type ReturnUpdateMeta = Partial<Omit<ReturnMeta, "usuarioId">>;

// Fecha de calendario YYYY-MM-DD (el rango y el orden se validan en la capa de aplicación)
const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Rechaza fechas que cumplen el formato pero no existen (ej. 2026-02-30)
const fechaReal = (value: string, helpers: joi.CustomHelpers) => {
    const fecha = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== value) {
        return helpers.error("date.invalida");
    }
    return value;
};

const fecha = (campo: string) => joi.string()
    .pattern(FECHA)
    .custom(fechaReal)
    .messages({
        "string.base": `${campo} debe ser un texto`,
        "string.empty": `${campo} no puede estar vacía`,
        "string.pattern.base": `${campo} debe tener formato YYYY-MM-DD`,
        "date.invalida": `${campo} no es una fecha válida`,
        "any.required": `${campo} es obligatoria`,
    });

const pausasObjetivo = joi.number()
    .integer()
    .min(1)
    .max(50)
    .messages({
        "number.base": "pausasObjetivo debe ser un número",
        "number.integer": "pausasObjetivo debe ser un número entero",
        "number.min": "pausasObjetivo debe ser al menos 1",
        "number.max": "pausasObjetivo debe ser como máximo 50",
        "any.required": "pausasObjetivo es obligatorio",
    });

const createSchema = joi.object({
    usuarioId: joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "El usuarioId debe ser un número",
            "number.integer": "El usuarioId debe ser un número entero",
            "number.positive": "El usuarioId debe ser mayor a 0",
            "any.required": "El usuarioId es obligatorio",
        }),
    pausasObjetivo: pausasObjetivo.required(),
    fechaInicio: fecha("La fecha de inicio").required(),
    fechaFin: fecha("La fecha de fin").required(),
}).unknown(false);

// El estado lo calcula el servidor y el usuario de la meta no se puede cambiar
const updateSchema = joi.object({
    pausasObjetivo,
    fechaInicio: fecha("La fecha de inicio"),
    fechaFin: fecha("La fecha de fin"),
}).min(1).unknown(false);

const load = <T>(schema: joi.ObjectSchema, data: any): T => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true, convert: true });
    if (error) {
        throw validationErrorFrom(error);
    }
    return value;
};

export const loadMeta = (data: any): ReturnMeta => load<ReturnMeta>(createSchema, data);

export const loadUpdateMeta = (data: any): ReturnUpdateMeta => load<ReturnUpdateMeta>(updateSchema, data);
