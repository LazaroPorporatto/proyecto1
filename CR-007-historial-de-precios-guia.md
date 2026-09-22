# CR-007: Historial de precios

## Guia de analisis e implementacion

Este documento explica como implementar el CR-007 en este proyecto, dividido en `Proyecto1_Back` y `Proyecto1_Front`, sin modificar el codigo fuente. La implementacion queda a cargo del equipo.

## 1. Alcance del CR

El sistema debe conservar un registro cada vez que cambia el precio de un producto. Cada registro debe contener como minimo:

- producto al que pertenece;
- precio anterior;
- precio nuevo;
- fecha y hora del cambio;
- motivo del cambio.

El precio vigente sigue estando en `producto.precio`. El historial no debe reemplazarlo: cumple una responsabilidad distinta, que es conservar trazabilidad.

### Regla propuesta

Cuando el precio cambia de `P anterior` a `P nuevo`:

1. `P nuevo` debe ser mayor que cero.
2. El motivo es obligatorio y no puede ser solo espacios.
3. Se actualiza el precio vigente del producto.
4. Se crea un registro con ambos valores, la fecha generada por el backend y el motivo.
5. Los dos cambios se confirman juntos. Si uno falla, ninguno debe quedar guardado.
6. Si el precio nuevo es igual al anterior, no se registra un cambio de precio. Esta decision debe confirmarse con el docente o el equipo; es la opcion recomendada para evitar historial redundante.

El usuario que realiza el cambio no aparece en la descripcion minima del CR, pero el proyecto ya posee auditoria y relaciones con `Usuario`. Es recomendable guardarlo como dato adicional si el equipo lo justifica en el informe.

## 2. Estado actual que debes auditar primero

Antes de editar, recorri el flujo de precios existente. Estos son los puntos concretos que debes verificar en tu copia:

### Backend

- [Producto](Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/domain/entities/producto.entity.ts): tiene `precio`, `costo`, `porcentaje`, fechas de costo y datos de auditoria, pero no tiene una entidad de historial de precios.
- [UpdatePrecioDto](Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/dto/update-precio.dto.ts): recibe costos, cotizacion, porcentaje y `usuarioId`; no recibe un precio nuevo ni un motivo.
- [ProductoMapper](Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/mappers/producto.mapper.ts): `mapPrecios` actualiza costos y fechas de costo, pero actualmente no asigna `entity.precio`.
- [ProductoPersistenceAdapter](Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/infraestructure/repositories/producto.persistence-adapters.ts): `actualizarPrecio` obtiene el producto, llama al mapper y guarda la entidad dentro de una transaccion. Es un punto importante para revisar, pero no debes asumir que es el caso de uso publico.
- [ProductoController](Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/application/controllers/producto.controller.ts): expone `POST`, `GET`, `PUT` y `DELETE` de productos, pero en la version relevada no se encontro una ruta publica para `actualizarPrecio` ni para consultar historial.
- [producto.module.ts](Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/producto.module.ts): registra solamente `Producto` en `TypeOrmModule.forFeature` y no registra una entidad de historial.
- [Init migration](Proyecto1_Back/proyecto/src/migrations/1787269586538-Init.ts): crea la tabla `producto` con `precio`, pero no crea una tabla de historial.

### Frontend

- [producto-service.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/services/producto-service.tsx): contiene `actualizarPreciosProducto`, que intenta hacer `PATCH /producto/:id/precios`, y varias operaciones de calculo.
- [interfaces-historial-precios.tsx](Proyecto1_Front/src/interfaces/gestion-producto/historial-precios/interfaces-historial-precios.tsx): ya existe una interfaz llamada `HistorialPrecios`, pero modela muchos precios y datos de documentos; no coincide exactamente con el CR-007 minimo.
- [consultar-producto.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/utils/consultar-producto.tsx): ya tiene estados y handlers llamados `mostrarHistorialPrecios` y `handleMostrarHistorialPrecios`.
- [producto-modales.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/modales/producto-modales.tsx): recibe props para historial y cambio de precios, pero el fragmento actual no renderiza esos modales. Esto sugiere una funcionalidad parcial o pendiente.

### Hipotesis de impacto

El CR no consiste solamente en agregar una tabla. El riesgo principal es registrar el historial en una ruta que no sea la que realmente cambia el precio. El primer entregable tecnico debe ser identificar un unico caso de uso oficial para cambiar precios y hacer que todas las entradas, por ejemplo edicion individual o actualizacion masiva futura, pasen por ese caso de uso.

La discrepancia entre `PATCH /producto/:id/precios` en el frontend y las rutas observadas en el controller es un hallazgo de auditoria. Debes comprobarlo ejecutando el backend, revisando Swagger y buscando el endpoint desde el frontend antes de implementar.

## 3. Analisis de impacto solicitado por la Entrega 2

El analisis de impacto debe explicar que cambia y que no cambia.

