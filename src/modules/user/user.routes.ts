import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  register,
  login,
  me,
  updateMe,
  changeMyPassword
} from "./user.controller.js";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);

// Authenticated
router.get("/me", auth(), me);
router.patch("/me", auth(), updateMe);
router.post("/me/change-password", auth(), changeMyPassword);

export default router;
