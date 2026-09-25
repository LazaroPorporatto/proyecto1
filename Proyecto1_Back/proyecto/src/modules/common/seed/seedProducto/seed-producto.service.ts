import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from 'src/modules/gestion-productos/producto/domain/entities/producto.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { UnidadPresentacion } from 'src/modules/gestion-productos/producto/enums/unidad-presentacion.enum';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class SeedProductoService {
  private readonly logger = new Logger(SeedProductoService.name);

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(Linea)
    private readonly lineaRepository: Repository<Linea>,

    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,

    @InjectRepository(Presentacion)
    private readonly presentacionRepository: Repository<Presentacion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async seedProductos() {
    const entryData = [
      {
        denominacion: 'SEED ACEITES 1LT',
        linea: 'ACEITES',
        marca: 'CAROYENSE',
        presentacion: 'BIDON 5L',
        unidadPresentacion: UnidadPresentacion.LITRO,
        cantidadPresentacion: 5,
        costo: 80,
        porcentaje: 15,
        stock: 2,
        stockMinimo: 5,
        utilizaStockMinimo: true,
      },
      {
        denominacion: 'SEED ACEITUNAS 1LT',
        linea: 'ACEITUNAS',
        marca: 'CIRCE',
        presentacion: 'UNIDAD',
        unidadPresentacion: UnidadPresentacion.UNIDAD,
        cantidadPresentacion: 1,
        costo: 40,
        porcentaje: 15,
        stock: 120,
        stockMinimo: 20,
        utilizaStockMinimo: true,
      },
      {
        denominacion: 'SEED AZUCAR 1KG',
        linea: 'AZUCAR',
        marca: 'CAROYENSE',
        presentacion: 'UNIDAD',
        unidadPresentacion: UnidadPresentacion.KILOGRAMO,
        cantidadPresentacion: 1,
        costo: 100,
        porcentaje: 25,
        stock: 3,
        stockMinimo: 4,
        utilizaStockMinimo: true,
      },
      {
        denominacion: 'SEED HARINAS 1KG',
        linea: 'HARINAS',
        marca: 'SIN MARCA',
        presentacion: 'UNIDAD',
        unidadPresentacion: UnidadPresentacion.KILOGRAMO,
        cantidadPresentacion: 1,
        costo: 60,
        porcentaje: 15,
        stock: 0,
        stockMinimo: 1,
        utilizaStockMinimo: true,
      },
      {
        denominacion: 'SEED BOLSAS X10',
        linea: 'BOLSAS',
        marca: 'CIRCE',
        presentacion: 'PACK x6',
        unidadPresentacion: UnidadPresentacion.PACK,
        cantidadPresentacion: 6,
        costo: 200,
        porcentaje: 15,
        stock: 500,
        stockMinimo: 100,
        utilizaStockMinimo: true,
      },
      {
        denominacion: 'SEED MARGARINAS 1KG',
        linea: 'MARGARINAS Y GRASAS',
        marca: 'SIN MARCA',
        presentacion: 'UNIDAD',
        unidadPresentacion: UnidadPresentacion.KILOGRAMO,
        cantidadPresentacion: 1,
        costo: 90,
        porcentaje: 15,
        stock: 1,
        stockMinimo: 10,
        utilizaStockMinimo: false,
      },
    ];

    for (const data of entryData) {
      const existe = await this.productoRepository.findOneBy({
        denominacion: data.denominacion,
      });

      if (existe) {
        this.logger.log(` Producto "${data.denominacion}" ya existe.`);
        continue;
      }

      const linea = await this.lineaRepository.findOneBy({
        denominacion: data.linea,
      });
      if (!linea) {
        this.logger.warn(
          ` No se encontró la línea "${data.linea}". Ejecutá primero el seed de familia de producto.`,
        );
        continue;
      }

      const marca = await this.marcaRepository.findOneBy({
        denominacion: data.marca,
      });
      if (!marca) {
        this.logger.warn(
          `No se encontró la marca "${data.marca}". Ejecutá primero el seed de familia de producto.`,
        );
        continue;
      }

      const presentacion = await this.presentacionRepository.findOneBy({
        denominacion: data.presentacion,
      });
      if (!presentacion) {
        this.logger.warn(
          `No se encontró la presentación "${data.presentacion}". Ejecutá primero el seed de presentación.`,
        );
        continue;
      }

      const usuarioCreated = await this.usuarioRepository.findOneBy({
        id: 1,
      });
      if (!usuarioCreated) {
        this.logger.warn(
          `No se encontró el usuario "1". Ejecutá primero el seed de usuario.`,
        );
        continue;
      }

      // Regla P1-73: precio = costo * (1 + margen/100), con redondeo a 2 decimales.
      const precio = Math.round(data.costo * (1 + data.porcentaje / 100) * 100) / 100;

      const producto = this.productoRepository.create({
        denominacion: data.denominacion,
        linea,
        marca,
        lineaId: linea.id,
        marcaId: marca.id,
        presentacion,
        presentacionId: presentacion.id,
        usuarioCreated,
        costo: data.costo,
        porcentaje: data.porcentaje,
        precio,
        stock: data.stock,
        stockMinimo: data.stockMinimo,
        utilizaStockMinimo: data.utilizaStockMinimo,
        alicuotaIva: 21.0,
        sistema: 0,
        unidadPresentacion: data.unidadPresentacion,
        cantidadPresentacion: data.cantidadPresentacion,
      } as DeepPartial<Producto>);

      await this.productoRepository.save(producto);
      this.logger.log(` Producto "${data.denominacion}" creado.`);
    }
  }

  async runAllSeeds() {
    this.logger.log(' Iniciando seeds de productos...');
    await this.seedProductos();
    this.logger.log(' Seeds de productos completados.');
  }
}