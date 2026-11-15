import express from "express";
import http from "http";
import envs from '../config/environment-vars.js';

/*CREAR CLASE
1.Recordar nombres de clase con mayuscula 
2.se agrega export al inicio para modularizar y usar en otros archivos.
*/
export class serverBootstrap {
    //ATRIBUTOS DE LA CLASE
    private app: express.Application;

    //METODO CONSTRUCTOR PARA INICIALIZAR LA APLICACION DE EXPRESS
    constructor(app: express.Application) {
        this.app = app;
    }

    //METODOS
    initialize(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const server = http.createServer(this.app);
            const PORT = Number(envs.PORT ?? 4000);
            server.listen(PORT)
                .on("listening", () => {
                    console.log(`Server running at http://localhost:${PORT}`);
                    resolve(true);
                })

                .on("error", (err) => {
                    console.log(`se ha generado un error: ${err}`);
                    reject(err);
                })
        });
    };
}
