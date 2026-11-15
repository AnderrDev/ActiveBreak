import express from "express";
import helmet from "helmet";
import cors, { type CorsOptions } from "cors";
import envs from "../config/environment-vars.js";
import userRoutes from "../routes/userRoutes.js"
import pausaRoutes from "../routes/pausaRoutes.js";
import recordatorioRoutes from "../routes/recordatorioRoutes.js"
import HistorialRoutes from "../routes/HistorialRoutes.js"
import recordatorioDiaRoutes from "../routes/recordatorioDiaRoutes.js"
import { errorHandler, notFoundHandler } from "./errorMiddleware.js"

class App {

     //ATRIBUTOS DE LA CLASE
     private app: express.Application;
     //METODO CONSTRUCTOR PARA INICIALIZAR LA APLICACION DE EXPRESS
     constructor() {
          this.app = express();
          this.middlewares();
          this.routes();
     }

     //METODO PARA QUE PUEDAN funcionar las peticiones

     private middlewares(): void {
          // Necesario para que el rate limit use la IP real del cliente detrás de un proxy inverso
          this.app.set("trust proxy", envs.TRUST_PROXY)
          // Cabeceras de seguridad HTTP (oculta X-Powered-By, HSTS, nosniff, etc.)
          this.app.use(helmet())
          this.app.use(cors(this.corsOptions()))
          // Límite explícito del cuerpo JSON
          this.app.use(express.json({ limit: "100kb" }))
     }

     // CORS: solo los orígenes de CORS_ORIGINS. Si no se definen, en desarrollo se permite
     // cualquier origen y en producción ninguno (solo clientes del mismo origen o sin navegador).
     private corsOptions(): CorsOptions {
          const origins = envs.CORS_ORIGINS;
          const origin: CorsOptions["origin"] =
               origins.length > 0 ? origins : envs.NODE_ENV === "development";
          return {
               origin,
               methods: ["GET", "POST", "PUT", "DELETE"],
               allowedHeaders: ["Content-Type", "Authorization"],
          };
     }

     private routes(): void {
          this.app.use("/api", userRoutes)
          this.app.use("/api", pausaRoutes)
          this.app.use("/api", recordatorioRoutes)
          this.app.use("/api", HistorialRoutes)
          this.app.use("/api", recordatorioDiaRoutes)
          // Siempre al final: rutas inexistentes y manejo centralizado de errores
          this.app.use(notFoundHandler)
          this.app.use(errorHandler)
     }
     getApp() {
          return this.app;
     }
}
export default new App().getApp();

