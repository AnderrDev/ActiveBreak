/*
Domain errors: they describe WHAT went wrong without knowing anything about HTTP.
The translation to status codes lives in the error middleware (infrastructure/web/errorMiddleware.ts).
Messages are in Spanish because they reach the end user.
*/

export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

// Invalid input or a broken business rule.
// "details" holds one message per invalid field (for example, the Joi messages).
export class ValidationError extends DomainError {
    readonly details: string[];

    constructor(message: string, details: string[] = []) {
        super(message);
        this.details = details;
    }
}

// The requested (or referenced) resource does not exist
export class NotFoundError extends DomainError { }

// Conflict with the current state (duplicated value, business rule)
export class ConflictError extends DomainError { }

// Invalid credentials
export class UnauthorizedError extends DomainError { }

// Authenticated, but without permission over the resource
export class ForbiddenError extends DomainError { }
