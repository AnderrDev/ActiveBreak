import { Router } from "express";
import { OrganizacionAdapter } from "../adapter/OrganizacionAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { OrganizacionApplication } from "../../application/OrganizacionApplication.js";
import { OrganizacionController } from "../controller/OrganizacionController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

// inicialización de capas
const organizacionAdapter = new OrganizacionAdapter();
const userAdapter = new UserAdapter();
const organizacionApp = new OrganizacionApplication(organizacionAdapter, userAdapter);
const organizacionController = new OrganizacionController(organizacionApp);

// Las organizaciones solo las gestiona el administrador
router.post("/organizaciones", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await organizacionController.createOrganizacion(req, res);
});

router.get("/organizaciones", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await organizacionController.getAllOrganizaciones(req, res);
});

router.get("/organizaciones/activas", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await organizacionController.getActiveOrganizaciones(req, res);
});

router.get("/organizaciones/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await organizacionController.getOrganizacionById(req, res);
});

router.put("/organizaciones/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await organizacionController.updateOrganizacion(req, res);
});

router.delete("/organizaciones/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await organizacionController.deleteOrganizacion(req, res);
});

export default router;
