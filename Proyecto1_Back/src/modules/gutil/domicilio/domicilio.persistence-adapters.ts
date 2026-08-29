import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DatabaseConnectionException } from "../../common/exceptions/database-connection.exception";
import { EntityNotFoundException } from "../../common/exceptions/entity-not-found.exception";
import { Repository, IsNull, DataSource } from "typeorm";
import { IDomicilioRepository } from "./domicilio.repository.interface";
import { Domicilio } from "./entities/domicilio.entity";


@Injectable()
export class DomicilioPersistenceAdapter implements IDomicilioRepository {
  private readonly logger = new Logger(DomicilioPersistenceAdapter.name);

  private readonly ENTITY_NAME = 'Domicilio';

  constructor(
    @InjectRepository(Domicilio)
    private readonly repository: Repository<Domicilio>,
     private readonly dataSource: DataSource
  ) { }

}