| Area | Impacto | Que debes analizar |
|---|---|---|
| Dominio | Alto | Aparece el concepto `HistorialPrecio` y la regla de que todo cambio valido deja trazabilidad. |
| Agregado Producto | Medio/alto | `Producto` sigue siendo el objeto cuyo precio cambia. El historial puede ser una entidad asociada, sin permitir actualizaciones arbitrarias desde afuera. |
| Base de datos | Alto | Nueva tabla, clave primaria, FK a `producto`, precios decimales, fecha y motivo. Se necesita migracion. |
| Aplicacion | Alto | Nuevo caso de uso para cambiar precio y nuevo caso de uso de consulta del historial. |
| Infraestructura | Alto | Repositorio, transaccion, registro de la entidad y consulta ordenada por fecha descendente. |
| API | Alto | DTO de entrada con `precioNuevo` y `motivo`; endpoint para consultar historial; respuestas y errores claros. |
| Frontend | Medio/alto | Formulario de cambio debe pedir motivo; debe existir una vista para consultar los registros. |
| Seguridad | Medio | Mantener `AuthGuard` y roles; decidir que roles pueden modificar precio y cuales solo consultar. |
| Testing | Alto | Probar la regla en dominio/aplicacion, persistencia atomica, endpoint y renderizado de errores. |
| Documentacion | Alto | Actualizar analisis DDD, Event Storming, historias, trazabilidad, deuda tecnica y README si cambia la forma de ejecutar. |

### Cambios que no deberias hacer por este CR

- No eliminar `producto.precio`: es el valor vigente y permite consultas rapidas.
- No guardar el historial solo en el frontend.
- No permitir que un controller actualice precio y otro registre historial por separado.
- No usar `updatedAt` de `Producto` como reemplazo de la fecha del historial: `updatedAt` no dice que precio tenia antes ni por que cambio.
- No mezclar automaticamente el historial de precios con `ProductoOperacion` sin justificarlo. Esa entidad representa operaciones y no tiene los campos especificos del CR.

## 4. Modelo de dominio recomendado

### 4.1 Entidad HistorialPrecio

Es una entidad porque cada cambio debe poder identificarse y auditarse individualmente. Dos cambios con los mismos valores, realizados en fechas distintas, siguen siendo dos registros diferentes.

Campos minimos sugeridos:

```text
HistorialPrecio
- id
- productoId
- precioAnterior
- precioNuevo
- fecha
- motivo
```

Campos opcionales justificables:

```text
- usuarioId
- tipoCambio: manual | masivo | importacion
- porcentajeAplicado o montoAplicado
```

No agregues campos opcionales solo porque podrian ser utiles. Cada uno debe responder a una necesidad del dominio, una consulta o una auditoria.

### 4.2 Relacion con Producto

La relacion minima es `Producto 1 --- N HistorialPrecio`: un producto puede tener muchos cambios y cada cambio pertenece a un unico producto.

En este proyecto, una ubicacion coherente es mantener la entidad dentro de `gestion-productos`, junto al submodulo `producto`, por ejemplo:

```text
producto/
  domain/entities/producto.entity.ts
  domain/entities/historial-precio.entity.ts
  dto/
  application/controllers/
  application/services/
  infraestructure/repositories/
```

Si el equipo decide crear un submodulo separado `historial-precios`, debe justificarlo. Para este CR, mantenerlo cerca de Producto reduce el acoplamiento y hace visible que el historial pertenece al ciclo de vida del producto.

### 4.3 Value Objects

Para una primera implementacion pueden mantenerse tipos primitivos respaldados por validaciones:

- dinero: decimal positivo;
- motivo: texto no vacio;
- fecha: fecha generada por el servidor.

Si el equipo quiere aplicar Value Objects de forma mas estricta, `Precio` y `MotivoCambioPrecio` son buenos candidatos. No es obligatorio crear una clase para cada campo si la arquitectura actual no usa ese estilo; la justificacion debe ser consistente con el resto del proyecto.

## 5. Como implementarlo por capas

### Paso 1: fijar el caso de uso de cambio de precio

Primero localiza todos los lugares donde se modifica `precio`, `costo` o un porcentaje que termine recalculando el precio. Busca asignaciones a `precio`, llamadas a `actualizarPreciosProducto`, `PATCH /producto/:id/precios`, importaciones y actualizaciones masivas.

Luego decide una sola entrada de aplicacion, por ejemplo:

```text
CambiarPrecioProducto(productoId, precioNuevo, motivo, usuarioId)
```

Ese caso de uso debe:

1. validar la entrada;
2. cargar el producto;
3. guardar el precio anterior;
4. asignar el precio nuevo;
5. crear `HistorialPrecio`;
6. confirmar todo en una transaccion.

Si el precio se calcula a partir de costo y porcentaje, el caso de uso debe recibir el cambio que corresponda y obtener el precio final mediante una regla centralizada. No dupliques el calculo en React y NestJS.

### Paso 2: crear la entidad TypeORM

En `gestion-productos/producto/domain/entities` crea la entidad de persistencia para `HistorialPrecio`.

Debes decidir:

- nombre exacto de tabla, por ejemplo `historial_precio`;
- tipo decimal y precision coherentes con `Producto.precio`;
- `fecha` con valor por defecto del servidor;
- `motivo` obligatorio y con longitud razonable;
- FK a `producto` y comportamiento ante borrado;
- indice por `productoId` y `fecha` si la consulta siempre sera por producto y orden cronologico.

Agrega la relacion inversa en `Producto` solo si la aplicacion necesita navegarla. Para consultar el historial con paginacion no es necesario cargar todos los registros dentro de cada producto.

### Paso 3: crear una migracion

En `Proyecto1_Back/proyecto/src/migrations` crea una nueva migracion con timestamp posterior a `1787269586538-Init`.

La migracion debe crear la tabla, la FK y los indices. Su metodo `down` debe eliminar la tabla y los indices que la migracion creo.

No edites la migracion inicial para simular que siempre existio la tabla. Una migracion nueva conserva la historia de evolucion de la base y permite desplegarla sin perder datos existentes.

