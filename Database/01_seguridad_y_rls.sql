-- =====================================================================
-- RestauranteApp - Paso 2: restricciones, trigger, funciones y RLS
-- Ejecutar COMPLETO en Supabase > SQL Editor.
-- Se puede ejecutar varias veces sin romper nada (es idempotente).
-- Roles del sistema: admin, mesero, repartidor (tabla empleados) y cliente.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Enlace con Supabase Auth (columna auth_id)
-- ---------------------------------------------------------------------
alter table public.clientes  add column if not exists auth_id uuid unique references auth.users(id);
alter table public.empleados add column if not exists auth_id uuid unique references auth.users(id);

-- Si se borra un usuario de Auth, la fila de negocio se conserva (auth_id queda en null)
alter table public.clientes  drop constraint if exists clientes_auth_id_fkey;
alter table public.clientes  add constraint clientes_auth_id_fkey
  foreign key (auth_id) references auth.users(id) on delete set null;

alter table public.empleados drop constraint if exists empleados_auth_id_fkey;
alter table public.empleados add constraint empleados_auth_id_fkey
  foreign key (auth_id) references auth.users(id) on delete set null;


-- ---------------------------------------------------------------------
-- 1. Valores por defecto y restricciones de integridad
--    ("not valid" = se aplican a los datos nuevos y no fallan por datos viejos)
-- ---------------------------------------------------------------------
alter table public.productos alter column disponible set default true;
alter table public.pedidos   alter column estado set default 'pendiente';
alter table public.mesas     alter column estado set default 'libre';
alter table public.domicilios alter column estado_entrega set default 'pendiente';

-- empleados
alter table public.empleados drop constraint if exists empleados_rol_valido;
alter table public.empleados add constraint empleados_rol_valido
  check (rol in ('admin', 'mesero', 'repartidor')) not valid;

-- productos
alter table public.productos drop constraint if exists productos_precio_positivo;
alter table public.productos add constraint productos_precio_positivo
  check (precio >= 0) not valid;

-- mesas
create unique index if not exists mesas_numero_mesa_uk on public.mesas (numero_mesa);

alter table public.mesas drop constraint if exists mesas_estado_valido;
alter table public.mesas add constraint mesas_estado_valido
  check (estado in ('libre', 'ocupada', 'reservada')) not valid;

alter table public.mesas drop constraint if exists mesas_capacidad_positiva;
alter table public.mesas add constraint mesas_capacidad_positiva
  check (capacidad > 0) not valid;

-- pedidos
alter table public.pedidos drop constraint if exists tipo_pedido_valido;
alter table public.pedidos drop constraint if exists pedidos_tipo_valido;
alter table public.pedidos add constraint pedidos_tipo_valido
  check (tipo_pedido in ('mesa', 'domicilio')) not valid;

