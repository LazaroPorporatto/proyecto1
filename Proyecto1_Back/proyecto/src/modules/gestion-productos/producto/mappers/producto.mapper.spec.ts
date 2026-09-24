import { ProductoMapper } from './producto.mapper';
import { Producto } from '../domain/entities/producto.entity';
import { UnidadPresentacion } from '../enums/unidad-presentacion.enum';

function crearProducto(overrides: Partial<Producto> = {}): Producto {
  const base: any = {
    id: 1,
    denominacion: 'TEST GASEOSA 1L',
    observacion: 'obs',
    codigoProveedor: 'CP001',
    codigoReferencia: 'REF001',
    stock: 0,
    costo: 100,
    precio: 200,
    alicuotaIva: 21,
    porcentaje: 100,
    ubicacion: 'A1',
    utilizaStockMinimo: true,
    stockMinimo: 5,
    unidadPresentacion: UnidadPresentacion.UNIDAD,
    cantidadPresentacion: 1,
    sistema: 0,
    precioConIva: 242,
    linea: { id: 1, denominacion: 'LINEA A' },
    marca: { id: 1, denominacion: 'MARCA A' },
    ...overrides,
  };
  return base as Producto;
}

describe('ProductoMapper enStockBajo', () => {
  it('marca enStockBajo=true cuando el stock esta en (o por debajo de) el minimo', () => {
    const dto = ProductoMapper.toBusquedaDto(crearProducto({ stock: 5, stockMinimo: 5 }));
    expect(dto.enStockBajo).toBe(true);
  });

  it('marca enStockBajo=false cuando el stock esta por encima del minimo', () => {
    const dto = ProductoMapper.toBusquedaDto(crearProducto({ stock: 10, stockMinimo: 5 }));
    expect(dto.enStockBajo).toBe(false);
  });

  it('no alerta si el producto no utiliza stock minimo', () => {
    const dto = ProductoMapper.toBusquedaDto(
      crearProducto({ stock: 0, stockMinimo: 5, utilizaStockMinimo: false }),
    );
    expect(dto.enStockBajo).toBe(false);
  });

  it('expone enStockBajo tambien en toDto (edicion)', () => {
    const dto = ProductoMapper.toDto(crearProducto({ stock: 2, stockMinimo: 5 }));
    expect(dto.enStockBajo).toBe(true);
  });
});