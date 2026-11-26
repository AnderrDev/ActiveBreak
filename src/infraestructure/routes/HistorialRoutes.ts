import { Router } from "express";
import { HistorialAdapter } from "../adapter/HistorialAdapter.js";
import { HistorialApplication } from "../../application/HistorialApplication.js";
import { HistorialController } from "../controller/HistorialController.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { PausaActivaAdapter } from "../adapter/PausaActivaAdapter.js";
import { MetaAdapter } from "../adapter/MetaAdapter.js";
import { MetaApplication } from "../../application/MetaApplication.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

// inicialización de capas
const historialAdapter = new HistorialAdapter();
const userAdapter = new UserAdapter();
const pausaAdapter = new PausaActivaAdapter();

// El historial recalcula las metas del usuario cada vez que cambia
const metaApp = new MetaApplication(new MetaAdapter(), userAdapter, historialAdapter);

const historialApp = new HistorialApplication(
    historialAdapter,
    userAdapter,
    pausaAdapter,
    metaApp
);

const historialController = new HistorialController(historialApp);

router.post("/historial", authenticateToken, async (req, res) => {
    await historialController.createHistorial(req, res);
});

router.get("/historial", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await historialController.getAllHistorial(req, res);
});

router.get("/historial/usuario/:usuarioId", authenticateToken, async (req, res) => {
    await historialController.getHistorialByUsuarioId(req, res);
});

router.get("/historial/pausa/:pausaId", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await historialController.getHistorialByPausaId(req, res);
});

router.get("/historial/:id", authenticateToken, async (req, res) => {
    await historialController.getHistorialById(req, res);
});

router.delete("/historial/:id", authenticateToken, async (req, res) => {
    await historialController.deleteHistorial(req, res);
});

export default router;