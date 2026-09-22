import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Producto } from './producto.entity';

@Entity('historial_precio')
@Index(['productoId', 'fecha'])
export class HistorialPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'producto_id', type: 'int' })
  productoId: number;

  @ManyToOne(() => Producto, (producto) => producto.historialPrecios, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  precioAnterior: number;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  precioNuevo: number;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  fecha: Date;

  @Column({ type: 'varchar', length: 500 })
  motivo: string;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId?: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;
}
