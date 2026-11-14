//ESTE ARCHIVO CONTIENE LA CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
import dotenv from "dotenv";
import { User } from "../entities/User.js";
import { DataSource } from "typeorm";
import envs from "./environment-vars.js";
import { PausaActiva } from "../entities/PausaActiva.js";
import { Recordatorio } from "../entities/Recordatorio.js";
import { RecordatorioDia } from "../entities/RecordatorioDia.js";
import { HistorialActividad } from "../entities/HistorialActividad.js";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: envs.DB_HOST,
    port: Number(envs.DB_PORT) || 5432,
    username: envs.DB_USER,
    password: envs.DB_PASSWORD,
    database: envs.DB_NAME,
    schema: "public",
    synchronize: true,
    logging: true,
    entities: [
        User,
        PausaActiva,
        Recordatorio,
        RecordatorioDia,
        HistorialActividad

    ],
});

//MÉTODO PARA CONECTAR A LA BASE DE DATOS
export const connectDB = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Conexión a la base de datos establecida correctamente");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        process.exit(1);
    }
}