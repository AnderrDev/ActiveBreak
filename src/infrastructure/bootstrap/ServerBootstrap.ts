// Starts the HTTP server
import express from "express";
import http from "http";
import envs from "../config/environment-vars.js";

export class ServerBootstrap {
    private app: express.Application;

    constructor(app: express.Application) {
        this.app = app;
    }

    initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const server = http.createServer(this.app);
            server.listen(envs.PORT)
                .on("listening", () => {
                    console.log(`Servidor ejecutándose en http://localhost:${envs.PORT}`);
                    resolve();
                })
                .on("error", (error) => {
                    console.error("No se pudo iniciar el servidor:", error);
                    reject(error);
                });
        });
    }
}
