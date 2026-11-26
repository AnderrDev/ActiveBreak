import joi from "joi";
import { validationErrorFrom } from "./joi-error.js";

export type ReturnRecordatorioDiaData = {
    recordatorioId: number;
    diaSemana: string[];
};

const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const recordatorioDiaSchema = joi.object({

    recordatorioId: joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "recordatorioId debe ser un número",
            "number.integer": "recordatorioId debe ser entero",
            "number.positive": "recordatorioId debe ser positivo",
            "any.required": "recordatorioId es obligatorio"
        }),

    diaSemana: joi.array()
        .items(
            joi.string().valid(...diasValidos)
                .messages({
                    "any.only": `Los dias válidos son: ${diasValidos.join(", ")}`
                })
        )
        .min(1)
        .required()
        .messages({
            "array.base": "dias debe ser un array",
            "array.min": "dias no puede estar vacío",
            "any.required": "dias es obligatorio",
        })
})
    .unknown(false);

export const loadRecordatorioDia = (data: any): ReturnRecordatorioDiaData => {

    const { error, value } = recordatorioDiaSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
    });

    if (error) {
        throw validationErrorFrom(error);
    }

    return value;
};