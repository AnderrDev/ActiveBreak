import { Role } from "./User.js";

// Authenticated user data carried inside the JWT
export interface AuthPayload {
    id: number;
    email: string;
    role: Role;
}
