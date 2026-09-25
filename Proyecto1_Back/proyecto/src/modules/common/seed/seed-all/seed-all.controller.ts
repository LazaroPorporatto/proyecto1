import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SeedAllService } from './seed-all.service';

@Controller('seed-all')
export class SeedAllController {
  private readonly logger = new Logger(SeedAllController.name);

  constructor(private readonly seedService: SeedAllService) {}

  @Get('execute')
  async executeSeed() {
    this.logger.log('Ejecutando todos los seeds...');
    const resultado = await this.seedService.runAllSeeds();

    // Antes devolvia 200 siempre, incluso con la base a medio cargar.
    if (!resultado.ok) {
      const detalle = resultado.pasos
        .filter((p) => !p.ok)
        .map((p) => `${p.paso}: ${p.error}`)
        .join(' | ');

      this.logger.error(`Seeds finalizados con errores -> ${detalle}`);

      throw new HttpException(
        {
          message: `Los seeds se ejecutaron con errores. ${detalle}`,
          ok: false,
          pasos: resultado.pasos,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return resultado;
  }
}