Antes de avanzar, prueba la migracion sobre una base vacia y sobre una base que ya tenga productos.

### Paso 4: registrar la entidad en el modulo

Actualiza `producto.module.ts` para que TypeORM conozca `HistorialPrecio`. Si creas repositorios propios, registralos como providers y exporta solo lo que necesiten otros modulos.

Comprueba tambien la configuracion de migraciones en `orm.config.ts` y en los scripts de `package.json`; el despliegue debe ejecutar la migracion antes de recibir trafico.

### Paso 5: definir DTOs y validaciones

Crea un DTO de comando para el cambio, separado del DTO de consulta. Como minimo debe representar:

```text
precioNuevo: number
motivo: string
usuarioId: number, si la politica actual lo exige
```

Validaciones esperadas:

- `precioNuevo` es numerico y mayor que cero;
- `motivo` es string, obligatorio y no vacio luego de quitar espacios;
- `productoId` y `usuarioId` son enteros cuando formen parte del path o del payload;
- el precio anterior se obtiene del backend, nunca del valor enviado por el navegador.

El DTO de consulta debe permitir, como minimo, filtrar por producto y paginar. Ordena por fecha descendente para mostrar primero el cambio mas reciente.

### Paso 6: ubicar la logica en servicio de aplicacion/dominio

La validacion de formato pertenece al DTO y a los pipes de NestJS. La regla de negocio pertenece al servicio de aplicacion o a un servicio de dominio, segun el estilo que el equipo adopte.

Una distribucion razonable para este repositorio es:

- `ProductoController`: recibe HTTP, aplica guardas/roles y delega;
- `ProductoService` o un servicio de aplicacion especifico: orquesta el caso de uso;
- entidad o servicio de dominio: valida que un precio nuevo sea valido y que el cambio tenga motivo;
- repositorio/adaptador: persiste Producto e HistorialPrecio;
- migracion: modifica el esquema, no contiene reglas de negocio.

Evita poner la regla completa en `ProductoController` o en un componente React.

### Paso 7: hacer el cambio atomico

El precio vigente y el historial deben guardar dentro de la misma transaccion de TypeORM. El orden conceptual es:

```text
producto = obtenerProducto(productoId)
precioAnterior = producto.precio
validar(precioNuevo, motivo)
producto.precio = precioNuevo
guardar(producto)
guardar(historialPrecio)
commit
```

Si falla la segunda escritura, la primera debe revertirse. Debes agregar una prueba que provoque una falla en el guardado del historial y compruebe que el precio vigente no quedo modificado.

### Paso 8: exponer la API

La API necesita una operacion de escritura y una de lectura. Los nombres exactos son una decision del equipo; una alternativa clara seria:

```text
PATCH /producto/:id/precio
GET   /producto/:id/historial-precios?skip=0&take=10
```

El `PATCH` debe recibir el motivo. El `GET` debe devolver un DTO de lectura, no necesariamente la entidad TypeORM completa.

Asegura que:

- el endpoint este protegido por `AuthGuard`;
- los roles sean consistentes con la edicion actual;
- los errores indiquen producto inexistente, precio invalido y motivo faltante;
- Swagger documente cuerpo, respuestas y errores.

Antes de conectar el frontend, prueba estos endpoints desde Swagger o Supertest.

### Paso 9: conectar el frontend

En [producto-service.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/services/producto-service.tsx):

1. reemplaza o adapta la llamada de actualizacion para que coincida exactamente con la ruta real del backend;
2. agrega una llamada para consultar historial por producto;
3. tipa el payload y la respuesta, evitando `any`.

En el formulario de edicion de producto, localiza donde se guarda el precio y agrega un campo `motivo`. El campo debe ser obligatorio solamente cuando efectivamente cambia el precio.

En la interfaz de historial:

- adapta o reemplaza [interfaces-historial-precios.tsx](Proyecto1_Front/src/interfaces/gestion-producto/historial-precios/interfaces-historial-precios.tsx), porque los campos actuales incluyen modelos de precios de otros flujos y no coinciden con el CR minimo;
- muestra fecha, precio anterior, precio nuevo y motivo;
- muestra estado de carga, lista vacia y error;
- pagina si el backend pagina;
- formatea dinero y fecha en la capa visual, sin volver a calcular el precio.

En [consultar-producto.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/utils/consultar-producto.tsx) ya existen estados y handlers para mostrar historial. Debes comprobar que abran un componente real. En [producto-modales.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/modales/producto-modales.tsx) las props de historial existen, pero el modal no aparece renderizado en el codigo relevado: completa esa integracion si la auditoria lo confirma.

## 6. Historia de usuario derivada del CR-007

### Historia principal

**Como** encargado de productos o administrador autorizado,

**quiero** registrar el motivo cada vez que cambio el precio de un producto y consultar su historial,

**para** conocer como evoluciono el precio, justificar decisiones comerciales y mantener trazabilidad.

### Criterios de aceptacion en Given/When/Then

#### CA-01: registrar un cambio valido

**Given** un producto existente con precio vigente de 1000

**When** un usuario autorizado informa precio nuevo 1150 y motivo "actualizacion de costo"

**Then** el producto queda con precio 1150 y se crea un historial con precio anterior 1000, precio nuevo 1150, fecha del servidor y ese motivo.

#### CA-02: motivo obligatorio

**Given** un producto existente

**When** el usuario intenta cambiar el precio sin motivo o con un motivo compuesto solo por espacios