alter table public.pedidos drop constraint if exists pedidos_estado_valido;
alter table public.pedidos add constraint pedidos_estado_valido
  check (estado in ('pendiente', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado')) not valid;

alter table public.pedidos drop constraint if exists pedidos_total_positivo;
alter table public.pedidos add constraint pedidos_total_positivo
  check (total >= 0) not valid;

-- un pedido de mesa necesita mesa; uno a domicilio necesita cliente
alter table public.pedidos drop constraint if exists pedidos_coherencia_tipo;
alter table public.pedidos add constraint pedidos_coherencia_tipo
  check (
    (tipo_pedido = 'mesa'      and mesa_id    is not null) or
    (tipo_pedido = 'domicilio' and cliente_id is not null)
  ) not valid;

-- detalles_pedido
alter table public.detalles_pedido drop constraint if exists detalles_cantidad_positiva;
alter table public.detalles_pedido add constraint detalles_cantidad_positiva
  check (cantidad > 0) not valid;

alter table public.detalles_pedido drop constraint if exists detalles_precio_positivo;
alter table public.detalles_pedido add constraint detalles_precio_positivo
  check (precio_unitario >= 0) not valid;

-- domicilios
alter table public.domicilios drop constraint if exists domicilios_estado_valido;
alter table public.domicilios add constraint domicilios_estado_valido
  check (estado_entrega in ('pendiente', 'en_camino', 'entregado', 'cancelado')) not valid;


-- ---------------------------------------------------------------------
-- 2. Trigger: crea la fila en "clientes" cuando alguien se registra en la app
--    Los empleados los crea el administrador (marcados con tipo = 'empleado')
--    y NO se convierten en clientes.
--    IMPORTANTE: el rol de empleado nunca se toma de los metadatos del
--    registro (los controla el usuario); solo el admin puede escribir en
--    "empleados" (ver políticas RLS más abajo).
-- ---------------------------------------------------------------------
create or replace function public.crear_cliente_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'nombre'
     and coalesce(new.raw_user_meta_data->>'tipo', '') <> 'empleado' then
    insert into public.clientes (nombre, telefono, email, auth_id)
    values (
      new.raw_user_meta_data->>'nombre',
      new.raw_user_meta_data->>'telefono',
      new.email,
      new.id
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_cliente_al_registrarse();


-- ---------------------------------------------------------------------
-- 3. Funciones auxiliares para las políticas
--    (security definer = leen las tablas sin disparar RLS, evita recursión)
-- ---------------------------------------------------------------------
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select e.rol from public.empleados e where e.auth_id = auth.uid() limit 1),
    (select 'cliente'::text from public.clientes c where c.auth_id = auth.uid() limit 1),
    'ninguno'
  );
$$;

create or replace function public.cliente_id_actual()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select c.id from public.clientes c where c.auth_id = auth.uid() limit 1;
$$;

create or replace function public.empleado_id_actual()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select e.id from public.empleados e where e.auth_id = auth.uid() limit 1;
$$;

create or replace function public.pedido_es_del_cliente(pid bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pedidos p
    where p.id = pid and p.cliente_id = public.cliente_id_actual()
  );
$$;

create or replace function public.pedido_es_del_repartidor(pid bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.domicilios d
    where d.pedido_id = pid and d.repartidor_id = public.empleado_id_actual()
  );
$$;

revoke all on function public.rol_actual()                    from public;
revoke all on function public.cliente_id_actual()             from public;
revoke all on function public.empleado_id_actual()            from public;
revoke all on function public.pedido_es_del_cliente(bigint)   from public;
revoke all on function public.pedido_es_del_repartidor(bigint) from public;

grant execute on function public.rol_actual()                    to authenticated;
grant execute on function public.cliente_id_actual()             to authenticated;
grant execute on function public.empleado_id_actual()            to authenticated;
grant execute on function public.pedido_es_del_cliente(bigint)   to authenticated;
grant execute on function public.pedido_es_del_repartidor(bigint) to authenticated;


-- ---------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- ---------------------------------------------------------------------
alter table public.clientes        enable row level security;
alter table public.empleados       enable row level security;
alter table public.mesas           enable row level security;
alter table public.productos       enable row level security;
alter table public.pedidos         enable row level security;
alter table public.detalles_pedido enable row level security;
alter table public.domicilios      enable row level security;

-- ===== productos: todos ven los disponibles; solo el admin gestiona =====
drop policy if exists productos_select on public.productos;
drop policy if exists productos_insert on public.productos;
drop policy if exists productos_update on public.productos;
drop policy if exists productos_delete on public.productos;

create policy productos_select on public.productos for select to authenticated
  using (coalesce(disponible, true) or public.rol_actual() = 'admin');
create policy productos_insert on public.productos for insert to authenticated
  with check (public.rol_actual() = 'admin');
create policy productos_update on public.productos for update to authenticated
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');
create policy productos_delete on public.productos for delete to authenticated
  using (public.rol_actual() = 'admin');

-- ===== mesas: las ven admin y mesero; el mesero cambia su estado =====
drop policy if exists mesas_select on public.mesas;
drop policy if exists mesas_insert on public.mesas;
drop policy if exists mesas_update on public.mesas;
drop policy if exists mesas_delete on public.mesas;

create policy mesas_select on public.mesas for select to authenticated
  using (public.rol_actual() in ('admin', 'mesero'));
create policy mesas_insert on public.mesas for insert to authenticated
  with check (public.rol_actual() = 'admin');
create policy mesas_update on public.mesas for update to authenticated
  using (public.rol_actual() in ('admin', 'mesero'))
  with check (public.rol_actual() in ('admin', 'mesero'));
create policy mesas_delete on public.mesas for delete to authenticated
  using (public.rol_actual() = 'admin');

-- ===== clientes: cada cliente ve y edita lo suyo; el personal puede consultar =====
drop policy if exists clientes_select on public.clientes;
drop policy if exists clientes_insert on public.clientes;
drop policy if exists clientes_update on public.clientes;
drop policy if exists clientes_delete on public.clientes;

create policy clientes_select on public.clientes for select to authenticated
  using (auth_id = auth.uid() or public.rol_actual() in ('admin', 'mesero', 'repartidor'));
create policy clientes_insert on public.clientes for insert to authenticated
  with check (auth_id = auth.uid());
create policy clientes_update on public.clientes for update to authenticated
  using (auth_id = auth.uid() or public.rol_actual() = 'admin')
  with check (auth_id = auth.uid() or public.rol_actual() = 'admin');
create policy clientes_delete on public.clientes for delete to authenticated
  using (public.rol_actual() = 'admin');

-- ===== empleados: cada uno ve su fila; solo el admin gestiona =====
drop policy if exists empleados_select on public.empleados;
drop policy if exists empleados_insert on public.empleados;
drop policy if exists empleados_update on public.empleados;
drop policy if exists empleados_delete on public.empleados;

create policy empleados_select on public.empleados for select to authenticated
  using (auth_id = auth.uid() or public.rol_actual() = 'admin');
create policy empleados_insert on public.empleados for insert to authenticated
  with check (public.rol_actual() = 'admin');
create policy empleados_update on public.empleados for update to authenticated
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');
create policy empleados_delete on public.empleados for delete to authenticated
  using (public.rol_actual() = 'admin');

-- ===== pedidos =====
--  cliente   : solo domicilios propios (crea en estado 'pendiente'; solo puede cancelar si sigue pendiente)
--  mesero    : pedidos de mesa
--  repartidor: pedidos de sus domicilios
--  admin     : todo
drop policy if exists pedidos_select on public.pedidos;
drop policy if exists pedidos_insert on public.pedidos;
drop policy if exists pedidos_update on public.pedidos;
drop policy if exists pedidos_delete on public.pedidos;

create policy pedidos_select on public.pedidos for select to authenticated
  using (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'cliente'    and cliente_id = public.cliente_id_actual())
    or (public.rol_actual() = 'mesero'     and tipo_pedido = 'mesa')
    or (public.rol_actual() = 'repartidor' and public.pedido_es_del_repartidor(id))
  );

