import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IProductoRepository } from '../../../producto/domain/interfaces/producto.repository-interface';
import { Producto } from '../../../producto/domain/entities/producto.entity';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { redondear } from 'src/modules/common/utils/number/redondeo';
import { TypeOrmUnitOfWork } from 'src/modules/common/unit-of-work/type-orm-unit-of-works1';
import { ProductoCambioPrecioDto } from '../../dto/producto-cambio-precio.dto';
import { BuscarProductosCambioPrecioDto } from '../../dto/buscar-productos-cambio-precio.dto';
import { AplicarCambiosPrecioDto } from '../../dto/aplicar-cambios-precio.dto';
import { GuardarCambiosPrecioDto } from '../../dto/guardar-cambios-precio.dto';
import { HistorialPrecio } from '../../../producto/domain/entities/historial-precio.entity';

@Injectable()
export class CambioPreciosService {
  private readonly logger = new Logger(CambioPreciosService.name);

  constructor(
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usuarioService: UsuarioService,
  ) {}

  async buscarProductos(dto: BuscarProductosCambioPrecioDto) {
    this.logger.log(`Buscando productos para cambio de precios`);
    const result = await this.productoRepository.findBy(
      dto.denominacion ?? '',
      '',
      false,
      '',
      dto.marcaId ?? 0,
      dto.lineaId ?? 0,
      0,
      dto.conStock ?? false,
      dto.skip ?? 0,
      dto.take ?? 10,
    );

    return {
      data: result.data.map((producto) =>
        this.toProductoCambioPrecioDto(producto),
      ),
      total: result.total,
      ambito: dto.lineaId ? 'linea' : 'global',
    };
  }

  /**
   * Calcula el preview de la actualización de precios sin persistir.
   * El servidor relee los productos de la base de datos (server-authoritative):
   * los precios enviados por el cliente no son tenidos en cuenta.
   */
  async aplicarCambios(dto: AplicarCambiosPrecioDto) {
    const productos = (await this.productoRepository.findByIds(
      dto.items.map((item) => item.id),
    )).filter((producto) => !producto.deletedAt);

    const mapa = new Map<number, Producto>(
      productos.map((producto) => [producto.id, producto]),
    );

    return dto.items
      .map((item) => mapa.get(item.id))
      .filter((producto): producto is Producto => Boolean(producto))
      .map((producto) => {
        const resultado = this.toProductoCambioPrecioDto(producto);

        const nuevoPrecio = producto.calcularPrecioAjustado(
          dto.tipo,
          dto.valor,
        );
        resultado.nuevoPrecio = nuevoPrecio;

        const alicuotaIva = producto.alicuotaIva ?? 0;
        resultado.nuevoPrecioConIva = redondear(
          nuevoPrecio * (1 + alicuotaIva / 100),
          2,
        );

        const nuevoPorcentaje =
          producto.calcularPorcentajeImplicito(nuevoPrecio);
        resultado.nuevoPorcentaje = nuevoPorcentaje ?? producto.porcentaje ?? 0;

        const costo = producto.costo ?? 0;
        if (nuevoPrecio <= 0) {
          resultado.error = 'El nuevo precio debe ser mayor a 0.';
        } else if (costo > 0 && nuevoPrecio < costo) {
          resultado.error =
            'El nuevo precio no puede ser menor al costo del producto.';
        }

        return resultado;
      });
  }

  /**
   * Guarda las actualizaciones de precios en una transacción.
   * Devuelve la información lista para el historial de precios (CR-007):
   * precio anterior, precio nuevo, motivo, fecha y usuario.
   */
  async guardarCambios(dto: GuardarCambiosPrecioDto) {
    const usuario = await this.usuarioService.findOne(dto.usuarioCreatedId);
    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID ${dto.usuarioCreatedId} no encontrado.`,
      );
    }

    const productos = (await this.productoRepository.findByIds(
      dto.items.map((item) => item.id),
    )).filter((producto) => !producto.deletedAt);

    const mapa = new Map<number, Producto>(
      productos.map((producto) => [producto.id, producto]),
    );

    const uow = new TypeOrmUnitOfWork(this.dataSource);
    await uow.start();
    try {
      const historial: Array<{
        productoId: number;
        precioAnterior: number;
        precioNuevo: number;
        motivo: string;
        usuarioCreatedId: number;
        fecha: Date;
      }> = [];
      for (const item of dto.items) {
        const producto = mapa.get(item.id);
        if (!producto) {
          throw new NotFoundException(
            `Producto con ID ${item.id} no encontrado o eliminado.`,
          );
        }

        const precioAnterior = producto.precio ?? 0;
        producto.fijarPrecio(item.nuevoPrecio);
        producto.usuarioUpdated = usuario;

        await this.productoRepository.updateEntity(uow, producto);

        const historialRepository = uow.getRepository(HistorialPrecio);
        await historialRepository.save(
          historialRepository.create({
            productoId: producto.id,
            producto,
            precioAnterior,
            precioNuevo: producto.precio ?? 0,
            motivo: dto.motivo,
            usuarioId: usuario.id,
            usuario,
          }),
        );

        historial.push({
          productoId: producto.id,
          precioAnterior,
          precioNuevo: producto.precio ?? 0,
          motivo: dto.motivo,
          usuarioCreatedId: usuario.id,
          fecha: new Date(),
        });
      }

      await uow.commit();

      return {
        mensaje: `Actualización de precios masiva realizada sobre ${historial.length} producto(s).`,
        historial,
      };
    } catch (error) {
      await uow.rollback();
      throw error;
    } finally {
      await uow.release();
    }
  }

  private toProductoCambioPrecioDto(
    producto: Producto,
  ): ProductoCambioPrecioDto {
    const precio = producto.precio ?? 0;
    const alicuota = producto.alicuotaIva ?? 0;

    return {
      id: producto.id,
      codigoProveedor: producto.codigoProveedor ?? '',
      denominacion: producto.denominacion,
      observacion: producto.observacion ?? '',
      costo: producto.costo ?? 0,
      stock: producto.stock ?? 0,
      stockMinimo: producto.stockMinimo ?? 0,
      enStockBajo: Producto.estaBajoMinimo(producto),
      precio,
      precioConIva: redondear(precio * (1 + alicuota / 100), 2),
      alicuotaIva: alicuota,
      porcentaje: producto.porcentaje ?? 0,
      lineaId: producto.lineaId ?? producto.linea?.id ?? null,
      lineaDenominacion: producto.linea?.denominacion ?? null,
      nuevoPrecio: null,
      nuevoPorcentaje: null,
      nuevoPrecioConIva: null,
      error: null,
      dirty: false,
    };
  }
}