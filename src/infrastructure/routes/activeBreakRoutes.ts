import { Router } from "express";
import { ActiveBreakAdapter } from "../adapter/ActiveBreakAdapter.js";
import { BreakCategoryAdapter } from "../adapter/BreakCategoryAdapter.js";
import { ActiveBreakApplication } from "../../application/ActiveBreakApplication.js";
import { ActiveBreakController } from "../controller/ActiveBreakController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const controller = new ActiveBreakController(new ActiveBreakApplication(new ActiveBreakAdapter(), new BreakCategoryAdapter()));

router.post("/active-breaks", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.createBreak(req, res); });
router.get("/active-breaks", authenticateToken, async (req, res) => { await controller.getAllBreaks(req, res); });
router.get("/active-breaks/active", authenticateToken, async (req, res) => { await controller.getActiveBreaks(req, res); });
router.get("/active-breaks/:id", authenticateToken, async (req, res) => { await controller.getBreakById(req, res); });
router.put("/active-breaks/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.updateBreak(req, res); });
router.delete("/active-breaks/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.deleteBreak(req, res); });

export default router;
