import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CantidadColumn } from 'src/modules/common/decorators/cantidad-column.decorator';
import { TipoMovimiento } from '../../enums/tipo-movimiento.enum';

@Entity('movimiento_stock')
export class MovimientoStock {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Index()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty({ enum: TipoMovimiento })
  @Column({ type: 'enum', enum: TipoMovimiento })
  tipoMovimiento: TipoMovimiento;

  // Variación en unidades (con signo: + aumenta stock, - disminuye stock)
  @ApiProperty()
  @CantidadColumn()
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'text' })
  motivo: string;

  @ApiProperty()
  @CantidadColumn()
  stockAnterior: number;

  @ApiProperty()
  @CantidadColumn()
  stockNuevo: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  usuarioCreatedId?: number | null;

  static crear(data: {
    productoId: number;
    tipoMovimiento: TipoMovimiento;
    cantidad: number;
    motivo: string;
    stockAnterior: number;
    stockNuevo: number;
  }): MovimientoStock {
    const movimiento = new MovimientoStock();
    movimiento.productoId = data.productoId;
    movimiento.tipoMovimiento = data.tipoMovimiento;
    movimiento.cantidad = data.cantidad;
    movimiento.motivo = data.motivo;
    movimiento.stockAnterior = data.stockAnterior;
    movimiento.stockNuevo = data.stockNuevo;
    return movimiento;
  }
}