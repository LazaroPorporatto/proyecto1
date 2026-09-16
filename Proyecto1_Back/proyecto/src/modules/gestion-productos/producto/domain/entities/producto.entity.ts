import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Linea } from '../../../linea/domain/entities/linea.entity';
import { Marca } from '../../../marca/domain/entities/marca.entity';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { ApiProperty } from '@nestjs/swagger';
import { ProductoOperacion } from '../../../producto-operacion/entities/producto-operacion.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { MonetarioColumn } from 'src/modules/common/decorators/monetario-column.decorator';
import { CantidadColumn } from 'src/modules/common/decorators/cantidad-column.decorator';
import { PorcentajeColumn } from 'src/modules/common/decorators/porcentaje-column.decorator';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { UnidadPresentacion } from '../../enums/unidad-presentacion.enum';
import { BadRequestException } from '@nestjs/common';
import { redondear } from 'src/modules/common/utils/number/redondeo';

@Entity('producto')
export class Producto {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'text' })
  denominacion: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  codigoProveedor?: string | null;

  @Column({ type: 'text', nullable: true })
  codigoBarra?: string | null;

  // ========== PROVEEDOR ==========
  @ManyToOne(() => Proveedor, (pro) => pro.proveedoresOperacion, {
    eager: true,
  })
  @JoinColumn({ name: 'proveedor_id' })
  @Index()
  proveedor: Proveedor;

  @Column({ type: 'int', nullable: true })
  proveedorId?: number;

  /*
  Nota: No usar el enum alciculta iva en @Column
        sino no anda el importar precios 
  */
  @PorcentajeColumn(21.0)
  alicuotaIva: AlicuotaIva;

  // Stock: cantidades reales, admite fracciones (1.5 kg, 0.25 lts)
  @CantidadColumn()
  stock: number;

  @Column('boolean', { default: false })
  utilizaStockMinimo: boolean;

  @Column('boolean', { default: false })
  utilizaStockMinimoPorEmpresa: boolean;

  @CantidadColumn()
  stockMinimo: number;

  @MonetarioColumn()
  costo?: number;

  @MonetarioColumn()
  costoDolar?: number;

  /*
  Ultima cotizacion dolar por el cambio de precio si producto posee costo dolar
  */
  @MonetarioColumn()
  cotizacionDolar?: number;
  //se utiliza en las importaciones;

  @MonetarioColumn()
  precioDolar?: number;
  // Precio de venta

  @MonetarioColumn()
  precio?: number;

  @PorcentajeColumn()
  porcentaje?: number;

  @Column({ type: 'timestamp', nullable: true })
  fechaCosto?: Date;

  @Column('boolean', { default: false })
  costoEnDolar?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaCostoDolar?: Date;


  @Column('boolean', { default: false })
  destacado?: boolean;

  @Column('boolean', { default: false })
  envioGratis?: boolean;

  @Column({ type: 'text', nullable: true })
  observacion?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  deletedAt?: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_created_id' })
  usuarioCreated: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_updated_id' })
  usuarioUpdated: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_deleted_id' })
  usuarioDeleted: Usuario;


  // ========== LINEA ==========
  @ManyToOne(() => Linea, (linea) => linea.productos)
  @JoinColumn({ name: 'linea_id' })
  linea: Linea;

  @Column({ type: 'int', nullable: true })
  lineaId?: number;


 // ==========  MARCA ==========
  @ManyToOne(() => Marca, (marca) => marca.productos)
  @JoinColumn({ name: 'marca_id' })
  marca: Marca;

  @Column({ type: 'int', nullable: true })
  marcaId?: number;


  @Column({ type: 'enum', enum: UnidadPresentacion, default: UnidadPresentacion.UNIDAD })
  unidadPresentacion: UnidadPresentacion;

  @CantidadColumn()
  cantidadPresentacion: number;

  @Column({ type: 'text', nullable: true })
  imagen?: string;


  @Column({ type: 'text', nullable: true })
  ubicacion?: string;

  @ManyToOne(() => Producto, (producto) => producto.productosOperacion)
  productosOperacion: ProductoOperacion;


  @Column({ type: 'int', default: 0 })
  sistema: number;

  @Column({ type: 'text', nullable: true })
  codigoReferencia?: string | null;

  // ========== REGLAS DE DOMINIO: PRECIOS ==========

  /**
   * Calcula el nuevo precio a partir de un ajuste por porcentaje o monto.
   * No modifica la entidad.
   * @param tipo 'porcentaje' (valor en %) o 'monto' (valor en $).
   * @param valor Valor del ajuste (positivo o negativo).
   */
  calcularPrecioAjustado(tipo: 'porcentaje' | 'monto', valor: number): number {
    const precioActual = this.precio ?? 0;
    const nuevoPrecio =
      tipo === 'porcentaje'
        ? precioActual * (1 + valor / 100)
        : precioActual + valor;
    return redondear(nuevoPrecio, 2);
  }

  /**
   * Recalcula el margen implicito a partir del nuevo precio.
   * Regla: precio = costo * (1 + margen/100)  =>  margen = (precio/costo - 1) * 100
   * Si el costo no esta definido (<= 0) no se puede recalcular y se conserva el margen actual.
   */
  calcularPorcentajeImplicito(nuevoPrecio: number): number | null {
    const costo = this.costo ?? 0;
    if (costo <= 0) return null;
    return redondear((nuevoPrecio / costo - 1) * 100, 2);
  }

  /**
   * Fija el precio de venta validando las reglas de negocio:
   * - El precio debe ser mayor a 0.
   * - El precio no puede ser menor al costo (si el costo esta cargado).
   * Recalcula el margen implicito hacia atras.
   */
  fijarPrecio(nuevoPrecio: number): void {
    if (nuevoPrecio <= 0) {
      throw new BadRequestException('El nuevo precio debe ser mayor a 0.');
    }
    const costo = this.costo ?? 0;
    if (costo > 0 && nuevoPrecio < costo) {
      throw new BadRequestException(
        'El nuevo precio no puede ser menor al costo del producto.',
      );
    }
    this.precio = redondear(nuevoPrecio, 2);
    const nuevoPorcentaje = this.calcularPorcentajeImplicito(this.precio);
    if (nuevoPorcentaje !== null) {
      this.porcentaje = nuevoPorcentaje;
    }
  }

  /**
   * Aplica un ajuste masivo de precio (porcentaje o monto) sobre la entidad.
   */
  aplicarAjustePrecio(tipo: 'porcentaje' | 'monto', valor: number): void {
    this.fijarPrecio(this.calcularPrecioAjustado(tipo, valor));
  }
}
