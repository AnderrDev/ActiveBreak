// Runs a Joi schema and, if it fails, throws a ValidationError with one message per invalid field
import joi from "joi";
import { ValidationError } from "../../domain/errors.js";

// Default Spanish messages for the generic Joi errors (each schema can override them)
const DEFAULT_MESSAGES: joi.LanguageMessages = {
    "object.unknown": "El campo {#label} no está permitido",
    "object.base": "El cuerpo de la petición debe ser un objeto JSON",
};

export const validate = <T>(schema: joi.Schema, data: unknown): T => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
        messages: DEFAULT_MESSAGES,
        errors: { wrap: { label: false } }, // field names without quotes in the messages
    });
    if (error) {
        throw new ValidationError("Datos inválidos", error.details.map(d => d.message.trim()));
    }
    return value as T;
};

// ---------- Patterns shared by several schemas ----------

// Calendar date YYYY-MM-DD
export const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
// Date and time YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
export const DATE_TIME_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
// 24-hour time HH:mm
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Rejects values that match the pattern but do not exist (e.g. 2026-02-30)
export const existingDate = (value: string, helpers: joi.CustomHelpers) => {
    const datePart = value.slice(0, 10);
    const date = new Date(`${datePart}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== datePart) {
        return helpers.error("date.nonexistent");
    }
    return value;
};
