import {Request, Response, RequestHandler} from 'express';
import moment from 'moment';
import * as jwt from 'jsonwebtoken';
import {User} from '../../models/user.model';
import passport from 'passport';

/**
 * GET /
 * Home page
 */
export const index: RequestHandler = (_req: Request, res: Response) => {
  res.render('index', {title: 'oAuth2', datetime: moment().format('LLL')});
};

/**
 * GET /login
 * Sign In Form
 */
export const loginForm = (req: Request, res: Response, next: Function) => {
  passport.authenticate(['jwt'], {session: false}, (err, user) => {
    if (user) {
      res.redirect(req.originalUrl === req.url ? '/' : req.originalUrl);
    } else {
      res.render('login', {
        title: 'Sign In',
        redirectUri: req.query.redirectUri,
      });
    }
  })(req, res, next);
};

/**
 * POST /login
 * Sign In
 */

const createJwtToken = (req: Request, res: Response): string => {
  const expiration =
    process.env.NODE_ENV === 'production' ? 604800000 : 3600000;
  const token = jwt.sign(
    {userId: (req.user as User).id, userToken: true},
    process.env.JWT_SECRET ?? '',
    {expiresIn: process.env.NODE_ENV === 'production' ? '7d' : '1d'},
  );
  res.cookie('jwt_token', token, {
    expires: new Date(Date.now() + expiration),
    path: '/',
    secure: false,
    httpOnly: true,
  });
  return token;
};

export const login = (req: Request, res: Response) => {
  createJwtToken(req, res);
  res.redirect(decodeURIComponent(req.body.redirectUri) || '/');
};

export const authenticate = (req: Request, res: Response) => {
  const jwtToken = createJwtToken(req, res);
  res.json({userId: (req.user as User).id, jwtToken});
};

/**
 * POST /logout, GET /logout
 * Sign Out
 */
export const logout = (req: Request, res: Response) => {
  req.logout();
  res.cookie('jwt_token', null, {
    expires: new Date(Date.now()),
    path: '',
    secure: false,
    httpOnly: true,
  });
  res.render('logout', {title: 'Signed Out'});
};

/**
 * GET /account
 */
export const account = (req: Request, res: Response) => {
  res.json({user: req.user, authInfo: req.authInfo});
};
