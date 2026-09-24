import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import RegistrarActualizarLineaForm from "../../linea/utils/registrar-actualizar-linea";
import SuperLineaService from "../../superlinea/services/superlinea-service";
import LineaService from "../../linea/services/linea-service";

// Mock de servicios HTTP
vi.mock("../../superlinea/services/superlinea-service", () => ({
  default: {
    obtener: vi.fn(),
  },
}));

vi.mock("../../linea/services/linea-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", () => ({
  getUsuarioId: () => 1,
}));

describe("Prueba de Alta Rápida en Cascada: Producto -> Línea -> SuperLínea", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (SuperLineaService.obtener as any).mockResolvedValue({
      data: [{ id: 1, denominacion: "SuperLínea Base" }],
    });
  });

  it("debería permitir abrir el modal de Alta Rápida de SuperLínea desde el formulario de Línea", async () => {
    // Renderizar el modal de Línea (que es invocado desde Registrar Producto)
    render(
      <RegistrarActualizarLineaForm
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // 1. Verificar modal de Línea
    expect(screen.getByText("Registrar Línea")).toBeInTheDocument();

    // Esperar carga del selector de SuperLíneas
    await waitFor(() => {
      expect(SuperLineaService.obtener).toHaveBeenCalled();
    });

    // 2. Hacer clic en el botón '+' del selector de SuperLíneas
    const botonPlusSuperLinea = screen.getByTitle("Agregar SuperLínea");
    expect(botonPlusSuperLinea).toBeInTheDocument();
    fireEvent.click(botonPlusSuperLinea);

    // 3. Verificar que el sub-modal de Registrar SuperLínea se despliega correctamente en cascada
    await waitFor(() => {
      expect(screen.getByText("Registrar SuperLínea")).toBeInTheDocument();
    });
  });
});
