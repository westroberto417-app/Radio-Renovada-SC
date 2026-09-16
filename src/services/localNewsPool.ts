import { LocalNews } from './contentService';

export const LOCAL_NEWS_ROTATING_POOL = [
  {
    title: "San Miguel: Operativo de Salud y Entrega de Equipamiento Sanitario en Paraje Montaña",
    excerpt: "El Ministerio de Salud Pública y el Hospital local equiparon la sala de primeros auxilios y realizaron vacunación comunitaria.",
    fullContent: "El Hospital de San Miguel y el Ministerio de Salud Pública de Corrientes concretaron un importante operativo sanitario en el Paraje Montaña y zonas rurales aledañas. Durante la jornada se hizo entrega de nuevo equipamiento médico, insumos de urgencia y se aplicaron dosis de la vacuna antigripal y del calendario nacional.\n\nVecinos de parajes vecinos como San Antonio y Colonia Mexpression destacaron la presencia de médicos clínicos, odontólogos y enfermeros que brindaron atención gratuita y entrega directa de medicamentos esenciales. El operativo continuará la próxima semana en parajes rurales de General Paz.",
    tag: "SALUD",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Caá Catí: Presentan la 9° Fiesta Provincial del Búfalo en la Sociedad Rural de General Paz",
    excerpt: "Productores ganaderos, autoridades provinciales y el municipio presentaron la gran exposición gastronómica y ganadera.",
    fullContent: "En la sede de la Sociedad Rural de General Paz con sede en Caá Catí, se llevó a cabo el lanzamiento oficial de la 9° Fiesta Provincial del Búfalo. El evento reunirá a cabañas bufaleras de toda la región mesopotámica, con remates especiales, charlas técnicas de manejo sustentable en humedales y un gran festival gastronómico de carne de búfalo.\n\nEl intendente y autoridades del sector rural destacaron el rol de Caá Catí como capital provincial de esta producción en constante crecimiento, invitando a las familias de San Miguel, Loreto y Santa Rosa a disfrutar de las peñas y jineteadas.",
    tag: "AGRO",
    location: "Caá Catí",
    source: "Facebook Prensa Municipalidad de Caá Catí",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Loreto: Nuevo Hospital ya atendió a más de 700 vecinos y refuerza guardias 24 horas",
    excerpt: "El flamante centro asistencial de Loreto consolida su atención integral y amplía servicios de ecografía y radiología.",
    fullContent: "A pocas semanas de su inauguración oficial, las autoridades del nuevo Hospital de Loreto confirmaron que ya se brindó asistencia a más de 700 pacientes de la localidad y áreas rurales del Iberá. La incorporación de nuevo personal médico, guardia permanente y sala de internación abreviada ha descomprimido las derivaciones hacia los centros de mayor complejidad.\n\nAsimismo, desde la dirección médica se instó a las familias a concurrir para los controles de salud materno-infantil y controles cardiológicos preventivos.",
    tag: "SALUD",
    location: "Loreto",
    source: "Portal Loreto Informa",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Santa Rosa: El Sector Maderero y Aserraderos del Parque Industrial impulsan nuevas inversiones",
    excerpt: "Empresarios y autoridades coordinan obras viales y energéticas para potenciar la industria de la madera.",
    fullContent: "El polo forestoindustrial de Santa Rosa continúa siendo uno de los principales motores económicos y generadores de empleo en la cuenca centro-norte de Corrientes. En un reciente encuentro entre industriales y representantes del Ministerio de Producción, se acordaron avances en la pavimentación de accesos pesados sobre Ruta 118 y la optimización de líneas eléctricas de media tensión.\n\nEl sector proyecta mayor valor agregado a la madera de pino con destino a la construcción de viviendas sustentables.",
    tag: "PRODUCCIÓN",
    location: "Santa Rosa",
    source: "Diario Época - Suplemento Productivo",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Bomberos Voluntarios y Municipio intensifican prevención climática e incendios",
    excerpt: "Articulan protocolos de respuesta rápida y mantenimiento de cortafuegos en zonas forestales y pastizales.",
    fullContent: "El Cuartel de Bomberos Voluntarios de San Miguel, junto a personal de Defensa Civil y la Agencia de Emergencias, mantuvo una reunión de coordinación operativa ante los pronósticos de variabilidad climática. Se verificaron autobombas, cisternas y equipamiento de ataque rápido para resguardar las forestaciones de pino y eucalipto, así como las viviendas periurbanas.\n\nSe reiteró a la población la prohibición absoluta de realizar quemas de pastizales o basura sin autorización previa.",
    tag: "EMERGENCIAS",
    location: "San Miguel",
    source: "Facebook Bomberos Voluntarios San Miguel",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
  },
  {
    title: "Caá Catí: Operativo del Ministerio de Justicia y Protección Comunitaria en Plaza 25 de Mayo",
    excerpt: "Jornada de asesoramiento jurídico gratuito, DNI y convenios de derechos de niñez y adolescencia.",
    fullContent: "En la céntrica Plaza 25 de Mayo de Caá Catí, equipos interdisciplinarios del Gobierno de Corrientes llevaron a cabo un operativo integral de asistencia al ciudadano. Decenas de familias pudieron tramitar renovaciones de documentos, asesorarse en mediación comunitaria y recibir orientación sobre programas de inclusión social y protección de los derechos de la infancia.\n\nEl intendente municipal rubricó convenios específicos para fortalecer el gabinete psicopedagógico local.",
    tag: "COMUNIDAD",
    location: "Caá Catí",
    source: "El Litoral Corrientes - Seccional Norte",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Loreto: Obras de Puesta en Valor en la Histórica Parroquia y el Balneario Municipal",
    excerpt: "Cuadrillas municipales realizan trabajos de pintura, iluminación LED y embellecimiento en paseos públicos.",
    fullContent: "La Municipalidad de Loreto avanza con el plan de mejoras urbanas y turísticas en el casco céntrico y la ribera del balneario municipal. Se renovó por completo la fachada de la Parroquia Nuestra Señora de Loreto, preservando su valor histórico y cultural.\n\nAdemás, en la zona de campings y lagunas se colocaron nuevas luminarias LED solares y bancos de descanso para brindar mayor seguridad a los visitantes que recorren el circuito turístico del Iberá.",
    tag: "MUNICIPIO",
    location: "Loreto",
    source: "Facebook Municipalidad de Loreto Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1501167733271-e4f18b5ea3f4?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "General Paz y San Miguel: La Policía Rural (PRIAR) intensifica controles preventivos en caminos",
    excerpt: "Operativos cerrojo en rutas provinciales para combatir el abigeato y verificar guías de traslado de hacienda.",
    fullContent: "Efectivos de la Policía Rural e Islas y Ambiental Rural (PRIAR) con base en San Miguel y Caá Catí desplegaron patrullajes diurnos y nocturnos sobre caminos vecinales y accesos a estancias. Durante los controles se procedió a la verificación de marcas, señales y guías de tránsito de animales vacunos y equinos, logrando recuperar ejemplares sin documentación fehaciente.\n\nLos operativos cuentan con el respaldo de la Sociedad Rural y de los productores ganaderos locales.",
    tag: "SEGURIDAD",
    location: "San Miguel / General Paz",
    source: "Radio Dos Corrientes - Crónica Policial",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Programa Provincial 'Corrientes Cerca' brindó atención ciudadana masiva",
    excerpt: "Cientos de vecinos realizaron trámites de DNI, IPS, Ioscor y asesoramiento previsional en el polideportivo.",
    fullContent: "Una exitosa jornada de servicios se vivió en el Polideportivo Municipal de San Miguel con la llegada del programa 'Corrientes Cerca'. Vecinos de todos los barrios y colonias rurales accedieron de forma ágil a gestiones ante el Registro Civil, Instituto de Previsión Social (IPS), obra social Ioscor y Defensoría del Pueblo sin tener que trasladarse hasta la capital provincial.\n\nLas autoridades comunales anunciaron que continuarán gestionando la visita periódica de estos dispositivos móviles de atención directa.",
    tag: "COMUNIDAD",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Esteros del Iberá: Crecen las visitas por Portal San Nicolás y Portal San Antonio",
    excerpt: "Guías de sitio locales reportan un incremento en las excursiones de canoa y avistaje de ciervos de los pantanos.",
    fullContent: "El Portal San Nicolás, uno de los accesos agrestes más imponentes a los Esteros del Iberá situado en jurisdicción de San Miguel, vive semanas de gran concurrencia turística. Familias de todo el país y contingentes extranjeros llegan para realizar safaris fotográficos en lancha y caminatas guiadas por el monte nativo.\n\nLos prestadores locales subrayan la importancia del turismo sustentable como fuente de empleo directo para jóvenes baqueanos y artesanos de la zona.",
    tag: "TURISMO",
    location: "San Miguel / Iberá",
    source: "Facebook Turismo San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Nuevas obras de cordón cuneta y alumbrado público en el Barrio Itatí",
    excerpt: "La Secretaría de Obras Públicas avanza con tareas de modernización urbana y desagües pluviales.",
    fullContent: "Vecinos del Barrio Itatí de San Miguel celebraron la puesta en marcha de los nuevos tramos de cordón cuneta y la colocación de columnas de alumbrado público con tecnología LED. La intervención busca solucionar anegamientos en días de intensas lluvias y mejorar la seguridad nocturna de las familias y estudiantes.\n\nEl plan de urbanización comunal prevé extenderse a los barrios San Martín y Santa Rita durante las próximas semanas.",
    tag: "MUNICIPIO",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel Oficial",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
  },
  {
    title: "Caá Catí: La Biblioteca Popular 'Dr. Juan Manuel Rivera' impulsa talleres de lectura y memoria local",
    excerpt: "Jóvenes y adultos participan activamente en las jornadas de preservación del patrimonio literario y cultural.",
    fullContent: "La emblemática Biblioteca Popular de Caá Catí, reconocida como 'cuna de poetas', abrió las inscripciones para sus tradicionales ciclos de talleres culturales. Entre las propuestas se destacan la escritura creativa, narración de leyendas del Iberá y digitalización de documentos históricos del departamento General Paz.\n\nDocentes y gestores culturales invitan a toda la comunidad a sumarse a estas actividades de acceso libre y gratuito.",
    tag: "CULTURA",
    location: "Caá Catí",
    source: "Facebook Prensa Caá Catí",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "Santa Rosa: Capacitan a operarios forestales en técnicas de seguridad y manejo en aserraderos",
    excerpt: "El INTA y la Asociación de Madereros organizaron una jornada práctica para prevenir accidentes laborales.",
    fullContent: "En las instalaciones del Parque Forestoindustrial de Santa Rosa se llevó a cabo un taller intensivo sobre bioseguridad, uso de elementos de protección personal y optimización de corte en aserraderos de pino. La capacitación congregó a más de sesenta operarios y técnicos de plantas industriales locales.\n\nEspecialistas enfatizaron que la tecnificación y el cuidado de los trabajadores son pilares indispensables para la competitividad del sector maderero correntino.",
    tag: "PRODUCCIÓN",
    location: "Santa Rosa",
    source: "FM Radio Sur Santa Rosa",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1474&auto=format&fit=crop"
  },
  {
    title: "Loreto: Feria Franca de Pequeños Productores expone delicias típicas y verduras agroecológicas",
    excerpt: "Productores de los parajes Tatacuá y San Cayetano comercializan mandioca, miel de caña y quesos caseros.",
    fullContent: "La Plaza Central de Loreto albergó una nueva edición de la Feria Franca Comunitaria, donde familias campesinas ofrecieron alimentos frescos sin intermediarios. La propuesta atrajo a vecinos y turistas que adquirieron verduras de huerta, panificados caseros, dulces regionales y artesanías en palma caranday.\n\nDesde el área de producción municipal se destacó el acompañamiento con semillas y asistencia técnica para consolidar la soberanía alimentaria.",
    tag: "AGRO",
    location: "Loreto",
    source: "Portal Loreto Informa",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "San Miguel: Escuela Técnica N° 1 presenta prototipos de energía solar para viviendas rurales",
    excerpt: "Alumnos y profesores diseñaron cargadores comunitarios y calefones solares de bajo costo para parajes aislados.",
    fullContent: "Estudiantes del último año de la Escuela Técnica de San Miguel presentaron innovadores proyectos de energías limpias pensados para dar respuesta a las necesidades de pequeños productores de parajes rurales. Los prototipos incluyen boyeros solares para el ganado y sistemas de iluminación autónomos.\n\nDirectivos escolares felicitaron a los jóvenes por su compromiso social y vocación técnica al servicio del desarrollo local.",
    tag: "COMUNIDAD",
    location: "San Miguel",
    source: "Facebook Municipalidad de San Miguel",
    isFacebook: true,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1470&auto=format&fit=crop"
  },
  {
    title: "General Paz: Vialidad Provincial realiza mantenimiento en puentes y alcantarillas sobre Ruta 13",
    excerpt: "Las cuadrillas acondicionan los pasos hídricos para asegurar el tránsito seguro de camiones de carga y transporte escolar.",
    fullContent: "Personal técnico de la Dirección Provincial de Vialidad ejecuta tareas de refuerzo estructural y limpieza de sedimentos en puentes que conectan Caá Catí con parajes vecinos. Las obras resultan fundamentales para mantener la conectividad vial durante temporadas de precipitaciones copiosas.\n\nSe solicita a los conductores circular con precaución y respetar las señalizaciones de obra en las banquinas.",
    tag: "MUNICIPIO",
    location: "Caá Catí / General Paz",
    source: "El Litoral Corrientes",
    isFacebook: false,
    image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
  }
];

