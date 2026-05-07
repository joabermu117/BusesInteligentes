# Prompt Completos — Módulo Planificación de Viajes, Uso del Servicio, Conductores y Turnos

---

## Contexto Arquitectónico General (Backend NestJS / Frontend React)

**Backend (ms-business):**
- NestJS v11 con TypeORM + MySQL
- 26 módulos existentes con patrón CRUD estándar:
  - `Controller` → `Service` → `Repository` + Entities + DTOs
  - Cada módulo tiene su carpeta: `nombre-modulo/dto/`, `nombre-modulo/entities/`
- No hay guards globales, interceptors, ni filters (la autenticación la maneja el microservicio Java `ms-security`)
- Validación con `class-validator` en DTOs
- Update DTOs extienden `PartialType(CreateXxxDto)` de `@nestjs/mapped-types`
- Todos los endpoints bajo prefijo `api/` (ej: `@Controller('api/rutas')`)
- Las entidades existentes relevantes:
  - **Route** (`routes`): name, origin, destination, distance, estimated_duration, is_active
  - **Stop** (`stops`): name, latitude, longitude, address, is_active
  - **RouteStop** (`route_stop`): route_id + stop_id (composite PK), order_index
  - **Node** (`nodes`): latitude, longitude, type (stop|waypoint), sequence_order, route_id (FK)
  - **Bus** (`buses`): plate, model, year, totalCapacity, seatedCapacity, standingCapacity, status
  - **Schedule** (`schedules`): routeId, departureTime, toleranceMinutes, status, recurrence, date, bus (FK)
  - **Ticket** (`tickets`): ticketNumber, status (issued|used|expired|cancelled), issuedDate, expirationDate, price, qrCode, isBoardingPass; FK a Citizen, CitizenPaymentMethod, Schedule
  - **History** (`histories`): personId, timestamp, action (created|updated|deleted|boarded|validated), details, nodeId; FK a Ticket
  - **Shift** (`shifts`): startTime, endTime, status (scheduled|in_progress|finished|cancelled), observations, busCondition; FK a Driver y Bus
  - **Citizen** (`citizens`): person_id (PK, varchar(255) — mapea a MongoDB ObjectId del ms-security)
  - **Driver** (`drivers`): person_id (PK), licenseNumber, licenseExpiration, status
  - **CitizenPaymentMethod** (`citizen_payment_methods`): cardNumber, cardHolder, expirationDate, isDefault, isActive; FK a Citizen y PaymentMethod
  - **PaymentMethod** (`payment_methods`): name, description, isActive
- Patrón de CRUD en servicios:
  ```typescript
  async create(dto): Promise<Entity> { /* create + save */ }
  async findAll(): Promise<Entity[]> { /* find with relations */ }
  async findOne(id): Promise<Entity> { /* findOne with relations, throw NotFoundException */ }
  async update(id, dto): Promise<Entity> { /* findOne + Object.assign + save */ }
  async remove(id): Promise<{ message: string }> { /* findOne + remove + return message */ }
  ```
- La entidad base `Person` tiene solo `person_id` y es abstracta (no tabla). Citizen y Driver extienden Person.
- **No hay columna `tarifa` en Route actualmente** — se debe agregar.

**Frontend (client-app):**
- React 19 + Vite 8 + MUI v7 + TypeScript
- TanStack React Query v5 para estado del servidor
- Axios para HTTP con interceptor JWT
- React Router DOM v7
- Autenticación: JWT en localStorage, interceptor de Axios, `RequireAuth` wrapper
- Layout: `AppShell` con Drawer lateral y AppBar (en permisos/)
- Patrón de stores: React Query hooks en `stores/` (ej: `useUserStore.ts`)
- Patrón de servicios: archivos en `services/` llaman a la API con httpClient
- MUI Theme con primary blue, secondary amber

---

## Reglas y Buenas Prácticas Obligatorias

### Para Backend (NestJS):
1. **Seguir el patrón CRUD existente** — mismo estilo de controladores, servicios, DTOs, módulos
2. **Usar `+id` en controladores** para convertir string a number en params
3. **DTOs con class-validator** — decoradores en create, PartialType en update
4. **Respuestas limpias** — devolver la entidad o `{ message }` en delete
5. **Relaciones TypeORM** — cargar con `relations` en find, usar `@InjectRepository` para repositorios adicionales
6. **Usar `NotFoundException` y `BadRequestException`** de NestJS para errores
7. **Agregar columna `tarifa` (decimal) a Route** si es necesario para la HU-ENTR-2-001
8. **Registrar en History** las acciones relevantes (abordaje, descenso) con personId y timestamp

