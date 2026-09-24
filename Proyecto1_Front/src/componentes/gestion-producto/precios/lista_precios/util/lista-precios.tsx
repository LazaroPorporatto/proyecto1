import { useState, useEffect, useMemo, useCallback } from "react";
import { formatPrice, formatPercentage, formatCantidades } from "../../../../herramientas/formateo-de-campos/fucion-formateo";
import { Column } from "../../../../herramientas/tablas/tabla-flexible-ag-grid";
import { Card, CardContent, CardHeader } from "../../../../ui/Card";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../../herramientas/alertas/alertas";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../../herramientas/alertas/alertas-confirmacion";
import { ConsultarProductosListaPrecios } from "../../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { useConfiguracionSistema } from "../../../../sistema/ConfiguracionSistemaContext";
import { useFiltrosContext } from "../../../../../context/filtros-contesxt";
import CambioPreciosMasivoService from "../service/lista-precios-service";
import ProductoService from "../../../producto/services/producto-service";
import { useCatalogosContext } from "../../../../../context/catalogos-context";
import { getUsuarioId } from "../../../../../utils/auth";
import { useCambioPrecios } from "../hooks/useCambioPrecios";
import TablaCambioPrecios from "../componentes/tabla-cambio-precios";
import FiltrosCambioPrecios from "../componentes/filtros-cambio-precios";
import { ColumnasImprimir } from "../../../../herramientas/reutilizables/columnas-imprimir";

