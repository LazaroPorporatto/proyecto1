import { Controller, Get, Logger } from '@nestjs/common';
import { SeedProductoService } from './seed-producto.service';

@Controller('seed-producto')
export class SeedProductoController {
  constructor(private readonly seedService: SeedProductoService) {}

  private readonly logger = new Logger(SeedProductoController.name);

  @Get('execute')
  executeSeed() {
    this.logger.log('Ejecutando seed de productos...');
    return this.seedService.runAllSeeds();
  }
}