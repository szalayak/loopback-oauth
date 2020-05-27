import {inject, Provider, BindingScope, bind} from '@loopback/core';
import {UserServiceBindings} from '../services';
import {
  Strategy as OAuth2Strategy,
  StrategyOptions as OAuth2StrategyOptions,
} from 'passport-oauth2';
import {
  verifyFunctionFactory,
  profileFunction,
} from '../authentication-strategies/types';

@bind.provider({scope: BindingScope.SINGLETON})
export class CustomOauth2 implements Provider<OAuth2Strategy> {
  strategy: OAuth2Strategy;

  constructor(
    @inject('customOAuth2Options')
    public oauth2Options: OAuth2StrategyOptions,
    @inject('authentication.oauth2.profile.function', {optional: true})
    public profileFn: profileFunction,
  ) {
    if (profileFn) {
      OAuth2Strategy.prototype.userProfile = profileFn;
    }
    this.strategy = new OAuth2Strategy(
      this.oauth2Options,
      verifyFunctionFactory(),
    );
  }

  value() {
    return this.strategy;
  }
}
