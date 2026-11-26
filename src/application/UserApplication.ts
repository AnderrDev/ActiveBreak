/*
User use cases. The business rules live in domain/User.ts (UserRules);
this service loads the data through the ports, applies the rules and persists.
Passwords are hashed with bcrypt (cost 12) here, never in the controller or adapter.
*/
import bcrypt from "bcryptjs";
import { User, UserRules } from "../domain/User.js";
import { UserPort } from "../domain/UserPort.js";
import { OrganizationRules } from "../domain/Organization.js";
import { OrganizationPort } from "../domain/OrganizationPort.js";
import { NotFoundError, UnauthorizedError } from "../domain/errors.js";
import { AuthApplication } from "./AuthApplication.js";
import { appLock } from "./KeyedLock.js";

const BCRYPT_COST = 12;

// bcrypt hash of a random value; only used to equalize login timing
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), BCRYPT_COST);

// Changes that may remove an admin are serialized under this key
const ADMINS_LOCK = "admins";

export class UserApplication {
    private port: UserPort;
    private organizationPort: OrganizationPort;

    constructor(port: UserPort, organizationPort: OrganizationPort) {
        this.port = port;
        this.organizationPort = organizationPort;
    }

    async login(email: string, password: string): Promise<string> {
        const user = await this.port.getUserByEmail(email);

        // ALWAYS compare against a hash (a fake one if the user does not exist)
        // so the response time does not reveal which emails are registered
        const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

        // Same message for unknown email, wrong password or inactive account
        if (!user || !passwordMatches || !user.active) {
            throw new UnauthorizedError("Credenciales inválidas");
        }

        return AuthApplication.generateToken({ id: user.id, email: user.email, role: user.role });
    }

    async createUser(user: Omit<User, "id">): Promise<number> {
        UserRules.assertEmailAvailable(await this.port.getUserByEmail(user.email));

        const password = await bcrypt.hash(user.password, BCRYPT_COST);
        return this.port.createUser({ ...user, password });
    }

    async getUserById(id: number): Promise<User | null> {
        return this.port.getUserById(id);
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.port.getUserByEmail(email);
    }

    async getAllUsers(): Promise<User[]> {
        return this.port.getAllUsers();
    }

    async getActiveUsers(): Promise<User[]> {
        return this.port.getActiveUsers();
    }

    // actorId: id of the authenticated user making the change
    async updateUser(id: number, changes: Partial<User>, actorId: number): Promise<boolean> {
        return appLock.run(ADMINS_LOCK, async () => {
            const target = await this.findUser(id);

            if (UserRules.affectsAdmin(target, changes)) {
                UserRules.assertAdminChangeAllowed(target, actorId, {
                    losesAdminRole: changes.role !== undefined && changes.role !== "admin",
                    isDeactivated: changes.active === false,
                }, await this.port.countActiveAdmins());
            }

            if (changes.organizationId !== undefined) {
                OrganizationRules.assertAssignable(await this.organizationPort.getOrganizationById(changes.organizationId));
            }

            if (changes.email !== undefined) {
                UserRules.assertEmailAvailable(await this.port.getUserByEmail(changes.email), id);
            }

            const data = { ...changes };
            if (data.password !== undefined) {
                data.password = await bcrypt.hash(data.password, BCRYPT_COST);
            }

            return this.port.updateUser(id, data);
        });
    }

    async deleteUser(id: number, actorId: number): Promise<boolean> {
        return appLock.run(ADMINS_LOCK, async () => {
            const target = await this.findUser(id);

            if (UserRules.affectsAdmin(target, { active: false })) {
                UserRules.assertAdminChangeAllowed(target, actorId, {
                    losesAdminRole: false,
                    isDeactivated: true,
                }, await this.port.countActiveAdmins());
            }

            return this.port.deleteUser(id);
        });
    }

    private async findUser(id: number): Promise<User> {
        const user = await this.port.getUserById(id);
        if (!user) throw new NotFoundError("El usuario no existe");
        return user;
    }
}
