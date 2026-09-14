import { createCrudService } from "../../../../utils/crudFactory";
import { FormValues } from "../interfaces/interfaces-validaciones-superlinea";

const baseService = createCrudService<FormValues>("superlinea");

const SuperLineaService = {
  ...baseService,
};

export default SuperLineaService;
