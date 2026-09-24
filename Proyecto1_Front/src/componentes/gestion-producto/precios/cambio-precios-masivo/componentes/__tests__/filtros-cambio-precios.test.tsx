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

describe('FiltrosCambioPrecios - unidades de UI (US-006)', () => {
  test('muestra los campos de ajuste: select tipo, valor y motivo', () => {
    render(<FiltrosCambioPrecios {...propsBase} />)
    expect(screen.getByText('Ajuste')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Valor %')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Motivo (obligatorio para guardar)')).toBeInTheDocument()
  })

  test('Aplicar y Guardar habilitados si hay productos, deshabilitados si no (E1/E2)', () => {
    const { unmount } = render(<FiltrosCambioPrecios {...propsBase} productosLength={3} />)
    expect(screen.getByTitle('Aplicar Cambios')).not.toBeDisabled()
    expect(screen.getByTitle('Guardar Cambios')).not.toBeDisabled()

    unmount()
    render(<FiltrosCambioPrecios {...propsBase} productosLength={0} />)
    expect(screen.getByTitle('Aplicar Cambios')).toBeDisabled()
    expect(screen.getByTitle('Guardar Cambios')).toBeDisabled()
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

  test('Guardar cambios invoca onGuardarCambios con el motivo escrito (E4/E5)', async () => {
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