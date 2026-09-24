import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateHistorialPrecio1787269586539 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'historial_precio',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'producto_id', type: 'int' },
          { name: 'precioAnterior', type: 'decimal', precision: 15, scale: 5 },
          { name: 'precioNuevo', type: 'decimal', precision: 15, scale: 5 },
          {
            name: 'fecha',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          { name: 'motivo', type: 'varchar', length: '500' },
          { name: 'usuario_id', type: 'int', isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'historial_precio',
      new TableForeignKey({
        name: 'FK_historial_precio_producto',
        columnNames: ['producto_id'],
        referencedTableName: 'producto',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'historial_precio',
      new TableForeignKey({
        name: 'FK_historial_precio_usuario',
        columnNames: ['usuario_id'],
        referencedTableName: 'usuario',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'historial_precio',
      new TableIndex({
        name: 'IDX_historial_precio_producto_fecha',
        columnNames: ['producto_id', 'fecha'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('historial_precio');
  }
}
