import { BadRequestException } from '@nestjs/common';
import { Producto } from './producto.entity';
import { StockActualizadoEvent } from '../events/stock-actualizado.event';
import { StockBajoEvent } from '../events/stock-bajo.event';
import { TipoMovimiento } from '../../enums/tipo-movimiento.enum';

const crearProducto = (overrides: Partial<Producto> = {}): Producto => {
  return Object.assign(new Producto(), {
    id: 1,
    denominacion: 'Producto Test',
    precio: 100,
    costo: 80,
    porcentaje: 25,
    alicuotaIva: 21,
    ...overrides,
  });
};

describe('Producto - Regla Precio = Costo + Margen (P1-73)', () => {
  describe('calcularPrecioDesdeCostoYMargen', () => {
    it('caso estandar del dominio: costo 1000, margen 15% -> 1150', () => {
      expect(Producto.calcularPrecioDesdeCostoYMargen(1000, 15)).toBe(1150);
    });

    it('caso margen especial del dominio: costo 1000, margen 25% -> 1250', () => {
      expect(Producto.calcularPrecioDesdeCostoYMargen(1000, 25)).toBe(1250);
    });

    it('redondea a 2 decimales', () => {
      expect(Producto.calcularPrecioDesdeCostoYMargen(333.33, 10)).toBe(366.66);
    });
  });

  describe('calcularMargenImplicito', () => {
    it('de costo 80 a precio 100 el margen implicito es 25%', () => {
      expect(Producto.calcularMargenImplicito(80, 100)).toBe(25);
    });

    it('sin costo cargado no se recalcula y devuelve 0', () => {
      expect(Producto.calcularMargenImplicito(0, 100)).toBe(0);
    });
  });

  describe('fijarCostoYMargen', () => {
    it('fija costo y margen y deriva el precio de venta', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15 });
      producto.fijarCostoYMargen(1000, 25);
      expect(producto.costo).toBe(1000);
      expect(producto.porcentaje).toBe(25);
      expect(producto.precio).toBe(1250);
    });
  });

  describe('resolverCostoPrecioYMargen', () => {
    it('al crear con margen deriva el precio (fuente: el margen)', () => {
      const producto = new Producto();
      producto.resolverCostoPrecioYMargen(1000, 15, undefined);
      expect(producto.precio).toBe(1150);
      expect(producto.porcentaje).toBe(15);
    });

    it('al crear ignora un precio incoherente cuando viene el margen', () => {
      const producto = new Producto();
      producto.resolverCostoPrecioYMargen(1000, 25, 9999);
      expect(producto.precio).toBe(1250);
    });

    it('al crear con solo precio recalcula el margen implicito', () => {
      const producto = new Producto();
      producto.resolverCostoPrecioYMargen(1000, undefined, 1150);
      expect(producto.precio).toBe(1150);
      expect(producto.porcentaje).toBe(15);
    });

    it('al editar cambiando solo el margen re-deriva el precio', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15, precio: 1150 });
      producto.resolverCostoPrecioYMargen(undefined, 25, 1150);
      expect(producto.precio).toBe(1250);
      expect(producto.porcentaje).toBe(25);
    });

    it('al editar cambiando solo el precio recalcula el margen hacia atras', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15, precio: 1150 });
      producto.resolverCostoPrecioYMargen(undefined, 15, 1250);
      expect(producto.precio).toBe(1250);
      expect(producto.porcentaje).toBe(25);
    });

    it('al editar cambiando solo el costo re-deriva el precio con el margen vigente', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15, precio: 1150 });
      producto.resolverCostoPrecioYMargen(1200, undefined, undefined);
      expect(producto.precio).toBe(1380);
      expect(producto.porcentaje).toBe(15);
    });

    it('si cambian margen y precio a la vez, manda el margen (P1-73)', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15, precio: 1150 });
      producto.resolverCostoPrecioYMargen(undefined, 25, 999);
      expect(producto.precio).toBe(1250);
    });

    it('margen idéntico y precio distinto se interpreta como edición de precio', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15, precio: 1150 });
      producto.resolverCostoPrecioYMargen(undefined, 15, 1100);
      expect(producto.precio).toBe(1100);
      expect(producto.porcentaje).toBe(10);
    });

    it('si no llega nada de costo/margen/precio no toca los valores', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15, precio: 1150 });
      producto.resolverCostoPrecioYMargen(undefined, undefined, undefined);
      expect(producto.precio).toBe(1150);
      expect(producto.porcentaje).toBe(15);
    });

    it('margen 0 con precio explicito en alta: manda el precio (no lo pisa)', () => {
      const producto = new Producto();
      producto.resolverCostoPrecioYMargen(1000, 0, 1150);
      expect(producto.precio).toBe(1150);
      expect(producto.porcentaje).toBe(15);
    });
  });
});

