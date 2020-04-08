import { Entity, model, property } from '@loopback/repository';
import bcrypt from 'bcrypt';

@model()
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

  constructor(data?: Partial<Client>) {
    super(data);
  }

  async verifySecret(clientSecret: string) {
    return bcrypt.compare(clientSecret, this.clientSecret);
  }

}

export interface ClientRelations {
  // describe navigational properties here
}

export type ClientWithRelations = Client & ClientRelations;
