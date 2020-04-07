import {DefaultCrudRepository} from '@loopback/repository';
import {Token, TokenRelations} from '../models';
import {DsDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class TokenRepository extends DefaultCrudRepository<
  Token,
  typeof Token.prototype.id,
  TokenRelations
> {
  constructor(@inject('datasources.ds') dataSource: DsDataSource) {
    super(Token, dataSource);
  }
}
