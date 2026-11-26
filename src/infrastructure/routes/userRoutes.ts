import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { OrganizationAdapter } from "../adapter/OrganizationAdapter.js";
import { UserApplication } from "../../application/UserApplication.js";
import { UserController } from "../controller/UserController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";
import { loginLimiter, registerLimiter } from "../web/rateLimitMiddleware.js";

const router = Router();

// Layer wiring: Adapter -> Application -> Controller
const controller = new UserController(new UserApplication(new UserAdapter(), new OrganizationAdapter()));

// Public routes (with rate limit)
router.post("/login", loginLimiter, async (req, res) => { await controller.login(req, res); });
router.post("/users", registerLimiter, async (req, res) => { await controller.createUser(req, res); });

router.get("/users", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getAllUsers(req, res); });
router.get("/users/active", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getActiveUsers(req, res); });
router.get("/users/email/:email", authenticateToken, authorizeRoles("admin"), async (req, res) => { await controller.getUserByEmail(req, res); });
router.get("/users/:id", authenticateToken, async (req, res) => { await controller.getUserById(req, res); });
router.put("/users/:id", authenticateToken, async (req, res) => { await controller.updateUser(req, res); });
router.delete("/users/:id", authenticateToken, async (req, res) => { await controller.deleteUser(req, res); });

export default router;
