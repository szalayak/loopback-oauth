import { User } from '../models';
import { UserProfile, securityId } from '@loopback/security';

export namespace PassportAuthenticationBindings {
  export const OAUTH2_STRATEGY = 'passport.authentication.oauth2.strategy';
}

/**
 * map passport profile to UserProfile in `@loopback/security`
 * @param user
 */
export const mapProfile = function (user: User): UserProfile {
  const userProfile: UserProfile = {
    [securityId]: '' + user.id,
    profile: {
      ...user,
    },
  };
  return userProfile;
};
