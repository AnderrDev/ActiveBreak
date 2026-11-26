import { User } from "./User.js";

export interface UserPort {
    createUser(user: Omit<User, "id">): Promise<number>;
    updateUser(id: number, user: Partial<User>): Promise<boolean>;
    deleteUser(id: number): Promise<boolean>;
    getUserById(id: number): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    getActiveUsers(): Promise<User[]>;

    // Business rule: there must always be at least one active admin
    countActiveAdmins(): Promise<number>;

    // Business rule: an organization with active users cannot be deactivated
    countActiveByOrganization(organizationId: number): Promise<number>;
}
