import joi from "joi";
import { validate } from "./validate.js";

// Letters (with accents), spaces and hyphens: "Cuello", "Ojos", "Respiración"
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:[\s-][A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/;

const name = joi.string().trim().min(3).max(60).pattern(NAME_PATTERN).messages({
    "string.base": "El nombre debe ser un texto",
    "string.empty": "El nombre no puede estar vacío",
    "string.min": "El nombre debe tener entre 3 y 60 caracteres",
    "string.max": "El nombre debe tener entre 3 y 60 caracteres",
    "string.pattern.base": "El nombre solo puede contener letras, espacios y guiones",
    "any.required": "El nombre es obligatorio",
});

const description = joi.string().trim().max(500).allow("").messages({
    "string.base": "La descripción debe ser un texto",
    "string.max": "La descripción debe tener máximo 500 caracteres",
});

const active = joi.boolean().messages({ "boolean.base": "active debe ser true o false" });

export type BreakCategoryData = { name: string; description?: string; active: boolean };

const createSchema = joi.object({
    name: name.required(),
    description: description.optional(),
    active: active.default(true),
}).unknown(false);

const updateSchema = joi.object({ name, description, active })
    .min(1).unknown(false).messages({ "object.min": "Debes enviar al menos un campo para actualizar" });

export const loadBreakCategory = (data: unknown) => validate<BreakCategoryData>(createSchema, data);
export const loadBreakCategoryUpdate = (data: unknown) => validate<Partial<BreakCategoryData>>(updateSchema, data);
