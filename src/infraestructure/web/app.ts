import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "../docs/openapi.js";
import cors, { type CorsOptions } from "cors";
import envs from "../config/environment-vars.js";
import userRoutes from "../routes/userRoutes.js"
import pausaRoutes from "../routes/pausaRoutes.js";
import recordatorioRoutes from "../routes/recordatorioRoutes.js"
import HistorialRoutes from "../routes/HistorialRoutes.js"
import recordatorioDiaRoutes from "../routes/recordatorioDiaRoutes.js"
import categoriaRoutes from "../routes/categoriaRoutes.js"
import organizacionRoutes from "../routes/organizacionRoutes.js"
import metaRoutes from "../routes/metaRoutes.js"
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
          // Sin "upgrade-insecure-requests": en http (local o Docker) haría que la página de
          // Swagger intentara cargar sus archivos por https y se viera en blanco
          this.app.use(helmet({
               contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
          }))
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
          // Documentación Swagger: interfaz en /api/docs y especificación en /api/docs.json
          this.app.get("/api/docs.json", (req, res) => { res.json(openapiSpec) })
          this.app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, {
               customSiteTitle: "ActiveBreak API",
               swaggerOptions: {
                    persistAuthorization: true, // conserva el token al recargar la página
                    docExpansion: "none",        // etiquetas cerradas: se abre solo lo que se va a probar
                    tagsSorter: "alpha",         // etiquetas numeradas: 1. Autenticación, 2. Usuarios...
                    tryItOutEnabled: true,       // los formularios aparecen listos para "Execute"
               },
          }))
          this.app.use("/api", userRoutes)
          this.app.use("/api", pausaRoutes)
          this.app.use("/api", recordatorioRoutes)
          this.app.use("/api", HistorialRoutes)
          this.app.use("/api", recordatorioDiaRoutes)
          this.app.use("/api", categoriaRoutes)
          this.app.use("/api", organizacionRoutes)
          this.app.use("/api", metaRoutes)
          // Siempre al final: rutas inexistentes y manejo centralizado de errores
          this.app.use(notFoundHandler)
          this.app.use(errorHandler)
     }
     getApp() {
          return this.app;
     }
}
export default new App().getApp();

