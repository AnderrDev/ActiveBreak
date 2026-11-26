import { Router } from "express";
import { ReminderAdapter } from "../adapter/ReminderAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { ReminderApplication } from "../../application/ReminderApplication.js";
import { ReminderController } from "../controller/ReminderController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

const controller = new ReminderController(new ReminderApplication(new ReminderAdapter(), new UserAdapter()));

router.post("/reminders", authenticateToken, async (req, res) => { await controller.createReminder(req, res); });
router.get("/reminders", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getAllReminders(req, res); });
router.get("/reminders/active", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getActiveReminders(req, res); });
router.get("/reminders/user/:userId", authenticateToken, async (req, res) => { await controller.getRemindersByUserId(req, res); });
router.get("/reminders/:id", authenticateToken, async (req, res) => { await controller.getReminderById(req, res); });
router.put("/reminders/:id", authenticateToken, async (req, res) => { await controller.updateReminder(req, res); });
router.delete("/reminders/:id", authenticateToken, async (req, res) => { await controller.deleteReminder(req, res); });

export default router;
