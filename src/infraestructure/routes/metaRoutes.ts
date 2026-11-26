import { Router } from "express";
import { MetaAdapter } from "../adapter/MetaAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { HistorialAdapter } from "../adapter/HistorialAdapter.js";
import { MetaApplication } from "../../application/MetaApplication.js";
import { MetaController } from "../controller/MetaController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

// inicialización de capas
const metaApp = new MetaApplication(new MetaAdapter(), new UserAdapter(), new HistorialAdapter());
const metaController = new MetaController(metaApp);

router.post("/metas", authenticateToken, async (req, res) => {
    await metaController.createMeta(req, res);
});

router.get("/metas", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await metaController.getAllMetas(req, res);
});

router.get("/metas/usuario/:usuarioId", authenticateToken, async (req, res) => {
    await metaController.getMetasByUsuarioId(req, res);
});

router.get("/metas/:id", authenticateToken, async (req, res) => {
    await metaController.getMetaById(req, res);
});

router.put("/metas/:id", authenticateToken, async (req, res) => {
    await metaController.updateMeta(req, res);
});

router.delete("/metas/:id", authenticateToken, async (req, res) => {
    await metaController.deleteMeta(req, res);
});

export default router;
