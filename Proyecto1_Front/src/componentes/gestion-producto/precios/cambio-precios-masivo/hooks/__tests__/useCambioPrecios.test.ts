import { renderHook, act } from '@testing-library/react'
import { useCambioPrecios } from '../useCambioPrecios'
import CambioPreciosMasivoService from '../../cambio-precios-masivo-service'

vi.mock('../../cambio-precios-masivo-service', () => ({
  default: {
    obtenerDesde: vi.fn(),
    aplicarCambios: vi.fn(),
    guardarCambios: vi.fn(),
  },
}))

const productoBase = (id: number, extras: any = {}) => ({
  id,
  precio: 100,
  costo: 50,
  nuevoPrecio: null,
  nuevoPrecioConIva: null,
  nuevoPorcentaje: null,
  error: null,
  dirty: false,
  stock: 10,
  stockMinimo: 5,
  ...extras,
})

describe('useCambioPrecios - flujo masivo con motivo (P1-73)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('buscarProductos setea los productos devueltos por el servicio', async () => {
    vi.mocked(CambioPreciosMasivoService.obtenerDesde).mockResolvedValue({
      data: [productoBase(1)],
      total: 1,
    })

    const { result } = renderHook(() => useCambioPrecios(7))

    await act(async () => {
      await result.current.buscarProductos({ denominacion: 'harina' })
    })

    expect(CambioPreciosMasivoService.obtenerDesde).toHaveBeenCalledWith(
      { denominacion: 'harina' },
      'productos',
    )
    expect(result.current.productos).toHaveLength(1)
    expect(result.current.productos[0].id).toBe(1)
  })

  test('aplicarCambios envia tipo, valor e items de todos los productos y marca dirty sin error', async () => {
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockResolvedValue([
      {
        ...productoBase(1),
        nuevoPrecio: 110,
        nuevoPrecioConIva: 133.1,
        nuevoPorcentaje: 10,
        error: null,
      },
      {
        ...productoBase(2),
        nuevoPrecio: 90,
        error: 'El precio nuevo está por debajo del costo',
      },
    ])

    const { result } = renderHook(() => useCambioPrecios(7))
    act(() => {
      result.current.setProductos([productoBase(1), productoBase(2)])
    })

    await act(async () => {
      await result.current.aplicarCambios('porcentaje', 10)
    })

    expect(CambioPreciosMasivoService.aplicarCambios).toHaveBeenCalledWith({
      tipo: 'porcentaje',
      valor: 10,
      items: [{ id: 1 }, { id: 2 }],
    })

    expect(result.current.productos[0].dirty).toBe(true)
    expect(result.current.productos[1].dirty).toBe(false)
    expect(result.current.productos[1].error).toContain('costo')
  })

  test('guardarCambios envia SOLO productos marcados (dirty con nuevoPrecio) e incluye motivo y usuarioCreatedId', async () => {
    vi.mocked(CambioPreciosMasivoService.guardarCambios).mockResolvedValue({
      mensaje: 'Actualización de precios masiva realizada sobre 1 producto(s).',
      historial: [],
    })

    const { result } = renderHook(() => useCambioPrecios(42))
    act(() => {
      result.current.setProductos([
        productoBase(1, { dirty: true, nuevoPrecio: 110 }),
        productoBase(2, { dirty: false, nuevoPrecio: null }),
        productoBase(3, { dirty: true, nuevoPrecio: null }),
      ])
    })

    let respuesta: unknown
    await act(async () => {
      respuesta = await result.current.guardarCambios('E2E aumento de precios')
    })

    expect(CambioPreciosMasivoService.guardarCambios).toHaveBeenCalledWith({
      items: [{ id: 1, nuevoPrecio: 110 }],
      motivo: 'E2E aumento de precios',
      usuarioCreatedId: 42,
    })
    expect(respuesta).toEqual({
      mensaje: 'Actualización de precios masiva realizada sobre 1 producto(s).',
      historial: [],
    })
    // Tras guardar, se limpia la bandera dirty
    expect(result.current.productos.every((p) => p.dirty === false)).toBe(true)
  })

  test('guardarCambios sin productos marcados envia items vacios', async () => {
    vi.mocked(CambioPreciosMasivoService.guardarCambios).mockResolvedValue({
      mensaje: 'Actualización de precios masiva realizada sobre 0 producto(s).',
      historial: [],
    })

    const { result } = renderHook(() => useCambioPrecios(1))
    act(() => {
      result.current.setProductos([productoBase(1)])
    })

    await act(async () => {
      await result.current.guardarCambios('sin cambios reales')
    })

    expect(CambioPreciosMasivoService.guardarCambios).toHaveBeenCalledWith({
      items: [],
      motivo: 'sin cambios reales',
      usuarioCreatedId: 1,
    })
  })

  test('loading se activa durante una operacion asincrona', async () => {
    let resolver!: (value: any) => void
    vi.mocked(CambioPreciosMasivoService.aplicarCambios).mockImplementation(() => new Promise((r) => (resolver = r)))

    const { result } = renderHook(() => useCambioPrecios(7))
    act(() => {
      result.current.setProductos([productoBase(1)])
    })

    let promesa!: Promise<any>
    act(() => {
      promesa = result.current.aplicarCambios('monto', 10)
    })
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolver([{ ...productoBase(1), nuevoPrecio: 110 }])
      await promesa
    })

    expect(result.current.loading).toBe(false)
  })
})