### Para Frontend (React):
1. **Seguir la estructura existente** — crear módulos en carpetas tipo `viajes/`, `boletos/`, `turnos/`
2. **React Query hooks** en `stores/` para datos del servidor
3. **Servicios API** en `services/` usando `httpClient` de `config/httpClient.ts`
4. **MUI v7** para componentes UI — usar theme existente
5. **Componentes pequeños** (~150-200 líneas máx), hooks pequeños (~80-120 líneas)
6. **Responsabilidad única** — un componente = una cosa
7. **Tipado fuerte** — interfaces para props, tipos para entidades
8. **Mapas** — usar una librería como Leaflet (react-leaflet) o MapLibre para visualización de rutas y paraderos
9. **GPS del navegador** — usar Geolocation API para obtener ubicación
10. **React Router** — agregar rutas hijas bajo el layout protegido en `App.tsx`

---

## PROMPT 1: HU-ENTR-2-001 — Consulta de rutas disponibles

### Backend

#### 1. Agregar columna `tarifa` a Route

Agregar en `route/entities/route.entity.ts`:
```typescript
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
tarifa?: number;
```

#### 2. Filtrar rutas por nombre

En `routes.service.ts`, modificar `findAll()` para aceptar query param opcional `name`:
```typescript
async findAll(name?: string): Promise<Route[]> {
  const where = name ? { name: Like(`%${name}%`) } : {};
  return await this.routeRepository.find({
    where,
    relations: ['nodes', 'routeStops', 'routeStops.stop'],
  });
}
```
Importar `Like` de `typeorm`.

#### 3. Endpoint: Obtener paraderos de una ruta en orden secuencial

En `routes.service.ts`, crear método que devuelva los paraderos (stops) ordenados por `order_index`:
```typescript
async findStopsByRoute(routeId: number): Promise<RouteStop[]> {
  const route = await this.routeRepository.findOne({
    where: { id: routeId },
    relations: ['routeStops', 'routeStops.stop'],
  });
  if (!route) throw new NotFoundException(`Route #${routeId} not found`);
  return route.routeStops.sort((a, b) => a.order_index! - b.order_index!);
}
```

En `routes.controller.ts`, agregar:
```typescript
@Get(':id/stops')
findStops(@Param('id') id: string) {
  return this.routeService.findStopsByRoute(+id);
}
```

#### 4. DTOs actualizados

Actualizar `CreateRouteDto` para incluir `tarifa`:
```typescript
@IsNumber()
@Min(0)
tarifa: number;
```

UpdateRouteDto se mantiene con `PartialType`.

### Frontend

#### Crear módulo `viajes/`

Archivos a crear:
- `client-app/src/viajes/services/rutasService.ts`
- `client-app/src/viajes/stores/useRutasStore.ts`
- `client-app/src/viajes/pages/RutasList.tsx`
- `client-app/src/viajes/pages/RutaDetalle.tsx`
- `client-app/src/viajes/components/MapaRuta.tsx`
- `client-app/src/viajes/models/ruta.ts`

#### Modelo `ruta.ts`:
```typescript
export interface Ruta {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimated_duration: number;
  tarifa: number;
  is_active: boolean;
}

export interface Paradero {
  route_id: number;
  stop_id: number;
  order_index: number;
  stop: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
}
```

#### Servicio `rutasService.ts`:
```typescript
import httpClient from "../../config/httpClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchRutas = async (name?: string): Promise<Ruta[]> => {
  const params = name ? { name } : {};
  const { data } = await httpClient.get(`${API_URL}/api/routes`, { params });
  return data;
};

export const fetchRutaById = async (id: number): Promise<Ruta> => {
  const { data } = await httpClient.get(`${API_URL}/api/routes/${id}`);
  return data;
};

