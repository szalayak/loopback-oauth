import { Entity, model, property } from '@loopback/repository';
import bcrypt from 'bcrypt';
import { HttpErrors } from '@loopback/rest';

@model({
  settings: { hiddenProperties: ['clientSecret'] }
})
export class Client extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'uuidv4',
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  clientId: string;

  @property({
    type: 'string',
    required: true,
  })
  clientSecret: string;

  @property({
    type: 'string',
    required: true,
  })
  redirectUri: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isTrusted: boolean;

  // internal copy of client secret for verification even if it's not returned in the object
  _clientSecret: string;

  constructor(data?: Partial<Client>) {
    super(data);
    this._clientSecret = this.clientSecret;
  }

  async verifySecret(clientSecret: string) {
    const result = await bcrypt.compare(clientSecret, this._clientSecret);
    if (!result) {
      throw new HttpErrors.Unauthorized('Invalid client secret.');
    }
    return true;
  }
}

export interface ClientRelations {
  // describe navigational properties here
}

export type ClientWithRelations = Client & ClientRelations;
