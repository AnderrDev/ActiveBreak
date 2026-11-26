import joi from "joi";
import { validate } from "./validate.js";
import { HealthLevel, Role } from "../../domain/User.js";

// Letters (with accents) and single spaces between words
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\s[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/;
// 8 to 64 characters, at least one letter and one number, no spaces
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/;

const name = joi.string().trim().min(5).max(150).pattern(NAME_PATTERN).messages({
    "string.base": "El nombre debe ser un texto",
    "string.empty": "El nombre no puede estar vacío",
    "string.min": "El nombre debe tener entre 5 y 150 caracteres",
    "string.max": "El nombre debe tener entre 5 y 150 caracteres",
    "string.pattern.base": "El nombre solo puede contener letras y espacios",
    "any.required": "El nombre es obligatorio",
});

// Emails are stored in lowercase so there are no duplicates by case
const email = joi.string().trim().lowercase().max(150).email({ tlds: { allow: false } }).messages({
    "string.base": "El correo electrónico debe ser un texto",
    "string.email": "El correo electrónico no es válido",
    "string.empty": "El correo electrónico no puede estar vacío",
    "string.max": "El correo electrónico debe tener máximo 150 caracteres",
    "any.required": "El correo electrónico es obligatorio",
});

const password = joi.string().min(8).max(64).pattern(PASSWORD_PATTERN).messages({
    "string.base": "La contraseña debe ser un texto",
    "string.empty": "La contraseña es obligatoria",
    "string.min": "La contraseña debe tener entre 8 y 64 caracteres",
    "string.max": "La contraseña debe tener entre 8 y 64 caracteres",
    "string.pattern.base": "La contraseña debe tener al menos una letra y un número, sin espacios",
    "any.required": "La contraseña es obligatoria",
});

const healthLevel = joi.string().valid("low", "medium", "high").messages({
    "any.only": "healthLevel debe ser 'low', 'medium' o 'high'",
    "any.required": "healthLevel es obligatorio",
});

// ---------- Registration ----------
export type RegisterData = { name: string; email: string; password: string; healthLevel: HealthLevel };

// "role", "active" and "organizationId" are NOT accepted: the server assigns them
const registerSchema = joi.object({
    name: name.required(),
    email: email.required(),
    password: password.required(),
    healthLevel: healthLevel.required(),
    role: joi.forbidden().messages({ "any.unknown": "El rol no se puede asignar al registrarse" }),
    active: joi.forbidden().messages({ "any.unknown": "El estado no se puede asignar al registrarse" }),
    organizationId: joi.forbidden().messages({ "any.unknown": "La organización la asigna un administrador" }),
}).unknown(false);

export const loadRegisterData = (data: unknown) => validate<RegisterData>(registerSchema, data);

// ---------- Update ----------
export type UserUpdateData = Partial<{
    name: string; email: string; password: string; healthLevel: HealthLevel;
    role: Role; active: boolean; organizationId: number;
}>;

const updateSchema = joi.object({
    name,
    email,
    password,
    healthLevel,
    role: joi.string().valid("user", "admin").messages({ "any.only": "role debe ser 'user' o 'admin'" }),
    active: joi.boolean().messages({ "boolean.base": "active debe ser true o false" }),
    organizationId: joi.number().integer().positive().messages({
        "number.base": "organizationId debe ser un número",
        "number.integer": "organizationId debe ser un número entero",
        "number.positive": "organizationId debe ser mayor a 0",
    }),
}).min(1).unknown(false).messages({ "object.min": "Debes enviar al menos un campo para actualizar" });

export const loadUserUpdate = (data: unknown) => validate<UserUpdateData>(updateSchema, data);

// ---------- Login ----------
// Only type and presence are checked: the password format rules are not revealed here
export type LoginData = { email: string; password: string };

const loginSchema = joi.object({
    email: joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required(),
    password: joi.string().min(1).max(128).required(),
}).unknown(false).messages({
    "any.required": "email y password son obligatorios",
    "string.empty": "email y password son obligatorios",
    "string.base": "email y password deben ser texto",
    "string.email": "El correo electrónico no es válido",
    "string.max": "Credenciales inválidas",
    "object.unknown": "Solo se permiten los campos email y password",
});

export const loadLoginData = (data: unknown) => validate<LoginData>(loginSchema, data);

// ---------- Email route parameter (/users/email/:email) ----------
const emailParamSchema = joi.object({ email: email.required() }).unknown(false);

export const loadEmailParam = (params: unknown) => validate<{ email: string }>(emailParamSchema, params);
