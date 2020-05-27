import {UserProfileFactory} from '@loopback/authentication';
import {User} from '../models';
import {UserProfile, securityId} from '@loopback/security';
import {VerifyFunction} from 'passport-oauth2';
import axios from 'axios';

export const OAUTH2_STRATEGY_NAME = 'oauth2';

export type profileFunction = (
  accessToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  done: (err?: Error | null, profile?: any) => void,
) => void;

export namespace PassportAuthenticationBindings {
  export const OAUTH2_STRATEGY = 'passport.authentication.oauth2.strategy';
}

export const oauth2ProfileFunction: profileFunction = (
  accessToken: string,
  done,
) => {
  // call the profile url in the mock authorization app with the accessToken
  axios
    .get('/userinfo?access_token=' + accessToken, {
      headers: {Authorization: accessToken},
    })
    .then(response => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile: any = response.data;
      profile.id = profile.userId;
      profile.emails = [{value: profile.email}];
      profile.provider = 'custom-oauth2';
      done(null, profile);
    })
    .catch(err => {
      done(err);
    });
};

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

/**
 * provides an appropriate verify function for oauth2 strategies
 * @param accessToken
 * @param refreshToken
 * @param profile
 * @param done
 */
export const verifyFunctionFactory = function(): VerifyFunction {
  return (
    _accessToken: string,
    _refreshToken: string,
    profile: User,
    done: Function,
  ) => {
    if (profile) done(null, profile);
    else done(new Error('Verification failed, no profile was returned.'));
  };
};