function getRecentSpanishDate(index: number): string {
  if (index <= 2) return "Hoy - Edición Actualizada";
  if (index <= 5) return "Hoy - Hace unas horas";
  if (index <= 7) return "Ayer - Edición Tarde";
  return "Hace 2 días - Edición Verificada";
}

function getPublishedTimestamp(index: number): number {
  const offsets = [
    15 * 60 * 1000,
    45 * 60 * 1000,
    2 * 60 * 60 * 1000,
    4 * 60 * 60 * 1000,
    7 * 60 * 60 * 1000,
    12 * 60 * 60 * 1000,
    20 * 60 * 60 * 1000,
    30 * 60 * 60 * 1000,
    44 * 60 * 60 * 1000,
    55 * 60 * 60 * 1000
  ];
  return Date.now() - (offsets[index] || (index * 5 * 60 * 60 * 1000));
}

export function getClientRotatingLocalNews(): LocalNews[] {
  const now = new Date();
  const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const hour = argTime.getHours();
  const slotIndex = Math.floor(hour / 4);
  const dayOffset = argTime.getDate() % 5;
  const startIndex = (slotIndex * 3 + dayOffset) % LOCAL_NEWS_ROTATING_POOL.length;

  const result: LocalNews[] = [];
  for (let i = 0; i < 10; i++) {
    const item = LOCAL_NEWS_ROTATING_POOL[(startIndex + i) % LOCAL_NEWS_ROTATING_POOL.length];
    result.push({
      ...item,
      id: Date.now() + i,
      date: getRecentSpanishDate(i),
      publishedAt: getPublishedTimestamp(i)
    });
  }
  return result;
}

