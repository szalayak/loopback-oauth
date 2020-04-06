import {Entity, model, property} from '@loopback/repository';

@model()
export class Code extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  clientId: string;

  @property({
    type: 'string',
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  redirectUri: string;

  @property({
    type: 'string',
    required: true,
  })
  value: string;


  constructor(data?: Partial<Code>) {
    super(data);
  }
}

export interface CodeRelations {
  // describe navigational properties here
}

export type CodeWithRelations = Code & CodeRelations;