**Then** la API rechaza la operacion, informa el error y no modifica ni el precio ni el historial.

#### CA-03: precio positivo

**Given** un producto existente

**When** el usuario informa un precio nuevo menor o igual a cero

**Then** la API rechaza la operacion con un mensaje claro y no persiste cambios.

#### CA-04: precio sin cambios

**Given** un producto cuyo precio actual es 1000

**When** el usuario informa nuevamente 1000

**Then** el sistema aplica la politica definida por el equipo. La politica recomendada es rechazarlo como "sin cambios" o finalizar sin crear historial redundante.

#### CA-05: consulta del historial

**Given** un producto con varios cambios registrados

**When** un usuario autorizado consulta su historial

**Then** ve precio anterior, precio nuevo, fecha y motivo, ordenados del mas reciente al mas antiguo.

#### CA-06: producto inexistente

**Given** un id que no corresponde a un producto

**When** se intenta cambiar su precio o consultar su historial

**Then** la API responde recurso no encontrado y no crea registros.

#### CA-07: consistencia transaccional

**Given** una falla al guardar el historial

**When** se ejecuta un cambio de precio

**Then** el precio vigente conserva su valor anterior.

## 7. Event Storming del CR

Los eventos deben estar expresados en pasado. Una secuencia minima para el diagrama es:

```text
Comando: Cambiar precio
  -> Regla: el precio nuevo es mayor que cero
  -> Regla: el motivo es obligatorio
  -> Evento: Precio actualizado
  -> Evento: Cambio de precio registrado
  -> Consulta: Historial de precios disponible
```

Puedes agregar:

- Actor: encargado de productos;
- Politica: notificar o auditar cambios relevantes;
- Evento de error: cambio de precio rechazado;
- Read model: historial ordenado por producto y fecha.

En la reflexion del Event Storming explica:

1. que el evento clave es `Precio actualizado` porque modifica el estado vigente;
2. que `Cambio de precio registrado` representa la trazabilidad exigida por CR-007;
3. que el motivo aparece como regla explicita y no como comentario de UI;
4. que la consulta del historial no es otro comando, sino una lectura;
5. si el modelado revelo la necesidad de guardar usuario, origen del cambio o tipo de actualizacion.

El diagrama debe entregarse como imagen y con el enlace al tablero si se utilizo una herramienta colaborativa.

## 8. Testing obligatorio

### Backend unitario

Prueba como minimo:

- precio nuevo positivo: acepta;
- precio nuevo cero o negativo: rechaza;
- motivo vacio o con espacios: rechaza;
- precio anterior se toma de la entidad persistida;
- se crea historial con los cuatro datos exigidos;
- precio igual: respeta la politica elegida.

### Backend de integracion o E2E

- migracion crea tabla y FK;
- endpoint de cambio persiste producto e historial;
- endpoint de consulta devuelve orden y paginacion;
- producto inexistente devuelve 404;
- usuario sin rol autorizado recibe 401/403 segun corresponda;
- una falla transaccional no deja el producto parcialmente actualizado.

### Frontend

- el formulario muestra el motivo cuando corresponde;
- no permite enviar motivo vacio;
- muestra el error devuelto por backend;
- abre el historial del producto correcto;
- renderiza fecha, valores y motivo;
- maneja lista vacia y error de consulta.

La cobertura debe medirse con la configuracion vigente del proyecto y justificarse. No alcanza con cubrir endpoints si las reglas de precio no tienen tests.

## 9. Trazabilidad para la Entrega 2

Usa una tabla como esta en el informe:

| CR | Historia | Evento | Codigo | Test |
|---|---|---|---|---|
| CR-007 | HU-CR007-01 | Precio actualizado | caso de uso de cambio de precio | cambio valido |
| CR-007 | HU-CR007-01 | Cambio de precio registrado | entidad y repositorio `HistorialPrecio` | persistencia del historial |
| CR-007 | HU-CR007-01 | Cambio de precio rechazado | DTO/servicio/guardas | motivo y precio invalidos |
| CR-007 | HU-CR007-01 | Historial consultado | endpoint y vista frontend | consulta ordenada |

Ademas, conserva evidencia de:

- issue o tarea del tablero;
- commits descriptivos;
- ejecucion de migraciones;
- capturas o enlace del Event Storming;
- resultados de tests y cobertura;
- decisiones descartadas y motivo.

## 10. Deuda tecnica y hallazgos que debes documentar

El CR-007 permite reconocer estas posibles deudas, que debes confirmar con el codigo final:

1. El frontend parece llamar a `PATCH /producto/:id/precios`, mientras el controller relevado no expone esa ruta.
2. `UpdatePrecioDto` recibe datos de costo y porcentaje, pero el flujo relevado no muestra una actualizacion directa de `precio`.
3. Hay interfaces frontend de historial que representan muchos campos distintos a los cuatro campos minimos del CR.
4. El modal de historial parece estar cableado por props y estados, pero no renderizado en el componente relevado.
5. El README menciona historial de precios como parte del modulo, aunque la migracion inicial no muestra una tabla correspondiente.

Clasifica cada hallazgo como:

- documentado pero no implementado;
- implementado pero no documentado;
- backend no expuesto en frontend;
- regla mal ubicada;
- deuda tecnica reconocida;
- otra, si corresponde.

No presentes estos puntos como certezas sin volver a verificarlos en ejecucion, Swagger y busqueda completa del repositorio.

## 11. Priorizacion Impacto vs. Esfuerzo

Una priorizacion defendible para trabajar es:

