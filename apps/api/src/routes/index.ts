import { Router, type IRouter } from "express";
import healthRouter from "./health";
import websitesRouter from "./websites";
import scansRouter from "./scans";
import monitoringRouter from "./monitoring";
import alertsRouter from "./alerts";
import reportsRouter from "./reports";
import policiesRouter from "./policies";
import dashboardRouter from "./dashboard";
import teamRouter from "./team";
import developerRouter from "./developer";
import auditLogsRouter from "./auditLogs";
import organizationsRouter from "./organizations";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/websites", websitesRouter);
router.use("/", scansRouter);
router.use("/", monitoringRouter);
router.use("/alerts", alertsRouter);
router.use("/reports", reportsRouter);
router.use("/policies", policiesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/team", teamRouter);
router.use("/developer", developerRouter);
router.use("/audit-logs", auditLogsRouter);
router.use("/", organizationsRouter);

export default router;