export default function ListaPrecios() {
  const columns = useMemo<Column<ConsultarProductosListaPrecios>[]>(
    () => [
      {
        header: "Código",
        accessor: "codigoProveedor",
        flex: 0.4,
        type: "text",
        align: "right",
        editable: false,
        scrollable: false,
      },
      {
        header: "Denominación",
        accessor: "denominacion",
        flex: 1.3,
        type: "text",
        editable: false,
        scrollable: false,
        formatFunction: ({ value, row }) => (
          <div className="flex flex-col">
            <div
              className="flex items-center gap-1 truncate whitespace-nowrap max-w-[700px]"
              title={
                typeof value === "string"
                  ? `${value}${row.observacion ? `\n${row.observacion}` : ""}`
                  : undefined
              }
            >
              <span>{value}</span>
            </div>
            {row.observacion && (
              <div className="text-sm text-gray-500 truncate max-w-[700px]">{row.observacion}</div>
            )}
          </div>
        ),
      },
      {
        header: "Línea",
        accessor: "lineaDenominacion",
        flex: 0.6,
        type: "text",
        editable: false,
        scrollable: false,
        formatFunction: ({ value }) => <span>{value ?? "—"}</span>,
      },
      {
        header: "Stock",
        accessor: "stock",
        flex: 0.5,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value, row }) => {
          const bajo = row.enStockBajo ?? (row.stock ?? 0) <= (row.stockMinimo ?? 0);
          const faltante = (row.stockMinimo ?? 0) - (row.stock ?? 0);
          return bajo ? (
            <span className="text-red-600 font-semibold">
              {formatCantidades(value || 0)}
              {faltante > 0 && <span className="text-red-500 text-xs font-normal"> (faltan {formatCantidades(faltante)})</span>}
            </span>
          ) : (
            <span>{formatCantidades(value || 0)}</span>
          );
        },
      },
      {
        header: "Costo",
        accessor: "costo",
        flex: 0.5,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value }) => <span>{formatPrice(value, "ARS")}</span>,
      },
      {
        header: "Precio (sin IVA)",
        accessor: "precio",
        flex: 0.6,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value }) => <span>{formatPrice(value, "ARS")}</span>,
      },
      {
        header: "Precio (c/IVA)",
        accessor: "precioConIva",
        flex: 0.6,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value }) => <span>{formatPrice(value, "ARS")}</span>,
      },
      {
        header: "Margen %",
        accessor: "porcentaje",
        flex: 0.5,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value }) => <span>{formatPercentage(value)}</span>,
      },
    ],
    []
  );

  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState<string[]>(
    columns.map((col) => col.accessor as string)
  );
  const [error, setError] = useState<string | null>(null);

  const usuarioId = getUsuarioId();
  const { configuracion } = useConfiguracionSistema();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { AlertasConfirmacion } = useConfirmation();

  const columnasParaImprimir = useMemo(
    () => columns.filter((col) => columnasSeleccionadas.includes(col.accessor as string)),
    [columns, columnasSeleccionadas]
  );

  const {
    setFiltrosNecesarios,
    valoresFiltros,
    setValoresFiltros,
    limpiarFiltros,
    setBuscar,
  } = useFiltrosContext();

  const { productos, loading, setProductos, buscarProductos } = useCambioPrecios(usuarioId);

  const { marcas, lineas, setLineas, setMarcas } = useCatalogosContext();

  useEffect(() => {
    limpiarFiltros();
    setBuscar({ cont: 0, componente: "lista-precios" });
    setFiltrosNecesarios({ marca: true, linea: true, sublinea: false });
  }, []);

  const fetchMarcas = useCallback(async () => {
    setError(null);
    try {
      const marcasTotales = await ProductoService.obtenerTotales(
        { denominacion: valoresFiltros.denominacionMarca || "" },
        "marcas"
      );
      const ordenadas = [...(marcasTotales.data ?? [])].sort((a: any, b: any) =>
        (a.denominacion ?? "").localeCompare(b.denominacion ?? "")
      );
      setMarcas(ordenadas);
    } catch {
      setError("No se pudieron cargar las marcas.");
    }
  }, [valoresFiltros.denominacionMarca]);

  const fetchLineas = useCallback(async () => {
    setError(null);
    try {
      const lineasTotales = await ProductoService.obtenerTotales(
        { denominacion: valoresFiltros.denominacionLinea || "" },
        "lineas"
      );
      const ordenadas = [...(lineasTotales.data ?? [])].sort((a: any, b: any) =>
        (a.denominacion ?? "").localeCompare(b.denominacion ?? "")
      );
      setLineas(ordenadas);
    } catch {
      setError("No se pudieron cargar las líneas.");
    }
  }, [valoresFiltros.denominacionLinea]);

  useEffect(() => {
    fetchMarcas();
    fetchLineas();
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setValoresFiltros({
      denominacion: "",
      denominacionMarca: "",
      denominacionLinea: "",
      marcaId: undefined,
      lineaId: undefined,
    });
    setProductos([]);
  }, [setValoresFiltros, setProductos]);

  const handleImprimir = useCallback(async () => {
    const columnasParaEnviar = columns
      .filter((col) => columnasSeleccionadas.includes(col.accessor as string))
      .map((col) => ({
        accessor: col.accessor,
        header: col.header,
        type: col.type,
      }));

    const payload = {
      columnas: columnasParaEnviar,
      marcaId: valoresFiltros.marcaId,
      lineaId: valoresFiltros.lineaId,
      subLineaId: valoresFiltros.sublineaId,
      usuarioId: getUsuarioId(),
    };

    const pdfBlob = await CambioPreciosMasivoService.imprimirListaPrecios(payload);
    const fileURL = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
    window.open(fileURL, "_blank");
  }, [columns, columnasSeleccionadas, valoresFiltros]);

  return (
    <div className="w-full">
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <p className="text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <Card className="border-gray-200 dark:border-slate-700">
              <FiltrosCambioPrecios
                valoresFiltros={valoresFiltros}
                setValoresFiltros={setValoresFiltros}
                marcas={marcas}
                lineas={lineas}
                productosLength={productos.length}
                onBuscar={() =>
                  buscarProductos({
                    denominacion: valoresFiltros.denominacion ?? "",
                    marcaId: valoresFiltros.marcaId,
                    lineaId: valoresFiltros.lineaId,
                  })
                }
                fetchMarcas={fetchMarcas}
                fetchLineas={fetchLineas}
                onLimpiarFiltros={handleLimpiarFiltros}
              />

              <CardHeader>
                <ColumnasImprimir
                  columns={columns}
                  columnasSeleccionadas={columnasSeleccionadas}
                  onCambiarSeleccion={setColumnasSeleccionadas}
                  onImprimir={handleImprimir}
                />
              </CardHeader>

              <CardContent className="p-0">
                <TablaCambioPrecios productos={productos} columns={columnasParaImprimir} />
              </CardContent>
            </Card>

            <Alertas alerts={alerts} onRemove={removeAlert} />
            <AlertasConfirmacion />
          </>
        )}
      </div>
    </div>
  );
}
