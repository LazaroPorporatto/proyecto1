import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import RegistrarActualizarLineaForm from "./registrar-actualizar-linea";
import LineaService from "../services/linea-service";
import SuperLineaService from "../../superlinea/services/superlinea-service";

// Mock services
vi.mock("../services/linea-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../../superlinea/services/superlinea-service", () => ({
  default: {
    obtener: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", () => ({
  getUsuarioId: () => 1,
}));

describe("RegistrarActualizarLineaForm Component", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockSuperLineas = [
    { id: 10, denominacion: "SuperLínea Electrónica" },
    { id: 20, denominacion: "SuperLínea Ferretería" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (SuperLineaService.obtener as any).mockResolvedValue({
      data: mockSuperLineas,
    });
  });

  it("debería renderizar los campos del formulario y el selector de SuperLíneas con sus opciones", async () => {
    render(
      <RegistrarActualizarLineaForm
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Verificar título del modal
    expect(screen.getByText("Registrar Línea")).toBeInTheDocument();

    // Verificar inputs
    expect(screen.getByLabelText(/Denominación/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Observación/i)).toBeInTheDocument();

    // Esperar a que se carguen las opciones del selector de SuperLínea
    await waitFor(() => {
      expect(SuperLineaService.obtener).toHaveBeenCalled();
    });

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("SuperLínea Electrónica")).toBeInTheDocument();
    expect(screen.getByText("SuperLínea Ferretería")).toBeInTheDocument();
  });

  it("debería desplegar el sub-modal de alta rápida al hacer clic en el botón '+'", async () => {
    render(
      <RegistrarActualizarLineaForm
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(SuperLineaService.obtener).toHaveBeenCalled();
    });

    const botonPlus = screen.getByTitle("Agregar SuperLínea");
    expect(botonPlus).toBeInTheDocument();

    // Clic en el botón "+"
    fireEvent.click(botonPlus);

    // Verificar que se renderiza el modal de Registrar SuperLínea
    await waitFor(() => {
      expect(screen.getByText("Registrar SuperLínea")).toBeInTheDocument();
    });
  });

  it("debería enviar el formulario con datos válidos y llamar a LineaService.nuevo", async () => {
    (LineaService.nuevo as any).mockResolvedValue({
      mensaje: "Línea creada exitosamente",
    });

    render(
      <RegistrarActualizarLineaForm
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(SuperLineaService.obtener).toHaveBeenCalled();
    });

    // Llenar denominación
    const inputDenominacion = screen.getByLabelText(/Denominación/i);
    await userEvent.type(inputDenominacion, "Línea Estándar");

    // Seleccionar SuperLínea
    const selectSuperLinea = screen.getByRole("combobox");
    await userEvent.selectOptions(selectSuperLinea, "10");

    // Llenar observación
    const inputObservacion = screen.getByLabelText(/Observación/i);
    await userEvent.type(inputObservacion, "Prueba de observación");

    // Enviar formulario
    const botonSubmit = screen.getByRole("button", { name: "Registrar" });
    fireEvent.click(botonSubmit);

    await waitFor(() => {
      expect(LineaService.nuevo).toHaveBeenCalledWith({
        denominacion: "línea estándar",
        superLineaId: 10,
        observacion: "Prueba de observación",
        usuarioCreatedId: 1,
      });
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith("Línea creada exitosamente");
    });
  });
});
