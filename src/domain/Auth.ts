// Datos del usuario autenticado que viajan dentro del token JWT
import { User } from "./User.js";

export interface AuthPayload {
    id: number;
    email: string;
    rol: User["rol"];
}
