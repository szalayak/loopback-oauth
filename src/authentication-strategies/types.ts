import {User} from '../models';
import {UserProfile, securityId} from '@loopback/security';
import {UserProfileFactory} from '@loopback/authentication';

export namespace PassportAuthenticationBindings {
  export const OAUTH2_STRATEGY = 'passport.authentication.oauth2.strategy';
}

/**
 * map passport profile to UserProfile in `@loopback/security`
 * @param user
 */
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