describe('Producto - Reglas de dominio de stock y eventos (P1-29 / P1-31)', () => {
  describe('calcularPrecio', () => {
    it('calcula Precio = Costo + Margen', () => {
      const producto = crearProducto({ costo: 1000, porcentaje: 15 });
      expect(producto.calcularPrecio()).toBe(1150);
    });

    it('redondea a 2 decimales', () => {
      const producto = crearProducto({ costo: 333.33, porcentaje: 10 });
      expect(producto.calcularPrecio()).toBe(366.66);
    });

    it('devuelve 0 cuando no hay costo cargado', () => {
      const producto = crearProducto({ costo: 0, porcentaje: 15 });
      expect(producto.calcularPrecio()).toBe(0);
    });
  });

  describe('estaBajoMinimo', () => {
    it('menor o igual al minimo queda en alerta (5 = 5)', () => {
      const producto = crearProducto({
        stock: 5,
        stockMinimo: 5,
        utilizaStockMinimo: true,
      });
      expect(producto.estaBajoMinimo()).toBe(true);
    });

    it('no queda en alerta por encima del minimo', () => {
      const producto = crearProducto({
        stock: 6,
        stockMinimo: 5,
        utilizaStockMinimo: true,
      });
      expect(producto.estaBajoMinimo()).toBe(false);
    });

    it('sin control de stock minimo nunca queda en alerta', () => {
      const producto = crearProducto({
        stock: 0,
        stockMinimo: 0,
        utilizaStockMinimo: false,
      });
      expect(producto.estaBajoMinimo()).toBe(false);
    });
  });

  describe('ajustarStock', () => {
    it('incrementa el stock', () => {
      const producto = crearProducto({ stock: 10 });
      producto.ajustarStock(3, 'Compra');
      expect(producto.stock).toBe(13);
    });

    it('decrementa el stock', () => {
      const producto = crearProducto({ stock: 10 });
      producto.ajustarStock(-2, 'Venta');
      expect(producto.stock).toBe(8);
    });

    it('rechaza un ajuste sin motivo', () => {
      const producto = crearProducto({ stock: 10 });
      expect(() => producto.ajustarStock(1, '')).toThrow(BadRequestException);
      expect(() => producto.ajustarStock(1, undefined as any)).toThrow(
        BadRequestException,
      );
      expect(producto.stock).toBe(10);
    });

    it('rechaza un ajuste que deja el stock negativo sin modificar el stock', () => {
      const producto = crearProducto({ stock: 5 });
      expect(() => producto.ajustarStock(-6, 'Venta')).toThrow(
        'El stock no puede quedar negativo.',
      );
      expect(producto.stock).toBe(5);
    });
  });

  describe('eventos de dominio al ajustar stock', () => {
    it('emite StockActualizado en cada cambio de stock', () => {
      const producto = crearProducto({ stock: 10 });
      producto.ajustarStock(3, 'Compra');
      const eventos = producto.sacarEventos();
      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
      expect((eventos[0] as StockActualizadoEvent).stockAnterior).toBe(10);
      expect((eventos[0] as StockActualizadoEvent).stockNuevo).toBe(13);
      expect((eventos[0] as StockActualizadoEvent).motivo).toBe('Compra');
    });

    it('emite StockBajo cuando tras el ajuste queda menor o igual al minimo', () => {
      const producto = crearProducto({
        stock: 8,
        stockMinimo: 5,
        utilizaStockMinimo: true,
      });
      producto.ajustarStock(-3, 'Venta');
      expect(producto.stock).toBe(5);
      const eventos = producto.sacarEventos();
      expect(eventos).toHaveLength(2);
      expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
      expect(eventos[1]).toBeInstanceOf(StockBajoEvent);
      expect(
        (eventos[1] as StockBajoEvent).productoId,
      ).toBe(1);
    });

    it('no emite StockBajo cuando tras el ajuste sigue por encima del minimo', () => {
      const producto = crearProducto({
        stock: 10,
        stockMinimo: 5,
        utilizaStockMinimo: true,
      });
      producto.ajustarStock(-3, 'Venta'); // queda en 7
      const eventos = producto.sacarEventos();
      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
    });

    it('sacarEventos desapila los eventos', () => {
      const producto = crearProducto({ stock: 10 });
      producto.ajustarStock(1, 'Compra');
      producto.sacarEventos();
      expect(producto.sacarEventos()).toHaveLength(0);
    });
  });

  describe('regla de dominio aplicada sobre instancias livianas', () => {
    it('aplicarAjusteDeStock funciona sobre objetos planos tipo Producto', () => {
      const productoPlano = { id: 1, stock: 5, denominacion: 'Test' } as any;
      Producto.aplicarAjusteDeStock(productoPlano, 3, 'Compra');
      expect(productoPlano.stock).toBe(8);
      const eventos = Producto.sacarEventos(productoPlano);
      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toBeInstanceOf(StockActualizadoEvent);
      expect(
        (eventos[0] as StockActualizadoEvent).tipoMovimiento,
      ).toBe(TipoMovimiento.AJUSTE);
    });

    it('aplicarAjusteDeStock rechaza stock negativo en instancias livianas', () => {
      const productoPlano = { id: 1, stock: 5 } as any;
      expect(() =>
        Producto.aplicarAjusteDeStock(productoPlano, -6, 'Venta'),
      ).toThrow('El stock no puede quedar negativo.');
      expect(productoPlano.stock).toBe(5);
    });
  });
});