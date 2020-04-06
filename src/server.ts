import { LoopbackOauthApplication } from "./application";
import { ApplicationConfig } from "@loopback/core";
import express from "express";
import { Request, Response } from "express";

export class ExpressServer {
  private app: express.Application;
  private lbApp: LoopbackOauthApplication;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new LoopbackOauthApplication(options);

    this.app.use('/api', this.lbApp.requestHandler);

    this.app.get('/hello', (_req: Request, res: Response) => {
      res.send('Hello world!');
    });

  }
}
