export class PaginacionUtils {
  static totalPaginas(totalRegistros: number, cantidadPorPagina: number): number {
    const total = Math.ceil(totalRegistros / cantidadPorPagina);
    return total;
  }

  static totalItems(totalRegistros: number): number {
    return totalRegistros;
  }
};
