import {Entity, model, property} from '@loopback/repository';
import bcrypt from 'bcrypt';
import {HttpErrors} from '@loopback/rest';

@model()
export class User extends Entity {
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
  firstName: string;

  @property({
    type: 'string',
    required: true,
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isAdmin: boolean;

  constructor(data?: Partial<User>) {
    super(data);
  }

  async verifyPassword(password: string) {
    const result = await bcrypt.compare(password, this.password);
    if (!result) {
      throw new HttpErrors.Unauthorized('Invalid password.');
    }
    return true;
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
