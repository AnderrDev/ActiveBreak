import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter.js";
import { UserApplication } from "../../application/UserApplication.js";
import { UserController } from "../controller/UserController.js";
import { authenticateToken, authorizeRoles } from "../web/authMiddleware.js";


const router = Router();
//inicializacion de las capas
const userAdapter = new UserAdapter();
const userApp = new UserApplication(userAdapter);
const userController = new UserController(userApp);

//definicion de rutas para usuarios
router.post("/login", (req, res) => {
    userController.login(req, res);
});

router.post("/users", (req, res) => {
    userController.createUser(req, res);
});

router.get("/users", authenticateToken, authorizeRoles("admin"), (req, res) => {
    userController.getAllUsers(req, res);
});

router.get("/users/active", authenticateToken, authorizeRoles("admin"), (req, res) => {
    userController.getActiveUsers(req, res);
});

router.get("/users/email/:email", authenticateToken, authorizeRoles("admin"), (req, res) => {
    userController.getUserByEmail(req, res);
});

router.get("/users/:id", authenticateToken, (req, res) => {
    userController.getUserById(req, res);
});

router.put("/users/:id", authenticateToken, (req, res) => {
    userController.updateUser(req, res);
});

router.delete("/users/:id", authenticateToken, (req, res) => {
    userController.deleteUser(req, res);
});

export default router; 