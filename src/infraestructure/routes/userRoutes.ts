import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { UserApplication } from "../../application/UserApplication.js";
import { UserController } from "../controller/UserController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";
import { loginLimiter, registerLimiter } from "../web/rateLimitMiddleware.js";


const router = Router();
//inicializacion de las capas
const userAdapter = new UserAdapter();
const userApp = new UserApplication(userAdapter);
const userController = new UserController(userApp);

//definicion de rutas para usuarios
router.post("/login", loginLimiter, async (req, res) => {
    await userController.login(req, res);
});

router.post("/users", registerLimiter, async (req, res) => {
    await userController.createUser(req, res);
});

router.get("/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await userController.getAllUsers(req, res);
});

router.get("/users/active", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await userController.getActiveUsers(req, res);
});

router.get("/users/email/:email", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    await userController.getUserByEmail(req, res);
});

router.get("/users/:id", authenticateToken, async (req, res) => {
    await userController.getUserById(req, res);
});

router.put("/users/:id", authenticateToken, async (req, res) => {
    await userController.updateUser(req, res);
});

router.delete("/users/:id", authenticateToken, async (req, res) => {
    await userController.deleteUser(req, res);
});

export default router; 