create policy pedidos_insert on public.pedidos for insert to authenticated
  with check (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'cliente'
        and tipo_pedido = 'domicilio'
        and cliente_id = public.cliente_id_actual()
        and mesa_id is null
        and empleado_id is null
        and estado = 'pendiente')
    or (public.rol_actual() = 'mesero'
        and tipo_pedido = 'mesa'
        and empleado_id = public.empleado_id_actual()
        and estado = 'pendiente')
  );

create policy pedidos_update on public.pedidos for update to authenticated
  using (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'cliente' and cliente_id = public.cliente_id_actual() and estado = 'pendiente')
    or (public.rol_actual() = 'mesero'  and tipo_pedido = 'mesa')
    or (public.rol_actual() = 'repartidor' and public.pedido_es_del_repartidor(id))
  )
  with check (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'cliente'
        and cliente_id = public.cliente_id_actual()
        and tipo_pedido = 'domicilio'
        and estado in ('pendiente', 'cancelado'))
    or (public.rol_actual() = 'mesero'  and tipo_pedido = 'mesa')
    or (public.rol_actual() = 'repartidor' and tipo_pedido = 'domicilio')
  );

create policy pedidos_delete on public.pedidos for delete to authenticated
  using (public.rol_actual() = 'admin');

-- ===== detalles_pedido: heredan la visibilidad del pedido =====
drop policy if exists detalles_select on public.detalles_pedido;
drop policy if exists detalles_insert on public.detalles_pedido;
drop policy if exists detalles_update on public.detalles_pedido;
drop policy if exists detalles_delete on public.detalles_pedido;

create policy detalles_select on public.detalles_pedido for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = detalles_pedido.pedido_id));

create policy detalles_insert on public.detalles_pedido for insert to authenticated
  with check (
    public.rol_actual() in ('admin', 'cliente', 'mesero')
    and exists (
      select 1 from public.pedidos p
      where p.id = detalles_pedido.pedido_id
        and (p.estado = 'pendiente' or public.rol_actual() in ('admin', 'mesero'))
    )
  );

