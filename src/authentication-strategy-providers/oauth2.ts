import {Provider} from '@loopback/core';
import {VerifyFunction} from 'passport-oauth2';
import {User} from '../models';

export class Oauth2VerifyFunctionProvider implements Provider<VerifyFunction> {
  value(): VerifyFunction {
    return (
      _accessToken: string,
      _refreshToken: string,
      profile: User,
      done: Function,
    ) => {
      done(profile);
    };
  }
}