export const fetchParaderosByRuta = async (routeId: number): Promise<Paradero[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/routes/${routeId}/stops`);
  return data;
};
```

#### Store `useRutasStore.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchRutas, fetchRutaById, fetchParaderosByRuta } from "../services/rutasService";
import type { Ruta, Paradero } from "../models/ruta";

export const useRutas = (name?: string) =>
  useQuery<Ruta[]>({
    queryKey: ["rutas", name],
    queryFn: () => fetchRutas(name),
  });

export const useRuta = (id: number) =>
  useQuery<Ruta>({
    queryKey: ["ruta", id],
    queryFn: () => fetchRutaById(id),
    enabled: !!id,
  });

export const useParaderosByRuta = (routeId: number) =>
  useQuery<Paradero[]>({
    queryKey: ["paraderos", routeId],
    queryFn: () => fetchParaderosByRuta(routeId),
    enabled: !!routeId,
  });
```

#### Página `RutasList.tsx`:
- Tabla/listado de rutas con nombre, origen, destino, tarifa (formateada como moneda), duración estimada
- Input de búsqueda por nombre con debounce
- Al hacer clic en una ruta, navegar a `/rutas/:id`
- Usar componentes MUI: TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button

#### Página `RutaDetalle.tsx`:
- Muestra info de la ruta (nombre, origen, destino, distancia, tarifa, duración)
- Mapa (Leaflet/MapLibre) con los paraderos en orden secuencial marcados con pins numerados
- Línea que conecta los paraderos en orden
- Tiempo estimado total de recorrido mostrado prominentemente
- Botón "Volver a rutas"

#### Componente `MapaRuta.tsx`:
- Recibe array de paraderos con coordenadas
- Renderiza mapa centrado en los paraderos
- Marcadores numerados según `order_index`
- Línea/polyline conectando en orden secuencial

#### Rutas en React Router:
En `App.tsx`, dentro del layout protegido `<Route element={<AppShell />}>`, agregar:
```tsx
<Route path="/rutas" element={<RutasList />} />
<Route path="/rutas/:id" element={<RutaDetalle />} />
```

#### Agregar navegación en AppShell:
Agregar ítem "Rutas" en el menú lateral del `AppShell.tsx`.

---

## PROMPT 2: HU-ENTR-2-002 — Búsqueda de paraderos cercanos

### Backend

#### Endpoint en `stop/stops.service.ts`:
Crear método que, dadas coordenadas (lat, lng), devuelva los 5 paraderos más cercanos usando fórmula de Haversine vía TypeORM query builder:

```typescript
async findNearest(latitude: number, longitude: number, limit = 5): Promise<any[]> {
  // Haversine en SQL para calcular distancia en metros
  const result = await this.stopRepository
    .createQueryBuilder('stop')
    .leftJoinAndSelect('stop.routeStops', 'routeStop')
    .leftJoinAndSelect('routeStop.route', 'route')
    .addSelect(
      `6371000 * 2 * ASIN(SQRT(
        POWER(SIN((:lat - stop.latitude) * PI() / 360), 2) +
        COS(:lat * PI() / 180) * COS(stop.latitude * PI() / 180) *
        POWER(SIN((:lng - stop.longitude) * PI() / 360), 2)
      ))`,
      'distance',
    )
    .setParameters({ lat: latitude, lng: longitude })
    .orderBy('distance', 'ASC')
    .take(limit)
    .getRawAndEntities();

  // Mapear resultado con distancia
  return result.raw.map((raw, index) => ({
    ...result.entities[index],
    distance: Math.round(raw.distance),
  }));
}
```

#### En `stop.controller.ts`:
```typescript
@Get('nearest')
findNearest(@Query('lat') lat: string, @Query('lng') lng: string) {
  return this.stopService.findNearest(+lat, +lng);
}
```

### Frontend

#### Crear página `ParaderosCercanos.tsx` en `viajes/pages/`:
1. Solicitar permiso de ubicación GPS al montar el componente usando `navigator.geolocation.getCurrentPosition`
2. Mostrar loader mientras se obtiene ubicación
3. Llamar al endpoint `/api/stops/nearest?lat=...&lng=...`
4. Mostrar lista de 5 paraderos con:
   - Nombre del paradero
   - Distancia en metros
   - Rutas que pasan por él
5. Mapa con la ubicación de cada paradero marcado
6. Botón "Actualizar ubicación" para refrescar
7. Si el usuario se desplaza significativamente (>100m), auto-actualizar (opcional con `watchPosition`)

#### Store `useParaderosStore.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import httpClient from "../../config/httpClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useParaderosCercanos = (lat: number, lng: number) =>
  useQuery({
    queryKey: ["paraderos-cercanos", lat, lng],
    queryFn: async () => {
      const { data } = await httpClient.get(`${API_URL}/api/stops/nearest`, {
        params: { lat, lng },
      });
      return data;
    },
    enabled: !!lat && !!lng,
  });
```

#### Agregar ruta en `App.tsx`:
```tsx
<Route path="/paraderos" element={<ParaderosCercanos />} />
```

#### Agregar navegación en AppShell.

---

## PROMPT 3: HU-ENTR-2-003 — Abordaje y generación de boleto

### Backend

#### Crear endpoint `POST /api/boarding/board` en nuevo módulo `boarding`

**Estructura:**
```
src/boarding/
├── boarding.module.ts
├── boarding.controller.ts
├── boarding.service.ts
├── dto/
│   └── board-bus.dto.ts
├── entities/  (reutilizar Ticket, History existentes)
```

**DTO `board-bus.dto.ts`:**
```typescript
import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class BoardBusDto {
  @IsString()
  @IsNotEmpty()
  citizenId: string;  // person_id del ciudadano

  @IsNumber()
  scheduleId: number;  // programación activa del bus

  @IsNumber()
  paymentMethodId: number;  // método de pago a usar

  @IsNumber()
  stopId: number;  // paradero donde aborda
}
```

**Lógica del servicio `boarding.service.ts`:**
1. Obtener el Schedule con relaciones a Bus y tickets
2. Validar que el Schedule tenga estado `in_progress` o `scheduled`
3. Verificar capacidad: contar tickets activos (status `issued` o `used`) en el schedule vs `bus.totalCapacity`
   - Si alcanzó capacidad máxima → rechazar con `BadRequestException('El bus está lleno')`
4. Verificar que el ciudadano exista (citizenRepository.findOne)
5. Verificar que el método de pago exista y pertenezca al ciudadano
6. Si es prepagado, **simular** validación de saldo (para MVP, asumir saldo suficiente; en producción conectar con pasarela de pagos)
7. Descontar tarifa — para MVP, registrar como validado; en producción descontar del saldo
8. Generar el Ticket:
   - `ticketNumber`: auto-generado estilo `TKT-{Date.now()}-{random}`
   - `status`: `issued`
   - `issuedDate`: new Date()
   - `price`: la tarifa de la ruta (desde Route)
   - `isBoardingPass`: true
   - Asociar con Citizen, Schedule, CitizenPaymentMethod
9. Registrar historia de abordaje:
   - `personId`: citizenId
   - `action`: 'boarded'
   - `timestamp`: new Date()
   - `nodeId`: stopId (como string)
   - `details`: `"Abordaje en paradero #${stopId}"`
   - Asociar con el Ticket creado
10. Devolver: ticket generado + saldo restante (para MVP: mensaje de confirmación)
    ```typescript
    return {
      message: 'Abordaje exitoso',
      ticket,
      remainingBalance: 0, // placeholder
    };
    ```

#### Crear endpoint `POST /api/boarding/validate-payment`
```typescript
@Post('validate-payment')
validatePayment(@Body() dto: ValidatePaymentDto) {
  return this.boardingService.validatePaymentMethod(dto);
}
```
DTO: `citizenId`, `paymentMethodId`. Devuelve `{ valid: boolean, balance?: number }`.

### Frontend

#### Crear módulo `boletos/` con:
- `services/boardingService.ts`
- `stores/useBoardingStore.ts`
- `pages/AbordarBus.tsx`
- `components/PagoSelector.tsx`
- `components/ConfirmacionAbordaje.tsx`

#### Flujo de la página `AbordarBus.tsx`:
1. Detectar schedule/programación activa (por ahora, el usuario selecciona de una lista de schedules disponibles)
2. Mostrar info del bus (placa, modelo, capacidad disponible vs total)
3. Selector de método de pago del ciudadano (tarjetas guardadas)
4. Botón "Validar y abordar"
5. Confirmación visual "Abordaje exitoso" con saldo restante
6. Manejo de error si bus está lleno

#### Agregar ruta:
```tsx
<Route path="/abordar" element={<AbordarBus />} />
```

---

## PROMPT 4: HU-ENTR-2-004 — Descenso y cierre de viaje

### Backend

#### En el mismo módulo `boarding`:

**DTO `alight-bus.dto.ts`:**
```typescript
import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class AlightBusDto {
  @IsNumber()
  ticketId: number;  // boleto activo

  @IsNumber()
  stopId: number;  // paradero donde desciende
}
```

**Método en `boarding.service.ts`:**
```typescript
async alightBus(dto: AlightBusDto): Promise<{ message: string; ticket: Ticket }> {
  const ticket = await this.ticketRepository.findOne({
    where: { id: dto.ticketId, status: 'issued' },
    relations: ['history'],
  });
  if (!ticket) throw new NotFoundException('Boleto activo no encontrado');

  // Actualizar ticket
  ticket.status = 'used';
  ticket.issuedDate = new Date(); // reuse as completion date? mejor agregar columna completedDate

  await this.ticketRepository.save(ticket);

  // Registrar historia de descenso
  const history = this.historyRepository.create({
    personId: ticket.citizen?.person_id || '',
    action: 'validated',
    timestamp: new Date(),
    nodeId: dto.stopId.toString(),
    details: 'Descenso en paradero',
    ticket,
  });
  await this.historyRepository.save(history);

  return { message: 'Viaje completado - Gracias por usar nuestro servicio', ticket };
}
```

**Consideración:** Agregar columna `completedDate` a `Ticket` si se quiere timestamp de finalización explícito.

### Frontend

#### En `boletos/pages/DescenderBus.tsx`:
1. Mostrar boleto activo del ciudadano (debe tener uno en status `issued`)
2. Botón "Descender aquí" que registra la salida en el paradero actual
3. Mensaje de confirmación: "Viaje completado - Gracias por usar nuestro servicio"
4. Redirigir al historial de viajes

#### Store `useViajesStore.ts`:
```typescript
export const useDescender = () =>
  useMutation({
    mutationFn: (data: { ticketId: number; stopId: number }) =>
      httpClient.post(`${API_URL}/api/boarding/alight`, data),
  });
```

---

## PROMPT 5: HU-ENTR-2-005 — Visualización de recorrido de un viaje

### Backend

#### Endpoint en `ticket/ticket.service.ts`:
```typescript
async findTravelDetail(id: number): Promise<Ticket> {
  return await this.ticketRepository.findOne({
    where: { id },
    relations: [
      'citizen',
      'schedule',
      'schedule.bus',
      'history',
    ],
  });
}
```

#### Endpoint nuevo: historial de viajes por ciudadano
```typescript
async findByPerson(personId: string): Promise<Ticket[]> {
  return await this.ticketRepository.find({
    where: { citizen: { person_id: personId } },
    relations: ['schedule', 'schedule.bus', 'history'],
    order: { issuedDate: 'DESC' },
  });
}
```

### Frontend

#### Crear páginas:
- `boletos/pages/HistorialViajes.tsx` — lista de viajes realizados
- `boletos/pages/DetalleViaje.tsx` — mapa con recorrido

#### `HistorialViajes.tsx`:
- Lista de tickets del ciudadano con: número de boleto, fecha, ruta, placa del bus, estado
- Cada item es clickeable para ver detalle

#### `DetalleViaje.tsx`:
- Mapa con la ruta completa (obtener paraderos de la ruta del schedule)
- Marcar paradero de abordaje y descenso con iconos distintivos (verde/rojo)
- Mostrar horas exactas de cada validación (desde History)
- Indicar tiempo total de viaje (diferencia entre boarded y validated timestamps)
- Mostrar placa del bus y conductor
- Botón "Volver al historial"

---

## PROMPT 6: HU-ENTR-2-006 — Inicio de turno de conductor

### Backend (ya existe módulo Shifts)

#### Actualizar `shifts/shifts.service.ts` con método de inicio de turno:

```typescript
async startShift(shiftId: number, dto: StartShiftDto): Promise<Shift> {
  const shift = await this.shiftRepository.findOne({
    where: { id: shiftId },
    relations: ['bus', 'driver'],
  });
  if (!shift) throw new NotFoundException(`Turno #${shiftId} no encontrado`);

  // Validar que sea la fecha/hora correcta
  const now = new Date();
  const shiftStart = new Date(shift.startTime!);
  const diffMinutes = Math.abs(now.getTime() - shiftStart.getTime()) / 60000;
  if (diffMinutes > 30) {
    throw new BadRequestException('El turno no corresponde a la hora actual (+/- 30 min)');
  }

  // Validar estado
  if (shift.status !== 'scheduled') {
    throw new BadRequestException('El turno no está programado');
  }

  // Actualizar con datos del conductor
  shift.status = 'in_progress';
  shift.busCondition = dto.busCondition;
  shift.observations = dto.observations;
  shift.startTime = now; // actualizar con hora real de inicio

  // Activar GPS del bus
  if (shift.bus?.gps) {
    shift.bus.gps.active = true;
    shift.bus.gps.lastUpdate = now;
  }

  return await this.shiftRepository.save(shift);
}
```

#### DTO `start-shift.dto.ts`:
```typescript
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class StartShiftDto {
  @IsOptional()
  @IsEnum(['operative', 'maintenance', 'out_of_service'])
  busCondition?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
```

#### Controlador:
```typescript
@Patch(':id/start')
startShift(@Param('id') id: string, @Body() dto: StartShiftDto) {
  return this.shiftsService.startShift(+id, dto);
}
```

### Frontend

#### Crear módulo `turnos/`:
- `pages/MisTurnos.tsx` — lista de turnos programados del conductor
- `pages/IniciarTurno.tsx` — formulario para iniciar turno

#### `MisTurnos.tsx`:
- Lista de turnos del conductor logueado con estado
- Botón "Iniciar turno" en los que estén "scheduled"
- Filtro por fecha (hoy)

#### `IniciarTurno.tsx`:
- Mostrar bus asignado según la programación
- Selector de estado del bus: Operativo / Con observaciones
- Si "Con observaciones", mostrar TextField para nota
- Botón "Confirmar inicio de turno"
- Al confirmar, llamar a `PATCH /api/shifts/:id/start`
- Confirmación visual: GPS activado, turno en curso

---

## Resumen de nuevos endpoints backend

| Módulo | Método | Endpoint | Propósito |
|--------|--------|----------|-----------|
| Route | GET | `/api/routes?name=` | Listar rutas con filtro |
| Route | GET | `/api/routes/:id/stops` | Paraderos de ruta ordenados |
| Stop | GET | `/api/stops/nearest?lat=&lng=` | 5 paraderos más cercanos |
| Boarding | POST | `/api/boarding/board` | Abordaje y generar boleto |
| Boarding | POST | `/api/boarding/validate-payment` | Validar método de pago |
| Boarding | POST | `/api/boarding/alight` | Descenso y cerrar viaje |
| Ticket | GET | `/api/tickets/by-person/:personId` | Historial de viajes |
| Ticket | GET | `/api/tickets/:id/detail` | Detalle de un viaje |
| Shift | PATCH | `/api/shifts/:id/start` | Iniciar turno conductor |

## Notas adicionales

1. **Instalar leaflet/react-leaflet** en frontend: `npm install leaflet react-leaflet @types/leaflet`
2. **No olvidar importar CSS de Leaflet**: `import "leaflet/dist/leaflet.css";`
3. **Para el GPS del navegador**, manejar casos:
   - Permiso denegado → mostrar mensaje amigable
   - No soportado → alternativa manual con input de dirección
4. **Coordinación con ms-security:** Los IDs de ciudadano y conductor vienen de MongoDB. Asegurar que existan en MySQL antes de operar.
5. **No hay sistema de recarga/saldo real** — para MVP, simular saldo suficiente; en producción se integraría con pasarela de pagos.
6. **Agregar `completedDate` a Ticket** si se desea tracking explícito de finalización.
7. **Actualizar `app.module.ts`** para importar `BoardingModule` y cualquier módulo nuevo creado.
8. **Mantener estilo consistente:** Las historias(History) ya existen como entidad, reutilizarlas en lugar de crear tablas nuevas de auditoría.
9. **No olvidar el CORS** — el backend escucha en puerto 3000, el frontend en puerto 5173 (Vite). Asegurar que NestJS tenga CORS habilitado.
