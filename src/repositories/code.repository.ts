import {DefaultCrudRepository} from '@loopback/repository';
import {Code, CodeRelations} from '../models';
import {DsDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CodeRepository extends DefaultCrudRepository<
  Code,
  typeof Code.prototype.id,
  CodeRelations
> {
  constructor(
    @inject('datasources.ds') dataSource: DsDataSource,
  ) {
    super(Code, dataSource);
  }
}