create policy detalles_update on public.detalles_pedido for update to authenticated
  using (
    public.rol_actual() in ('admin', 'mesero')
    and exists (select 1 from public.pedidos p where p.id = detalles_pedido.pedido_id)
  )
  with check (public.rol_actual() in ('admin', 'mesero'));

create policy detalles_delete on public.detalles_pedido for delete to authenticated
  using (
    public.rol_actual() in ('admin', 'mesero')
    and exists (select 1 from public.pedidos p where p.id = detalles_pedido.pedido_id)
  );

-- ===== domicilios =====
--  cliente   : crea y ve el de su pedido (sin asignar repartidor)
--  repartidor: ve y actualiza los que tiene asignados
--  admin     : todo (asigna repartidor)
drop policy if exists domicilios_select on public.domicilios;
drop policy if exists domicilios_insert on public.domicilios;
drop policy if exists domicilios_update on public.domicilios;
drop policy if exists domicilios_delete on public.domicilios;

create policy domicilios_select on public.domicilios for select to authenticated
  using (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'cliente'    and public.pedido_es_del_cliente(pedido_id))
    or (public.rol_actual() = 'repartidor' and repartidor_id = public.empleado_id_actual())
  );

create policy domicilios_insert on public.domicilios for insert to authenticated
  with check (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'cliente'
        and public.pedido_es_del_cliente(pedido_id)
        and repartidor_id is null)
  );

create policy domicilios_update on public.domicilios for update to authenticated
  using (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'repartidor' and repartidor_id = public.empleado_id_actual())
  )
  with check (
    public.rol_actual() = 'admin'
    or (public.rol_actual() = 'repartidor' and repartidor_id = public.empleado_id_actual())
  );

create policy domicilios_delete on public.domicilios for delete to authenticated
  using (public.rol_actual() = 'admin');


-- ---------------------------------------------------------------------
-- 5. Datos de prueba (solo se insertan si la tabla está vacía)
-- ---------------------------------------------------------------------
insert into public.productos (nombre, descripcion, precio, categoria, disponible)
select v.*
from (values
  ('Hamburguesa clásica', 'Carne de res, queso, lechuga y tomate',   18000, 'Hamburguesas', true),
  ('Hamburguesa doble',   'Doble carne, doble queso y tocineta',     24000, 'Hamburguesas', true),
  ('Perro caliente',      'Salchicha, queso, papas y salsas',        12000, 'Perros',       true),
  ('Pizza personal',      'Queso mozzarella y jamón',                16000, 'Pizzas',       true),
  ('Papas a la francesa', 'Porción grande con salsas',                8000, 'Acompañantes', true),
  ('Limonada natural',    'Jarra individual',                         5000, 'Bebidas',      true),
  ('Gaseosa',             'Botella personal',                         4000, 'Bebidas',      true),
  ('Brownie con helado',  'Brownie tibio con helado de vainilla',     9000, 'Postres',      true)
) as v(nombre, descripcion, precio, categoria, disponible)
where not exists (select 1 from public.productos);

insert into public.mesas (numero_mesa, capacidad, estado)
select n, 4, 'libre'
from generate_series(1, 8) as n
where not exists (select 1 from public.mesas);


-- ---------------------------------------------------------------------
-- 6. PRIMER ADMINISTRADOR (ejecutar aparte, después de crear el usuario)
--    a) Supabase > Authentication > Users > Add user (marca "Auto Confirm User")
--    b) Cambia el correo de abajo por el que usaste y ejecuta SOLO este bloque:
-- ---------------------------------------------------------------------
-- insert into public.empleados (nombre, rol, telefono, auth_id)
-- select 'Administrador', 'admin', null, u.id
-- from auth.users u
-- where u.email = 'admin@restaurante.com'
--   and not exists (select 1 from public.empleados e where e.auth_id = u.id);


-- ---------------------------------------------------------------------
-- 7. PRUEBAS DE RLS (ejecutar de a una, cambiando el UUID por el de un usuario)
--    El UUID se ve en Authentication > Users.
-- ---------------------------------------------------------------------
-- begin;
-- set local role authenticated;
-- select set_config('request.jwt.claims', '{"sub":"UUID_DEL_CLIENTE","role":"authenticated"}', true);
-- select public.rol_actual();   -- debe devolver 'cliente'
-- select * from public.pedidos; -- solo debe mostrar SUS pedidos
-- select * from public.mesas;   -- debe devolver 0 filas (un cliente no ve mesas)
-- rollback;