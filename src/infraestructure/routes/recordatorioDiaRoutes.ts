import { Router } from "express";
import { RecordatorioDiaAdapter } from "../adapter/RecordatorioDiaAdapter.js";
import { RecordatorioDiaApplication } from "../../application/RecordatorioDiaApplication.js";
import { RecordatorioDiaController } from "../controller/RecordatorioDiaController.js";
import { RecordatorioAdapter } from "../adapter/RecordatorioAdapter.js";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const recordatorioDiaAdapter = new RecordatorioDiaAdapter();

const recordatorioDiaApp = new RecordatorioDiaApplication(
    recordatorioDiaAdapter
);

// necesario para comprobar a qué usuario pertenece el recordatorio
const recordatorioApp = new RecordatorioApplication(
    new RecordatorioAdapter(),
    new UserAdapter()
);

const recordatorioDiaController = new RecordatorioDiaController(
    recordatorioDiaApp,
    recordatorioApp
);

router.post("/recordatorio-dia", authenticateToken, async (req, res) => {
    await recordatorioDiaController.createRecordatorioDia(req, res);
});

router.get("/recordatorio-dia", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await recordatorioDiaController.getAll(req, res);
});

router.get("/recordatorio-dia/:id", authenticateToken, async (req, res) => {
    await recordatorioDiaController.getById(req, res);
});

router.get("/recordatorio-dia/recordatorio/:recordatorioId", authenticateToken, async (req, res) => {
    await recordatorioDiaController.getByRecordatorioId(req, res);
});

router.delete("/recordatorio-dia/:id", authenticateToken, async (req, res) => {
    await recordatorioDiaController.delete(req, res);
});

export default router;