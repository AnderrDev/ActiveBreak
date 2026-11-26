// Express application: security middlewares, documentation, routes and error handling
import express from "express";
import helmet from "helmet";
import cors, { type CorsOptions } from "cors";
import swaggerUi from "swagger-ui-express";
import envs from "../config/environment-vars.js";
import { openapiSpec } from "../docs/openapi.js";
import { docsLimiter } from "./rateLimitMiddleware.js";
import { errorHandler, notFoundHandler } from "./errorMiddleware.js";
import userRoutes from "../routes/userRoutes.js";
import organizationRoutes from "../routes/organizationRoutes.js";
import breakCategoryRoutes from "../routes/breakCategoryRoutes.js";
import activeBreakRoutes from "../routes/activeBreakRoutes.js";
import reminderRoutes from "../routes/reminderRoutes.js";
import reminderDayRoutes from "../routes/reminderDayRoutes.js";
import activityHistoryRoutes from "../routes/activityHistoryRoutes.js";
import goalRoutes from "../routes/goalRoutes.js";

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
    }

    private middlewares(): void {
        // Needed so the rate limit uses the real client IP behind a reverse proxy
        this.app.set("trust proxy", envs.TRUST_PROXY);
        // HTTP security headers. Without "upgrade-insecure-requests": over plain http (local or Docker)
        // it would make the Swagger page load its files over https and show a blank page
        this.app.use(helmet({
            contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
        }));
        this.app.use(cors(this.corsOptions()));
        // Explicit limit for the JSON body
        this.app.use(express.json({ limit: "100kb" }));
    }

    // CORS: only the origins in CORS_ORIGINS. When empty, any origin is allowed in
    // development and none in production (only same-origin or non-browser clients).
    private corsOptions(): CorsOptions {
        const origins = envs.CORS_ORIGINS;
        return {
            origin: origins.length > 0 ? origins : envs.NODE_ENV === "development",
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
        };
    }

    private routes(): void {
        // Swagger documentation (public and read-only, with its own rate limit):
        // UI at /api/docs and specification at /api/docs.json. Disabled with API_DOCS_ENABLED=false
        if (envs.API_DOCS_ENABLED) {
            this.app.get("/api/docs.json", docsLimiter, (req, res) => { res.json(openapiSpec); });
            this.app.use("/api/docs", docsLimiter, swaggerUi.serve, swaggerUi.setup(openapiSpec, {
                customSiteTitle: "ActiveBreak API",
                swaggerOptions: {
                    persistAuthorization: true, // keeps the token after reloading the page
                    docExpansion: "none",       // tags start closed
                    tagsSorter: "alpha",        // numbered tags: 1. Authentication, 2. Users...
                    tryItOutEnabled: true,      // forms ready to "Execute"
                },
            }));
        }

        this.app.use("/api", userRoutes);
        this.app.use("/api", organizationRoutes);
        this.app.use("/api", breakCategoryRoutes);
        this.app.use("/api", activeBreakRoutes);
        this.app.use("/api", reminderRoutes);
        this.app.use("/api", reminderDayRoutes);
        this.app.use("/api", activityHistoryRoutes);
        this.app.use("/api", goalRoutes);

        // Always last: unknown routes and centralized error handling
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    getApp(): express.Application {
        return this.app;
    }
}

export default new App().getApp();
