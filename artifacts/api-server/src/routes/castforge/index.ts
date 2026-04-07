import { Router, type IRouter } from "express";
import episodesRouter from "./episodes.js";
import voicesRouter from "./voices.js";
import generateRouter from "./generate.js";
import presetsRouter from "./presets.js";

const router: IRouter = Router();

router.use(episodesRouter);
router.use(voicesRouter);
router.use(generateRouter);
router.use(presetsRouter);

export default router;
