import { formatCantidades } from "../../../herramientas/formateo-de-campos/fucion-formateo";

export function formatearCeldaStock({ value, row }: { value: number | string; row: any }) {
  const bajo =
    row.enStockBajo ??
    (row.utilizaStockMinimo && (row.stock ?? 0) <= (row.stockMinimo ?? 0));
  const faltante = (row.stockMinimo ?? 0) - (row.stock ?? 0);
  return bajo ? (
    <span className="text-red-600 font-semibold">
      {formatCantidades(value || 0)}
      {faltante > 0 && (
        <span className="text-red-500 text-xs font-normal">
          {" "}
          (faltan {formatCantidades(faltante)})
        </span>
      )}
    </span>
  ) : (
    <span>{formatCantidades(value || 0)}</span>
  );
}