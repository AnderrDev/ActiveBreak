import { Router } from "express";
import { RecordatorioAdapter } from "../adapter/RecordatorioAdapter.js";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { RecordatorioController } from "../controller/RecordatorioController.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const recordatorioAdapter = new RecordatorioAdapter();
const userAdapter = new UserAdapter();

const recordatorioApp = new RecordatorioApplication(
    recordatorioAdapter,
    userAdapter
);

const recordatorioController = new RecordatorioController(recordatorioApp);


router.post("/recordatorios", authenticateToken, async (req, res) => {
    await recordatorioController.createRecordatorio(req, res);
});


router.get("/recordatorios", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await recordatorioController.getAllRecordatorios(req, res);
});


router.get("/recordatorios/active", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await recordatorioController.getActiveRecordatorios(req, res);
});


router.get("/recordatorios/:id", authenticateToken, async (req, res) => {
    await recordatorioController.getRecordatorioById(req, res);
});


router.get("/recordatorios/user/:userId", authenticateToken, async (req, res) => {
    await recordatorioController.getRecordatoriosByUsuarioId(req, res);
});


router.put("/recordatorios/:id", authenticateToken, async (req, res) => {
    await recordatorioController.updateRecordatorio(req, res);
});


router.delete("/recordatorios/:id", authenticateToken, async (req, res) => {
    await recordatorioController.deleteRecordatorio(req, res);
});

export default router;