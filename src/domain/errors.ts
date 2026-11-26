/*
Errores de dominio: expresan QUÉ falló sin saber nada de HTTP.
La traducción a códigos de estado la hace el middleware de errores (infraestructura).
*/

export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

// Datos de entrada o reglas de negocio no cumplidas.
// "errores" guarda el detalle de cada dato inválido (por ejemplo, los mensajes de Joi).
export class ValidationError extends DomainError {
    readonly errores: string[];

    constructor(message: string, errores: string[] = []) {
        super(message);
        this.errores = errores;
    }
}

// El recurso solicitado (o uno referenciado) no existe
export class NotFoundError extends DomainError { }

// Conflicto con el estado actual (p. ej. correo ya registrado)
export class ConflictError extends DomainError { }

// Credenciales inválidas
export class UnauthorizedError extends DomainError { }

// Autenticado, pero sin permiso sobre el recurso
export class ForbiddenError extends DomainError { }