| Cambio | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|
| Definir y corregir el caso de uso real que modifica precio | Alto | Bajo/medio | Hacer ya |
| Crear entidad, migracion y escritura atomica del historial | Alto | Medio | Hacer ya |
| Agregar validaciones y tests de reglas | Alto | Medio | Hacer ya |
| Endpoint paginado de consulta | Medio/alto | Bajo/medio | Hacer ya |
| Vista de historial en frontend | Medio | Medio | Hacer ya |
| Guardar usuario y origen del cambio | Medio | Medio | Planificar o hacer ya si auditoria lo exige |
| Reemplazar todos los precios primitivos por Value Objects | Medio | Alto | Planificar |
| Separar Inventario y Catalogo en bounded contexts | Alto | Alto | Evolucion futura, fuera del CR |

## 12. Orden de trabajo recomendado

1. Auditar donde se modifica realmente el precio.
2. Definir reglas, roles, politica de precio igual y campos opcionales.
3. Derivar la historia de usuario y criterios de aceptacion.
4. Modelar `HistorialPrecio` y la relacion con `Producto`.
5. Crear migracion y probarla en una base nueva y existente.
6. Implementar el caso de uso transaccional.
7. Exponer cambio y consulta con DTOs y Swagger.
8. Conectar formulario, motivo, modal/lista y mensajes en frontend.
9. Escribir tests de dominio, integracion, E2E y UI.
10. Actualizar Event Storming, tabla de trazabilidad, deuda tecnica, metricas y README.
11. Verificar despliegue y rollback de migracion antes de entregar.

## Resultado esperado

Al finalizar, debe ser posible demostrar con una prueba reproducible que un cambio valido actualiza el precio vigente y crea un registro historico; que un cambio invalido no modifica datos; y que un usuario autorizado puede consultar el historial ordenado. Esa demostracion conecta dominio, codigo, base de datos, frontend, tests y los entregables exigidos por la Entrega 2.

## 13. Plan exacto de archivos y codigo a introducir

Esta seccion traduce el analisis anterior a tareas de codigo. Los nombres son una propuesta compatible con la estructura observada. Antes de copiar los fragmentos, confirma si el equipo va a usar `PUT /producto/:id` como flujo principal o si va a habilitar `PATCH /producto/:id/precio`. La regla debe implementarse en un solo flujo de aplicacion.

### 13.1 Backend: entidad nueva

**Crear:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/domain/entities/historial-precio.entity.ts`

Contenido base:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from './producto.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';

@Entity('historial_precio')
@Index(['productoId', 'fecha'])
export class HistorialPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  productoId: number;

  @ManyToOne(() => Producto, (producto) => producto.historialPrecios, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  precioAnterior: number;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  precioNuevo: number;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  fecha: Date;

  @Column({ type: 'varchar', length: 500 })
  motivo: string;

  @Column({ type: 'int', nullable: true })
  usuarioId?: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;
}
```

El campo `usuarioId` es opcional respecto del CR, pero es recomendable porque el backend ya trabaja con usuarios para auditoria. Si no se lo incluye, se debe justificar la decision en el informe.

### 13.2 Backend: relacion inversa en Producto

**Modificar:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/domain/entities/producto.entity.ts`

Agregar el import:

```ts
import { OneToMany } from 'typeorm';
import { HistorialPrecio } from './historial-precio.entity';
```

Agregar dentro de `Producto`, cerca de las relaciones de producto:

```ts
@OneToMany(() => HistorialPrecio, (historial) => historial.producto)
historialPrecios: HistorialPrecio[];
```

No es necesario cargar esta coleccion en cada consulta de producto. Para el listado historico se debe usar un repositorio o query paginada.

### 13.3 Backend: DTO de cambio

**Crear:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/dto/cambiar-precio.dto.ts`

```ts
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CambiarPrecioDto {
  @IsNumber({}, { message: 'El precio nuevo debe ser numerico.' })
  @IsPositive({ message: 'El precio nuevo debe ser mayor que cero.' })
  precioNuevo: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo debe ser texto.' })
  @IsNotEmpty({ message: 'El motivo es obligatorio.' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres.' })
  motivo: string;

  @IsOptional()
  @IsInt({ message: 'El usuario debe ser un entero.' })
  usuarioId?: number;
}
```

No agregues `precioAnterior` al DTO: ese valor debe leerlo el backend desde la base antes de actualizar. De lo contrario, el cliente podria falsificar el valor anterior.

### 13.4 Backend: DTO de salida del historial

**Crear:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/dto/historial-precio.dto.ts`

```ts
export class HistorialPrecioDto {
  id: number;
  productoId: number;
  precioAnterior: number;
  precioNuevo: number;
  fecha: Date;
  motivo: string;
  usuarioId?: number;
}
```

Si los valores `decimal` llegan como `string` desde MySQL, normalizalos en el mapper o en la respuesta, pero mantene una sola convencion en toda la API.

### 13.5 Backend: repositorio para historial

**Crear:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/infraestructure/repositories/historial-precio.repository.ts`

Una implementacion inicial puede ser:

```ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';

@Injectable()
export class HistorialPrecioRepository {
  obtenerPorProducto(
    uow: IUnitOfWork,
    productoId: number,
    skip: number,
    take: number,
  ): Promise<[HistorialPrecio[], number]> {
    const repository = uow.getRepository(HistorialPrecio);
    return repository.findAndCount({
      where: { productoId },
      order: { fecha: 'DESC' },
      skip,
      take,
    });
  }
}
```

