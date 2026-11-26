import { Router } from "express";
import { ReminderDayAdapter } from "../adapter/ReminderDayAdapter.js";
import { ReminderAdapter } from "../adapter/ReminderAdapter.js";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { ReminderDayApplication } from "../../application/ReminderDayApplication.js";
import { ReminderApplication } from "../../application/ReminderApplication.js";
import { ReminderDayController } from "../controller/ReminderDayController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";

const router = Router();

// The reminders service is needed to check who owns the reminder
const controller = new ReminderDayController(
    new ReminderDayApplication(new ReminderDayAdapter()),
    new ReminderApplication(new ReminderAdapter(), new UserAdapter())
);

router.post("/reminder-days", authenticateToken, async (req, res) => { await controller.createReminderDays(req, res); });
router.get("/reminder-days", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getAllReminderDays(req, res); });
router.get("/reminder-days/reminder/:reminderId", authenticateToken, async (req, res) => { await controller.getDaysByReminderId(req, res); });
router.get("/reminder-days/:id", authenticateToken, async (req, res) => { await controller.getReminderDayById(req, res); });
router.delete("/reminder-days/:id", authenticateToken, async (req, res) => { await controller.deleteReminderDay(req, res); });

export default router;
