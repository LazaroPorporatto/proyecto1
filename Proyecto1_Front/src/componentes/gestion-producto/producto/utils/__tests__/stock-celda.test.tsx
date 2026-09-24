import { render, screen, within } from '@testing-library/react'
import { formatearCeldaStock } from '../stock-celda'

function renderCelda(value: number, row: any) {
  return render(<div>{formatearCeldaStock({ value, row })}</div>)
}

describe('formatearCeldaStock - badge de stock bajo (P1-74)', () => {
  test('producto por encima del minimo NO muestra el badge de alerta', () => {
    renderCelda(50, { stock: 50, stockMinimo: 10, utilizaStockMinimo: true })
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.queryByText(/faltan/)).not.toBeInTheDocument()
  })

  test('producto por debajo del minimo muestra la cantidad en rojo y el faltante', () => {
    renderCelda(2, { stock: 2, stockMinimo: 10, utilizaStockMinimo: true })
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/\bfaltan\b/)).toBeInTheDocument()
    expect(screen.getByText(/(faltan 8)/)).toBeInTheDocument()
  })

  test('stock exactamente en el minimo se considera bajo pero sin faltante', () => {
    renderCelda(10, { stock: 10, stockMinimo: 10, utilizaStockMinimo: true })
    const celda = screen.getByText('10').closest('span') as HTMLElement
    expect(celda.className).toContain('text-red-600')
    expect(screen.queryByText(/faltan/)).not.toBeInTheDocument()
  })

  test('producto sin utilizaStockMinimo no se marca por la regla local', () => {
    renderCelda(2, { stock: 2, stockMinimo: 10, utilizaStockMinimo: false })
    expect(screen.queryByText(/faltan/)).not.toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('enStockBajo del servidor es autoritativo (true sin usa minimo)', () => {
    renderCelda(8, { stock: 8, stockMinimo: 10, utilizaStockMinimo: false, enStockBajo: true })
    expect(screen.getByText(/(faltan 2)/)).toBeInTheDocument()
  })

  test('enStockBajo false del servidor gana sobre la regla local', () => {
    renderCelda(2, { stock: 2, stockMinimo: 10, utilizaStockMinimo: true, enStockBajo: false })
    const celda = screen.getByText('2')
    const contenedor = (celda as HTMLElement).closest('span') as HTMLElement
    expect(contenedor.className).not.toContain('text-red-600')
    expect(screen.queryByText(/faltan/)).not.toBeInTheDocument()
  })
})