Para la escritura del historial no uses otro `DataSource` ni otro `QueryRunner`: usa el mismo `IUnitOfWork` que actualiza Producto.

### 13.6 Backend: ampliar el modulo

**Modificar:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/producto.module.ts`

Cambiar el import de TypeORM:

```ts
import { HistorialPrecio } from './domain/entities/historial-precio.entity';
```

Cambiar:

```ts
TypeOrmModule.forFeature([Producto]),
```

por:

```ts
TypeOrmModule.forFeature([Producto, HistorialPrecio]),
```

Y agregar `HistorialPrecioRepository` a `providers`. Si el repositorio se inyecta directamente en `ProductoService`, tambien debe agregarse al constructor del servicio.

### 13.7 Backend: caso de uso transaccional

**Modificar:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/application/services/producto.service.ts`

Agregar imports:

```ts
import { BadRequestException } from '@nestjs/common';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { CambiarPrecioDto } from '../../dto/cambiar-precio.dto';
import { HistorialPrecioDto } from '../../dto/historial-precio.dto';
```

Agregar `IUnitOfWork` y `HistorialPrecioRepository` al constructor segun la forma en que el modulo registre los providers. El caso de uso puede seguir este esquema:

```ts
async cambiarPrecio(id: number, dto: CambiarPrecioDto) {
  if (!dto.motivo || dto.motivo.trim().length === 0) {
    throw new BadRequestException('El motivo del cambio es obligatorio.');
  }

  const uow = this.unitOfWork;
  await uow.start();

  try {
    const productoRepository = uow.getRepository(Producto);
    const historialRepository = uow.getRepository(HistorialPrecio);
    const producto = await productoRepository.findOne({ where: { id } });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    const precioAnterior = Number(producto.precio ?? 0);
    const precioNuevo = Number(dto.precioNuevo);

    if (!Number.isFinite(precioNuevo) || precioNuevo <= 0) {
      throw new BadRequestException('El precio nuevo debe ser mayor que cero.');
    }

    if (precioAnterior === precioNuevo) {
      throw new BadRequestException('El precio nuevo es igual al precio actual.');
    }

    producto.precio = precioNuevo;
    producto.usuarioUpdated = dto.usuarioId
      ? await this.usuarioService.findOne(dto.usuarioId)
      : producto.usuarioUpdated;
    await productoRepository.save(producto);

    await historialRepository.save(
      historialRepository.create({
        productoId: producto.id,
        producto,
        precioAnterior,
        precioNuevo,
        motivo: dto.motivo.trim(),
        usuarioId: dto.usuarioId,
      }),
    );

    await uow.commit();
    return { productoId: producto.id, precioAnterior, precioNuevo };
  } catch (error) {
    await uow.rollback();
    throw error;
  } finally {
    await uow.release();
  }
}
```

Este fragmento es una guia, no debe copiarse sin adaptar: el `ProductoService` relevado actualmente no muestra `IUnitOfWork` en su constructor, y el proyecto tiene un decorador `@Transactional()` en el adaptador. El equipo debe escoger una sola estrategia transaccional. No mezcles un decorador transaccional con un `IUnitOfWork` manual sin comprobar como se administra el contexto.

Una alternativa mas alineada con el codigo existente es mover este metodo al `ProductoPersistenceAdapter`, donde ya existe `actualizarPrecio`, y modificar ese metodo para guardar Producto e HistorialPrecio con el mismo `uow`. En ese caso, `ProductoService` solo valida/orquesta y el controller llama al servicio.

### 13.8 Backend: lectura paginada

En el mismo servicio o en un servicio de consulta separado, agregar:

```ts
async obtenerHistorialPrecios(
  productoId: number,
  skip = 0,
  take = 10,
): Promise<{ data: HistorialPrecioDto[]; total: number }> {
  const producto = await this.repository.findOne(productoId);
  if (!producto) {
    throw new NotFoundException(`Producto con ID ${productoId} no encontrado.`);
  }

  const [historial, total] = await this.historialPrecioRepository.findAndCount({
    where: { productoId },
    order: { fecha: 'DESC' },
    skip,
    take,
  });

  return {
    data: historial.map((item) => ({
      id: item.id,
      productoId: item.productoId,
      precioAnterior: Number(item.precioAnterior),
      precioNuevo: Number(item.precioNuevo),
      fecha: item.fecha,
      motivo: item.motivo,
      usuarioId: item.usuarioId,
    })),
    total,
  };
}
```

La llamada a `findAndCount` debe salir del repositorio elegido por el equipo; el objetivo es que el controller no conozca TypeORM.

### 13.9 Backend: endpoints

**Modificar:** `Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/application/controllers/producto.controller.ts`

Agregar imports:

```ts
import { Body, DefaultValuePipe } from '@nestjs/common';
import { CambiarPrecioDto } from '../../dto/cambiar-precio.dto';
```

Agregar antes de `@Get(':id')`, para mantener claras las rutas especificas:

```ts
@Patch(':id/precio')
@Roles('Root', 'Administrador', 'Empleado')
async cambiarPrecio(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CambiarPrecioDto,
) {
  return this.service.cambiarPrecio(id, dto);
}

@Get(':id/historial-precios')
@Roles('Root', 'Administrador', 'Empleado', 'Vendedor')
async historialPrecios(
  @Param('id', ParseIntPipe) id: number,
  @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
) {
  return this.service.obtenerHistorialPrecios(id, skip, take);
}
```

