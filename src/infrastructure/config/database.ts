// Database connection (TypeORM + PostgreSQL)
import { DataSource } from "typeorm";
import envs from "./environment-vars.js";
import { User } from "../entities/User.js";
import { Organization } from "../entities/Organization.js";
import { BreakCategory } from "../entities/BreakCategory.js";
import { ActiveBreak } from "../entities/ActiveBreak.js";
import { Reminder } from "../entities/Reminder.js";
import { ReminderDay } from "../entities/ReminderDay.js";
import { ActivityHistory } from "../entities/ActivityHistory.js";
import { Goal } from "../entities/Goal.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: envs.DB_HOST,
    port: envs.DB_PORT,
    username: envs.DB_USER,
    password: envs.DB_PASSWORD,
    database: envs.DB_NAME,
    schema: "public",
    // synchronize changes the schema automatically: NEVER in production (it may drop columns/data).
    // In production the tables come from database/init/01_tables.sql
    synchronize: envs.NODE_ENV !== "production",
    // Queries are not logged: they would include sensitive parameters (hashes, emails)
    logging: envs.NODE_ENV === "development" ? ["error", "warn", "schema"] : ["error"],
    entities: [User, Organization, BreakCategory, ActiveBreak, Reminder, ReminderDay, ActivityHistory, Goal],
});

export const connectDB = async (): Promise<void> => {
    await AppDataSource.initialize();
    console.log("Conexión a la base de datos establecida correctamente");
};
