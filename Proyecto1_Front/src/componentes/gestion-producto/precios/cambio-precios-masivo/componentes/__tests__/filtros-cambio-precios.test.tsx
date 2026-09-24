import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiltrosCambioPrecios from '../filtros-cambio-precios'

const propsBase = {
  valoresFiltros: { denominacion: '', denominacionMarca: '', denominacionLinea: '' },
  setValoresFiltros: vi.fn(),
  marcas: [],
  lineas: [],
  ambito: 'global' as const,
  productosLength: 2,
  onBuscar: vi.fn(),
  onAplicarCambios: vi.fn(),
  onGuardarCambios: vi.fn(),
  fetchMarcas: vi.fn(),
  fetchLineas: vi.fn(),
  onLimpiarFiltros: vi.fn(),
}

describe('FiltrosCambioPrecios - unidades de UI (P1-69)', () => {
  test('muestra los campos de ajuste: select tipo y campo valor', () => {
    render(<FiltrosCambioPrecios {...propsBase} />)
    expect(screen.getByText('Ajuste')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Valor %')).toBeInTheDocument()
  })

  test('permite escribir valor numérico (monto o porcentaje)', async () => {
    const user = userEvent.setup()
    render(<FiltrosCambioPrecios {...propsBase} />)
    const inputValor = screen.getByPlaceholderText('Valor %') as HTMLInputElement
    await user.clear(inputValor)
    await user.type(inputValor, '10.5')
    expect(inputValor.value).toBe('10.5')
  })

  test('cuando hay productos, los botones Aplicar y Guardar están habilitados', () => {
    render(<FiltrosCambioPrecios {...propsBase} productosLength={3} />)
    const btnAplicar = screen.getByTitle('Aplicar Cambios')
    const btnGuardar = screen.getByTitle('Guardar Cambios')
    expect(btnAplicar).not.toBeDisabled()
    expect(btnGuardar).not.toBeDisabled()
  })

  test('cuando no hay productos, Aplicar y Guardar están deshabilitados', () => {
    render(<FiltrosCambioPrecios {...propsBase} productosLength={0} />)
    const btnAplicar = screen.getByTitle('Aplicar Cambios')
    const btnGuardar = screen.getByTitle('Guardar Cambios')
    expect(btnAplicar).toBeDisabled()
    expect(btnGuardar).toBeDisabled()
  })

  test('cambiar el tipo de ajuste a Monto ($) actualiza el placeholder del valor', async () => {
    render(<FiltrosCambioPrecios {...propsBase} />)
    // Por defecto el ajuste es porcentaje
    expect(screen.getByPlaceholderText('Valor %')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByText('Porcentaje (%)'))
    const opcionMonto = await screen.findByText('Monto ($)')
    fireEvent.click(opcionMonto)

    expect(screen.getByPlaceholderText('Valor $')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Valor %')).not.toBeInTheDocument()
  })

  test('Aplicar cambios invoca onAplicarCambios con tipo y valor numerico', async () => {
    const user = userEvent.setup()
    const onAplicarCambios = vi.fn()
    render(<FiltrosCambioPrecios {...propsBase} onAplicarCambios={onAplicarCambios} />)

    const inputValor = screen.getByPlaceholderText('Valor %')
    await user.clear(inputValor)
    await user.type(inputValor, '10.5')

    await user.click(screen.getByTitle('Aplicar Cambios'))
    expect(onAplicarCambios).toHaveBeenCalledWith('porcentaje', 10.5)
  })

  test('Aplicar cambios envia () monto como numero desde el toggle', async () => {
    const user = userEvent.setup()
    const onAplicarCambios = vi.fn()
    render(<FiltrosCambioPrecios {...propsBase} onAplicarCambios={onAplicarCambios} />)

    fireEvent.mouseDown(screen.getByText('Porcentaje (%)'))
    const opcionMonto = await screen.findByText('Monto ($)')
    fireEvent.click(opcionMonto)

    const inputValor = screen.getByPlaceholderText('Valor $')
    await user.clear(inputValor)
    await user.type(inputValor, '250')

    await user.click(screen.getByTitle('Aplicar Cambios'))
    expect(onAplicarCambios).toHaveBeenCalledWith('monto', 250)
  })

  test('Guardar cambios invoca onGuardarCambios con el motivo escrito', async () => {
    const user = userEvent.setup()
    const onGuardarCambios = vi.fn()
    render(<FiltrosCambioPrecios {...propsBase} onGuardarCambios={onGuardarCambios} />)

    await user.type(
      screen.getByPlaceholderText('Motivo (obligatorio para guardar)'),
      'Ajuste trimestral 2026',
    )
    await user.click(screen.getByTitle('Guardar Cambios'))
    expect(onGuardarCambios).toHaveBeenCalledWith('Ajuste trimestral 2026')
  })
})