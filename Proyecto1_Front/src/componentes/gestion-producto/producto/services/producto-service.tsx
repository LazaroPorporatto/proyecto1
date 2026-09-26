import axios from "axios";
import axiosConfig from "../../../../utils/axiosConfig";

import { createCrudService } from "../../../../utils/crudFactory";
import { FormValues } from "../interfaces/interfaces-validaciones-item-prod-alternativo";
import ApiService from "../../../../utils/apiService";
import { UnidadPresentacion } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { HistorialPrecioResponse } from "../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";


const apiUrl = axiosConfig.apiUrl;

const baseService = createCrudService<FormValues>("producto");

const ProductoService = {
  ...baseService,

  
  obtenerMobile: async (filtros: any) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { data } = await axios.get(`${apiUrl}/producto/search-by-mobile`, { headers, params: filtros });

      return data;
    } catch (error) {
      throw error;
    }
  },

  actualizarPreciosProducto: async (id: number, payload: any) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log(">> PATCH iniciado a:", `${apiUrl}/producto/${id}/precios`);
      console.log(">> Payload PATCH:", payload);

      const result = await axios.patch(`${apiUrl}/producto/${id}/precios`, payload, { headers });
      console.log(">> PATCH terminado con éxito:", result);
      return result;
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw error;
    }
  },

  obtenerHistorialPrecios: async (
    id: number,
    skip = 0,
    take = 10,
  ): Promise<HistorialPrecioResponse> => {
    return ApiService.get(`/producto/${id}/historial-precios`, { skip, take });
  },

  calcularPreciosConPorcentaje: async (
    productoId: number,
    baseImponible: number,
    porcentajeOcasional: number,
    porcentajeMayorista: number,
    porcentajeCliente: number,
  ) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const body = {
        productoId,
        baseImponible,
        porcentajeOcasional,
        porcentajeMayorista,
        porcentajeCliente,
      };

      const { data } = await axios.post(`${apiUrl}/producto/calcular-precio-item`, body, { headers });

      console.log("Respuesta de la API en calcular importes:", data);
      return data;
    } catch (error) {
      console.error("Error al calcular precios:", error);
      return null;
    }
  },

  calcularPreciosEnCrearProducto: async (
    alicuotaIva: number,
    baseImponible: number,
    porcentajeOcasional: number,
    porcentajeMayorista: number,
    porcentajeCliente: number,
  ) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const body = {
        alicuotaIva,
        baseImponible,
        porcentajeOcasional,
        porcentajeMayorista,
        porcentajeCliente,
      };

      const { data } = await axios.post(`${apiUrl}/producto/calcular-precio-item-from-nuevo`, body, { headers });

      console.log("Respuesta de la API en calcular importes:", data);
      return data;
    } catch (error) {
      console.error("Error al calcular precios:", error);
      return null;
    }
  },

  calcularPrecioConFlete: async (
    precio: number,
    tipo: number,
    valor: number,
  ): Promise<{ precioConFlete: number }> => {
    const token = localStorage.getItem("Token");
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
    const { data } = await axios.post(
      `${apiUrl}/producto/calcular-precio-con-flete`,
      { precio, tipo, valor },
      { headers },
    );
    return data;
  },

  /**
   * CR-005: pide al backend una denominación sugerida a partir de
   * Marca + Línea + Presentación. No persiste nada.
   */
  sugerirDenominacion: async (
    marcaId: number,
    lineaId: number,
    unidadPresentacion?: UnidadPresentacion,
    cantidadPresentacion?: number,
    presentacionId?: number,
  ): Promise<{ denominacion: string } | null> => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params: any = { marcaId, lineaId };
      if (presentacionId) params.presentacionId = presentacionId;
      if (unidadPresentacion) params.unidadPresentacion = unidadPresentacion;
      if (cantidadPresentacion !== undefined) params.cantidadPresentacion = cantidadPresentacion;

      const { data } = await axios.get(`${apiUrl}/producto/sugerir-denominacion`, {
        headers,
        params,
      });

      return data;
    } catch (error) {
      console.error("Error al sugerir denominación:", error);
      return null;
    }
  },
};

export default ProductoService;