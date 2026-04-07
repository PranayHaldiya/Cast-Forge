import { Router, type IRouter } from "express";
import healthRouter from "./health";
import castforgeRouter from "./castforge/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(castforgeRouter);

export default router;