export function getClientRotatingProvincialNews(): LocalNews[] {
  const provincialItems = [
    {
      title: "Iberá: Crecen las visitas a los portales San Nicolás y Carambola en temporada",
      excerpt: "El ecoturismo y el avistaje de fauna silvestre en los Esteros del Iberá marcan una ocupación destacada.",
      fullContent: "Los Esteros del Iberá continúan atrayendo a miles de turistas nacionales y extranjeros apasionados por la naturaleza. Los accesos por San Miguel (Portal San Nicolás) y Concepción del Yaguareté Corá (Portal Carambola) registran un intenso flujo de visitantes que realizan safaris fotográficos, paseos en canoa a botador y senderismo guiado.\n\nOperadores turísticos y guardaparques destacan el compromiso ambiental de la comunidad y el impacto económico positivo en gastronomía típica y artesanías tradicionales.",
      tag: "TURISMO",
      location: "Esteros del Iberá",
      source: "Diario Época - Suplemento Turismo",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Corrientes: Inversión en obras viales para fortalecer la red de caminos de la producción",
      excerpt: "Vialidad Provincial y consorcios camineros avanzan en el ripiado de accesos a cuencas arroceras y forestales.",
      fullContent: "El Gobierno provincial, a través del Ministerio de Obras y Servicios Públicos, ejecuta obras de enripiado y mantenimiento de puentes en rutas provinciales estratégicas. Los trabajos benefician directamente el transporte de madera, cítricos, ganado y arroz en departamentos como General Paz, San Miguel, San Roque y Santo Tomé.\n\nAutoridades confirmaron que las cuadrillas técnicas continuarán trabajando para garantizar la transitabilidad permanente en días de lluvia.",
      tag: "INFRAESTRUCTURA",
      location: "Corrientes",
      source: "Prensa Gobierno de Corrientes",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=1472&auto=format&fit=crop"
    },
    {
      title: "Chamamé y Fiestas Tradicionales: Presentan el calendario cultural del Litoral",
      excerpt: "El Instituto de Cultura de Corrientes dio a conocer las fechas para las peñas, festivales y encuentros chamameceros.",
      fullContent: "Con una nutrida participación de músicos, poetas y ballets folclóricos de toda la provincia, se lanzó la agenda de encuentros y festivales de música tradicional para los próximos meses. Las actividades abarcarán localidades de toda la cuenca del Iberá y departamentos vecinos.",
      tag: "CULTURA",
      location: "Corrientes Capital",
      source: "El Litoral Corrientes",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Sector Arrocero y Forestal: Nuevos acuerdos de exportación y sustentabilidad ambiental",
      excerpt: "Productores de General Paz y San Miguel participan en mesas de trabajo sobre riego eficiente y energías renovables.",
      fullContent: "Representantes del sector agroindustrial de Corrientes mantuvieron reuniones con autoridades provinciales para fortalecer las cadenas de valor y la certificación de origen sustentable. Se proyecta la incorporación de más paneles solares para sistemas de bombeo.",
      tag: "PRODUCCIÓN",
      location: "General Paz / San Miguel",
      source: "Diario Época - Campo & Producción",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1470&auto=format&fit=crop"
    }
  ];

  return provincialItems.map((item, index) => ({
    ...item,
    id: Date.now() + 1000 + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
}

export function getClientRotatingNationalNews(): LocalNews[] {
  const nationalItems = [
    {
      title: "Economías Regionales: Crece la demanda internacional de productos del Norte Grande",
      excerpt: "Informes sectoriales destacan el buen ritmo de colocaciones de cítricos, miel y madera procesada.",
      fullContent: "Las provincias del Norte Grande argentino experimentan un repunte sostenido en el comercio exterior de productos con agregado de valor. Consorcios cooperativos y pequeñas y medianas empresas celebraron la apertura de nuevos canales logísticos que facilitan la llegada de productos correntinos y del litoral hacia mercados del Mercosur y la Unión Europea.\n\nEspecialistas recomiendan consolidar los incentivos impositivos al flete y fortalecer la conectividad ferroviaria y fluvial.",
      tag: "ECONOMÍA",
      location: "Argentina / Federal",
      source: "Agencia Nacional de Noticias",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1611974714652-760056a2cc09?q=80&w=1470&auto=format&fit=crop"
    },
    {
      title: "Innovación y Conectividad: Programa federal lleva fibra óptica a parajes rurales de frontera",
      excerpt: "El plan de conectividad comunitaria beneficia a más de cincuenta escuelas y salas de salud del litoral.",
      fullContent: "Con el objetivo de reducir la brecha digital en poblaciones aisladas, avanza la instalación de antenas satelitales y tendido de fibra óptica en parajes rurales de Corrientes, Misiones y Chaco. El servicio permite que miles de alumnos accedan a plataformas pedagógicas y agiliza las interconsultas de telemedicina.",
      tag: "TECNOLOGÍA",
      location: "Argentina / Federal",
      source: "Portal Nacional de Innovación",
      isFacebook: false,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1470&auto=format&fit=crop"
    }
  ];

  return nationalItems.map((item, index) => ({
    ...item,
    id: Date.now() + 2000 + index,
    date: getRecentSpanishDate(index),
    publishedAt: getPublishedTimestamp(index)
  }));
}
