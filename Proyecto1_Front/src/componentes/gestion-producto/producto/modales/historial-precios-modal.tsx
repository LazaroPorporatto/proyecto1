import { useEffect, useState } from "react";
import ProductoService from "../services/producto-service";
import { HistorialPrecioCr007 } from "../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";
import { formatPrice } from "../../../herramientas/formateo-de-campos/fucion-formateo";

interface Props {
  productoId: number;
  onClose: () => void;
}

export function HistorialPreciosModal({ productoId, onClose }: Props) {
  const [items, setItems] = useState<HistorialPrecioCr007[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    ProductoService.obtenerHistorialPrecios(productoId)
      .then((response) => {
        if (activo) setItems(response.data);
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar el historial de precios.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [productoId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Historial de precios</h2>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900">
            Cerrar
          </button>
        </div>

        {loading && <p>Cargando historial...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && items.length === 0 && <p>No hay cambios de precio registrados.</p>}

        {!loading && !error && items.length > 0 && (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Fecha</th>
                <th className="p-2">Precio anterior</th>
                <th className="p-2">Precio nuevo</th>
                <th className="p-2">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{new Date(item.fecha).toLocaleString()}</td>
                  <td className="p-2">{formatPrice(item.precioAnterior)}</td>
                  <td className="p-2">{formatPrice(item.precioNuevo)}</td>
                  <td className="p-2">{item.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
