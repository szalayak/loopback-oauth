import {Strategy, StrategyOptions, VerifyFunction} from 'passport-oauth2';
import {StrategyAdapter} from '@loopback/authentication-passport';
import {
  AuthenticationStrategy,
  AuthenticationBindings,
} from '@loopback/authentication';
import {Provider} from '@loopback/core';
import {inject} from '@loopback/context';
import {UserProfileFactory} from '@loopback/authentication';
import {PassportAuthenticationBindings} from './types';

export class PassportOauth2AuthProvider<User>
  implements Provider<AuthenticationStrategy> {
  constructor(
    @inject('authentication.oauth2.verify')
    private verifyFn: VerifyFunction,
    @inject(AuthenticationBindings.USER_PROFILE_FACTORY)
    private myUserProfileFactory: UserProfileFactory<User>,
  ) {}

  value(): AuthenticationStrategy {
    const oauth2Strategy = this.configuredOauth2Strategy(this.verifyFn);
    return this.convertToAuthStrategy(oauth2Strategy);
  }

  // Takes in the verify callback function and returns a configured basic strategy.
  configuredOauth2Strategy(verifyFn: VerifyFunction): Strategy {
    const options: StrategyOptions = {
      authorizationURL: '/oauth/authorize',
      tokenURL: '/oauth/token',
      clientID: 'admin',
      clientSecret:
        '$2b$10$ji5FuprVEhjKVmTPiepdEewptNi4la8y45fBn79CcqUsJCynAJ0ya',
      callbackURL: 'http://localhost:8080/',
    };
    return new Strategy(options, verifyFn);
  }

  // Applies the `StrategyAdapter` to the configured basic strategy instance.
  // You'd better define your strategy name as a constant, like
  // `const AUTH_STRATEGY_NAME = 'basic'`
  // You will need to decorate the APIs later with the same name
  // Pass in the user profile factory
  convertToAuthStrategy(oauth2: Strategy): AuthenticationStrategy {
    return new StrategyAdapter(
      oauth2,
      PassportAuthenticationBindings.OAUTH2_STRATEGY,
      this.myUserProfileFactory,
    );
  }
}
