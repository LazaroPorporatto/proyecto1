import { ProductoDenominacionService } from './producto-denominacion.service';
import { UnidadPresentacion } from '../../enums/unidad-presentacion.enum';

describe('ProductoDenominacionService', () => {
  let service: ProductoDenominacionService;

  beforeEach(() => {
    service = new ProductoDenominacionService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CR-005: generación de denominación sugerida', () => {
    it('combina Marca + Línea + Presentación cuando la presentación no es la de por defecto', () => {
      const resultado = service.generarDenominacionSugerida(
        'Coca-Cola',
        'Gaseosas',
        UnidadPresentacion.LITRO,
        1.5,
      );

      expect(resultado).toBe('Coca-Cola Gaseosas 1.5L');
    });

    it('omite el sufijo de presentación cuando es UNIDAD x 1 (caso por defecto)', () => {
      const resultado = service.generarDenominacionSugerida(
        'Marolio',
        'Arroz',
        UnidadPresentacion.UNIDAD,
        1,
      );

      expect(resultado).toBe('Marolio Arroz');
    });

    it('incluye el sufijo PACK con la cantidad correspondiente', () => {
      const resultado = service.generarDenominacionSugerida(
        'La Serenísima',
        'Lácteos',
        UnidadPresentacion.PACK,
        6,
      );

      expect(resultado).toBe('La Serenísima Lácteos 6PACK');
    });

    it('incluye el sufijo aunque la unidad sea UNIDAD, si la cantidad no es 1', () => {
      const resultado = service.generarDenominacionSugerida(
        'Marca',
        'Línea',
        UnidadPresentacion.UNIDAD,
        3,
      );

      expect(resultado).toBe('Marca Línea 3UNIDAD');
    });

    it('recorta espacios en blanco de Marca y Línea antes de combinar', () => {
      const resultado = service.generarDenominacionSugerida(
        '  Coca-Cola  ',
        '  Gaseosas  ',
        UnidadPresentacion.UNIDAD,
        1,
      );

      expect(resultado).toBe('Coca-Cola Gaseosas');
    });

    it('omite la Marca si viene vacía o indefinida, sin romper', () => {
      const resultado = service.generarDenominacionSugerida(
        '',
        'Gaseosas',
        UnidadPresentacion.UNIDAD,
        1,
      );

      expect(resultado).toBe('Gaseosas');
    });
  });
});