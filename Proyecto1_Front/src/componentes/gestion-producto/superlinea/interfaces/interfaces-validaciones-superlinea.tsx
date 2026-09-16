import * as yup from "yup";
import { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

//===================== interfaces ============================================//

export interface FormValues {
  denominacion: string;
  observacion?: string | null;
  stockMinimo?: number;
  utilizaStockMinimo?: boolean;
}

//===================== schema de validacion ============================================//

export const schema = (utilizaStockMinimo: boolean) =>
  yup.object().shape({
    denominacion: yup
      .string()
      .trim()
      .lowercase()
      .required("La denominación es obligatoria.")
      .max(255, "Máximo 255 caracteres.")
      .matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/, "Solo se permiten letras, números y espacios."),
    observacion: yup.string().optional().nullable(),
    stockMinimo: yup.number().when([], {
      is: () => utilizaStockMinimo,
      then: (schema) => schema.required("El Stock mínimo es obligatorio.").moreThan(0, "El stock mínimo debe ser mayor a 0."),
      otherwise: (schema) => schema.optional(),
    }),
    utilizaStockMinimo: yup.boolean().optional(),
  });

//===================== transform data ============================================//

export const transformData = (superLinea: Superlinea): FormValues => {
  return {
    denominacion: superLinea.denominacion,
    observacion: superLinea.observacion ?? null,
  };
};
