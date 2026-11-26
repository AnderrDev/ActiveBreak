import { Router } from "express";
import { BreakCategoryAdapter } from "../adapter/BreakCategoryAdapter.js";
import { ActiveBreakAdapter } from "../adapter/ActiveBreakAdapter.js";
import { BreakCategoryApplication } from "../../application/BreakCategoryApplication.js";
import { BreakCategoryController } from "../controller/BreakCategoryController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const controller = new BreakCategoryController(new BreakCategoryApplication(new BreakCategoryAdapter(), new ActiveBreakAdapter()));

router.post("/break-categories", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.createCategory(req, res); });
router.get("/break-categories", authenticateToken, async (req, res) => { await controller.getAllCategories(req, res); });
router.get("/break-categories/active", authenticateToken, async (req, res) => { await controller.getActiveCategories(req, res); });
router.get("/break-categories/:id", authenticateToken, async (req, res) => { await controller.getCategoryById(req, res); });
router.put("/break-categories/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.updateCategory(req, res); });
router.delete("/break-categories/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.deleteCategory(req, res); });

export default router;
