-- =====================================================================
-- ActiveBreak - Datos iniciales para probar la API
-- Se ejecuta después de 01_tablas.sql (orden alfabético).
-- No se crea ningún usuario: el primer admin se obtiene registrando un
-- usuario con POST /api/users y cambiando su rol (ver README).
-- =====================================================================

INSERT INTO "categorias_pausa" ("nombre", "descripcion") VALUES
    ('Cuello',      'Movimientos suaves para la zona cervical'),
    ('Ojos',        'Descanso visual frente a la pantalla'),
    ('Piernas',     'Activación de la circulación en las piernas'),
    ('Respiración', 'Ejercicios de respiración para bajar el estrés');

INSERT INTO "pausas_activas" ("nombre", "descripcion", "duracion_minutos", "intensidad", "categoria_id") VALUES
    ('Giro de cuello',        'Girar la cabeza lentamente a cada lado, 5 veces',          3, 'baja',  1),
    ('Inclinación lateral',   'Llevar la oreja hacia el hombro y sostener 10 segundos',   2, 'baja',  1),
    ('Regla 20-20-20',        'Cada 20 minutos mirar a 20 pies de distancia 20 segundos', 1, 'baja',  2),
    ('Parpadeo consciente',   'Parpadear lentamente 15 veces para hidratar los ojos',     1, 'baja',  2),
    ('Sentadillas',           'Hacer 10 sentadillas junto al puesto de trabajo',          5, 'media', 3),
    ('Elevación de talones',  'Subir y bajar los talones 20 veces',                       3, 'baja',  3),
    ('Respiración 4-7-8',     'Inhalar 4 s, sostener 7 s y exhalar 8 s, 4 ciclos',        4, 'baja',  4);
