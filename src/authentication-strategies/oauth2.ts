import {Strategy, VerifyFunction} from 'passport-oauth2';
import {StrategyAdapter} from '@loopback/authentication-passport';
import {User} from '../models';
import {UserProfileFactory} from '@loopback/authentication';
import {UserProfile, securityId} from '@loopback/security';

export const mapProfile: UserProfileFactory<User> = function(
  user: User,
): UserProfile {
  return {
    [securityId]: '' + user.id,
    profile: {
      ...user,
    },
  };
};

const oauth2VerifyFn: VerifyFunction = (
  _accessToken: string,
  _refreshToken: string,
  profile: User,
  done: Function,
) => {
  done(profile);
};

const strategy = new Strategy(
  {
    authorizationURL: '/oauth/authorize',
    tokenURL: '/oauth/token',
    clientID: 'admin',
    clientSecret: 'Welcome1', // TODO replace this
    callbackURL: 'http://localhost:8080/oauth2-redirect.html',
  },
  oauth2VerifyFn,
);

export const OAUTH2_STRATEGY_NAME = 'oauth2';

export const oauth2AuthStrategy = new StrategyAdapter(
  // The configured basic strategy instance
  strategy,
  // Give the strategy a name
  // You'd better define your strategy name as a constant, like
  // `const AUTH_STRATEGY_NAME = 'basic'`.
  // You will need to decorate the APIs later with the same name.
  OAUTH2_STRATEGY_NAME,
  // Provide a user profile factory
  mapProfile,
);
