import { Router, type IRouter } from "express";
import episodesRouter from "./episodes.js";
import voicesRouter from "./voices.js";
import generateRouter from "./generate.js";
import presetsRouter from "./presets.js";
import fetchUrlRouter from "./fetch-url.js";

const router: IRouter = Router();

router.use(episodesRouter);
router.use(voicesRouter);
router.use(generateRouter);
router.use(presetsRouter);
router.use(fetchUrlRouter);

export default router;
