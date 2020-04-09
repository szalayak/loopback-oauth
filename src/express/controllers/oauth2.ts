import oauth2orize from 'oauth2orize';
import passport from 'passport';
import {LooseObject} from '../types';
import {DsDataSource} from '../../datasources';
import * as dsConfig from '../../datasources/ds.datasource.config.json';
import {v4 as uuidv4} from 'uuid';
import {Code} from '../../models/code.model';
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {Request, Response} from 'express';
import {isJwtAuthenticated} from '../auth';
import {ClientController} from '../../controllers/client.controller';
import {ClientRepository} from '../../repositories/client.repository';
import {Token} from '../../models/token.model';
import {
  TokenController,
  CodeController,
  UserController,
} from '../../controllers';
import {
  TokenRepository,
  CodeRepository,
  UserRepository,
} from '../../repositories';
import {HttpErrors} from '@loopback/rest';

// read env config
dotenv.config();

interface AuthRequest extends Request {
  oauth2: LooseObject;
}

const findClientById = async (id: string) => {
  const ctrl = new ClientController(new ClientRepository(ds));
  return ctrl.findById(id);
};

const ds = new DsDataSource(dsConfig);

const oauth2 = () => {
  // Create OAuth 2.0 server
  const server = oauth2orize.createServer();

  // Register serialization and deserialization functions.
  //
  // When a client redirects a user to user authorization endpoint, an
  // authorization transaction is initiated. To complete the transaction, the
  // user must authenticate and approve the authorization request. Because this
  // may involve multiple HTTP request/response exchanges, the transaction is
  // stored in the session.
  //
  // An application must supply serialization functions, which determine how the
  // client object is serialized into the session. Typically this will be a
  // simple matter of serializing the client's ID, and deserializing by finding
  // the client by ID from the database.
  server.serializeClient((client: LooseObject, done: Function) =>
    done(null, client.id),
  );

  server.deserializeClient((id: string, done: Function) => {
    findClientById(id)
      .then(client => {
        done(null, client);
      })
      .catch(error => {
        done(error, null);
      });
  });

  // create the token
  const createToken = async (
    userId: string | undefined,
    clientId: string | undefined,
  ): Promise<Token> => {
    const ctrl = new TokenController(new TokenRepository(ds));
    const uuid = uuidv4();
    const value: string = jwt.sign(
      {uuid, clientId, userId},
      process.env.JWT_SECRET ?? '',
      {expiresIn: '7d'},
    );
    const token = await ctrl.create(
      new Token({
        clientId,
        userId,
        value,
      }),
    );
    return token;
  };

  // Register supported grant types.
  //
  // OAuth 2.0 specifies a framework that allows users to grant client
  // applications limited access to their protected resources. It does this
  // through a process of the user granting access, and the client exchanging
  // the grant for an access token.

  // Grant authorization codes. The callback takes the `client` requesting
  // authorization, the `redirectUri` (which is used as a verifier in the
  // subsequent exchange), the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application. The application issues a code, which is bound to these
  // values, and will be exchanged for an access token.
  server.grant(
    oauth2orize.grant.code((client, redirectUri, user, _ares, done) => {
      const ctrl = new CodeController(new CodeRepository(ds));
      const value = uuidv4();
      const jwtCode = jwt.sign({value}, process.env.JWT_SECRET ?? '', {
        expiresIn: '7d',
      });
      ctrl
        .create(
          new Code({
            clientId: client.id,
            userId: user.id,
            redirectUri: redirectUri,
            value,
          }),
        )
        .then(code => done(null, jwtCode))
        .catch(error => done(error));
    }),
  );

  // Grant implicit authorization. The callback takes the `client` requesting
  // authorization, the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application. The application issues a token, which is bound to these
  // values.
  server.grant(
    oauth2orize.grant.token((client, user, _ares, done) => {
      createToken(user.id, client.id)
        .then(token => done(null, token.value))
        .catch(error => done(error));
    }),
  );

  // Exchange authorization codes for access tokens. The callback accepts the
  // `client`, which is exchanging `code` and any `redirectUri` from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the user who authorized the
  // code. The issued access token response can include a refresh token and
  // custom parameters by adding these to the `done()` call
  server.exchange(
    oauth2orize.exchange.code((client, code, redirectUri, done) => {
      const ctrl = new CodeController(new CodeRepository(ds));
      ctrl
        .findByValue(code)
        .then(authCode => {
          if (
            authCode &&
            authCode.clientId === client.id &&
            authCode.redirectUri === redirectUri
          ) {
            createToken(authCode.userId, authCode.clientId)
              .then(token =>
                done(null, token.value, undefined, {userId: authCode.userId}),
              )
              .catch(error => done(error));
          } else {
            done(new Error('Invalid Code'));
          }
        })
        .catch(error => done(error));
    }),
  );

  // Exchange user id and password for access tokens. The callback accepts the
  // `client`, which is exchanging the user's name and password from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the user who authorized the code.
  server.exchange(
    oauth2orize.exchange.password(
      (client, username, password, _scope, done) => {
        const clientCtrl = new ClientController(new ClientRepository(ds));
        const userCtrl = new UserController(new UserRepository(ds));
        Promise.all([
          clientCtrl.findById(client.clientId),
          userCtrl.findByEmail(username),
        ])
          .then(([authClient, user]) => {
            Promise.all([
              authClient.verifySecret(client.clientSecret),
              user.verifyPassword(password),
            ])
              .then(() => {
                createToken(user.id as string, authClient.id as string)
                  .then(token => done(null, token.value))
                  .catch(error => done(error));
              })
              .catch(error => done(error));
          })
          .catch(error => done(error));
      },
    ),
  );

  // Exchange the client id and password/secret for an access token. The callback accepts the
  // `client`, which is exchanging the client's id and password/secret from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the client who authorized the code.

  server.exchange(
    oauth2orize.exchange.clientCredentials((client, _scope, done) => {
      const clientCtrl = new ClientController(new ClientRepository(ds));

      clientCtrl
        .findById(client.clientId)
        .then(authClient => {
          authClient
            .verifySecret(client.clientSecret)
            .then(() => {
              createToken(undefined, authClient.id)
                .then(token => {
                  done(null, token.value);
                })
                .catch(error => done(error));
            })
            .catch(error => done(error));
        })
        .catch(error => done(error));
    }),
  );

  return server;
};

