import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CardContent, CardFooter } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import FormInput from "../../../herramientas/formateo-de-campos/form-input";
import React from "react";
import { Card } from "../../../ui/Card";
import { FormValues, schema, transformData } from "../interfaces/interfaces-validaciones-linea";
import LineaService from "../services/linea-service";
import SuperLineaService from "../../superlinea/services/superlinea-service";
import { Linea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

import { Layers, PlusCircle } from "lucide-react";
import { parseApiError } from "../../../../utils/errores";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { getUsuarioId } from "../../../../utils/auth";
import EncabezadoFormularios from "../../../ui/encabezadoFormularios";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import RegistrarActualizarSuperLineaForm from "../../superlinea/utils/registrar-actualizar-superlinea";

export default function RegistrarActualizarLineaForm({
  linea,
  onClose,
  onSuccess,
}: {
  linea?: Linea;
  onClose: () => void;
  onSuccess: (mensajeAlerta: string) => void;
}) {
  const usuarioId = getUsuarioId();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();
  const [superLineas, setSuperLineas] = useState<Superlinea[]>([]);
  const [mostrarFormularioSuperLinea, setMostrarFormularioSuperLinea] = useState(false);

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema(false)) as any,
    defaultValues: linea ? transformData(linea) : {},
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    setError,
    register,
  } = methods;

  const fetchSuperLineas = async () => {
    try {
      const resSuperLineas = await SuperLineaService.obtener({ skip: 0, take: 100 });
      setSuperLineas(resSuperLineas?.data || resSuperLineas || []);
    } catch (error) {
      console.error("Error al obtener las SuperLíneas:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchSuperLineas();

        if (linea) {
          setValue("denominacion", linea.denominacion || "");
          setValue("superLineaId", linea.superLinea?.id || (linea as any).superLineaId || linea.superlinea?.id || 0);
          setValue("observacion", linea.observacion || null);
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (formData: FormValues) => {
    let response: ResponsePost;
    try {
      if (linea) {
        const payload = { ...formData, usuarioUpdatedId: usuarioId };
        response = await LineaService.actualizar(linea.id, payload);
      } else {
        const payload = { ...formData, usuarioCreatedId: usuarioId };
        response = await LineaService.nuevo(payload);
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
      message: "¿Estás seguro de que quieres cerrar el formulario? NO se guardaran los cambios.",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
      onConfirm: () => { },
    });
    if (confirmed) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto py-5">
      <Card className="relative w-full max-w-7xl bg-white mx-auto shadow-lg rounded-lg overflow-hidden mt-10 mb-12">
        <EncabezadoFormularios
          title={linea ? "Actualizar Línea" : "Registrar Línea"}
          subtitle={linea ? "Modifica los detalles de la línea." : "Ingresa los datos de la nueva línea."}
          icon={<Layers className="form-icon" />}
          onClose={handleOnClose}
        />

        <fieldset disabled={linea?.sistema === 1}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-6 py-4">
                <div className="lg:col-span-2">
                  <FormInput name="denominacion" label="Denominación" placeholder="Ingresa la denominación" />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SuperLínea <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      {...register("superLineaId", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione una SuperLínea...</option>
                      {superLineas.map((sl) => (
                        <option key={sl.id} value={sl.id}>
                          {sl.denominacion}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={() => setMostrarFormularioSuperLinea(true)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center shrink-0"
                      title="Agregar SuperLínea"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </Button>
                  </div>
                  {errors.superLineaId && (
                    <p className="mt-1 text-xs text-red-600">{String(errors.superLineaId.message)}</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <FormInput name="observacion" label="Observación" placeholder="Ingresa una observación (opcional)" />
                </div>
              </CardContent>
              {errors.root?.message && (
                <div className="text-red-600 text-center mb-4">{String(errors.root.message)}</div>
              )}

              <CardFooter className="flex justify-center">
                <Button type="submit" disabled={isSubmitting} className="btn btn-dark">
                  {isSubmitting ? (linea ? "Actualizando..." : "Registrando...") : linea ? "Actualizar" : "Registrar"}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </fieldset>
      </Card>

      {mostrarFormularioSuperLinea && (
        <RegistrarActualizarSuperLineaForm
          onClose={() => setMostrarFormularioSuperLinea(false)}
          onSuccess={() => {
            setMostrarFormularioSuperLinea(false);
            fetchSuperLineas();
          }}
        />
      )}

      <AlertasConfirmacion />
    </div>
  );
}

