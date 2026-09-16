import { Search, Package, Check, Save, Eraser } from "lucide-react";
import { useState, useMemo } from "react";
import Select from "react-select";
import { CardHeader, CardTitle } from "../../../../ui/Card";
import { Input } from "../../../../ui/Input";
import { Button } from "../../../../ui/Button";

type TipoAjuste = "porcentaje" | "monto";

const opcionesTipo = [
  { value: "porcentaje", label: "Porcentaje (%)" },
  { value: "monto", label: "Monto ($)" },
];

type Props = {
    valoresFiltros: any;
    setValoresFiltros: any;
    marcas: any[];
    lineas: any[];
    ambito: string;
    productosLength: number;
    onBuscar: () => void;
    onAplicarCambios: (tipo: TipoAjuste, valor: number) => void;
    onGuardarCambios: (motivo: string) => void;
    fetchMarcas: () => void;
    fetchLineas: () => void;
    onLimpiarFiltros: () => void;
};

const stylesSelect = {
  control: (base: any) => ({
    ...base,
    color: "black",
    minWidth: "200px",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "black",
  }),
  option: (base: any, { isSelected, isFocused }: any) => ({
    ...base,
    color: isSelected ? "white" : "black",
    backgroundColor: isSelected ? "#3b82f6" : isFocused ? "#93c5fd" : "white",
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
};

const inputCls =
  "bg-white dark:bg-slate-600 border-gray-300 dark:border-slate-500 focus:border-blue-500 focus:ring-blue-500";

const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400";

export default function FiltrosCambioPrecios({
  valoresFiltros,
  setValoresFiltros,
  marcas,
  lineas,
  ambito,
  productosLength,
  onBuscar,
  onAplicarCambios,
  onGuardarCambios,
  fetchMarcas,
  fetchLineas,
  onLimpiarFiltros
}: Props) {
  const [tipo, setTipo] = useState<TipoAjuste>("porcentaje");
  const [valor, setValor] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");

  const valorNumerico = useMemo(() => {
    const numero = parseFloat(valor.replace(",", "."));
    return Number.isFinite(numero) ? numero : 0;
  }, [valor]);

  const terminoMarca = (valoresFiltros.denominacionMarca ?? "").toLowerCase();
  const marcasVisibles = (marcas ?? [])
    .filter((m) => (m.denominacion ?? "").toLowerCase().includes(terminoMarca));

  const terminoLinea = (valoresFiltros.denominacionLinea ?? "").toLowerCase();
  const lineasVisibles = (lineas ?? [])
    .filter((l) => (l.denominacion ?? "").toLowerCase().includes(terminoLinea));

  const puedeAplicar = productosLength > 0;

  return (
    <CardHeader className="flex flex-col gap-4 p-4">
      <CardTitle className="flex items-center space-x-2">
        <Package className="consultar-icon" />
        <span>Productos</span>
      </CardTitle>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className={labelCls}>Descripción</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Descripción del producto..."
              className={`pl-10 w-72 ${inputCls}`}
              value={valoresFiltros.denominacion ?? ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onBuscar();
                }
              }}
              onChange={(e) =>
                setValoresFiltros({
                  ...valoresFiltros,
                  denominacion: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Marca</label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar marca..."
                className={`pl-10 w-40 ${inputCls}`}
                value={valoresFiltros.denominacionMarca}
                onChange={(e) =>
                  setValoresFiltros({
                    ...valoresFiltros,
                    denominacionMarca: e.target.value,
                  })
                }
              />
            </div>
            <Select
              value={(marcas ?? []).find((option) => option.id === valoresFiltros.marcaId) || null}
              options={marcasVisibles}
              getOptionLabel={(option) => option.denominacion}
              getOptionValue={(option) => String(option.id)}
              onChange={(option) =>
                setValoresFiltros({
                  ...valoresFiltros,
                  marcaId: option ? option.id : undefined,
                })
              }
              placeholder="Seleccione una marca"
              className="text-black"
              menuPortalTarget={document.body}
              styles={stylesSelect}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Línea</label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar línea..."
                className={`pl-10 w-40 ${inputCls}`}
                value={valoresFiltros.denominacionLinea ?? ""}
                onChange={(e) =>
                  setValoresFiltros({
                    ...valoresFiltros,
                    denominacionLinea: e.target.value,
                  })
                }
              />
            </div>
            <Select
              value={(lineas ?? []).find((option) => option.id === valoresFiltros.lineaId) || null}
              options={lineasVisibles}
              getOptionLabel={(option) => option.denominacion}
              getOptionValue={(option) => String(option.id)}
              onChange={(option) =>
                setValoresFiltros({
                  ...valoresFiltros,
                  lineaId: option ? option.id : undefined,
                })
              }
              placeholder="Seleccione una linea"
              className="text-black"
              menuPortalTarget={document.body}
              styles={stylesSelect}
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onBuscar}
          className="bg-blue-500 text-white hover:bg-blue-800"
          title="Buscar Productos"
        >
          <Search className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          onClick={onLimpiarFiltros}
          className="bg-gray-500 text-white hover:bg-gray-700"
          title="Limpiar filtros"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="space-y-1">
          <label className={labelCls}>Ajuste</label>
          <Select
            value={opcionesTipo.find((opcion) => opcion.value === tipo) || null}
            options={opcionesTipo}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            onChange={(option) => setTipo((option?.value as TipoAjuste) ?? "porcentaje")}
            placeholder="Tipo de ajuste"
            className="text-black"
            isDisabled={!puedeAplicar}
            menuPortalTarget={document.body}
            styles={stylesSelect}
          />
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Valor</label>
          <Input
            type="number"
            step="0.01"
            placeholder={tipo === "porcentaje" ? "Valor %" : "Valor $"}
            className={`${inputCls}`}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            disabled={!puedeAplicar}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => onAplicarCambios(tipo, valorNumerico)}
          className={`${
            puedeAplicar
              ? "bg-blue-500 text-white hover:bg-blue-800"
              : "bg-gray-400 text-gray-600 cursor-not-allowed"
          }`}
          title="Aplicar Cambios"
          disabled={!puedeAplicar}
        >
          <Check className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-[220px] space-y-1">
          <label className={labelCls}>Motivo</label>
          <Input
            type="text"
            placeholder="Motivo (obligatorio para guardar)"
            className={`${inputCls}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={!puedeAplicar}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => onGuardarCambios(motivo)}
          className="bg-green-500 text-white hover:bg-green-700"
          title="Guardar Cambios"
          disabled={!puedeAplicar}
        >
          <Save className="w-4 h-4" />
        </Button>

        {ambito === "linea" ? (
          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 rounded">
            Ámbito: Línea seleccionada
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded">
            Ámbito: Global
          </span>
        )}
      </div>
    </CardHeader>
  );
}