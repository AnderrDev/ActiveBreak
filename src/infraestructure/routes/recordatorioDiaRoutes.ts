import { Router } from "express";
import { RecordatorioDiaAdapter } from "../adapter/RecordatorioDiaAdapter.js";
import { RecordatorioDiaApplication } from "../../application/RecordatorioDiaApplication.js";
import { RecordatorioDiaController } from "../controller/RecordatorioDiaController.js";
import { authenticateToken } from "../web/authMiddleware.js";

const router = Router();

const recordatorioDiaAdapter = new RecordatorioDiaAdapter();

const recordatorioDiaApp = new RecordatorioDiaApplication(
    recordatorioDiaAdapter
);

const recordatorioDiaController = new RecordatorioDiaController(
    recordatorioDiaApp
);

router.post("/recordatorio-dia", authenticateToken, (req, res) => {
    recordatorioDiaController.createRecordatorioDia(req, res);
});

router.get("/recordatorio-dia", authenticateToken, (req, res) => {
    recordatorioDiaController.getAll(req, res);
});

router.get("/recordatorio-dia/:id", authenticateToken, (req, res) => {
    recordatorioDiaController.getById(req, res);
});

router.get("/recordatorio-dia/recordatorio/:recordatorioId", authenticateToken, (req, res) => {
    recordatorioDiaController.getByRecordatorioId(req, res);
});

router.delete("/recordatorio-dia/:id", authenticateToken, (req, res) => {
    recordatorioDiaController.delete(req, res);
});

export default router;