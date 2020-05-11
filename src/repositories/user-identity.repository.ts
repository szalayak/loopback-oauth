import { DefaultCrudRepository } from '@loopback/repository';
import { UserIdentity } from '../models';
import { DsDataSource } from '../datasources';
import { inject } from '@loopback/core';

export class UserIdentityRepository extends DefaultCrudRepository<
  UserIdentity,
  typeof UserIdentity.prototype.id,
  UserIdentity
  > {
  constructor(@inject('datasources.ds') dataSource: DsDataSource) {
    super(UserIdentity, dataSource);
  }
}
