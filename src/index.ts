// import {ExpressServer} from './server';
// import {ApplicationConfig} from '@loopback/core';

// export {ExpressServer};

// export async function main(options: ApplicationConfig = {}) {
//   const server = new ExpressServer(options);
//   await server.boot();
//   await server.start();
//   console.log('Server is running at http://127.0.0.1:8080');
// }

import {RestApplication} from '@loopback/rest';
import * as path from 'path';
import {oauth2ProfileFunction} from './authentication-strategies';
import {ApplicationConfig, ExpressServer} from './server';

export * from './server';

/**
 * Prepare server config
 * @param oauth2Providers
 */
export async function serverConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oauth2Providers: any,
): Promise<ApplicationConfig> {
  const config = {
    rest: {
      port: +(process.env.PORT ?? 8080),
      host: process.env.HOST,
      protocol: 'http',
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        setServersFromRequest: true,
      },
      // Use the LB4 application as a route. It should not be listening.
      listenOnStart: false,
    },
    oauth2Options: oauth2Providers['oauth2'],
  };
  return config;
}

/**
 * bind resources to application
 * @param server
 */
export async function setupApplication(
  lbApp: RestApplication,
  dbBackupFile?: string,
) {
  lbApp.bind('datasources.config.db').to({
    name: 'db',
    connector: 'memory',
    localStorage: '',
    file: dbBackupFile ? path.resolve(__dirname, dbBackupFile) : undefined,
  });

  lbApp
    .bind('authentication.oauth2.profile.function')
    .to(oauth2ProfileFunction);
}

/**
 * Start this application
 * @param oauth2Providers
 */
export async function startApplication(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oauth2Providers: any,
  dbBackupFile?: string,
): Promise<ExpressServer> {
  const config = await serverConfig(oauth2Providers);
  const server = new ExpressServer(config);
  await setupApplication(server.lbApp, dbBackupFile);
  await server.boot();
  await server.start();
  return server;
}

/**
 * run main() to start application with oauth config
 */
export async function main() {
  let oauth2Providers;
  if (process.env.OAUTH_PROVIDERS_LOCATION) {
    oauth2Providers = require(process.env.OAUTH_PROVIDERS_LOCATION);
  } else {
    oauth2Providers = require('../oauth2-providers');
  }
  const server: ExpressServer = await startApplication(
    oauth2Providers,
    process.env.DB_BKP_FILE_PATH, // eg: export DB_BKP_FILE_PATH=../data/db.json
  );
  console.log(`Server is running at ${server.url}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
