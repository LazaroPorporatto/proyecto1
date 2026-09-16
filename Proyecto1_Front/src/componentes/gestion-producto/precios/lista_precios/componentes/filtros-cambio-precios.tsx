import { Search, Package, Eraser } from "lucide-react";
import Select from "react-select";
import { CardHeader, CardTitle } from "../../../../ui/Card";
import { Input } from "../../../../ui/Input";
import { Button } from "../../../../ui/Button";

type Props = { 
    valoresFiltros: any; 
    setValoresFiltros: any; 
    marcas: any[]; 
    lineas: any[]; 
    productosLength: number; 
    onBuscar: () => void; 
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
  onBuscar,
  fetchMarcas,
  fetchLineas,
  onLimpiarFiltros
}: Props) {
  const terminoMarca = (valoresFiltros.denominacionMarca ?? "").toLowerCase();
  const marcasVisibles = (marcas ?? []).filter((m) =>
    (m.denominacion ?? "").toLowerCase().includes(terminoMarca)
  );

  const terminoLinea = (valoresFiltros.denominacionLinea ?? "").toLowerCase();
  const lineasVisibles = (lineas ?? []).filter((l) =>
    (l.denominacion ?? "").toLowerCase().includes(terminoLinea)
  );

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
    </CardHeader>
  );
}