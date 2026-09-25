import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
  OneToMany,
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
import { TipoMovimiento } from '../../enums/tipo-movimiento.enum';
import { BadRequestException } from '@nestjs/common';
import { redondear } from 'src/modules/common/utils/number/redondeo';
import { DomainEvent } from '../events/domain-event.interface';
import { StockActualizadoEvent } from '../events/stock-actualizado.event';
import { StockBajoEvent } from '../events/stock-bajo.event';
import { HistorialPrecio } from './historial-precio.entity';

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

  // ========== REGLAS DE DOMINIO: STOCK ==========

  /**
   * Regla P1-73 "Precio = Costo + Margen".
   * precio = costo * (1 + margen/100), con redondeo a 2 decimales.
   */
  static calcularPrecioDesdeCostoYMargen(costo: number, margen: number): number {
    return redondear(costo * (1 + margen / 100), 2);
  }

  /**
   * Recalcula el margen implicito hacia atras.
   * Regla: margen = (precio/costo - 1) * 100.
   * Si no hay costo no se puede recalcular y se deriva 0.
   */
  static calcularMargenImplicito(costo: number, precio: number): number {
    if (costo <= 0) return 0;
    return redondear((precio / costo - 1) * 100, 2);
  }

  /**
   * Calcula el precio de venta derivado de Costo + Margen (porcentaje).
   */
  static calcularPrecio(instancia: Producto): number {
    return Producto.calcularPrecioDesdeCostoYMargen(
      instancia.costo ?? 0,
      instancia.porcentaje ?? 0,
    );
  }

  /**
   * API de instancia (lenguaje ubicuo): mismo comportamiento que el metodo estatico.
   */
  calcularPrecio(): number {
    return Producto.calcularPrecio(this);
  }

  /**
   * Regla P1-73 "Precio = Costo + Margen": fija costo y margen (15% estandar o
   * especial por producto) y deriva el precio de venta.
   */
  fijarCostoYMargen(costo: number, margen: number): void {
    this.costo = costo;
    this.porcentaje = margen;
    this.precio = Producto.calcularPrecioDesdeCostoYMargen(costo, margen);
  }

  /** Tope del margen: alineado con la columna `porcentaje` = decimal(5,2) (max 999.99). */
  static readonly MAX_PORCENTAJE = 999.99;

  /**
   * Concilia costo, margen y precio al guardar (alta o edicion) para que la regla
   * P1-73 quede SIEMPRE coherente, sin depender de lo que envie el cliente:
   * - Si viene (o cambia) el margen y no se fija un precio explicitamente ->
   *   el precio se deriva del margen (P1-73: el margen es la fuente).
   * - Si cambia solo el costo -> el precio se re-deriva con el margen vigente.
   * - Si se fija explicitamente un precio (y el margen no cambia) -> el margen
   *   se recalcula hacia atras.
   * - Si cambian margen y precio a la vez -> manda el margen (P1-73).
   * - Si no llega nada de costo/margen/precio -> no se toca nada.
   */
  resolverCostoPrecioYMargen(
    costo?: number,
    porcentaje?: number,
    precio?: number,
  ): void {
    if (costo === undefined && porcentaje === undefined && precio === undefined) {
      return;
    }

    const esCreacion =
      this.costo === undefined && this.porcentaje === undefined && this.precio === undefined;

    const costoActual = this.costo ?? 0;
    const margenActual = this.porcentaje;
    const precioActual = this.precio ?? 0;

    const precioViene = precio !== undefined && precio !== null;
    // Un margen 0 con precio explícito no es "intención de margen": manda el precio.
    const margenViene =
      porcentaje !== undefined &&
      porcentaje !== null &&
      (porcentaje !== 0 || !precioViene);
    const cambiaCosto = costo !== undefined && redondear(costo, 2) !== redondear(costoActual, 2);
    const cambiaMargen =
      margenViene &&
      (esCreacion || redondear(porcentaje!, 2) !== redondear(margenActual ?? 0, 2));
    const cambiaPrecio =
      precioViene &&
      (esCreacion || redondear(precio!, 2) !== redondear(precioActual, 2));

    if (cambiaMargen) {
      // Regla P1-73: el margen es la fuente y el precio se deriva.
      if (porcentaje! > Producto.MAX_PORCENTAJE) {
        throw new BadRequestException(
          `El margen (${porcentaje}%) supera el m\u00e1ximo permitido (${Producto.MAX_PORCENTAJE}%).`,
        );
      }
      this.costo = costo ?? costoActual;
      this.porcentaje = porcentaje!;
      this.precio = Producto.calcularPrecioDesdeCostoYMargen(this.costo, this.porcentaje);
      return;
    }

    if (!precioViene && cambiaCosto && margenActual !== undefined && margenActual !== null) {
      // Cambió solo el costo: el precio se re-deriva con el margen vigente (P1-73).
      this.costo = costo!;
      this.precio = Producto.calcularPrecioDesdeCostoYMargen(this.costo, margenActual);
      return;
    }

    if (cambiaPrecio) {
      // Se fijó un precio: el margen se recalcula hacia atrás.
      if (costo !== undefined) this.costo = costo;
      this.precio = redondear(precio!, 2);
      this.porcentaje = Producto.calcularMargenImplicito(this.costo ?? 0, this.precio);
      if (this.porcentaje > Producto.MAX_PORCENTAJE) {
        throw new BadRequestException(
          `El margen resultante (${this.porcentaje}%) supera el m\u00e1ximo permitido (${Producto.MAX_PORCENTAJE}%).`,
        );
      }
      return;
    }

    if (costo !== undefined) {
      this.costo = costo;
    }
  }

  /**
   * Regla de dominio: "stock bajo".
   * Un producto entra en alerta cuando su stock actual es menor o igual a su
   * stock minimo (solamente si utiliza el control de stock minimo).
   */
  static estaBajoMinimo(instancia: Producto): boolean {
    if (!instancia.utilizaStockMinimo) return false;
    return (instancia.stock ?? 0) <= (instancia.stockMinimo ?? 0);
  }

  /**
   * API de instancia (lenguaje ubicuo): mismo comportamiento que el metodo estatico.
   */
  estaBajoMinimo(): boolean {
    return Producto.estaBajoMinimo(this);
  }

  /**
   * Regla de dominio: "ajuste de stock".
   * - Todo ajuste requiere un motivo obligatorio.
   * - El stock no puede quedar negativo.
   * Aplica el cambio de stock sobre la instancia, registra el evento de dominio
   * StockActualizado y, si al quedar por debajo del minimo, ademas StockBajo.
   */
  static aplicarAjusteDeStock(
    instancia: Producto,
    cantidad: number,
    motivo: string,
    tipoMovimiento: TipoMovimiento = TipoMovimiento.AJUSTE,
  ): void {
    if (typeof motivo !== 'string' || motivo.trim().length === 0) {
      throw new BadRequestException(
        'El motivo del ajuste de stock es obligatorio.',
      );
    }

    const stockAnterior = instancia.stock ?? 0;
    const nuevoStock = stockAnterior + cantidad;

    if (nuevoStock < 0) {
      throw new BadRequestException('El stock no puede quedar negativo.');
    }

    instancia.stock = nuevoStock;

    Producto.registrarEvento(
      instancia,
      new StockActualizadoEvent(
        instancia.id,
        stockAnterior,
        nuevoStock,
        tipoMovimiento,
        motivo,
      ),
    );

    if (Producto.estaBajoMinimo(instancia)) {
      Producto.registrarEvento(
        instancia,
        new StockBajoEvent(
          instancia.id,
          instancia.denominacion,
          nuevoStock,
          instancia.stockMinimo ?? 0,
        ),
      );
    }
  }

  /**
   * API de instancia (lenguaje ubicuo): mismo comportamiento que el metodo estatico.
   */
  ajustarStock(
    cantidad: number,
    motivo: string,
    tipoMovimiento: TipoMovimiento = TipoMovimiento.AJUSTE,
  ): void {
    Producto.aplicarAjusteDeStock(this, cantidad, motivo, tipoMovimiento);
  }

  /**
   * Coleccion de eventos de dominio generados por la entidad.
   * No se persiste: la capa de aplicacion los desapila y despacha.
   */
  private _eventos: DomainEvent[] = [];

  private static registrarEvento(instancia: Producto, evento: DomainEvent): void {
    const instanciaComoCualquiera = instancia as any;
    if (!Array.isArray(instanciaComoCualquiera._eventos)) {
      instanciaComoCualquiera._eventos = [];
    }
    instanciaComoCualquiera._eventos.push(evento);
  }

  static sacarEventos(instancia: Producto): DomainEvent[] {
    const instanciaComoCualquiera = instancia as any;
    if (!Array.isArray(instanciaComoCualquiera._eventos)) return [];
    const eventos = [...instanciaComoCualquiera._eventos];
    instanciaComoCualquiera._eventos = [];
    return eventos;
  }

  /**
   * API de instancia (lenguaje ubicuo): mismo comportamiento que el metodo estatico.
   */
  sacarEventos(): DomainEvent[] {
    return Producto.sacarEventos(this);
  }

  @OneToMany(() => HistorialPrecio, (historial) => historial.producto)
  historialPrecios: HistorialPrecio[];
}
