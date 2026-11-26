import { Router } from "express";
import { ActivityHistoryAdapter } from "../adapter/ActivityHistoryAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { ActiveBreakAdapter } from "../adapter/ActiveBreakAdapter.js";
import { GoalAdapter } from "../adapter/GoalAdapter.js";
import { ActivityHistoryApplication } from "../../application/ActivityHistoryApplication.js";
import { GoalApplication } from "../../application/GoalApplication.js";
import { ActivityHistoryController } from "../controller/ActivityHistoryController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const historyAdapter = new ActivityHistoryAdapter();
const userAdapter = new UserAdapter();

// The history recalculates the goals of the user every time it changes
const goals = new GoalApplication(new GoalAdapter(), userAdapter, historyAdapter);
const controller = new ActivityHistoryController(
    new ActivityHistoryApplication(historyAdapter, userAdapter, new ActiveBreakAdapter(), goals)
);

router.post("/activity-history", authenticateToken, async (req, res) => { await controller.createRecord(req, res); });
router.get("/activity-history", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getAllRecords(req, res); });
router.get("/activity-history/user/:userId", authenticateToken, async (req, res) => { await controller.getRecordsByUserId(req, res); });
router.get("/activity-history/break/:breakId", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getRecordsByBreakId(req, res); });
router.get("/activity-history/:id", authenticateToken, async (req, res) => { await controller.getRecordById(req, res); });
router.delete("/activity-history/:id", authenticateToken, async (req, res) => { await controller.deleteRecord(req, res); });

export default router;
