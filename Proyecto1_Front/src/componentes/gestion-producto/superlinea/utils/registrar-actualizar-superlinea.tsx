import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Card, CardContent, CardFooter } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import FormInput from "../../../herramientas/formateo-de-campos/form-input";
import { FormValues, schema, transformData } from "../interfaces/interfaces-validaciones-superlinea";
import SuperLineaService from "../services/superlinea-service";
import { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { Layers } from "lucide-react";
import { parseApiError } from "../../../../utils/errores";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { getUsuarioId } from "../../../../utils/auth";
import EncabezadoFormularios from "../../../ui/encabezadoFormularios";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";

export default function RegistrarActualizarSuperLineaForm({
  superLinea,
  onClose,
  onSuccess,
}: {
  superLinea?: Superlinea;
  onClose: () => void;
  onSuccess: (mensajeAlerta: string) => void;
}) {
  const usuarioId = getUsuarioId();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema(false)) as any,
    defaultValues: superLinea
      ? transformData(superLinea)
      : { utilizaStockMinimo: false, stockMinimo: 0 },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    setError,
  } = methods;

  useEffect(() => {
    if (superLinea) {
      setValue("denominacion", superLinea.denominacion || "");
      setValue("observacion", superLinea.observacion || null);
    }
  }, [superLinea, setValue]);

  const onSubmit = async (formData: FormValues) => {
    let response: ResponsePost;
    try {
      const dataToSend = {
        ...formData,
        utilizaStockMinimo: formData.utilizaStockMinimo ?? false,
        stockMinimo: formData.stockMinimo ?? 0,
      };

      if (superLinea) {
        const payload = { ...dataToSend, usuarioUpdatedId: usuarioId };
        response = await SuperLineaService.actualizar(superLinea.id, payload);
      } else {
        const payload = { ...dataToSend, usuarioCreatedId: usuarioId };
        response = await SuperLineaService.nuevo(payload);
      }
      onClose();
      onSuccess(response.mensaje);
    } catch (error) {
      setError("root", { type: "manual", message: parseApiError(error) });
    }
  };

  const handleOnClose = async () => {
    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DEFAULT,
      title: TituloAlertaConfirmacion.DEFAULT,
      message: "¿Estás seguro de que quieres cerrar el formulario? NO se guardarán los cambios.",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });
    if (confirmed) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto py-5">
      <Card className="relative w-full max-w-2xl bg-white mx-auto shadow-lg rounded-lg overflow-hidden mt-10 mb-12">
        <EncabezadoFormularios
          title={superLinea ? "Actualizar SuperLínea" : "Registrar SuperLínea"}
          subtitle={superLinea ? "Modifica los detalles de la superlínea." : "Ingresa los datos de la nueva superlínea."}
          icon={<Layers className="form-icon" />}
          onClose={handleOnClose}
        />

        <fieldset disabled={superLinea?.sistema === 1}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid grid-cols-1 gap-4 px-6 py-4">
                <div>
                  <FormInput name="denominacion" label="Denominación" placeholder="Ingresa la denominación" />
                </div>

                <div>
                  <FormInput name="observacion" label="Observación" placeholder="Ingresa una observación (opcional)" />
                </div>
              </CardContent>
              {errors.root?.message && (
                <div className="text-red-600 text-center mb-4">{String(errors.root.message)}</div>
              )}

              <CardFooter className="flex justify-center">
                <Button type="submit" disabled={isSubmitting} className="btn btn-dark">
                  {isSubmitting
                    ? superLinea
                      ? "Actualizando..."
                      : "Registrando..."
                    : superLinea
                    ? "Actualizar"
                    : "Registrar"}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </fieldset>
      </Card>

      <AlertasConfirmacion />
    </div>
  );
}
