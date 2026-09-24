import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductosHeader } from '../header-producto'

const propsBase = (extra: any = {}) => ({
  roles: [2],
  codigo: '',
  exacto: false,
  soloStockBajo: false,
  denominacion: '',
  onChangeCodigo: vi.fn(),
  onChangeExacto: vi.fn(),
  onChangeSoloStockBajo: vi.fn(),
  onChangeDenominacion: vi.fn(),
  onBuscarRapido: vi.fn(),
  onNuevo: vi.fn(),
  total: 10,
  mostrados: 5,
  paginaActual: 1,
  onImprimirTodo: vi.fn(),
  onImprimirPagina: vi.fn(),
  ...extra,
})

describe('ProductosHeader - filtro Solo stock bajo (P1-74)', () => {
  test('muestra el checkbox "Solo stock bajo" desmarcado por defecto', () => {
    render(<ProductosHeader {...propsBase()} />)
    const checkbox = screen.getByLabelText('Solo stock bajo') as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.checked).toBe(false)
  })

  test('el checkbox refleja el valor recibido (soloStockBajo=true)', () => {
    render(<ProductosHeader {...propsBase({ soloStockBajo: true })} />)
    const checkbox = screen.getByLabelText('Solo stock bajo') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  test('tildar el checkbox activa el filtro (onChangeSoloStockBajo(true))', async () => {
    const user = userEvent.setup()
    const onChangeSoloStockBajo = vi.fn()
    render(<ProductosHeader {...propsBase({ onChangeSoloStockBajo })} />)

    await user.click(screen.getByLabelText('Solo stock bajo'))
    expect(onChangeSoloStockBajo).toHaveBeenCalledWith(true)
  })

  test('destildar el checkbox desactiva el filtro (onChangeSoloStockBajo(false))', async () => {
    const user = userEvent.setup()
    const onChangeSoloStockBajo = vi.fn()
    render(<ProductosHeader {...propsBase({ soloStockBajo: true, onChangeSoloStockBajo })} />)

    await user.click(screen.getByLabelText('Solo stock bajo'))
    expect(onChangeSoloStockBajo).toHaveBeenCalledWith(false)
  })

  test('no renderiza el checkbox si no se provee el handler', () => {
    const { onChangeSoloStockBajo, ...sinHandler } = propsBase()
    render(<ProductosHeader {...sinHandler} />)
    expect(screen.queryByLabelText('Solo stock bajo')).not.toBeInTheDocument()
  })
})