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
import { Token } from '../models';
import { TokenRepository } from '../repositories';

export class TokenController {
  constructor(
    @repository(TokenRepository)
    public tokenRepository: TokenRepository,
  ) { }

  // @post('/tokens', {
  //   responses: {
  //     '200': {
  //       description: 'Token model instance',
  //       content: {'application/json': {schema: getModelSchemaRef(Token)}},
  //     },
  //   },
  // })
  async create(
    // @requestBody({
    //   content: {
    //     'application/json': {
    //       schema: getModelSchemaRef(Token, {
    //         title: 'NewToken',
    //         exclude: ['id'],
    //       }),
    //     },
    //   },
    // })
    token: Omit<Token, 'id'>,
  ): Promise<Token> {
    return this.tokenRepository.create(token);
  }

  @get('/tokens/count', {
    responses: {
      '200': {
        description: 'Token model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Token)) where?: Where<Token>,
  ): Promise<Count> {
    return this.tokenRepository.count(where);
  }

  @get('/tokens', {
    responses: {
      '200': {
        description: 'Array of Token model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Token, { includeRelations: true }),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Token))
    filter?: Filter<Token>,
  ): Promise<Token[]> {
    return this.tokenRepository.find(filter);
  }

  // @patch('/tokens', {
  //   responses: {
  //     '200': {
  //       description: 'Token PATCH success count',
  //       content: { 'application/json': { schema: CountSchema } },
  //     },
  //   },
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Token, { partial: true }),
  //       },
  //     },
  //   })
  //   token: Token,
  //   @param.query.object('where', getWhereSchemaFor(Token)) where?: Where<Token>,
  // ): Promise<Count> {
  //   return this.tokenRepository.updateAll(token, where);
  // }

  @get('/tokens/{id}', {
    responses: {
      '200': {
        description: 'Token model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Token, { includeRelations: true }),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Token))
    filter?: Filter<Token>,
  ): Promise<Token> {
    return this.tokenRepository.findById(id, filter);
  }

  @get('/tokens/byValue/{value}', {
    responses: {
      '200': {
        description: 'Token model instance by value',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Token, { includeRelations: true }),
          },
        },
      },
    },
  })
  async findByValue(
    @param.path.string('value') value: string,
  ): Promise<Token> {
    const token = await this.tokenRepository.findOne({ where: { value } });
    if (!token) {
      throw new HttpErrors.NotFound('Invalid code');
    }
    return token;
  }

  @del('/tokens/{id}', {
    responses: {
      '204': {
        description: 'Token DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.tokenRepository.deleteById(id);
  }
}
