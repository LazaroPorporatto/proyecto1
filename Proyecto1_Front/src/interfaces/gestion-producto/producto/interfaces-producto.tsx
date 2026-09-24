import { SelectLinea } from "../linea/interfaces-linea";
import { SelectMarca } from "../marca/interfaces-marca";
import { SelectSublinea } from "../sublinea/interfaces-sublinea";
import { ItemProdAlternativo } from "./interfaces-item-prod-alternativo";
import { ItemProveedor } from "./interfaces-item-proveedor";

export enum UnidadPresentacion {
  UNIDAD = 'UNIDAD',
  LITRO = 'L',
  MILILITRO = 'ML',
  KILOGRAMO = 'KG',
  GRAMO = 'GR',
  PACK = 'PACK',
  CAJA = 'CAJA',
}

export interface Producto {
  //
  id: number;
  denominacion: string;
  codigoProveedor?: string | null;
  codigoReferencia?: string | null;
  codigoBarra?: string | null;
  stock?: number | null;
  alicuotaIva?: number | null;
  //ubicacion?: string | null;
  costo?: number | null;
  precio?: number | null;
  porcentaje?: number | null;
  //fechaCosto?: string | null;
 /*  costoEnDolar: boolean;
  costoDolar?: number | null;
  cotizacionDolar?: number | null;
  fechaCostoDolar?: string | null;
  precioConIva?: number | null;
  fechaPrecio?: string | null;
  fechaPrecioOferta?: string | null;
  destacado?: boolean | null;
  envioGratis?: boolean | null; */
  observacion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  usuarioCreatedId: number;
  usuarioDeletedId?: number | null;
  usuarioUpdatedId: number;
  linea: SelectLinea;
  marca: SelectMarca;
  /* itemsAlternativo?: ItemProdAlternativo[] | null;
  poseeAlternativos: boolean;
  esAlternativo: boolean; */
  sistema: number;
  /* sublinea: SelectSublinea;
  precioOcasionalConIva: number;
  precioMayoristaConIva: number;
  precioClienteConIva: number;
  precioOfertaConIva: number;
  presentacion: SelectPresentacion;
  itemsProveedor?: ItemProveedor[] | null;
 */
  stockMinimo: number;
  utilizaStockMinimo: boolean;
  enStockBajo?: boolean;
  unidadPresentacion: UnidadPresentacion;
  cantidadPresentacion: number;
 // oferta: boolean;
 // cantidadOferta: number;
 /*  porcentajeOcasional: number;
  porcentajeMayorista: number;
  porcentajeCliente: number;
  porcentajeOferta: number;
  cantidadOferta: number;
  precioOcasional: number;
  precioMayorista: number;
  precioCliente: number;
  precioOferta: number; */
}

export interface ConsultarProducto {
  id: number;
  denominacion: string;
  codigoProveedor: string;
  codigoReferencia: string;
  stock: number;
  stockMinimo: number;
  utilizaStockMinimo: boolean;
  enStockBajo: boolean;
  precio: number;
  precioOferta: number;
  ubicacion?: string | null;
  poseeAlternativos: boolean;
  esAlternativo: boolean;
  sistema: number;
  precioConIva: number;
  observacion: string;
  proveedor: string;
  precioOcasionalConIva: number;
  precioMayoristaConIva: number;
  precioClienteConIva: number;
  precioOfertaConIva: number;
}


export interface ConsultarProductosCambioPreciosMasivo {
  id: number;
  denominacion: string;
  codigoProveedor: string;
  observacion: string;
  costo: number;
  stock: number;
  stockMinimo: number;
  enStockBajo: boolean;
  precio: number;
  precioConIva: number;
  alicuotaIva: number;
  porcentaje: number;
  lineaId: number | null;
  lineaDenominacion: string | null;
  nuevoPrecio: number | null;
  nuevoPorcentaje: number | null;
  nuevoPrecioConIva: number | null;
  error: string | null;
  dirty: boolean;
}

export interface ConsultarProductosListaPrecios {
  id: number;
  denominacion: string;
  codigoProveedor: string;
  observacion: string;
  costo: number;
  stock: number;
  stockMinimo: number;
  enStockBajo: boolean;
  precio: number;
  precioConIva: number;
  alicuotaIva: number;
  porcentaje: number;
  lineaId: number | null;
  lineaDenominacion: string | null;
  nuevoPrecio: number | null;
  nuevoPorcentaje: number | null;
  nuevoPrecioConIva: number | null;
  error: string | null;
  dirty: boolean;
}


export interface SelectProdAlternativos {
  id: number;
  denominacion: string;
  precio: number;
  ubicacion: string;
  stock: number;
  precioConIva: number;
  esAlternativo: boolean;
  codigoProveedor: string;
  codigoProveedorDenominacion: string;
  proveedor: string;
}

export interface ProductoSeleccionado {
  id: number;
  denominacion: string;
  codigoProveedorDenominacion: string;
  codigoProveedor: string;
  codigoReferencia: string;
  ubicacion: string;
  stock: number;
  alicuota: number;
  precio: number;
  precioConIva: number;
  poseeAlternativos: boolean;
  esAlternativo: boolean;
  sistema: number;
  costo: number;
  costoDolar: number;
  observacion: string;
  proveedor: string;
  precioOcasionalConIva: number;
  precioMayoristaConIva: number;
  precioClienteConIva: number;
  precioOfertaConIva: number;
  precioOferta: number;
  precioOcasional: number;
  precioMayorista: number;
  precioCliente: number;
  porcentajeOcasional: number;
  porcentajeMayorista: number;
  porcentajeCliente: number;
  porcentajeOferta: number;
  unidadPresentacion: UnidadPresentacion;
  cantidadPresentacion: number;
  utilizaStockMinimo: boolean;
  stockMinimo: number;
  enStockBajo?: boolean;
  cantidadOferta: number;
  oferta: boolean;
}

export interface ProductoCombo {
  id: number;
  denominacion: string;
  precio: number;
  cantidad: number; 
}

export const TipoProducto = {
  NACIONAL: 0,
  IMPORTADO: 1,
};

export interface SelectPresentacion {
  id: number;
  denominacion: string;
}


export const TipoPrecioN = {
  OCASIONAL: 0,
  MAYORISTA: 2,
  CLIENTE: 1,
  OFERTA: 3,
  MANUAL: 4,
};

export const TipoPrecioS: Record<number, string> = {
  0: "OCASIONAL",
  2: "MAYORISTA",
  1: "CLIENTE",
  3: "OFERTA",
  4: "MANUAL",
};