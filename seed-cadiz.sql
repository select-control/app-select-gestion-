-- ============================================================
-- DATOS DE LA ZONA DE CÁDIZ (generado desde el Excel original)
-- 33 establecimientos · 27 trabajadores
-- Ejecutar DESPUÉS de supabase-schema.sql
-- ============================================================

-- ESTABLECIMIENTOS
insert into public.establecimientos (nombre, razon_social, cif, direccion, delegacion, tarifa_hora_cliente) values
  ('CAMPING LA ROSALEDA', 'CAMPING LA ROSALEDA SL', 'B11460920', 'CARRETERA DEL PRADILLO KM1.3, 11140, CONIL DE LA FRONTERA', 'Andalucía', 18.5),
  ('DISCOTECA BEREBER', 'LONDON CLUB JEREZ 2013 SL', 'B11912276', 'CALLE CABEZAS 8-10, 11403, JEREZ DE LA FRONTERA', 'Andalucía', 22.0),
  ('DISCOTECA KUBBO', 'QUE NO FALTE GLORIA SL', 'B75833913', 'CALLE CALDEREROS, 1, PL. FADRICAS, 11100, SAN FERNANDO', 'Andalucía', 22.0),
  ('BAHIA SOUND', 'BAHIA SOUND BEACH CLUB SL', 'B70883913', 'CALLE CALDEREROS, 1, PL. FADRICAS, 11100, SAN FERNANDO', 'Andalucía', 21.0),
  ('FESTIVAL PIZZA (ROTA)', 'ARTEKNO EVENTOS SL (EVENSUR)', 'B75360032', 'CALLE CALDEREROS, 1, PL. FADRICAS, 11100, SAN FERNANDO', 'Andalucía', 20.0),
  ('DISCOTECA CALACHICA', 'CHIRINGUITOUR SL', 'B72908122', 'CALLE EDIFICIO CARRANZA S/N, AV/ DE LA SANIDAD PUBLICA, ESTADIO NUEVO MIRANDILLA, OFICINA 28, 4A PLANTA, 11010, CADIZ', 'Andalucía', 21.0),
  ('DISCOTECA LA CHALANA', 'SINGULAR OCIO PROYECT SL', 'B06975742', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('DISCOTECA GUATEQUE', 'GALERAS REALES PUB SL', 'B11372513', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('DISCOTECA CASABLANCA', 'PENTAGONO PUERTO SL', 'B90080516', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('DISCOTECA GOLD', 'GESPUERTO HOSTELERIA SL', 'B11549128', 'CALLE MICAELA ARAMBURU DE MORA 25, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 22.0),
  ('DISCOTECA ICARO', 'URCRESUR SL', 'B22465249', 'PLAZA DE ANDALUCIA, 2, 11140, CONIL DE LA FRONTERA', 'Andalucía', 22.0),
  ('DISCOTECA BLU', 'PENTAGONO ESCALENO SL', 'B90488164', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('CAMPING EL FARO', 'CAMPING EL FARO SL', 'B11265519', 'CALLE RAFAEL ALBERTI 1, 2 IZQUIERDA, 11140, CONIL DE LA FRONTERA', 'Andalucía', 20.0),
  ('LUPITA CLUB', 'DANCE AMIGO SL', 'B21860416', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('PLAYA CANALLA', 'PENTAGONO ESCALENO SL', 'B90488164', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('SAN ANTON SAN FERNANDO', 'ARTEKNO EVENTOS SL (EVENSUR)', 'B75360032', 'CALLE CALDEREROS, 1, PL. FADRICAS, 11100, SAN FERNANDO', 'Andalucía', 20.0),
  ('CASETA 08 - LA DOBLE AA', 'Manuel Real Dominguez', '20600764-D', 'Calle Chorrillo 7, pta 14, 11150, Vejer de la frontera, Cadiz', 'Andalucía', 21.0),
  ('CASETA 09 -LA DOBLE AA', 'Manuel Real Dominguez', '20600764-D', 'Calle Chorrillo 7, pta 14, 11150, Vejer de la frontera, Cadiz', 'Andalucía', 21.0),
  ('CASETA 10 - LA GUAPA', 'Manuel Real Dominguez', '20600764-D', 'Calle Chorrillo 7, pta 14, 11150, Vejer de la frontera, Cadiz', 'Andalucía', 21.0),
  ('CASETA 11 - LA GUAPA 2', 'Manuel Real Dominguez', '20600764-D', 'Calle Chorrillo 7, pta 14, 11150, Vejer de la frontera, Cadiz', 'Andalucía', 21.0),
  ('CASETA 12 - LA PURETA', 'Manuel Real Dominguez', '20600764-D', 'Calle Chorrillo 7, pta 14, 11150, Vejer de la frontera, Cadiz', 'Andalucía', 21.0),
  ('PUERTO DEPORTIVO LINENSE', 'Club deportivo de caza y pesca linense', 'G11266566', 'Avenida España 98, Bajo comercial, 11300, La linea de la concepción, Cadiz', 'Andalucía', 18.4),
  ('TEATRO MUNICIPAL SANLUCAR', 'Zian sanlucar SL', 'B72313505', 'Calle Bolsa 5, 11540, Sanlucar de barrameda, Cadiz', 'Andalucía', 23.0),
  ('THERAPY', 'Therapy el puerto SL', 'B75856153', 'Calle curva 4, 11500, El puerto de santa maria, Cadiz', 'Andalucía', 22.0),
  ('CRISTALERA CENTRO', 'GALERAS REALES PUB SL', 'B11372513', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('CASETA LA CRISTALERA', 'MUNDO PARRITA SL', 'B13640818', 'CALLE THOMAS ALBA EDISON P301 M15, 11500, EL PUERTO DE SANTA MARIA', 'Andalucía', 21.0),
  ('CASETA LA PEINETA', 'HOSTEVENTOS SL', 'B72015878', 'BAJADA DEL CASTILLO 2, 11500, EL PUERTO DE SANTA MARIA, CADIZ', 'Andalucía', 22.0),
  ('CUSTODIA CALACHICA', 'CHIRINGUITOUR SL', 'B72908122', 'CALLE EDIFICIO CARRANZA S/N, AV/ DE LA SANIDAD PUBLICA, ESTADIO NUEVO MIRANDILLA, OFICINA 28, 4A PLANTA, 11010, CADIZ', 'Andalucía', 21.0),
  ('CASETA CASINO NACIONAL', 'CASINO NACIONAL', 'G-11608775', 'C/ Porvera n ° 6-8, CP 11403 Jerez de la Frontera (Cádiz)', 'Andalucía', 22.0),
  ('CASETA MI CABALLO CON GLAMOUR', 'Agustin Marente morilla', '31702277C', 'Calle cepa 1 p03 C, 11403, Jerez de la frontera, Cadiz', 'Andalucía', 23.0),
  ('Caseta Juvenil Feria el colorado', 'MANUEL PINTO GARCÍA', '75755773Y', 'PLAZA DE LA CONSTITUCIÓN S/N 11140 CONIL', 'Andalucía', 22.0),
  ('CUSTODIA BAHIA SOUND', 'BAHIA SOUND BEACH CLUB SL', 'B70883913', 'CALLE CALDEREROS, 1, PL. FADRICAS, 11100, SAN FERNANDO', 'Andalucía', 18.0),
  ('PARKING LLANO AMARILLO', 'Lucia Hormigo Martin', '75966065-D', 'Calle Almirante Cervera N5, 11300, La linea de la concepción, Cadiz', 'Andalucía', 19.0)
on conflict do nothing;

-- TRABAJADORES (cargo por defecto: Controlador — cámbialo en la app)
insert into public.trabajadores (nombre, iban, cargo_id) values
  ('AMIN RGUIGE KASSIMI', 'ES1320389850926000295585', (select id from public.cargos where nombre='Controlador')),
  ('ANTONIO MARTIN BARROSO', 'ES9814650260691730435551', (select id from public.cargos where nombre='Controlador')),
  ('Aaron Izquierdo Benitez', 'ES3701823248700201606200', (select id from public.cargos where nombre='Controlador')),
  ('Alejandro Caro Dominguez', 'ES8421008523780100217360', (select id from public.cargos where nombre='Controlador')),
  ('Alejandro De Casas Vallecillo', 'ES8401829465680206944852', (select id from public.cargos where nombre='Controlador')),
  ('Antonio Rodriguez Mainé', 'ES7501281735390100010245', (select id from public.cargos where nombre='Controlador')),
  ('Daniel Escudero Granado', 'ES2801825640910201843566', (select id from public.cargos where nombre='Controlador')),
  ('Davinia Marchante Guerra', 'ES2314650100941730831676', (select id from public.cargos where nombre='Controlador')),
  ('Ezequiel Romero García', 'es3221008545010200058219', (select id from public.cargos where nombre='Controlador')),
  ('Francisco Jose Mata Utrera', 'ES8800490529412610155363', (select id from public.cargos where nombre='Controlador')),
  ('Hector Bernal Astete', 'ES8401825332190200392324', (select id from public.cargos where nombre='Controlador')),
  ('Hugo Consuegra De Los Santos', 'ES3631870131225629894923', (select id from public.cargos where nombre='Controlador')),
  ('JESUS CORDERO JAEN', 'ES6702370418709157664607', (select id from public.cargos where nombre='Controlador')),
  ('Jose Manuel García Sanchez', 'ES4514650100971757217073', (select id from public.cargos where nombre='Controlador')),
  ('Jose Ángel Pérez Peña', 'ES1100730100580620664847', (select id from public.cargos where nombre='Controlador')),
  ('Juan Jose Guardiola Bellido', 'ES8031870088755771321527', (select id from public.cargos where nombre='Controlador')),
  ('Manuel Alvarez de la Iglesia', 'ES92 0049 0410 2029 1036 8831', (select id from public.cargos where nombre='Controlador')),
  ('Maria Manuela Romero Molina', 'ES8300492569712115123936', (select id from public.cargos where nombre='Controlador')),
  ('NOE COTO GONZALEZ', 'ES3400496073672910054352', (select id from public.cargos where nombre='Controlador')),
  ('PABLO ANDRADES ROBLES', 'ES6301823099090201597256', (select id from public.cargos where nombre='Controlador')),
  ('Pablo Gallego Dominguez', 'ES3121002904000254438691', (select id from public.cargos where nombre='Controlador')),
  ('RAFAEL DE JESÚS MARISCAL RODRÍGUEZ', 'ES2321007871390200206716', (select id from public.cargos where nombre='Controlador')),
  ('REGINO ABRIL BENITEZ', 'ES8400496451732110002217', (select id from public.cargos where nombre='Controlador')),
  ('Rafael Jesus Espejo Perez', 'ES20 3058 0990 2727 6224 4261', (select id from public.cargos where nombre='Controlador')),
  ('Rocio Torres Selma', 'ES5701829465690205845309', (select id from public.cargos where nombre='Controlador')),
  ('Saima Ahmed Ali', 'ES05 2100 8496 8602 0029 4058', (select id from public.cargos where nombre='Controlador')),
  ('Sergio Gonzalez Perez', 'ES10 1465 0260 61 1767753718', (select id from public.cargos where nombre='Controlador'))
on conflict do nothing;
