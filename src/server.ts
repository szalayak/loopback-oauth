import {LoopbackOauthApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import express from 'express';
import pEvent from 'p-event';
import http from 'http';
import app from './express/app';

export class ExpressServer {
  private app: express.Application;
  private lbApp: LoopbackOauthApplication;
  private server?: http.Server;

  constructor(options: ApplicationConfig = {}) {
    this.app = app;
    this.lbApp = new LoopbackOauthApplication(options);

    this.app.use('/api', this.lbApp.requestHandler);
  }

  async boot() {
    await this.lbApp.boot();
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port || 8080;
    const host = this.lbApp.restServer.config.host ?? '127.0.0.1';
    this.server = this.app.listen(port, host);
    await pEvent(this.server, 'listening');
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await pEvent(this.server, 'close');
    this.server = undefined;
  }
}
