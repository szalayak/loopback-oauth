import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import { Code } from '../models';
import { CodeRepository } from '../repositories';
import * as jwt from 'jsonwebtoken';
import { LooseObject } from '../express/types';

export class CodeController {
  constructor(
    @repository(CodeRepository)
    public codeRepository: CodeRepository,
  ) { }

  async create(
    code: Omit<Code, 'id'>,
  ): Promise<Code> {
    return this.codeRepository.create(code);
  }

  @get('/codes/count', {
    responses: {
      '200': {
        description: 'Code model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Code)) where?: Where<Code>,
  ): Promise<Count> {
    return this.codeRepository.count(where);
  }

  @get('/codes', {
    responses: {
      '200': {
        description: 'Array of Code model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Code, { includeRelations: true }),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Code))
    filter?: Filter<Code>,
  ): Promise<Code[]> {
    return this.codeRepository.find(filter);
  }

  @get('/codes/{id}', {
    responses: {
      '200': {
        description: 'Code model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Code, { includeRelations: true }),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Code))
    filter?: Filter<Code>,
  ): Promise<Code> {
    return this.codeRepository.findById(id, filter);
  }

  @get('/codes/byValue/{value}', {
    responses: {
      '200': {
        description: 'Code model instance by value',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Code, { includeRelations: true }),
          },
        },
      },
    },
  })
  async findByValue(
    @param.path.string('value') value: string,
  ): Promise<Code> {
    const { value: decodedValue } = jwt.verify(
      value,
      process.env.JWT_SECRET ?? '',
    ) as LooseObject;
    const code = await this.codeRepository.findOne({
      where: { value: decodedValue as string },
    });
    if (!code) {
      throw new HttpErrors.NotFound('Invalid code');
    }
    return code;
  }

  @del('/codes/{id}', {
    responses: {
      '204': {
        description: 'Code DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.codeRepository.deleteById(id);
  }
}
