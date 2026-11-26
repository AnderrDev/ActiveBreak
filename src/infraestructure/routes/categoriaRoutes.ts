import { Router } from "express";
import { CategoriaPausaAdapter } from "../adapter/CategoriaPausaAdapter.js";
import { PausaActivaAdapter } from "../adapter/PausaActivaAdapter.js";
import { CategoriaPausaApplication } from "../../application/CategoriaPausaApplication.js";
import { CategoriaPausaController } from "../controller/CategoriaPausaController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

// inicialización de capas
const categoriaAdapter = new CategoriaPausaAdapter();
const pausaAdapter = new PausaActivaAdapter();
const categoriaApp = new CategoriaPausaApplication(categoriaAdapter, pausaAdapter);
const categoriaController = new CategoriaPausaController(categoriaApp);

router.post("/categorias-pausa", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await categoriaController.createCategoria(req, res);
});

router.get("/categorias-pausa", authenticateToken, async (req, res) => {
    await categoriaController.getAllCategorias(req, res);
});

router.get("/categorias-pausa/activas", authenticateToken, async (req, res) => {
    await categoriaController.getActiveCategorias(req, res);
});

router.get("/categorias-pausa/:id", authenticateToken, async (req, res) => {
    await categoriaController.getCategoriaById(req, res);
});

router.put("/categorias-pausa/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await categoriaController.updateCategoria(req, res);
});

router.delete("/categorias-pausa/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await categoriaController.deleteCategoria(req, res);
});

export default router;
