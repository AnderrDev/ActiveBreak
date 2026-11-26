import joi from "joi";
import { ValidationError } from "../../domain/errors.js";

// Convierte los errores de Joi en un ValidationError con la lista de mensajes,
// para que la respuesta muestre cada dato inválido por separado
export const validationErrorFrom = (error: joi.ValidationError): ValidationError =>
    new ValidationError("Datos inválidos", error.details.map(d => d.message.trim()));
