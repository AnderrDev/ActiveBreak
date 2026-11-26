import { Router } from "express";
import { OrganizationAdapter } from "../adapter/OrganizationAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { OrganizationApplication } from "../../application/OrganizationApplication.js";
import { OrganizationController } from "../controller/OrganizationController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const controller = new OrganizationController(new OrganizationApplication(new OrganizationAdapter(), new UserAdapter()));

// Organizations are managed by admins only
const adminOnly = [authenticateToken, authorizeRoles("admin")];

router.post("/organizations", ...adminOnly, async (req, res) => { await controller.createOrganization(req, res); });
router.get("/organizations", ...adminOnly, async (req, res) => { await controller.getAllOrganizations(req, res); });
router.get("/organizations/active", ...adminOnly, async (req, res) => { await controller.getActiveOrganizations(req, res); });
router.get("/organizations/:id", ...adminOnly, async (req, res) => { await controller.getOrganizationById(req, res); });
router.put("/organizations/:id", ...adminOnly, async (req, res) => { await controller.updateOrganization(req, res); });
router.delete("/organizations/:id", ...adminOnly, async (req, res) => { await controller.deleteOrganization(req, res); });

export default router;
