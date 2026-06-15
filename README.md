# SELECT · Control de turnos

Aplicación web para gestionar turnos de una empresa de seguridad privada:
trabajadores, establecimientos, turnos, informes y control de costes/márgenes.

Hecha con **Next.js 14**, **Supabase** y **Tailwind CSS**.

---

## 🧭 Guía para ponerla en marcha (paso a paso)

> No hace falta saber programar. Sigue los pasos en orden. Cada vez que veas
> un bloque `así`, es algo que tienes que copiar/pegar o escribir tal cual.

### Paso 1 · Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) con la cuenta de SELECT.
2. Pulsa **New project**.
3. Ponle un nombre (por ejemplo `select-control`), elige una contraseña para
   la base de datos (guárdala) y la región **West EU (Ireland)** o la más cercana.
4. Espera 1–2 minutos a que el proyecto termine de crearse.

### Paso 2 · Crear las tablas (la base de datos)

1. En tu proyecto de Supabase, menú izquierdo → **SQL Editor** → **New query**.
2. Abre el archivo **`supabase-schema.sql`** de esta carpeta, copia **todo** su
   contenido y pégalo en el editor.
3. Pulsa **Run** (abajo a la derecha). Debe decir *Success*.

Esto crea las 4 tablas y la seguridad. Solo se hace una vez.

### Paso 3 · Crear tu usuario administrador

1. En Supabase, menú izquierdo → **Authentication** → **Users** → **Add user**
   → **Create new user**.
2. Pon tu **email** y una **contraseña**. Marca *Auto Confirm User* si aparece.
   Pulsa **Create user**.
3. En la lista de usuarios, haz clic en el que acabas de crear y copia su
   **User UID** (un código largo).
4. Vuelve a **SQL Editor** → **New query**, pega esto cambiando el UID por el tuyo:

   ```sql
   insert into public.usuarios_app (id, nombre, rol)
   values ('PEGA-AQUI-TU-USER-UID', 'Tu Nombre', 'admin');
   ```

   Pulsa **Run**. Ya eres administrador.

### Paso 4 · Conectar la app con Supabase

1. En Supabase, menú izquierdo → **Settings** (rueda dentada) → **API**.
2. Verás 3 datos que necesitas copiar:
   - **Project URL**
   - **anon public** (en *Project API keys*)
   - **service_role** (en *Project API keys* — es secreta, no la compartas)
3. Abre el archivo **`.env.local`** de esta carpeta y pega cada valor:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   Guarda el archivo.

### Paso 5 · Arrancar la app en tu ordenador

Abre la Terminal y escribe (o pídeme que lo haga yo):

```bash
cd ~/Sites/select-control-app
npm run dev
```

Cuando ponga *Ready*, abre el navegador en **http://localhost:3000**.
Entra con el email y la contraseña del Paso 3. ¡Ya estás dentro!

---

## 👥 Roles

- **Administrador**: ve todo (horas, costes, ingresos y márgenes) y gestiona usuarios.
- **Encargado**: solo ve las horas. No ve tarifas, costes ni márgenes, ni la
  sección de Usuarios.

Para dar de alta a más personas: entra como admin → **Usuarios** → **Nuevo usuario**.
Les pones email, contraseña y rol. Ya pueden entrar.

---

## 📄 Qué hay en cada pantalla

| Pantalla | Para qué sirve |
|---|---|
| **Panel** | Resumen del mes: horas, coste, ingresos y margen. |
| **Turnos** | Crear/editar/borrar turnos. Las horas se calculan solas. Filtros por fecha, trabajador y establecimiento. |
| **Trabajadores** | Alta de personal con su tarifa por hora. Activar/desactivar. |
| **Establecimientos** | Alta de clientes con la tarifa que se les cobra por hora. |
| **Informes** | Resumen por trabajador y por establecimiento en un rango de fechas. Exporta a Excel. |
| **Usuarios** | (Solo admin) Gestionar quién puede entrar y con qué rol. |

> **Turnos de noche**: si la hora de fin es menor que la de inicio (por ejemplo
> de 22:00 a 06:00), la app entiende que cruza la medianoche y calcula 8 horas.

---

## 🚀 Subir a internet (opcional, cuando esté listo)

Lo más sencillo es **Vercel** (gratis para esto):

1. Sube esta carpeta a GitHub (al repo de SELECT).
2. En [vercel.com](https://vercel.com) → *Add New Project* → elige el repo.
3. En *Environment Variables*, añade las mismas 3 variables del `.env.local`.
4. Pulsa *Deploy*. En un par de minutos tendrás una URL pública.

Cuando llegues a este punto, avísame y te guío.

---

## 🛠️ Comandos útiles

```bash
npm run dev     # arrancar en local (desarrollo)
npm run build   # comprobar que todo está bien antes de publicar
npm start       # arrancar la versión de producción (tras build)
```
