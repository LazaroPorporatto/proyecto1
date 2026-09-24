import {
  forwardRef,
  Inject,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { AuditoriaMapper } from 'src/modules/gestion-sistema/auditoria/mappers/auditoria.mapper';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { Producto } from '../../domain/entities/producto.entity';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { GetProductoDto } from '../../dto/get-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { HistorialPrecioDto } from '../../dto/historial-precio.dto';
import { ProductoMapper } from '../../mappers/producto.mapper';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { ProductoDenominacionService } from '../../domain/services/producto-denominacion.service';
import { SugerirDenominacionDto } from '../../dto/sugerir-denominacion.dto';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { IMovimientoStockRepository } from '../../domain/interfaces/movimiento-stock.repository-interface';
import { EventPublisher } from '../../domain/interfaces/event-publisher.interface';
import { DomainEvent } from '../../domain/events/domain-event.interface';
import { TipoMovimiento } from '../../enums/tipo-movimiento.enum';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TypeOrmUnitOfWork } from 'src/modules/common/unit-of-work/type-orm-unit-of-works';
@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);
  constructor(
    @Inject('IProductoRepository')
    private readonly repository: IProductoRepository,
    private readonly lineaService: LineaService,

    @Inject(forwardRef(() => MarcaService))
    private readonly marcaService: MarcaService,
    private readonly proveedorService: ProveedorService,
    private readonly usuarioService: UsuarioService,

    //  Domain Services
    private readonly intrinsicValidationService: ProductoIntrinsicValidationService,
    private readonly validationService: ProductoValidationService,
    private readonly denominacionService: ProductoDenominacionService,

    // Infrastructure Validators
    private readonly relatedEntitiesValidator: ProductoRelatedEntitiesValidator,
    private readonly uniquenessValidator: ProductoUniquenessValidator,
    private readonly usuarioValidator: UsuarioValidator,

    private readonly productoDeletePolicy: ProductoDeletePolicy,

    @Optional()
    @Inject('IMovimientoStockRepository')
    private readonly movimientoStockRepository?: IMovimientoStockRepository,

    @Optional()
    @Inject('EventPublisher')
    private readonly eventPublisher?: EventPublisher,

    @Optional()
    @InjectDataSource()
    private readonly dataSource?: DataSource,

  ) { }

  private readonly ENTITY_NAME = 'Producto';

  async create(dto: CreateProductoDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion} a: ${dto.denominacion}`,
    );

    // Regla P1-73 (vive en la entidad Producto): Precio = Costo + Margen.
    // Se conforman valores coherentes ANTES de validar/persistir, sin depender
    // de lo que calcule (o deje de calcular) el cliente.
    const margenEnviado = dto.porcentaje;
    const precioEnviado = dto.precio;
    if (
      (precioEnviado === undefined || precioEnviado === null) &&
      (margenEnviado === undefined || margenEnviado === null)
    ) {
      throw new BadRequestException(
        'Se debe indicar el margen (porcentaje) o el precio del producto.',
      );
    }

    const reglaPrecio = new Producto();
    reglaPrecio.resolverCostoPrecioYMargen(dto.costo, margenEnviado, precioEnviado);
    if (dto.costo !== undefined) dto.costo = reglaPrecio.costo;
    dto.porcentaje = reglaPrecio.porcentaje;
    dto.precio = reglaPrecio.precio!;

    // Orquestar todas las validaciones
    const { marca, linea, usuario } =
      await this.validarYPrepararCreacion(dto);



    const entity = await this.repository.create(
      dto,
      linea,
      marca,

      usuario,
    );

    // Trazabilidad (P1-30): el stock inicial de alta queda registrado como movimiento
    if (typeof dto.stock === 'number' && dto.stock > 0) {
      await this.registrarStockInicial(entity, dto.stock);
    }

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateProductoDto) {
    this.logger.log(`Actualizandox  ${this.ENTITY_NAME} con ID: ${id}`);

    const { marca, linea, usuario } =
      await this.validarYPrepararActualizacion(id, dto);

    const entity = await this.repository.update(
      id,
      dto,
      linea,
      marca,

      usuario,
    );

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'editada',
    );
  }

  /**
   * CR-005: Genera una denominación sugerida a partir de Marca + Línea + Presentación.
   * No persiste nada; el frontend decide si la usa o el usuario la sobreescribe.
   */
  async sugerirDenominacion(dto: SugerirDenominacionDto): Promise<{ denominacion: string }> {
    const marca = await this.marcaService.findEntityById(dto.marcaId);
    const linea = await this.lineaService.findEntityById(dto.lineaId);

    const denominacion = this.denominacionService.generarDenominacionSugerida(
      marca.denominacion,
      linea.denominacion,
      dto.unidadPresentacion,
      dto.cantidadPresentacion,
    );

    return { denominacion };
  }

  async findByRapido(
    codigo: string,
    exacto: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.warn(`service`);
    const result = await this.repository.findByRapido(
      codigo,
      exacto,
      skip,
      take,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async obtenerHistorialPrecios(
    productoId: number,
    skip = 0,
    take = 10,
  ): Promise<{ data: HistorialPrecioDto[]; total: number }> {
    await this.findEntityById(productoId);
    const result = await this.repository.findHistorialPrecios(
      productoId,
      skip,
      take,
    );

    return {
      data: result.data.map((historial) => ({
        id: historial.id,
        productoId: historial.productoId,
        precioAnterior: Number(historial.precioAnterior),
        precioNuevo: Number(historial.precioNuevo),
        fecha: historial.fecha,
        motivo: historial.motivo,
        usuarioId: historial.usuarioId,
      })),
      total: result.total,
    };
  }


  async findBy(
    denominacion: string,
    codigoProveedor: string,
    codProveedorExacto: boolean,
    codigoReferencia: string,
    marca_id: number,
    linea_id: number,
    proveedor_id: number,
    conStock: boolean,
    skip: number,
    take: number,
    soloStockBajo = false,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.warn(`service`);
    const result = await this.repository.findBy(
      denominacion,
      codigoProveedor,
      codProveedorExacto,
      codigoReferencia,
      marca_id,
      linea_id,
      proveedor_id,
      conStock,
      skip,
      take,
      soloStockBajo,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }


  async buscarMarcaDesdeProducto(id: number) {
    return this.marcaService.findEntityById(id);
  }

  async buscarLineaDesdeProducto(id: number) {
    return this.lineaService.findEntityById(id);
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return AuditoriaMapper.mapProductoToDto(entity);
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    this.logger.log(`b1x`);
    return ProductoMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return entity;
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);

    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    

    ensureNotSistemaEntity(entity, 'Producto');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'eliminada',
    );
  }


  async findAllForLineas(denominacion: string) {
    return this.lineaService.findAllFor(denominacion);
  }

  async findAllForMarcas(denominacion: string) {
    return this.marcaService.findAllFor(denominacion);
  }

  async findByDenominacionCodigoProveedorFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.log(
      `  Buscando en srvice producto o ${denominacion}  skip=${skip}, take=${take}`,
    );
    const result =
      await this.repository.findByDenominacionCodigoProveedorFiltered(
        denominacion,
        skip,
        take,
      );
    this.logger.log(result);
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async existsProductosActivosByMarca(marcaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByMarca(marcaId);
  }
  async existsProductosActivosByLinea(lineaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByLinea(lineaId);
  }


  async findByIds(ids: number[]): Promise<Producto[]> {
    return this.repository.findByIds(ids);
  }

  async incrementarStock(
    uow: IUnitOfWork,
    productoId: number,
    cantidad: number,
    motivo: string,
    tipoMovimiento: TipoMovimiento = TipoMovimiento.AJUSTE,
  ): Promise<number> {
    return this.ajustarStockInterno(
      uow,
      productoId,
      cantidad,
      motivo,
      tipoMovimiento,
    );
  }

  async decrementarStock(
    uow: IUnitOfWork,
    productoId: number,
    cantidad: number,
    motivo: string,
    tipoMovimiento: TipoMovimiento = TipoMovimiento.AJUSTE,
  ): Promise<number> {
    return this.ajustarStockInterno(
      uow,
      productoId,
      -cantidad,
      motivo,
      tipoMovimiento,
    );
  }

  private async ajustarStockInterno(
    uow: IUnitOfWork,
    productoId: number,
    delta: number,
    motivo: string,
    tipoMovimiento: TipoMovimiento = TipoMovimiento.AJUSTE,
  ): Promise<number> {
    if (typeof motivo !== 'string' || motivo.trim().length === 0) {
      throw new BadRequestException(
        'El motivo del ajuste de stock es obligatorio.',
      );
    }

    const producto = await this.repository.findOne(productoId);
    if (!producto) {
      throw new Error(`Producto con ID ${productoId} no encontrado`);
    }

    const stockAnterior = producto.stock ?? 0;

    // Regla de dominio: vive en la entidad Producto
    Producto.aplicarAjusteDeStock(producto, delta, motivo, tipoMovimiento);

    await this.repository.updateEntity(uow, producto);

    // Trazabilidad (P1-30): registrar el movimiento dentro de la misma transacción
    if (this.movimientoStockRepository) {
      const movimiento = MovimientoStock.crear({
        productoId,
        tipoMovimiento,
        cantidad: delta,
        motivo,
        stockAnterior,
        stockNuevo: producto.stock,
      });
      await this.movimientoStockRepository.save(uow, movimiento);
    }

    // Eventos de dominio (P1-31): detectar en el dominio, reaccionar en aplicación
    this.despacharEventos(Producto.sacarEventos(producto));

    this.logger.log(
      `[StockService] ${motivo} → ${stockAnterior} → ${producto.stock}`,
    );

    return producto.stock;
  }

  private despacharEventos(eventos: DomainEvent[]): void {
    if (!eventos.length) return;

    if (this.eventPublisher) {
      this.eventPublisher.publish(eventos);
    } else {
      eventos.forEach((evento) =>
        this.logger.log(
          `[Evento de dominio: ${evento.constructor.name}] ${JSON.stringify(evento)}`,
        ),
      );
    }
  }

  private async registrarStockInicial(
    producto: Producto,
    stockInicial: number,
  ): Promise<void> {
    if (!this.movimientoStockRepository || !this.dataSource) return;
    if (typeof stockInicial !== 'number' || stockInicial <= 0) return;

    const uow = new TypeOrmUnitOfWork(this.dataSource);
    await uow.start();
    try {
      const movimiento = MovimientoStock.crear({
        productoId: producto.id,
        tipoMovimiento: TipoMovimiento.AJUSTE,
        cantidad: stockInicial,
        motivo: 'Stock inicial',
        stockAnterior: 0,
        stockNuevo: stockInicial,
      });
      await this.movimientoStockRepository.save(uow, movimiento);
      await uow.commit();
    } catch (error) {
      await uow.rollback();
      throw error;
    } finally {
      await uow.release();
    }
  }

  /**
   * Orquesta todas las validaciones necesarias para crear un producto
   * @private
   */
  private async validarYPrepararCreacion(dto: CreateProductoDto) {
    // Validar datos  (Domain - sin DB)
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion,
      marcaId: dto.marcaId,
      lineaId: dto.lineaId,
      alicuotaIva: dto.alicuotaIva,
      costo: dto.costo,
      precio: dto.precio,
      cantidadPresentacion: dto.cantidadPresentacion,
    });

    // Validar unicidad (Infrastructure - DB)
    await this.uniquenessValidator.validarDenominacionUnica(dto.denominacion);

    if (dto.codigoProveedor) {
      await this.uniquenessValidator.validarCodigoProveedorUnico(
        dto.codigoProveedor,
        0,
      );
    }
    // 3 Validar entidades relacionadas existen (Infrastructure - DB)
    const { marca, linea, } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId,
        dto.lineaId,

      );

    //  Validar reglas de negocio sobre entidades (Domain)
    this.validationService.validarEntidadesRelacionadas(
      marca,
      linea,

    );


    //  Validar usuario existe (Infrastructure)
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioCreatedId,
    );

    return { marca, linea, usuario };
  }
  /**
   * Orquesta todas las validaciones necesarias para actualizar un producto
   * @private
   */
  private async validarYPrepararActualizacion(
    id: number,
    dto: UpdateProductoDto,
  ) {
    // Obtener producto actual
    const productoActual = await this.repository.findOne(id);
    if (!productoActual)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );

    // Regla P1-73 (vive en la entidad Producto): se concilia costo/margen/precio
    // contra el producto vigente ANTES de validar/persistir.
    if (
      dto.costo !== undefined ||
      dto.porcentaje !== undefined ||
      dto.precio !== undefined
    ) {
      productoActual.resolverCostoPrecioYMargen(
        dto.costo,
        dto.porcentaje,
        dto.precio,
      );
      if (productoActual.costo !== undefined && productoActual.costo !== null) {
        dto.costo = productoActual.costo;
      }
      if (
        productoActual.porcentaje !== undefined &&
        productoActual.porcentaje !== null
      ) {
        dto.porcentaje = productoActual.porcentaje;
      }
      if (
        productoActual.precio !== undefined &&
        productoActual.precio !== null
      ) {
        dto.precio = productoActual.precio;
      }
    }

    if (
      productoActual.lineaId == null ||
      productoActual.marcaId == null
    ) {
      throw new InternalServerErrorException('Producto en estado inválido');
    }

    //  Validar datos intrínsecos
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion ?? productoActual.denominacion,
      marcaId: dto.marcaId ?? productoActual.marcaId,
      lineaId: dto.lineaId ?? productoActual.lineaId,
      alicuotaIva: dto.alicuotaIva ?? productoActual.alicuotaIva,
      costo: dto.costo ?? productoActual.costo,
      precio: dto.precio ?? productoActual.precio,
      cantidadPresentacion: dto.cantidadPresentacion ?? productoActual.cantidadPresentacion,
    });

    // Validar unicidad (excluyendo el ID actual)
    if (dto.denominacion) {
      await this.uniquenessValidator.validarDenominacionUnica(
        dto.denominacion,
        id,
      );
    }

    // Validar entidades relacionadas
    const { marca, linea, } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId ?? productoActual.marcaId,
        dto.lineaId ?? productoActual.lineaId,

      );

    //  Validar reglas de negocio
    this.validationService.validarEntidadesRelacionadas(
      marca,
      linea,

    );

    // 5 Validar usuario
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioUpdatedId,
    );

    return { marca, linea, usuario };
  }


}