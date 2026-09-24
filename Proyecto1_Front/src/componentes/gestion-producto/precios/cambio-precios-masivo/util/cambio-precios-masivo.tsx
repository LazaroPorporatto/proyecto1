import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "../../../../ui/Card";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../../herramientas/alertas/alertas";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../../herramientas/alertas/alertas-confirmacion";
import { ConsultarProductosCambioPreciosMasivo } from "../../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { formatPrice, formatPercentage, formatCantidades } from "../../../../herramientas/formateo-de-campos/fucion-formateo";
import { Column } from "../../../../herramientas/tablas/tabla-flexible-ag-grid";
import { useConfiguracionSistema } from "../../../../sistema/ConfiguracionSistemaContext";
import { useFiltrosContext } from "../../../../../context/filtros-contesxt";
import ProductoService from "../../../producto/services/producto-service";
import CambioPreciosManual from "../cambio-precios.manual";
import { useCatalogosContext } from "../../../../../context/catalogos-context";
import { getUsuarioId } from "../../../../../utils/auth";
import { useCambioPrecios } from "../hooks/useCambioPrecios";
import TablaCambioPrecios from "../componentes/tabla-cambio-precios";
import FiltrosCambioPrecios from "../componentes/filtros-cambio-precios";

export default function CambioPreciosMasivo() {
  const [error, setError] = useState<string | null>(null);
  const [mostrarActualizarProducto, setMostrarActualizarProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ConsultarProductosCambioPreciosMasivo>(
    {} as ConsultarProductosCambioPreciosMasivo
  );

  const usuarioId = getUsuarioId();
  const { configuracion } = useConfiguracionSistema();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const {
    setFiltrosNecesarios,
    valoresFiltros,
    setValoresFiltros,
    limpiarFiltros,
    setBuscar,
  } = useFiltrosContext();

  const {
    productos,
    loading,
    setProductos,
    buscarProductos,
    aplicarCambios,
    guardarCambios,
    actualizarProductoLocal,
  } = useCambioPrecios(usuarioId);

  const { marcas, lineas, setLineas, setMarcas } = useCatalogosContext();

  useEffect(() => {
    limpiarFiltros();
    setBuscar({ cont: 0, componente: "cambio-precios-masivo" });
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

  const handleAbrirActualizarProducto = useCallback(
    (producto: ConsultarProductosCambioPreciosMasivo) => {
      setProductoSeleccionado(producto);
      setMostrarActualizarProducto(true);
    },
    []
  );

  const handleCerrarActualizarProducto = useCallback(() => {
    setMostrarActualizarProducto(false);
    setProductoSeleccionado({} as ConsultarProductosCambioPreciosMasivo);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      const confirmed = await showConfirmation({
        type: TipoAlertaConfirmacion.DESTRUCTIVE,
        title: TituloAlertaConfirmacion.DESTRUCTIVE,
        message: "¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        onConfirm: () => {},
      });
      if (!confirmed) return;

      try {
        setProductos((prev) => prev.filter((p) => p.id !== id));
        addAlert({
          type: TipoAlerta.SUCCESS,
          title: TituloAlerta.SUCCESS,
          message: "El elemento ha sido eliminado.",
          autoClose: true,
          duration: 3000,
        });
      } catch {
        addAlert({
          type: TipoAlerta.ERROR,
          title: TituloAlerta.ERROR,
          message: "No se puede eliminar este elemento.",
          autoClose: true,
          duration: 3000,
        });
      }
    },
    [showConfirmation, setProductos, addAlert]
  );

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

  const handleActualizarSuccess = useCallback(
    (productoActualizado: ConsultarProductosCambioPreciosMasivo) => {
      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: `El producto ${productoActualizado.denominacion} se ha actualizado correctamente.`,
        autoClose: true,
        duration: 3000,
      });
      actualizarProductoLocal(productoActualizado);
      setMostrarActualizarProducto(false);
    },
    [addAlert, actualizarProductoLocal]
  );

  const handleGuardarCambios = useCallback(
    async (motivo: string) => {
      if (!motivo || !motivo.trim()) {
        addAlert({
          type: TipoAlerta.ERROR,
          title: TituloAlerta.ERROR,
          message: "Debe ingresar un motivo para guardar los cambios.",
          autoClose: true,
          duration: 3000,
        });
        return;
      }

      const productosParaGuardar = productos.filter(
        (p) => p.dirty && p.nuevoPrecio !== null
      );
      const productosInvalidos = productos.filter((p) => p.error);

      if (productosParaGuardar.length === 0) {
        addAlert({
          type: TipoAlerta.WARNING,
          title: TituloAlerta.WARNING,
          message:
            "No se guardó ningún cambio: todos los precios resultantes son inválidos (quedan negativos o por debajo del costo). Revisá los errores en rojo y corregí el ajuste.",
          autoClose: false,
        });
        return;
      }

      const response = await guardarCambios(motivo);

      if (productosInvalidos.length > 0) {
        addAlert({
          type: TipoAlerta.WARNING,
          title: TituloAlerta.WARNING,
          message: `Se guardaron ${productosParaGuardar.length} producto(s), pero ${productosInvalidos.length} producto(s) quedaron sin actualizar por precios no válidos (revisá los errores en rojo).`,
          autoClose: false,
        });
        return;
      }

      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: response.mensaje,
        autoClose: true,
        duration: 3000,
      });
    },
    [guardarCambios, addAlert, productos]
  );

  const columns = useMemo<Column<ConsultarProductosCambioPreciosMasivo>[]>(
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
        header: "Stock",
        accessor: "stock",
        flex: 0.5,
        type: "text",
        align: "right",
        editable: false,
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
        flex: 0.4,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value }) => <span>{formatPercentage(value)}</span>,
      },
      {
        header: "Nuevo Precio (sin IVA)",
        accessor: "nuevoPrecio",
        flex: 0.6,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value, row }) => (
          <span className={row.error ? "text-red-500" : "text-green-600"}>
            {value !== null && value !== undefined ? formatPrice(value, "ARS") : "—"}
          </span>
        ),
      },
      {
        header: "Nuevo Precio (c/IVA)",
        accessor: "nuevoPrecioConIva",
        flex: 0.6,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value, row }) => (
          <span className={row.error ? "text-red-500" : "text-green-600"}>
            {value !== null && value !== undefined ? formatPrice(value, "ARS") : "—"}
          </span>
        ),
      },
      {
        header: "Nuevo Margen %",
        accessor: "nuevoPorcentaje",
        flex: 0.5,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value, row }) => (
          <span className={row.error ? "text-red-500" : "text-green-600"}>
            {value !== null && value !== undefined ? formatPercentage(value) : "—"}
          </span>
        ),
      },
      {
        header: "Estado",
        accessor: "error",
        flex: 0.7,
        type: "text",
        editable: false,
        scrollable: false,
        formatFunction: ({ value }) => (
          <span className={value ? "text-red-500 font-medium" : "text-gray-400"}>
            {value ?? ("" as string)}
          </span>
        ),
      },
    ],
    []
  );

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
                ambito={valoresFiltros.lineaId ? "linea" : "global"}
                productosLength={productos.length}
                onBuscar={() =>
                  buscarProductos({
                    denominacion: valoresFiltros.denominacion ?? "",
                    marcaId: valoresFiltros.marcaId,
                    lineaId: valoresFiltros.lineaId,
                  })
                }
                onAplicarCambios={aplicarCambios}
                onGuardarCambios={handleGuardarCambios}
                fetchMarcas={fetchMarcas}
                fetchLineas={fetchLineas}
                onLimpiarFiltros={handleLimpiarFiltros}
              />
              <CardContent className="p-0">
                <TablaCambioPrecios
                  productos={productos}
                  columns={columns}
                  onEditar={handleAbrirActualizarProducto}
                  onEliminar={handleDelete}
                />
              </CardContent>
            </Card>

            <Alertas alerts={alerts} onRemove={removeAlert} />
            <AlertasConfirmacion />
          </>
        )}
      </div>

      {mostrarActualizarProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative p-6 sm:p-8 rounded-lg shadow-lg w-4/5 sm:w-3/5 md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-full">
            <CambioPreciosManual
              producto={productoSeleccionado}
              onClose={handleCerrarActualizarProducto}
              onSuccess={handleActualizarSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