Tambien debes importar `Patch`. Si los roles de precio son distintos, documenta la decision. Verifica que `@Get(':id')` no capture estas rutas antes de ellas: en NestJS las rutas fixas devem declararse antes da rota parametrizada.

### 13.10 Backend: migracion

**Crear:** `Proyecto1_Back/proyecto/src/migrations/<timestamp>-CreateHistorialPrecio.ts`

Estructura minima:

```ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateHistorialPrecio<timestamp> implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'historial_precio',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'producto_id', type: 'int' },
          { name: 'precioAnterior', type: 'decimal', precision: 15, scale: 5 },
          { name: 'precioNuevo', type: 'decimal', precision: 15, scale: 5 },
          { name: 'fecha', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
          { name: 'motivo', type: 'varchar', length: '500' },
          { name: 'usuario_id', type: 'int', isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'historial_precio',
      new TableForeignKey({
        columnNames: ['producto_id'],
        referencedTableName: 'producto',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'historial_precio',
      new TableIndex({
        name: 'IDX_historial_precio_producto_fecha',
        columnNames: ['producto_id', 'fecha'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('historial_precio');
  }
}
```

Reemplaza `<timestamp>` por un nombre de clase TypeScript valido, por ejemplo `CreateHistorialPrecio1787269586539`. No copies literalmente los signos `< >` al nombre de la clase.

El proyecto tiene `synchronize: true` en [orm.config.ts](Proyecto1_Back/proyecto/orm.config.ts). Para cumplir una entrega reproducible, el equipo debe decidir y documentar el flujo: en desarrollo puede sincronizar, pero antes de probar migraciones y desplegar conviene usar `synchronize: false` y ejecutar `npm run migration:run`. No presentes una migracion sin verificar que realmente se ejecuta en el entorno de entrega.

### 13.11 Frontend: tipos

**Modificar o reemplazar:** `Proyecto1_Front/src/interfaces/gestion-producto/historial-precios/interfaces-historial-precios.tsx`

Agregar una interfaz especifica para CR-007:

```ts
export interface HistorialPrecioCr007 {
  id: number;
  productoId: number;
  precioAnterior: number;
  precioNuevo: number;
  fecha: string;
  motivo: string;
  usuarioId?: number | null;
}

export interface HistorialPrecioResponse {
  data: HistorialPrecioCr007[];
  total: number;
}

export interface CambiarPrecioPayload {
  precioNuevo: number;
  motivo: string;
  usuarioId?: number;
}
```

No reutilices `ConsultarHistorialPrecios` si sus campos representan otro historial con precios de cliente, mayorista, oferta o documentos. Esa interfaz existente debe mantenerse solo si pertenece a otro caso de uso.

### 13.12 Frontend: servicio HTTP

**Modificar:** `Proyecto1_Front/src/componentes/gestion-producto/producto/services/producto-service.tsx`

Agregar tipos y metodos usando `ApiService`, para no duplicar la configuracion del token:

```ts
import {
  CambiarPrecioPayload,
  HistorialPrecioResponse,
} from '../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios';

// dentro de ProductoService
 cambiarPrecio: (id: number, payload: CambiarPrecioPayload) =>
   ApiService.patch(`/producto/${id}/precio`, payload),

 obtenerHistorialPrecios: (
   id: number,
   skip = 0,
   take = 10,
 ): Promise<HistorialPrecioResponse> =>
   ApiService.get(`/producto/${id}/historial-precios`, { skip, take }),
```

Corrige la llamada actual `PATCH /producto/${id}/precios` solo despues de confirmar la ruta definitiva del controller. La diferencia entre `precios` y `precio` debe resolverse en un unico lugar.

### 13.13 Frontend: formulario de cambio

El formulario actual [registrar-actualizar-producto.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.tsx) envia todo el producto mediante `PUT`, incluyendo `precio`. Tienes dos alternativas:

**Alternativa recomendada:** separar la accion de cambio de precio.

1. Comparar el precio inicial con `watch('precio')`.
2. Si cambia, abrir o mostrar un campo `motivo`.
3. Llamar a `ProductoService.cambiarPrecio` para el precio.
4. Llamar a `ProductoService.actualizar` solo para los demas campos.
5. No permitir que ambos flujos actualicen precio en la misma operacion.

Ejemplo de regla en `onSubmit`:

```ts
const precioInicial = Number(producto?.precio ?? 0);
const precioNuevo = Number(formData.precio ?? 0);
const precioCambio = producto && precioInicial !== precioNuevo;

if (precioCambio && !formData.motivoPrecio?.trim()) {
  setError('root', {
    type: 'manual',
    message: 'Debe indicar el motivo del cambio de precio.',
  });
  return;
}

if (producto && precioCambio) {
  await ProductoService.cambiarPrecio(producto.id, {
    precioNuevo,
    motivo: formData.motivoPrecio.trim(),
    usuarioId: usuarioId ?? undefined,
  });
}
```

Este ejemplo exige agregar `motivoPrecio` al tipo `FormValues`, al esquema Yup y al JSX del formulario. Para crear un producto no debe solicitarse un historial de cambio, salvo que el equipo decida que el precio inicial tambien es un evento de historial.

**Alternativa de menor cambio:** mantener `PUT /producto/:id` como unica operacion y agregar `motivoPrecio` al DTO de actualizacion. En ese caso, `ProductoService.update` o el repositorio debe detectar si el precio cambio y crear el historial dentro de la misma transaccion. Es mas facil de integrar, pero mezcla actualizacion general y cambio de precio; deben documentar esa decision.

