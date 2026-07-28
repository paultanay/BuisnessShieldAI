import { Router } from "express";
import { getAuthContext } from "../lib/auth";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
