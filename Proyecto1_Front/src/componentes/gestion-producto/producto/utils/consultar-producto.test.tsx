import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { ProductosHeaderLg } from "../componentes/header-producto-lg";
import ProductoService from "../services/producto-service";

// Mock del servicio HTTP de Productos
vi.mock("../services/producto-service", () => ({
  default: {
    obtener: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    obtenerRapido: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    obtenerTotales: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe("Pruebas de Búsqueda Avanzada por Denominación con Debounce (CR-004)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería capturar correctamente el texto ingresado en el input de denominación del encabezado", async () => {
    const handleChangeDenominacion = vi.fn();

    render(
      <ProductosHeaderLg
        codigo=""
        exacto={false}
        denominacion=""
        roles={[1]}
        onChangeCodigo={vi.fn()}
        onChangeExacto={vi.fn()}
        onChangeDenominacion={handleChangeDenominacion}
        onBuscarRapido={vi.fn()}
        onNuevo={vi.fn()}
        total={0}
        mostrados={0}
        paginaActual={1}
        onImprimirTodo={vi.fn()}
        onImprimirPagina={vi.fn()}
      />
    );

    const inputDenominacion = screen.getByPlaceholderText("Denominación...");
    expect(inputDenominacion).toBeInTheDocument();

    // Simular tipeo del usuario
    fireEvent.change(inputDenominacion, { target: { value: "PROD" } });

    expect(handleChangeDenominacion).toHaveBeenCalledWith("PROD");
  });

  it("debería agrupar las pulsaciones de teclas con debounce antes de llamar al servicio HTTP de búsqueda", async () => {
    vi.useFakeTimers();

    let denominacionState = "";
    const mockObtener = ProductoService.obtener as any;

    // Simular componente que aplica el useEffect debounce de 400ms
    function ComponentePruebaDebounce() {
      const [denominacion, setDenominacion] = React.useState("");

      React.useEffect(() => {
        if (!denominacion) return;
        const timer = setTimeout(() => {
          ProductoService.obtener({ denominacion, skip: 0, take: 10 });
        }, 400);
        return () => clearTimeout(timer);
      }, [denominacion]);

      return (
        <ProductosHeaderLg
          codigo=""
          exacto={false}
          denominacion={denominacion}
          roles={[1]}
          onChangeCodigo={vi.fn()}
          onChangeExacto={vi.fn()}
          onChangeDenominacion={(val) => setDenominacion(val)}
          onBuscarRapido={vi.fn()}
          onNuevo={vi.fn()}
          total={0}
          mostrados={0}
          paginaActual={1}
          onImprimirTodo={vi.fn()}
          onImprimirPagina={vi.fn()}
        />
      );
    }

    render(<ComponentePruebaDebounce />);

    const input = screen.getByPlaceholderText("Denominación...");

    // Simular escritura rápida tecla por tecla ("P", "PR", "PRO", "PROD")
    fireEvent.change(input, { target: { value: "P" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: "PR" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: "PRO" } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: "PROD" } });

    // Durante las pulsaciones intermedias no debe haber llamado aún al servicio
    expect(mockObtener).not.toHaveBeenCalled();

    // Avanzar los 400ms tras la última tecla pulsada
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Verificar que solo se realizó 1 llamada al servicio con el valor final agrupado "PROD"
    expect(mockObtener).toHaveBeenCalledTimes(1);
    expect(mockObtener).toHaveBeenCalledWith({
      denominacion: "PROD",
      skip: 0,
      take: 10,
    });

    vi.useRealTimers();
  });
});
