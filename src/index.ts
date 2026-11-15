// Se importa primero para validar las variables de entorno antes de cargar el resto
import "./infraestructure/config/environment-vars.js";
import app from "./infraestructure/web/app.js";
import { serverBootstrap } from "./infraestructure/bootstrap/server.bootstrap.js"
import { connectDB } from "./infraestructure/config/data-base.js";

const server = new serverBootstrap(app);
(
    async () => {
        try {
            // Primero la BD: el servidor no acepta peticiones hasta que la conexión está lista
            await connectDB();
            await server.initialize();
        } catch (error) {
            console.log("Error al iniciar la aplicacion ", error);
            process.exit(1);
        }
    }
)();
