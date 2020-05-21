import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, addExtension} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {
  AuthenticationComponent,
  AuthenticationBindings,
} from '@loopback/authentication';
import {Oauth2VerifyFunctionProvider} from './authentication-strategy-providers';
import {
  PassportOauth2AuthProvider,
  PassportAuthenticationBindings,
} from './authentication-strategies';

export class LoopbackOauthApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    // add authentication
    this.component(AuthenticationComponent);

    // the verify function for passport-oauth2
    this.bind('authentication.oauth2.verify').toProvider(
      Oauth2VerifyFunctionProvider,
    );

    // register PassportBasicAuthProvider as a custom authentication strategy
    addExtension(
      this,
      AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      PassportOauth2AuthProvider,
      {
        namespace:
          AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      },
    );
    this.configure(AuthenticationBindings.COMPONENT).to({
      defaultMetadata: {
        strategy: PassportAuthenticationBindings.OAUTH2_STRATEGY,
      },
    });

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
