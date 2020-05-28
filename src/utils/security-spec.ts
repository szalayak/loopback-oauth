import { SecuritySchemeObject, ReferenceObject } from '@loopback/openapi-v3';

export const OPERATION_SECURITY_SPEC = [{ oAuth2: ["*"] }];
export type SecuritySchemeObjects = {
  [securityScheme: string]: SecuritySchemeObject | ReferenceObject;
};
export const SECURITY_SCHEME_SPEC: SecuritySchemeObjects = {
  oAuth2: {
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: '/oauth/authorize',
        tokenUrl: '/oauth/token',
        scopes: { '*': 'Full Access' },
      },
    },
  },
};
