-- ============================================================
-- DATOS INICIALES: ITEMS DEL MERCADO NEGRO
-- ============================================================

INSERT INTO market_items (name, type, rarity, description, image) VALUES
-- Legendarios
('Sandworm Juvenil', 'CRIATURA', 'legendario', 'Un joven Shai-Hulud captado en las arenas de abierto. Su domesticación podría cambiar la guerra.', 'Captura de pantalla 2026-04-16 223231.png'),
('Sardaukar', 'CRIATURA', 'legendario', 'Soldado de élite del Emperador. Entrenado en la muerte de Salusa Secundus.', 'Captura de pantalla 2026-04-16 223251.png'),
('Melange', 'RECURSO', 'legendario', 'La Especia. Más valiosa que el oro, más esencial que el agua. Solo existe en Arrakis.', 'Captura de pantalla 2026-04-16 223304.png'),

-- Épicos
('Harkonnen Brutal', 'CRIATURA', 'epico', 'Fuerte, despiadado, hambriento de violencia. El producto perfecto para la guerra.', 'Captura de pantalla 2026-04-16 223329.png'),
('Harén Fremen', 'CRIATURA', 'epico', 'Mujeres guerreras del desierto. Cada una vale por diez combatientes.', 'Captura de pantalla 2026-04-16 223535.png'),
('Maestre Harkonnen', 'CRIATURA', 'epico', 'Intelectuales brutales que combinan estrategia militar con crueldad artística.', 'Captura de pantalla 2026-04-16 223539.png'),
('Tumba de Atreides', 'INFO', 'epico', 'Planos secretos de la tumba de la Casa Atreides. ¿Quién pagaría por esto?', 'Captura de pantalla 2026-04-16 223547.png'),
('Cría de Sandworm', 'CRIATURA', 'epico', 'Pequeña, manejable, pero con un hambre voraz que crece con ella.', 'Captura de pantalla 2026-04-16 223553.png'),
('Atommóvil', 'INFO', 'epico', 'Los planos del vehículo atómico. Un secreto que cambió la guerra.', 'Captura de pantalla 2026-04-16 223557.png'),

-- Raros
('Residuo de Filtro', 'RECURSO', 'raro', 'Agua recuperada de un filtro stillsuit. Incalculable en el desierto.', 'Captura de pantalla 2026-04-16 223605.png'),
('Duna de Arena', 'INFO', 'raro', 'Coordenadas de las dunas más altas del Gran Mar de Arena. Un mapa al secreto.', 'Captura de pantalla 2026-04-16 224025.png'),
('Distraído', 'CRIATURA', 'raro', 'Criatura domesticada para la guerra. Su mente fue borrada para seguir órdenes.', 'Captura de pantalla 2026-04-16 224028.png'),
('Giedi Prime', 'INFO', 'raro', 'Planos de las instalaciones Harkonnen en su planeta natal.', 'Captura de pantalla 2026-04-16 224030.png'),
('Guardián', 'CRIATURA', 'raro', 'Máquina de matar automatizada. Programada para no fallar.', 'Captura de pantalla 2026-04-16 224034.png'),
('Bebedor', 'CRIATURA', 'raro', 'Criatura del desierto que puede sobrevivir semanas sin agua.', 'Captura de pantalla 2026-04-16 224036.png'),
('Ataúd', 'INFO', 'raro', 'Planos de los ataúdes atemporales de los Bene Gesserit.', 'Captura de pantalla 2026-04-16 224055.png'),
('Pavo', 'CRIATURA', 'raro', 'Criatura expendedora de los Harkonnen. Engorda rápido, sacrifica fácil.', 'Captura de pantalla 2026-04-16 224103.png'),
('Gusano', 'CRIATURA', 'raro', 'Hermano menor del Shai-Hulud. También puede atacar si no se controla.', 'Captura de pantalla 2026-04-16 224112.png'),
('Atmoral', 'INFO', 'raro', 'Archivo atómico del Museo de la Humanidad. ¿Cómo llegó al mercado negro?', 'Captura de pantalla 2026-04-16 224121.png'),
('Vermine', 'CRIATURA', 'raro', 'Pequeña criatura del desierto. Solitaria y territorial.', 'Captura de pantalla 2026-04-16 224135.png'),
('Vermis', 'CRIATURA', 'raro', 'Hermano menor del Sandworm. También se come todo a su paso.', 'Captura de pantalla 2026-04-16 224143.png'),
('Cazador', 'CRIATURA', 'raro', 'Cazador solitario del desierto. Extremadamente territorial.', 'Captura de pantalla 2026-04-16 224148.png'),
('Planos Harkonnen', 'INFO', 'raro', 'Documentos que detallan los métodos de exterminio Harkonnen.', 'Captura de pantalla 2026-04-16 224155.png'),
('Hacedor', 'CRIATURA', 'raro', 'Criatura que construye estructuras en las dunas. Muy territorial.', 'Captura de pantalla 2026-04-16 224205.png'),
('Chakal', 'CRIATURA', 'raro', 'El Chacal del Desierto. Cazador implacable de caravanas.', 'Captura de pantalla 2026-04-16 224213.png'),
('Ritual Fremen', 'INFO', 'raro', 'Manuscritos del ritual Fremen de agua de muerte.', 'Captura de pantalla 2026-04-16 224223.png'),
('Mapa', 'INFO', 'raro', 'Mapa actualizado de las tormentas de arena de la estación.', 'Captura de pantalla 2026-04-16 224249.png'),
('Fosil', 'RECURSO', 'raro', 'Fósil de criatura pre-Desiertización. Extremadamente valioso.', 'Captura de pantalla 2026-04-16 224257.png'),
('Muro', 'INFO', 'raro', 'Planos de construcción para muros defensivos de arena compactada.', 'Captura de pantalla 2026-04-16 224304.png'),
('Espejo', 'RECURSO', 'raro', 'Material reflectante para señales ópticas a través del desierto.', 'Captura de pantalla 2026-04-16 224312.png'),
('Cristal', 'RECURSO', 'raro', 'Cristal de cuarzo del desierto. Usado para fabricar lentes.', 'Captura de pantalla 2026-04-16 224326.png'),
('Cuchillo', 'RECURSO', 'raro', 'Cuchillo de combate Fremen. Forjado en las arenas.', 'Captura de pantalla 2026-04-16 224334.png'),
('Destilería', 'INFO', 'raro', 'Manual de construcción para alambiques de agua de muerte.', 'Captura de pantalla 2026-04-16 224348.png'),

-- Comunes
('Bolsas', 'RECURSO', 'comun', 'Bolsas de cuero de arena. Resistentes al desgaste.', 'Captura de pantalla 2026-04-16 224358.png'),
('Tierra', 'RECURSO', 'comun', 'Muestra de tierra del Gran Mar de Arena. Para análisis.', 'Captura de pantalla 2026-04-16 224407.png');