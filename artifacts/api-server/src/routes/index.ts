import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import castforgeRouter from "./castforge/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(castforgeRouter);

export default router;
