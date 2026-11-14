import express, { type Request, type Response } from "express";
import userRoutes from "../routes/userRoutes.js"
import pausaRoutes from "../routes/pausaRoutes.js";
import recordatorioRoutes from "../routes/recordatorioRoutes.js"
import HistorialRoutes from "../routes/HistorialRoutes.js"
import recordatorioDiaRoutes from "../routes/recordatorioDiaRoutes.js"

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
          this.app.use(express.json())
     }

     private routes(): void {
          this.app.use("/api", userRoutes)
          this.app.use("/api", pausaRoutes)
          this.app.use("/api", recordatorioRoutes)
          this.app.use("/api", HistorialRoutes)
          this.app.use("/api", recordatorioDiaRoutes)
     }
     getApp() {
          return this.app;
     }
}
export default new App().getApp();

