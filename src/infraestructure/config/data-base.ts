//ESTE ARCHIVO CONTIENE LA CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
import dotenv from "dotenv";
import { User } from "../entities/User.js";
import { DataSource } from "typeorm";
import envs from "./environment-vars.js";
import { PausaActiva } from "../entities/PausaActiva.js";
import { Recordatorio } from "../entities/Recordatorio.js";
import { RecordatorioDia } from "../entities/RecordatorioDia.js";
import { HistorialActividad } from "../entities/HistorialActividad.js";
import { CategoriaPausa } from "../entities/CategoriaPausa.js";
import { Organizacion } from "../entities/Organizacion.js";
import { Meta } from "../entities/Meta.js";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: envs.DB_HOST,
    port: Number(envs.DB_PORT) || 5432,
    username: envs.DB_USER,
    password: envs.DB_PASSWORD,
    database: envs.DB_NAME,
    schema: "public",
    // synchronize altera el esquema automáticamente: NUNCA en producción (puede borrar columnas/datos)
    synchronize: envs.NODE_ENV !== "production",
    // No se registran las consultas: incluirían parámetros sensibles (hashes, correos)
    logging: envs.NODE_ENV === "development" ? ["error", "warn", "schema"] : ["error"],
    entities: [
        User,
        PausaActiva,
        Recordatorio,
        RecordatorioDia,
        HistorialActividad,
        CategoriaPausa,
        Organizacion,
        Meta

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