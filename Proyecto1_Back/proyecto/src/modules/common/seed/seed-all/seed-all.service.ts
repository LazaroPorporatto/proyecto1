import { Injectable, Logger } from '@nestjs/common';
import { SeedOrganizacionService } from '../seed-organizacion/seed-organizacion.service';
import { SeedFamiliaProductoService } from '../seedFamiliaProducto/seed-familia-producto.service';
import { SeedUsuarioService } from '../seed-usuario/seed-usuario.service';
import { SeedProductoService } from '../seedProducto/seed-producto.service';
import { SeedPresentacionService } from '../seed-presentacion/seed-presentacion.service';

export interface SeedStepResult {
  paso: string;
  ok: boolean;
  error?: string;
}

export interface SeedAllResult {
  ok: boolean;
  pasos: SeedStepResult[];
}

@Injectable()
export class SeedAllService {
  private readonly logger = new Logger(SeedAllService.name);

  constructor(
    private readonly seedUsuarioService: SeedUsuarioService,
    private readonly seedOrganizacionService: SeedOrganizacionService,
    private readonly seedArticuloService: SeedFamiliaProductoService,
    private readonly seedPresentacionService: SeedPresentacionService,
    private readonly seedProductoService: SeedProductoService,
  ) {}

  /**
   * Cada paso se aísla: si uno falla, el resto sigue igual. Antes un solo
   * throw cortaba toda la cadena y el endpoint respondía 200 con
   * "todos los seeds ejecutados" teniendo la base a medio cargar.
   */
  async runAllSeeds(): Promise<SeedAllResult> {
    this.logger.log('Ejecutando todos los seeds...');

    const pasos: SeedStepResult[] = [
      { paso: 'usuarios', ok: true },
      { paso: 'organizacion', ok: true },
      { paso: 'familia-producto', ok: true },
      { paso: 'presentacion', ok: true },
      { paso: 'producto', ok: true },
    ];

    const ejecutar = async (
      indice: number,
      accion: () => Promise<unknown>,
    ): Promise<void> => {
      try {
        await accion();
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : String(error);
        pasos[indice] = { paso: pasos[indice].paso, ok: false, error: mensaje };
        this.logger.error(`Fallo el seed "${pasos[indice].paso}": ${mensaje}`);
      }
    };

    // El orden importa: usuario (id 1) -> organizacion -> familia (lineas y
    // marcas) -> presentacion -> producto, que depende de todo lo anterior.
    await ejecutar(0, () => this.seedUsuarioService.runAllSeeds());
    await ejecutar(1, () => this.seedOrganizacionService.runAllSeeds());
    await ejecutar(2, () => this.seedArticuloService.runAllSeeds());
    await ejecutar(3, () => this.seedPresentacionService.runAllSeeds());
    await ejecutar(4, () => this.seedProductoService.runAllSeeds());

    const fallidos = pasos.filter((p) => !p.ok);

    if (fallidos.length > 0) {
      this.logger.error(
        `Seeds finalizados con errores en: ${fallidos
          .map((p) => p.paso)
          .join(', ')}`,
      );
      return { ok: false, pasos };
    }

    this.logger.log('Todos los seeds han sido ejecutados correctamente.');
    return { ok: true, pasos };
  }
}
