-- =====================================================================
-- ActiveBreak - Initial data to test the API
-- Runs after 01_tables.sql (alphabetical order).
-- No user is created: the first admin is obtained by registering a user
-- with POST /api/users and changing its role (see README).
-- The texts are in Spanish because they are shown to the end user.
-- =====================================================================

INSERT INTO "break_categories" ("name", "description") VALUES
    ('Cuello',      'Movimientos suaves para la zona cervical'),
    ('Ojos',        'Descanso visual frente a la pantalla'),
    ('Piernas',     'Activación de la circulación en las piernas'),
    ('Respiración', 'Ejercicios de respiración para bajar el estrés');

INSERT INTO "active_breaks" ("name", "description", "duration_minutes", "intensity", "category_id") VALUES
    ('Giro de cuello',       'Girar la cabeza lentamente a cada lado, 5 veces',          3, 'low',    1),
    ('Inclinación lateral',  'Llevar la oreja hacia el hombro y sostener 10 segundos',   2, 'low',    1),
    ('Regla 20-20-20',       'Cada 20 minutos mirar a 20 pies de distancia 20 segundos', 1, 'low',    2),
    ('Parpadeo consciente',  'Parpadear lentamente 15 veces para hidratar los ojos',     1, 'low',    2),
    ('Sentadillas',          'Hacer 10 sentadillas junto al puesto de trabajo',          5, 'medium', 3),
    ('Elevación de talones', 'Subir y bajar los talones 20 veces',                       3, 'low',    3),
    ('Respiración 4-7-8',    'Inhalar 4 s, sostener 7 s y exhalar 8 s, 4 ciclos',        4, 'low',    4);
