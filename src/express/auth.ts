import passport from 'passport';
import {BasicStrategy} from 'passport-http';
import {Strategy as BearerStrategy} from 'passport-http-bearer';
import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy as ClientPasswordStrategy} from 'passport-oauth2-client-password';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import {LooseObject} from './types';
import {Application} from 'express';
import {Request, Response} from 'express';
import dotenv from 'dotenv';
import {DsDataSource} from '../datasources';
import * as dsConfig from '../datasources/ds.datasource.config.json';
import {
  UserController,
  ClientController,
  TokenController,
} from '../controllers';
import {
  UserRepository,
  ClientRepository,
  TokenRepository,
} from '../repositories';
import {HttpErrors} from '@loopback/rest';

dotenv.config();

const ds = new DsDataSource(dsConfig);

export const auth = (app: Application) => {
  // initialise express
  app.use(passport.initialize());

  /**
   * LocalStrategy
   *
   * This strategy is used to authenticate users based on a username and password.
   * Anytime a request is made to authorize an application, we must ensure that
   * a user is logged in before asking them to approve the request.
   */
  passport.use(
    'user-local',
    new LocalStrategy((username: string, password: string, done: Function) => {
      new UserController(new UserRepository(ds))
        .findByEmail(username)
        .then(user => {
          user
            .verifyPassword(password)
            .then(() => done(null, user))
            .catch(error => done(error));
        })
        .catch(error => done(error));
    }),
  );

  passport.use(
    'user-basic',
    new BasicStrategy((username: string, password: string, done: Function) => {
      new UserController(new UserRepository(ds))
        .findByEmail(username)
        .then(user => {
          user
            .verifyPassword(password)
            .then(() => done(null, user))
            .catch(error => done(error));
        })
        .catch(error => done(error));
    }),
  );

  // JWT Strategy

  // set up auth strategy
  const opts = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      (req: Request) => (req?.cookies ? req.cookies['jwt_token'] : null),
      ExtractJwt.fromAuthHeaderAsBearerToken,
    ]),
    secretOrKey: process.env.JWT_SECRET,
  };
  const jwtStrategy = new JwtStrategy(
    opts,
    (jwtPayload: LooseObject, done: Function) => {
      new UserController(new UserRepository(ds))
        .findById(jwtPayload.userId as string)
        .then(user => done(null, user))
        .catch(error => done(error));
    },
  );
  passport.use(jwtStrategy);

  // set up strategy for admin auth
  const adminStrategy = new JwtStrategy(
    opts,
    (jwtPayload: LooseObject, done: Function) => {
      new UserController(new UserRepository(ds))
        .findById(jwtPayload.userId as string)
        .then(user =>
          user.isAdmin
            ? done(null, user)
            : done(
                new HttpErrors.Unauthorized(
                  'You are not authorised to perform this action.',
                ),
              ),
        )
        .catch(error => done(error));
    },
  );
  passport.use('admin', adminStrategy);

  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients. They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens. The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate. Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header). While this approach is not recommended by
   * the specification, in practice it is quite common.
   */
  const verifyClient = (
    clientId: string,
    clientSecret: string,
    done: Function,
  ) => {
    new ClientController(new ClientRepository(ds))
      .findByClientId(clientId)
      .then(client => {
        client
          .verifySecret(clientSecret)
          .then(() => done(null, client))
          .catch(error => done(error));
      })
      .catch(error => done(error));
  };

  passport.use(new BasicStrategy(verifyClient));
  passport.use(new ClientPasswordStrategy(verifyClient));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate either users or clients based on an access token
   * (aka a bearer token). If a user, they must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use(
    new BearerStrategy((accessToken: string, done: Function) => {
      new TokenController(new TokenRepository(ds))
        .findByValue(accessToken)
        .then(token => {
          if (token.userId) {
            new UserController(new UserRepository(ds))
              .findById(token.userId)
              .then(user => done(null, user, {scope: '*'}))
              .catch(error => done(error));
          } else {
            new ClientController(new ClientRepository(ds))
              .findById(token.clientId)
              .then(client => done(null, client, {scope: '*'}))
              .catch(error => done(error));
          }
        })
        .catch(error => done(error));
    }),
  );

  passport.use(
    'bearer-admin',
    new BearerStrategy((accessToken: string, done: Function) => {
      new TokenController(new TokenRepository(ds))
        .findByValue(accessToken)
        .then(token => {
          if (token.userId) {
            new UserController(new UserRepository(ds))
              .findById(token.userId)
              .then(user => {
                if (user.isAdmin) {
                  done(null, user, {scope: '*'});
                } else {
                  done(
                    new HttpErrors.Unauthorized(
                      'You must be logged in as an administrator for this operation.',
                    ),
                  );
                }
              })
              .catch(error => done(error));
          } else {
            done(
              new HttpErrors.Unauthorized(
                'You must be logged in as an administrator for this operation.',
              ),
            );
          }
        })
        .catch(error => done(error));
    }),
  );
};

const redirectIfNotAuthenticated: Function = (
  strategies: string | string[],
) => {
  return (req: Request, res: Response, next: Function) => {
    passport.authenticate(strategies, {session: false}, (err, user) => {
      if (user) {
        req.logIn(user, {session: false}, e => {
          if (e) return next(e);
          next();
        });
      } else {
        res.redirect(
          `/login?redirectUri=${encodeURIComponent(req.originalUrl)}`,
        );
      }
    })(req, res, next);
  };
};

export const isAdminAuthenticated = passport.authenticate(
  ['admin', 'bearer-admin'],
  {session: false},
);
export const isAuthenticated = redirectIfNotAuthenticated(['jwt, bearer']);
export const isJwtAuthenticated = redirectIfNotAuthenticated(['jwt']);
export const isBearerAuthenticated = redirectIfNotAuthenticated('bearer');

export const isLocalAuthenticated = (
  req: Request,
  res: Response,
  next: Function,
) => {
  passport.authenticate(['jwt', 'bearer'], {session: false}, (err, user) => {
    if (user) {
      req.logIn(user, {session: false}, e => {
        if (e) return next(err);
        next();
      });
    } else {
      passport.authenticate(
        ['user-local', 'user-basic'],
        {session: false},
        (e, localUser) => {
          if (localUser) {
            req.logIn(localUser, {session: false}, e2 => {
              if (e2) return next(e2);
              next();
            });
          } else {
            const redirectUri = req.body.redirectUri || req.originalUrl;
            res.redirect(
              `/login?redirectUri=${encodeURIComponent(
                redirectUri,
              )}&loginFailed=true`,
            );
          }
        },
      )(req, res, next);
    }
  })(req, res, next);
};
