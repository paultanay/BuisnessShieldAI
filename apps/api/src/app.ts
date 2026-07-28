import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middlewares/securityHeaders";
import { auditMiddleware } from "./middlewares/auditMiddleware";
import { apiKeyAuth } from "./middlewares/apiKeyAuth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(securityHeaders);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auditMiddleware);

app.use(clerkMiddleware());

app.use("/api", apiKeyAuth);
app.use("/api", router);

export default app;
