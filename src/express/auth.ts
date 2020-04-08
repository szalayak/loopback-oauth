import passport from "passport";
import { BasicStrategy } from "passport-http";
import { Strategy as BearerStrategy } from "passport-http-bearer";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as ClientPasswordStrategy } from "passport-oauth2-client-password";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { User, UserResult } from "./db/models/User";
import { Client, ClientResult } from "./db/models/Client";
import { Token } from "./db/models/Token";
import { LooseObject } from "./types";
import { ErrorCodes } from "./errors";
import { Application } from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

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
  passport.use("user-local", new LocalStrategy(async (username: string, password: string, done: Function) => {
    const result = await User.findOne({ where: { email: username } });
    const authenticated = result ? await result.verifyPassword(password) : false;
    return done(null, authenticated ? new UserResult(result) : false);
  }));

  passport.use("user-basic", new BasicStrategy(async (username: string, password: string, done: Function) => {
    const result = await User.findOne({ where: { email: username } });
    const authenticated = result ? await result.verifyPassword(password) : false;
    return done(null, authenticated ? new UserResult(result) : false);
  }));

  // JWT Strategy

  // set up auth strategy
  const opts = {
    jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies ? req.cookies["jwt_token"] : null, ExtractJwt.fromAuthHeaderAsBearerToken]),
    secretOrKey: process.env.JWT_SECRET
  };
  const jwtStrategy = new JwtStrategy(opts, async (jwtPayload: LooseObject, done: Function) => {
    const result = jwtPayload.userToken ? await User.findByPk(jwtPayload.userId as string) : undefined;
    return done(null, result ? new UserResult(result) : false);
  });
  passport.use(jwtStrategy);

  // set up strategy for admin auth
  const adminStrategy = new JwtStrategy(opts, async (jwtPayload: LooseObject, done: Function) => {
    const result = jwtPayload.userToken ? await User.findByPk(jwtPayload.userId as string) : undefined;
    return done(null, result?.isAdmin ? new UserResult(result) : false);
  });
  passport.use("admin", adminStrategy);

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
  const verifyClient = async (clientId: string, clientSecret: string, done: Function) => {
    const client = await Client.findOne({ where: { clientId: clientId } });
    const error = client ? await client.verifySecret(clientSecret) ? undefined : {} : { code: ErrorCodes.ClientNotFound, message: `Client ${clientId} does not exist.` };
    return done(error, client ? new ClientResult(client) : null);
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
  passport.use(new BearerStrategy(
    async (accessToken: string, done: Function) => {
      const token = await Token.findOne({ where: { value: accessToken } });
      if (token) {
        if (token.userId) {
          const user = await User.findByPk(token.userId);
          if (user) {
            done(null, new UserResult(user), { scope: "*" });
          } else {
            done({ code: ErrorCodes.UserNotFound, message: "User does not exist." });
          }
        } else {
          const client = await Client.findByPk(token.clientId);
          if (client) {
            done(null, new ClientResult(client), { scope: "*" });
          } else {
            done({ code: ErrorCodes.ClientNotFound, message: "Client does not exist." });
          }
        }
      } else {
        done({ code: ErrorCodes.InvalidToken, message: "Token invalid." });
      }
    }
  ));

  passport.use("bearer-admin", new BearerStrategy(
    async (accessToken: string, done: Function) => {
      const token = await Token.findOne({ where: { value: accessToken } });
      if (token) {
        if (token.userId) {
          const user = await User.findByPk(token.userId);
          if (user) {
            if (user.isAdmin) {
              done(null, new UserResult(user), { scope: "*" });
            } else {
              done({ code: ErrorCodes.UserNotAdmin, message: "You must be logged in as an administrator for this operation." });
            }
          } else {
            done({ code: ErrorCodes.UserNotFound, message: "User does not exist." });
          }
        } else {
          done({ code: ErrorCodes.UserNotAdmin, message: "You must be logged in as an administrator for this operation." });
        }
      } else {
        done({ code: ErrorCodes.InvalidToken, message: "Token invalid." });
      }
    }
  ));

};

const redirectIfNotAuthenticated: Function = (strategies: string | string[]) => {
  return ((req: Request, res: Response, next: Function) => {
    passport.authenticate(strategies, { session: false }, (err, user) => {
      if (user) {
        req.logIn(user, { session: false }, (err) => {
          if (err)
            return next(err);
          next();
        });
      } else {
        res.redirect(`/login?redirectUri=${encodeURIComponent(req.originalUrl)}`);
      }
    })(req, res, next);
  });
};

export const isAdminAuthenticated = passport.authenticate(["admin", "bearer-admin"], { session: false });
export const isAuthenticated = redirectIfNotAuthenticated(["jwt, bearer"]);
export const isJwtAuthenticated = redirectIfNotAuthenticated(["jwt"]);
export const isBearerAuthenticated = redirectIfNotAuthenticated("bearer");


export const isLocalAuthenticated = (req: Request, res: Response, next: Function) => {
  passport.authenticate(["jwt", "bearer"], { session: false }, (err, user) => {
    if (user) {
      req.logIn(user, { session: false }, (err) => {
        if (err)
          return next(err);
        next();
      });
    } else {
      passport.authenticate(["user-local", "user-basic"], { session: false }, (err, user) => {
        if (user) {
          req.logIn(user, { session: false }, (err) => {
            if (err)
              return next(err);
            next();
          });
        } else {
          const redirectUri = req.body.redirectUri || req.originalUrl;
          res.redirect(`/login?redirectUri=${encodeURIComponent(redirectUri)}&loginFailed=true`);
        }
      })(req, res, next);
    }
  })(req, res, next);
};
