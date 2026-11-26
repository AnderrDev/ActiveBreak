import { Router } from "express";
import { GoalAdapter } from "../adapter/GoalAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { ActivityHistoryAdapter } from "../adapter/ActivityHistoryAdapter.js";
import { GoalApplication } from "../../application/GoalApplication.js";
import { GoalController } from "../controller/GoalController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const controller = new GoalController(new GoalApplication(new GoalAdapter(), new UserAdapter(), new ActivityHistoryAdapter()));

router.post("/goals", authenticateToken, async (req, res) => { await controller.createGoal(req, res); });
router.get("/goals", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getAllGoals(req, res); });
router.get("/goals/user/:userId", authenticateToken, async (req, res) => { await controller.getGoalsByUserId(req, res); });
router.get("/goals/:id", authenticateToken, async (req, res) => { await controller.getGoalById(req, res); });
router.put("/goals/:id", authenticateToken, async (req, res) => { await controller.updateGoal(req, res); });
router.delete("/goals/:id", authenticateToken, async (req, res) => { await controller.deleteGoal(req, res); });

export default router;
