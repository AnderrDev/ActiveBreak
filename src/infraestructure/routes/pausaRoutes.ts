import { Router } from "express";
import { PausaActivaAdapter } from "../adapter/PausaActivaAdapter.js";
import { PausaActivaApplication } from "../../application/PausaActivaApplication.js";
import { PausaActivaController } from "../controller/PausaActivaController.js";
import { authenticateToken } from "../web/authMiddleware.js";

const router = Router();

// inicialización de capas
const pausaAdapter = new PausaActivaAdapter();
const pausaApp = new PausaActivaApplication(pausaAdapter);
const pausaController = new PausaActivaController(pausaApp);



router.post("/pausas-activas", (req, res) => {
    pausaController.createPausaActiva(req, res);
});


router.get("/pausas-activas", authenticateToken, (req, res) => {
    pausaController.getAllPausaActiva(req, res);
});


router.get("/pausas-activas/activas", authenticateToken, (req, res) => {
    pausaController.getActivasPausaActiva(req, res);
});


router.get("/pausas-activas/:id", authenticateToken, (req, res) => {
    pausaController.getByIdPausaActiva(req, res);
});


router.put("/pausas-activas/:id", (req, res) => {
    pausaController.updatePausaActiva(req, res);
});


router.delete("/pausas-activas/:id", (req, res) => {
    pausaController.deletePausaActiva(req, res);
});

export default router;