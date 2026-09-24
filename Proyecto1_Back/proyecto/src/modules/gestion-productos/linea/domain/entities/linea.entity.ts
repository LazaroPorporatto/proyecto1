import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { Producto } from '../../../producto/domain/entities/producto.entity';
import { SuperLinea } from '../../../superlinea/domain/entities/super-linea.entity';
import { ManyToOne, JoinColumn } from 'typeorm';
import { CantidadColumn } from 'src/modules/common/decorators/cantidad-column.decorator';

@Entity('linea')
@Index(['denominacion', 'deletedAt'], { unique: true })
export class Linea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  denominacion: string;

  @Column({ type: 'text', nullable: true })
  observacion?: string;

  @OneToMany(() => Producto, (producto) => producto.linea)
  productos: Producto[];

  @ManyToOne(() => SuperLinea, (superLinea) => superLinea.lineas, {
    nullable: false,
  })
  @JoinColumn({ name: 'super_linea_id' })
  superLinea: SuperLinea;

  @Column({ name: 'super_linea_id', type: 'int', nullable: false })
  superLineaId: number;
 
  @Column('boolean', { default: false })
  utilizaStockMinimo: boolean;

  @CantidadColumn()
  stockMinimo: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ type: 'int', nullable: true })
  usuarioCreatedId?: number;

  @Column({ type: 'int', nullable: true })
  usuarioDeletedId?: number;

  @Column({ type: 'int', nullable: true })
  usuarioUpdatedId?: number;

  @Column({ type: 'int', default: 0 })
  sistema: number;
}
