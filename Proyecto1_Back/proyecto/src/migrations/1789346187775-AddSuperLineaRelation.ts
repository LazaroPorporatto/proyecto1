import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperLineaRelation1789346187775 implements MigrationInterface {
    name = 'AddSuperLineaRelation1789346187775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`linea\` ADD \`superLineaId\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`linea\` DROP COLUMN \`superLineaId\``);
    }

}
