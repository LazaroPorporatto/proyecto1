import { ConsultarProductosCambioPreciosMasivo } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { Card, CardContent, CardFooter, } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Layers } from "lucide-react";
import PriceInput from "../../../herramientas/formateo-de-campos/price-input";
import { useEffect } from "react";
import { formatPrice, formatPercentage } from "../../../herramientas/formateo-de-campos/fucion-formateo";

const redondear = (num: number): number =>
  Math.round((num + Number.EPSILON) * 100) / 100;

const schema = yup.object({
  nuevoPrecio: yup
    .number()
    .typeError("El nuevo precio debe ser un número válido.")
    .moreThan(0, "El nuevo precio debe ser mayor a 0.")
    .required("El nuevo precio es obligatorio."),
}).required();

type FormValues = yup.InferType<typeof schema>;

export default function CambioPreciosManual({
  producto,
  onSuccess,
  onClose,
}: {
  producto: ConsultarProductosCambioPreciosMasivo;
  onSuccess: (productoActualizado: ConsultarProductosCambioPreciosMasivo) => void;
  onClose: () => void;
}) {
  //===================== CONSTANTES VARIAS ============================================

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      nuevoPrecio: producto.nuevoPrecio ?? producto.precio ?? 0,
    },
  });

  const {
    handleSubmit,
    setValue,
    setError,
    watch,
  } = methods;

  const nuevoPrecio = watch("nuevoPrecio");

  useEffect(() => {
    if (producto) {
      setValue(
        "nuevoPrecio",
        producto.nuevoPrecio ?? producto.precio ?? 0
      );
    }
  }, [producto, setValue]);

  const onSubmit = async (formData: FormValues) => {
    if (producto.costo > 0 && formData.nuevoPrecio < producto.costo) {
      setError("root", {
        type: "manual",
        message: "El nuevo precio no puede ser menor al costo del producto.",
      });
      return;
    }

    try {
      const productoActualizado: ConsultarProductosCambioPreciosMasivo = {
        ...producto,
        nuevoPrecio: formData.nuevoPrecio,
        nuevoPorcentaje: null,
        nuevoPrecioConIva: redondear(
          formData.nuevoPrecio * (1 + (producto.alicuotaIva ?? 0) / 100)
        ),
        error: null,
        dirty: true, // ✅ Marcamos el producto como modificado
      };

      onSuccess(productoActualizado);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      setError("root", {
        type: "manual",
        message: String(error),
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 sm:p-4">
      <Card className="w-full max-w-4xl bg-white mx-auto shadow-lg rounded-2xl overflow-hidden relative mt-10 mb-12">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          &times;
        </button>

        <div className="form-header">
          <button onClick={onClose} className="btn-onClose-title-form">
            &times;
          </button>

          <h2 className="form-title">
            <Layers className="form-icon" />
            <span>Cambio Precio Manual</span>
          </h2>
          <p className="form-subtitle">
            Ingresa el nuevo precio (sin IVA) a asignarle al producto.
          </p>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-3 px-4 sm:px-6 md:px-10 py-3 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Código</label>
                  <input
                    type="text"
                    value={producto.codigoProveedor}
                    onChange={() => {}}
                    className="bg-white text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>

                <div className="flex flex-col flex-grow sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Producto</label>
                  <input
                    type="text"
                    value={producto.denominacion}
                    onChange={() => {}}
                    className="bg-white text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Costo</label>
                  <input
                    type="text"
                    value={formatPrice(producto.costo, "ARS")}
                    onChange={() => {}}
                    className="bg-white text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Precio actual (sin IVA)</label>
                  <input
                    type="text"
                    value={formatPrice(producto.precio, "ARS")}
                    onChange={() => {}}
                    className="bg-white text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Precio actual (con IVA)</label>
                  <input
                    type="text"
                    value={formatPrice(producto.precioConIva, "ARS")}
                    onChange={() => {}}
                    className="bg-white text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Margen actual</label>
                  <input
                    type="text"
                    value={formatPercentage(producto.porcentaje)}
                    onChange={() => {}}
                    className="bg-white text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>

                <div className="flex flex-col lg:col-span-2">
                  <PriceInput
                    name="nuevoPrecio"
                    label="Nuevo Precio (sin IVA)"
                    value={nuevoPrecio || 0}
                    onChange={(value) => setValue("nuevoPrecio", Number(value))}
                  />
                </div>

                <div className="flex flex-col lg:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nuevo Precio (con IVA)</label>
                  <input
                    type="text"
                    value={formatPrice(
                      redondear((nuevoPrecio || 0) * (1 + (producto.alicuotaIva ?? 0) / 100)),
                      "ARS"
                    )}
                    onChange={() => {}}
                    className="bg-gray-100 text-black border rounded px-2 py-1 w-full"
                    disabled
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Observación</label>
                <textarea
                  value={producto.observacion}
                  onChange={() => {}}
                  className="bg-white text-black border rounded px-2 py-1 min-h-[80px]"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-center gap-2 py-3">
              {(methods.formState.errors.root?.message || methods.formState.errors.nuevoPrecio?.message) && (
                <span className="text-red-500 text-sm font-medium">
                  {methods.formState.errors.root?.message ?? methods.formState.errors.nuevoPrecio?.message}
                </span>
              )}
              <Button
                type="submit"
                className="btn btn-dark"
              >
                Confirmar
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}