// Entry point. The environment variables are imported first so they are validated before anything else
import "./infrastructure/config/environment-vars.js";
import app from "./infrastructure/web/app.js";
import { ServerBootstrap } from "./infrastructure/bootstrap/ServerBootstrap.js";
import { connectDB } from "./infrastructure/config/database.js";

const server = new ServerBootstrap(app);

(async () => {
    try {
        // Database first: the server does not accept requests until the connection is ready
        await connectDB();
        await server.initialize();
    } catch (error) {
        console.error("Error al iniciar la aplicación:", error);
        process.exit(1);
    }
})();
