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
import { Client } from '../models';
import { ClientRepository } from '../repositories';
import bcrypt from 'bcrypt';

export class ClientController {
  constructor(
    @repository(ClientRepository)
    public clientRepository: ClientRepository,
  ) { }

  @post('/clients', {
    responses: {
      '200': {
        description: 'Client model instance',
        content: { 'application/json': { schema: getModelSchemaRef(Client) } },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Client, {
            title: 'NewClient',
            exclude: ['id'],
          }),
        },
      },
    })
    client: Omit<Client, 'id'>,
  ): Promise<Client> {
    return this.clientRepository.create({ ...client, clientSecret: bcrypt.hashSync(client.clientSecret, 10) });
  }

  @get('/clients/count', {
    responses: {
      '200': {
        description: 'Client model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Client))
    where?: Where<Client>,
  ): Promise<Count> {
    return this.clientRepository.count(where);
  }

  @get('/clients', {
    responses: {
      '200': {
        description: 'Array of Client model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Client, { includeRelations: true }),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Client))
    filter?: Filter<Client>,
  ): Promise<Client[]> {
    return this.clientRepository.find(filter);
  }

  @patch('/clients', {
    responses: {
      '200': {
        description: 'Client PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Client, { partial: true }),
        },
      },
    })
    client: Client,
    @param.query.object('where', getWhereSchemaFor(Client))
    where?: Where<Client>,
  ): Promise<Count> {
    return this.clientRepository.updateAll({ ...client, clientSecret: client.clientSecret ? bcrypt.hashSync(client.clientSecret, 10) : undefined }, where);
  }

  @get('/clients/{id}', {
    responses: {
      '200': {
        description: 'Client model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Client, { includeRelations: true }),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(Client))
    filter?: Filter<Client>,
  ): Promise<Client> {
    return this.clientRepository.findById(id, filter);
  }

  @get('/clients/{clientId}', {
    responses: {
      '200': {
        description: 'Client model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Client, { includeRelations: true }),
          },
        },
      },
    },
  })
  async findByClientId(
    @param.path.string('clientId') clientId: string,
    @param.query.object('filter', getFilterSchemaFor(Client))
    filter?: Filter<Client>,
  ): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { clientId: clientId } });
    if (!client) {
      throw new HttpErrors.NotFound(`Client with clientId ${clientId} does not exist`);
    }
    return client;
  }

  @patch('/clients/{id}', {
    responses: {
      '204': {
        description: 'Client PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Client, { partial: true }),
        },
      },
    })
    client: Client,
  ): Promise<void> {
    await this.clientRepository.updateById(id, { ...client, clientSecret: client.clientSecret ? bcrypt.hashSync(client.clientSecret, 10) : undefined });
  }

  @put('/clients/{id}', {
    responses: {
      '204': {
        description: 'Client PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() client: Client,
  ): Promise<void> {
    await this.clientRepository.replaceById(id, { ...client, clientSecret: client.clientSecret ? bcrypt.hashSync(client.clientSecret, 10) : undefined });
  }

  @del('/clients/{id}', {
    responses: {
      '204': {
        description: 'Client DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.clientRepository.deleteById(id);
  }
}
