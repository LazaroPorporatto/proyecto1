import { useState } from "react";
import CambioPreciosMasivoService from "../cambio-precios-masivo-service";
import { ConsultarProductosCambioPreciosMasivo } from "../../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { ResponsePost } from "../../../../../interfaces/generales/interfaces-generales";

export function useCambioPrecios(usuarioId: number | null) {
  const [productos, setProductos] =
    useState<ConsultarProductosCambioPreciosMasivo[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarProductos = async (filtros: any) => {
    setLoading(true);

    const productosFiltrados =
      await CambioPreciosMasivoService.obtenerDesde(
        filtros,
        "productos"
      );

    setProductos(productosFiltrados.data);
    setLoading(false);
  };

  const aplicarCambios = async (tipo: "porcentaje" | "monto", valor: number) => {
    setLoading(true);

    const payload = {
      tipo,
      valor,
      items: productos.map((producto) => ({ id: producto.id })),
    };

    const productosActualizados =
      await CambioPreciosMasivoService.aplicarCambios(payload);

    setProductos(
      productosActualizados.map((p: any) => ({ ...p, dirty: !p.error }))
    );
    setLoading(false);
  };

  const guardarCambios = async (motivo: string): Promise<ResponsePost> => {
    setLoading(true);

    const payload = {
      items: productos
        .filter((producto) => producto.dirty && producto.nuevoPrecio !== null)
        .map((producto) => ({
          id: producto.id,
          nuevoPrecio: producto.nuevoPrecio,
        })),
      motivo,
      usuarioCreatedId: usuarioId,
    };

    const response =
      await CambioPreciosMasivoService.guardarCambios(payload);

    setProductos((prev) =>
      prev.map((p) => ({ ...p, dirty: false }))
    );

    setLoading(false);

    return response;
  };

  const actualizarProductoLocal = (
   productoActualizado: ConsultarProductosCambioPreciosMasivo
   ) => {
   setProductos((prevProductos) =>
      prevProductos.map((p) =>
         p.id === productoActualizado.id
         ? { ...productoActualizado, dirty: true }
         : p
      )
   );
   };

  return {
    productos,
    loading,
    setProductos,
    buscarProductos,
    aplicarCambios,
    guardarCambios,
    actualizarProductoLocal
  };
}