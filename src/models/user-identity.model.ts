import { Entity, model, property, belongsTo } from '@loopback/repository';
import { User } from './user.model';

@model()
export class UserIdentity extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  provider: string;

  @property({
    type: 'object',
    required: true,
  })
  profile: object;

  @property({
    type: 'object',
  })
  credentials?: object;

  @property({
    type: 'string',
    required: true,
  })
  authScheme: string;

  @property({
    type: 'date',
    required: true,
  })
  created?: Date;

  @belongsTo(() => User)
  userId: string;

  constructor(data?: Partial<UserIdentity>) {
    super(data);
  }
}

export interface UserIdentityRelations {
  // describe navigational properties here
}

export type UserIdentityWithRelations = UserIdentity & UserIdentityRelations;
