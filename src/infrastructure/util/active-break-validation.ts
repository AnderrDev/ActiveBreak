import joi from "joi";
import { validate } from "./validate.js";
import { Intensity } from "../../domain/ActiveBreak.js";

// Break name: letters, numbers, spaces and . , ( ) -  (3 to 100 characters)
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]+(?:[\s.,()-]+[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]+)*[.)]?$/;

const name = joi.string().trim().min(3).max(100).pattern(NAME_PATTERN).messages({
    "string.base": "El nombre debe ser un texto",
    "string.empty": "El nombre no puede estar vacío",
    "string.min": "El nombre debe tener entre 3 y 100 caracteres",
    "string.max": "El nombre debe tener entre 3 y 100 caracteres",
    "string.pattern.base": "El nombre solo puede contener letras, números, espacios y los signos . , ( ) -",
    "any.required": "El nombre es obligatorio",
});

const description = joi.string().trim().max(1000).allow("").messages({
    "string.base": "La descripción debe ser un texto",
    "string.max": "La descripción debe tener máximo 1000 caracteres",
});

const durationMinutes = joi.number().integer().min(1).max(30).messages({
    "number.base": "La duración (durationMinutes) debe ser un número",
    "number.integer": "La duración (durationMinutes) debe ser un número entero",
    "number.min": "La duración debe estar entre 1 y 30 minutos",
    "number.max": "La duración debe estar entre 1 y 30 minutos",
    "any.required": "La duración (durationMinutes) es obligatoria",
});

const intensity = joi.string().valid("low", "medium", "high").messages({
    "any.only": "La intensidad debe ser 'low', 'medium' o 'high'",
    "any.required": "La intensidad es obligatoria",
});

const categoryId = joi.number().integer().positive().messages({
    "number.base": "categoryId debe ser un número",
    "number.integer": "categoryId debe ser un número entero",
    "number.positive": "categoryId debe ser mayor a 0",
    "any.required": "La categoría (categoryId) es obligatoria",
});

const active = joi.boolean().messages({ "boolean.base": "active debe ser true o false" });

export type ActiveBreakData = {
    name: string; description?: string; durationMinutes: number;
    intensity: Intensity; categoryId: number; active: boolean;
};

const createSchema = joi.object({
    name: name.required(),
    description: description.optional(),
    durationMinutes: durationMinutes.required(),
    intensity: intensity.required(),
    categoryId: categoryId.required(),
    active: active.default(true),
}).unknown(false);

const updateSchema = joi.object({ name, description, durationMinutes, intensity, categoryId, active })
    .min(1).unknown(false).messages({ "object.min": "Debes enviar al menos un campo para actualizar" });

export const loadActiveBreak = (data: unknown) => validate<ActiveBreakData>(createSchema, data);
export const loadActiveBreakUpdate = (data: unknown) => validate<Partial<ActiveBreakData>>(updateSchema, data);

// ---------- Catalog filters: GET /active-breaks/active?categoryId=&intensity=&maxDuration= ----------
export type CatalogFiltersData = { categoryId?: number; intensity?: Intensity; maxDuration?: number };

const filtersSchema = joi.object({
    categoryId,
    intensity,
    maxDuration: joi.number().integer().min(1).max(30).messages({
        "number.base": "maxDuration debe ser un número",
        "number.integer": "maxDuration debe ser un número entero",
        "number.min": "maxDuration debe estar entre 1 y 30",
        "number.max": "maxDuration debe estar entre 1 y 30",
    }),
}).unknown(false).messages({ "object.unknown": "Filtro no permitido: {#label}" });

export const loadCatalogFilters = (query: unknown) => validate<CatalogFiltersData>(filtersSchema, query);
