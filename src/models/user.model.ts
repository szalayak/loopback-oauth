import { Entity, model, property } from '@loopback/repository';
import bcrypt from 'bcrypt';

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
    return bcrypt.compare(password, this.password);
  }

}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
