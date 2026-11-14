import app from "./infraestructure/web/app.js";
import { serverBootstrap } from "./infraestructure/bootstrap/server.bootstrap.js"
import { connectDB } from "./infraestructure/config/data-base.js";

const server = new serverBootstrap(app);
(
    async () => {
        try {
            const instances = [
                connectDB(),
                server.initialize()
            ];
            await Promise.all(instances);
        } catch (error) {
            console.log("Error al iniciar la aplicacion ", error);
            process.exit(1);
        }
    }
)();