const server = oauth2();

// User authorization endpoint.
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request. In
// doing so, is recommended that the `redirectUri` be checked against a
// registered value, although security requirements may vary across
// implementations. Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectUri` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction. It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization). We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

const authorization = [
  isJwtAuthenticated,
  server.authorization(
    (clientId, redirectUri, done) => {
      const ctrl = new ClientController(new ClientRepository(ds));
      ctrl
        .findByClientId(clientId)
        .then(client => {
          if (client.redirectUri === redirectUri) {
            done(null, client, redirectUri);
          } else {
            return done(
              new HttpErrors.BadRequest(
                `Client redirect URI ${redirectUri} invalid.`,
              ),
            );
          }
        })
        .catch(error => done(error));
    },
    (client, user, _scope, _type, _areq, done) => {
      // Check if grant request qualifies for immediate approval

      // Auto-approve
      if (client.isTrusted) {
        return done(null, true, null, null);
      }

      const ctrl = new TokenController(new TokenRepository(ds));
      ctrl
        .find({where: {userId: user.id, clientId: client.id}})
        .then(tokens => done(null, tokens.length > 0, null, null))
        .catch(error => done(error, false, null, null));
    },
  ),
  (req: Request, res: Response) => {
    const r = req as AuthRequest;
    res.render('dialog', {
      title: 'Authorise',
      transactionId: r.oauth2.transactionID,
      user: req.user,
      rclient: r.oauth2.client,
    });
  },
];

// User decision endpoint.
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application. Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.
const decision = [isJwtAuthenticated, server.decision()];

// Token endpoint.
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens. Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request. Clients must
// authenticate when making requests to this endpoint.

const token = [
  passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
  server.token(),
  server.errorHandler(),
];

export {oauth2, authorization, decision, token};
