import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey, CoreTags} from '@loopback/core';
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
import {SECURITY_SCHEME_SPEC, OPERATION_SECURITY_SPEC} from './utils';
import {oauth2AuthStrategy} from './authentication-strategies';

/**
 * Information from package.json
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
export const PackageKey = BindingKey.create<PackageInfo>('application.package');

const pkg: PackageInfo = require('../package.json');

export class LoopbackOauthApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      servers: [{url: '/'}],
      security: OPERATION_SECURITY_SPEC,
    });

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

    // register strategy

    this.bind('authentication.strategies.oauth2AuthStrategy')
      .to(oauth2AuthStrategy)
      .tag({
        [CoreTags.EXTENSION_FOR]:
          AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      });

    // this.configure(AuthenticationBindings.COMPONENT).to({
    //   defaultMetadata: { strategy: OAUTH2_STRATEGY_NAME },
    // });

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