### 13.14 Frontend: componente de consulta

**Crear:** `Proyecto1_Front/src/componentes/gestion-producto/producto/modales/historial-precios-modal.tsx`

Esquema minimo del componente:

```tsx
import { useEffect, useState } from 'react';
import ProductoService from '../services/producto-service';
import { HistorialPrecioCr007 } from '../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios';

export function HistorialPreciosModal({ productoId, onClose }: {
  productoId: number;
  onClose: () => void;
}) {
  const [items, setItems] = useState<HistorialPrecioCr007[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ProductoService.obtenerHistorialPrecios(productoId)
      .then((response) => setItems(response.data))
      .catch(() => setError('No se pudo cargar el historial de precios.'))
      .finally(() => setLoading(false));
  }, [productoId]);

  // Renderizar estados loading, error, lista vacia y tabla.
  // La tabla debe mostrar fecha, precioAnterior, precioNuevo y motivo.
  return null;
}
```

El `return null` es solo una plantilla de ubicacion. Debes reemplazarlo con el componente visual del proyecto. Luego, en [producto-modales.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/modales/producto-modales.tsx), renderiza el modal cuando `mostrarHistorialPrecios` sea verdadero y pasa el id del producto seleccionado.

En [consultar-producto.tsx](Proyecto1_Front/src/componentes/gestion-producto/producto/utils/consultar-producto.tsx), conserva `handleMostrarHistorialPrecios`, pero verifica que:

- use el producto seleccionado correcto;
- no haga una consulta innecesaria a `obtenerId` si ya tiene el id suficiente;
- cierre el modal y limpie el estado;
- respete paginacion si el historial puede crecer.

### 13.15 Tests que debes crear o modificar

**Backend unitario:** crear un spec para el servicio o caso de uso, por ejemplo:

`Proyecto1_Back/proyecto/src/modules/gestion-productos/producto/application/services/producto.service.spec.ts`

Casos minimos:

```ts
it('actualiza precio y crea historial', async () => {
  // Producto.precio = 1000; dto = { precioNuevo: 1150, motivo: 'costo' }
  // Verificar save de Producto y save de HistorialPrecio.
});

it('rechaza motivo vacio', async () => {
  // Esperar BadRequestException y verificar que no se guarde nada.
});

it('rechaza precio no positivo', async () => {
  // Esperar BadRequestException y verificar que no se guarde nada.
});

it('revierte cuando falla el historial', async () => {
  // Hacer fallar historialRepository.save y verificar rollback.
});
```

**Backend E2E:** agregar casos a `Proyecto1_Back/proyecto/test/app.e2e-spec.ts` o crear un spec especifico para:

```text
PATCH /producto/:id/precio -> 200 y registro creado
PATCH sin motivo -> 400
PATCH con precio <= 0 -> 400
GET /producto/:id/historial-precios -> registros ordenados
GET con producto inexistente -> 404
```

**Frontend:** crear tests para el servicio o componente usando la herramienta que el equipo configure. Deben verificar que el formulario no envia un cambio sin motivo y que la tabla muestra los cuatro campos del CR.

## 14. Criterio de terminado para la Entrega 2

No marques CR-007 como terminado hasta comprobar todos estos puntos:

- [ ] existe la entidad `HistorialPrecio` y la tabla correspondiente;
- [ ] la tabla tiene FK a Producto, precios, fecha y motivo;
- [ ] existe una migracion reproducible con `up` y `down`;
- [ ] el precio anterior lo obtiene el backend;
- [ ] precio nuevo y motivo se validan en backend;
- [ ] Producto e HistorialPrecio se guardan en la misma transaccion;
- [ ] el endpoint de cambio esta protegido y documentado;
- [ ] el endpoint de consulta devuelve historial paginado y ordenado;
- [ ] el frontend envia el motivo y muestra errores claros;
- [ ] la UI permite consultar el historial;
- [ ] existen tests de regla de negocio, endpoint, transaccion y UI;
- [ ] Event Storming, historia de usuario y tabla de trazabilidad apuntan al codigo real;
- [ ] se documentaron las discrepancias existentes y las decisiones tomadas;
- [ ] el despliegue ejecuta el esquema correcto antes de usar los endpoints.

Los fragmentos anteriores indican que codigo introducir y donde colocarlo, pero requieren adaptar imports, inyeccion de dependencias, nombres de tipos y componentes a la version final del equipo. La evidencia de la Entrega 2 debe mostrar esa adaptacion y no solo la copia de un ejemplo.

## 15. Implementacion aplicada en este repositorio

La implementacion realizada usa `PUT /producto/:id` como entrada unica para editar el producto, porque ese es el endpoint que utiliza actualmente el formulario de React. Cuando el campo `precio` cambia, el backend exige `motivoPrecio`, actualiza el precio y crea `HistorialPrecio` dentro de la misma transaccion. Cuando el precio no cambia, no crea un registro redundante.

Tambien se agrego `GET /producto/:id/historial-precios` para consultar los registros paginados y ordenados por fecha descendente. Se conserva el usuario que realiza el cambio como dato adicional de auditoria.

Esta decision difiere de la alternativa de crear un `PATCH /producto/:id/precio` independiente, pero es necesaria para que el flujo actual de edicion no pueda modificar precios sin registrar historial. La alternativa independiente solo seria valida despues de migrar toda la UI y cualquier otro consumidor al nuevo caso de uso.