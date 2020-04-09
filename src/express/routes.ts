import {Application} from 'express';
import * as home from './controllers/home';
import {
  isBearerAuthenticated,
  isLocalAuthenticated,
  isJwtAuthenticated,
} from './auth';
import {authorization, decision, token} from './controllers/oauth2';

export default function routes(app: Application): void {
  /**
   * Primary app routes.
   */
  app.get('/', isJwtAuthenticated, home.index);
  app.get('/login', home.loginForm);
  app.post('/login', isLocalAuthenticated, home.login);
  app.post('/authenticate', isLocalAuthenticated, home.authenticate);
  app.get('/logout', isJwtAuthenticated, home.logout);
  app.post('/logout', isJwtAuthenticated, home.logout);
  app.get('/userinfo', isBearerAuthenticated, home.account);

  app.get('/oauth/authorize', authorization);
  app.post('/oauth/authorize/decision', decision);
  app.post('/oauth/token', token);
}
