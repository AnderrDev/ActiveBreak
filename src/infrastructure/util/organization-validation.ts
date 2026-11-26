import joi from "joi";
import { validate } from "./validate.js";

// Colombian NIT: 9 digits, hyphen and check digit (the check digit is verified in the domain)
const TAX_ID_PATTERN = /^\d{9}-\d$/;
// Company name: letters, numbers, spaces and . , & -
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9][A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9\s.,&-]*$/;

const name = joi.string().trim().min(3).max(120).pattern(NAME_PATTERN).messages({
    "string.base": "El nombre debe ser un texto",
    "string.empty": "El nombre no puede estar vacío",
    "string.min": "El nombre debe tener entre 3 y 120 caracteres",
    "string.max": "El nombre debe tener entre 3 y 120 caracteres",
    "string.pattern.base": "El nombre solo puede contener letras, números, espacios y los signos . , & -",
    "any.required": "El nombre es obligatorio",
});

const taxId = joi.string().trim().pattern(TAX_ID_PATTERN).messages({
    "string.base": "El NIT (taxId) debe ser un texto",
    "string.empty": "El NIT (taxId) no puede estar vacío",
    "string.pattern.base": "El NIT (taxId) debe tener 9 dígitos, un guion y el dígito de verificación (ej. 900123456-8)",
    "any.required": "El NIT (taxId) es obligatorio",
});

const sector = joi.string().trim().min(3).max(80).pattern(/^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/).messages({
    "string.base": "El sector debe ser un texto",
    "string.min": "El sector debe tener entre 3 y 80 caracteres",
    "string.max": "El sector debe tener entre 3 y 80 caracteres",
    "string.pattern.base": "El sector solo puede contener letras y espacios",
});

const active = joi.boolean().messages({ "boolean.base": "active debe ser true o false" });

export type OrganizationData = { name: string; taxId: string; sector?: string; active: boolean };

const createSchema = joi.object({
    name: name.required(),
    taxId: taxId.required(),
    sector: sector.optional(),
    active: active.default(true),
}).unknown(false);

const updateSchema = joi.object({ name, taxId, sector, active })
    .min(1).unknown(false).messages({ "object.min": "Debes enviar al menos un campo para actualizar" });

export const loadOrganization = (data: unknown) => validate<OrganizationData>(createSchema, data);
export const loadOrganizationUpdate = (data: unknown) => validate<Partial<OrganizationData>>(updateSchema, data);
