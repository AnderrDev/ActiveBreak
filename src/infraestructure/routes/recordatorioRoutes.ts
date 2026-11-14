import { Router } from "express";
import { RecordatorioAdapter } from "../adapter/RecordatorioAdapter.js";
import { RecordatorioApplication } from "../../application/RecordatorioApplication.js";
import { RecordatorioController } from "../controller/RecordatorioController.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { authenticateToken } from "../web/authMiddleware.js";

const router = Router();

const recordatorioAdapter = new RecordatorioAdapter();
const userAdapter = new UserAdapter();

const recordatorioApp = new RecordatorioApplication(
    recordatorioAdapter,
    userAdapter
);

const recordatorioController = new RecordatorioController(recordatorioApp);


router.post("/recordatorios", authenticateToken, (req, res) => {
    recordatorioController.createRecordatorio(req, res);
});


router.get("/recordatorios", authenticateToken, (req, res) => {
    recordatorioController.getAllRecordatorios(req, res);
});


router.get("/recordatorios/active", authenticateToken, (req, res) => {
    recordatorioController.getActiveRecordatorios(req, res);
});


router.get("/recordatorios/:id", authenticateToken, (req, res) => {
    recordatorioController.getRecordatorioById(req, res);
});


router.get("/recordatorios/user/:userId", authenticateToken, (req, res) => {
    recordatorioController.getRecordatoriosByUsuarioId(req, res);
});


router.put("/recordatorios/:id", authenticateToken, (req, res) => {
    recordatorioController.updateRecordatorio(req, res);
});


router.delete("/recordatorios/:id", authenticateToken, (req, res) => {
    recordatorioController.deleteRecordatorio(req, res);
});

export default router;