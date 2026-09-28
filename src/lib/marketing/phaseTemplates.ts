// ─────────────────────────────────────────────────────────────────────────
// PHASE TEMPLATES — el marco de investigación, no datos de investigación.
//
// Las 14 fases y sus preguntas iniciales son el MÉTODO: el equivalente a un
// protocolo de laboratorio. Vienen incluidas para que un workspace nuevo
// abra con trabajo real que hacer en lugar de una pantalla vacía. NO son
// hallazgos: cada pregunta arranca en `not_started`, sin respuesta, sin
// evidencia y sin confianza. "No research data yet" se refiere a los
// hallazgos, y los hallazgos solo salen del investigador.
//
// El contenido de investigación va en español, que es el idioma en el que
// se trabaja. Las etiquetas de fase (Foundation, ICP, …) se mantienen en
// inglés porque así están definidas en la especificación del módulo y así
// aparecen en el Marketing Book.
//
// Cada pregunta lleva cuatro campos, porque un instrumento de investigación
// tiene que explicarse a sí mismo:
//
//   text             la pregunta
//   purpose          qué desbloquea responderla — por qué merece el tiempo
//   guidance         cómo abordarla en la práctica
//   expectedEvidence qué contaría como respuesta real y no como opinión
//
// Las preguntas se instancian por workspace y son totalmente editables,
// borrables y ampliables desde la UI (isTemplate solo marca su origen).
//
// Criterio de redacción: observable, decidible y conectada a algo que
// depende de ella. "¿Quién es nuestro cliente objetivo?" no es una pregunta
// de investigación — no tiene estándar de evidencia y nada depende de su
// respuesta. "¿Qué características observables predicen un problema
// operativo lo bastante grave como para iniciar una búsqueda?" sí lo es,
// porque puedes ir a comprobarlo.
// ─────────────────────────────────────────────────────────────────────────

import type { PhaseKey } from '../../types/marketing';

export interface QuestionTemplate {
  text: string;
  purpose: string;
  guidance: string;
  expectedEvidence: string;
}

export interface PhaseTemplate {
  key: PhaseKey;
  order: number;
  /** Prefijo de dos dígitos que se muestra en la UI, p. ej. "01". */
  code: string;
  label: string;
  objective: string;
  questions: QuestionTemplate[];
}

export const PHASE_TEMPLATES: PhaseTemplate[] = [
  {
    key: 'foundation',
    order: 1,
    code: '01',
    label: 'Foundation',
    objective:
      'Establecer qué vende realmente la empresa, a quién y con qué evidencia — antes de que todo el trabajo de mercado se apoye en un supuesto que nadie comprobó.',
    questions: [
      {
        text: '¿Qué resultado operativo concreto produce el producto que el cliente no podría producir sin él?',
        purpose:
          'Todo lo que viene después — posicionamiento, mensajes, ICP — se derrumba si el resultado central se describe como una lista de funcionalidades en lugar de como un cambio en la realidad del cliente.',
        guidance:
          'Escribe el resultado como un estado antes/después, no como una capacidad. Contrástalo con lo que dicen los clientes actuales que cambió, no con el copy de la web.',
        expectedEvidence:
          'Entrevistas o testimonios escritos que describan el estado previo y posterior, idealmente con una cifra asociada (horas, tasa de error, tiempo de ciclo).',
      },
      {
        text: '¿Cuáles de nuestras creencias actuales sobre el mercado son heredadas en lugar de investigadas?',
        purpose:
          'Las creencias heredadas son la principal fuente de error estratégico. Nombrarlas convierte supuestos silenciosos en hipótesis comprobables.',
        guidance:
          'Lista cada afirmación que el equipo repite sobre compradores, competencia o precios y pregunta por cada una: ¿de dónde salió esto? Lo que no tenga fuente pasa a ser hipótesis.',
        expectedEvidence:
          'Una lista explícita de afirmaciones con su procedencia, marcando cuáles no tienen ninguna fuente.',
      },
      {
        text: '¿Qué NO hace la empresa de forma categórica, y qué expectativas del comprador quedan descartadas por ello?',
        purpose:
          'Los límites de alcance determinan qué oportunidades hacen perder tiempo y qué competidores son sustitutos reales y no simples alternativas.',
        guidance:
          'Revisa las oportunidades perdidas y las peticiones de soporte buscando las solicitudes recurrentes que se rechazaron. Esos límites son más honestos que un roadmap.',
        expectedEvidence:
          'Notas de deals perdidos, peticiones de funcionalidad rechazadas o una declaración interna explícita de alcance.',
      },
      {
        text: '¿Qué pruebas de entrega existen ya, y qué tan sólidas son?',
        purpose:
          'Determina si el go-to-market puede liderar con resultados o tiene que liderar con un punto de vista. Exigen estrategias de contenido completamente distintas.',
        guidance:
          'Inventaría casos de éxito, referencias, métricas y logos. Califica cada uno según si un comprador escéptico lo aceptaría.',
        expectedEvidence:
          'Un inventario concreto de referencias con nombre, resultados cuantificados o despliegues documentados.',
      },
      {
        text: '¿Qué tendría que ser cierto para que este negocio fracasara en los próximos 18 meses?',
        purpose:
          'Saca a la luz los riesgos estructurales que la investigación debería priorizar, en lugar de investigar lo que resulta cómodo.',
        guidance:
          'Trabaja hacia atrás desde el fracaso: sin pipeline, comprador equivocado, respuesta del incumbente, indiferencia hacia la categoría. Ordena por plausibilidad.',
        expectedEvidence:
          'Una lista de fracasos ordenada, cada punto asociado a un indicador temprano observable.',
      },
    ],
  },
  {
    key: 'us_market',
    order: 2,
    code: '02',
    label: 'U.S. Market',
    objective:
      'Dimensionar y caracterizar la oportunidad en EE. UU. con cifras con fuente, e identificar las fuerzas estructurales que hacen el problema urgente ahora.',
    questions: [
      {
        text: '¿Cuántas organizaciones en EE. UU. presentan las condiciones específicas que hacen que este problema les salga caro?',
        purpose:
          'Convierte un mercado total difuso en una población contable que puedes ir a buscar de verdad.',
        guidance:
          'Define primero la condición que califica, y después cuenta. Census County Business Patterns, BLS y las asociaciones sectoriales dan conteos defendibles por NAICS y tramo de empleados.',
        expectedEvidence:
          'Una cifra del Census/BLS o de una asociación sectorial concreta, indicando los códigos NAICS y los tramos de tamaño usados.',
      },
      {
        text: '¿Qué cambio regulatorio, económico o tecnológico agudizó este problema en los últimos 24 meses?',
        purpose:
          'El comprador actúa ante un cambio, no ante un dolor crónico. Sin un detonante con nombre, los mensajes no tienen urgencia y las campañas no tienen timing.',
        guidance:
          'Busca cambios normativos, desplazamientos de costes, escasez de mano de obra o reportes obligatorios. Ponle fecha a cada uno y comprueba que realmente golpea al segmento objetivo.',
        expectedEvidence:
          'Una norma pública con fecha, un índice publicado o un informe sectorial que documente el cambio.',
      },
      {
        text: '¿Qué regiones o estados de EE. UU. concentran a la población objetivo, y por qué?',
        purpose:
          'La concentración geográfica determina la estrategia de eventos, la cobertura comercial y si la segmentación de pago es siquiera viable.',
        guidance:
          'Mapea el número de establecimientos por estado. La concentración suele tener una causa estructural: verifícala en lugar de asumirla.',
        expectedEvidence:
          'Datos de establecimientos o empleo a nivel estatal, identificando el factor que causa la concentración.',
      },
      {
        text: '¿Cuánto se gasta hoy en EE. UU. en las alternativas que usan los compradores, incluido hacerlo manualmente?',
        purpose:
          'Establece el presupuesto que ya existe. Un mercado sin gasto actual exige crear categoría, que es un movimiento distinto y mucho más lento.',
        guidance:
          'Pon precio a las herramientas incumbentes y estima el coste laboral del apaño manual. El apaño manual suele ser el competidor real.',
        expectedEvidence:
          'Precios publicados de las alternativas, cifras de gasto de analistas o un cálculo defendible de coste laboral.',
      },
      {
        text: '¿Qué evidencia contradice el supuesto de que EE. UU. es el primer mercado correcto?',
        purpose:
          'Refutación deliberada. Las decisiones de entrada a mercado casi nunca se someten a prueba y son caras de revertir.',
        guidance:
          'Busca activamente el argumento contrario: saturación, incumbentes atrincherados, barreras de compra, ciclos más largos de lo que la empresa puede financiar.',
        expectedEvidence:
          'Al menos un hecho con fuente que argumente genuinamente en contra de empezar por EE. UU., registrado como evidencia contradictoria.',
      },
    ],
  },
  {
    key: 'segmentation',
    order: 3,
    code: '03',
    label: 'Segmentation',
    objective:
      'Dividir el mercado por características observables que predigan necesidad y comportamiento de compra — no por etiquetas cómodas como el tamaño de empresa a secas.',
    questions: [
      {
        text: '¿Qué atributos firmográficos u operativos observables correlacionan realmente con una necesidad aguda?',
        purpose:
          'Un segmento solo sirve si puedes identificar a sus miembros desde fuera. Los atributos que no puedes observar no sirven para segmentar.',
        guidance:
          'Contrasta los atributos candidatos contra clientes conocidos y contra cuentas de mal encaje conocidas. Descarta cualquier atributo que no separe a los dos grupos.',
        expectedEvidence:
          'Una comparación entre clientes y no clientes sobre los atributos candidatos, mostrando cuáles discriminan.',
      },
      {
        text: '¿A partir de qué umbral operativo el problema se vuelve demasiado caro de seguir resolviendo a mano?',
        purpose:
          'Ese umbral es la frontera real del segmento. Por debajo de él nadie compra, por muy bien escritos que estén los mensajes.',
        guidance:
          'Encuentra el punto de ruptura: número de sedes, proyectos, cuadrillas, SKUs o personas a coordinar. Pregunta a los clientes cuál fue el suyo.',
        expectedEvidence:
          'Declaraciones de clientes o datos de uso que identifiquen el umbral, idealmente convergiendo en un rango.',
      },
      {
        text: '¿Qué segmentos adyacentes se parecen pero se comportan distinto en el proceso de compra?',
        purpose:
          'Los segmentos casi-iguales consumen pipeline en silencio. Nombrarlos evita una segmentación que parece correcta y convierte mal.',
        guidance:
          'Compara duración del ciclo, número de interlocutores y tasa de cierre entre grupos superficialmente parecidos.',
        expectedEvidence:
          'Datos de ganados/perdidos o de duración de ciclo que distingan al parecido del segmento real.',
      },
      {
        text: '¿Cuántas cuentas hay en el segmento prioritario, y podemos enumerarlas de verdad?',
        purpose:
          'Determina si el motor es account-based o de generación de demanda. No son intercambiables.',
        guidance:
          'Intenta construir la lista real. Si no puedes construir una lista de cuentas con nombre, el segmento está definido de forma demasiado abstracta.',
        expectedEvidence:
          'Un conteo real, más una muestra de organizaciones con nombre que demuestre que se puede enumerar.',
      },
    ],
  },
  {
    key: 'icp',
    order: 4,
    code: '04',
    label: 'ICP',
    objective:
      'Definir el perfil de cliente ideal con precisión suficiente para que dos personas cualesquiera clasifiquen la misma cuenta de forma idéntica.',
    questions: [
      {
        text: '¿Qué características observables de una empresa indican que tiene un problema operativo lo bastante importante como para buscar una solución como la nuestra?',
        purpose:
          'Esto es el ICP. Desde la construcción de listas hasta la segmentación publicitaria y la calificación comercial, todo depende de que sea observable y no inferido.',
        guidance:
          'Cada característica debe ser verificable desde fuera de la empresa: ofertas de empleo, registros públicos, número de sedes, señales tecnológicas, proyectos publicados. Rechaza todo lo que requiera una conversación para determinarse.',
        expectedEvidence:
          'Una lista de características donde cada entrada nombre su fuente de datos pública, validada contra los mejores clientes actuales.',
      },
      {
        text: '¿Qué características de nuestros mejores clientes son causas de encaje y cuáles son meras casualidades de cómo vendimos?',
        purpose:
          'Los primeros clientes sobrerrepresentan la red de contactos del fundador. Confundir eso con encaje estrecha el mercado artificialmente.',
        guidance:
          'Por cada rasgo compartido, pregunta si explica por qué el producto aporta valor o solo cómo se originó la oportunidad.',
        expectedEvidence:
          'Una clasificación rasgo por rasgo con el razonamiento registrado en cada caso.',
      },
      {
        text: '¿Qué descalifica a una cuenta aunque encaje sobre el papel?',
        purpose:
          'Los criterios negativos protegen más pipeline que los positivos. Sin ellos, la calificación se mantiene optimista.',
        guidance:
          'Revisa las cuentas perdidas y las estancadas buscando qué tenían en común. Esos patrones son los descalificadores.',
        expectedEvidence:
          'Análisis de churn y de oportunidades estancadas que produzca criterios de exclusión explícitos.',
      },
      {
        text: '¿Puede aplicar el ICP alguien ajeno a la empresa sin pedirnos aclaraciones?',
        purpose:
          'Un ICP que necesita interpretación no es operativo: cada SDR, agencia y herramienta lo aplicará de forma distinta.',
        guidance:
          'Dale la definición y una lista de 20 cuentas a alguien que no la conozca. Mide con qué frecuencia coincide contigo.',
        expectedEvidence:
          'Una prueba de clasificación documentada que muestre la tasa de coincidencia.',
      },
    ],
  },
  {
    key: 'buyer_personas',
    order: 5,
    code: '05',
    label: 'Buyer Personas',
    objective:
      'Describir a las personas implicadas en términos de qué responden y qué arriesgan — no de datos demográficos.',
    questions: [
      {
        text: '¿Con qué se mide internamente a cada persona, y cómo afecta este problema a esa métrica?',
        purpose:
          'La gente actúa según aquello de lo que responde. Una persona descrita sin su métrica no se puede convencer con ningún mensaje.',
        guidance:
          'Encuentra el KPI real: disponibilidad, margen, desviación de cronograma, coste de plantilla. Las ofertas de empleo y las evaluaciones internas suelen decirlo con claridad.',
        expectedEvidence:
          'Descripciones de puesto, entrevistas o definiciones de rol publicadas que nombren la métrica.',
      },
      {
        text: '¿Qué arriesga personalmente esta persona al impulsar un cambio como este?',
        purpose:
          'El riesgo personal percibido, no la duda sobre el producto, es lo que más frecuentemente frena las oportunidades en la fase de campeón interno.',
        guidance:
          'Pregunta qué le pasa a esa persona si el despliegue fracasa. La respuesta define qué pruebas y qué referencias importan.',
        expectedEvidence:
          'Declaraciones en entrevistas sobre consecuencias internas, o evidencia de deals estancados por riesgo percibido.',
      },
      {
        text: '¿Qué lenguaje usa cada persona para hablar de este problema, con sus propias palabras?',
        purpose:
          'Los compradores buscan y reconocen en su propio vocabulario. El lenguaje de categoría inventado internamente no les llega.',
        guidance:
          'Recopila frases literales de publicaciones en LinkedIn, foros, ofertas de empleo y tickets de soporte. No las parafrasees a lenguaje de marketing.',
        expectedEvidence:
          'Citas textuales con su fuente, no un resumen de ellas.',
      },
      {
        text: '¿A dónde acude realmente cada persona para informarse sobre problemas como este?',
        purpose:
          'Determina la estrategia de canal. Los canales asumidos son uno de los errores más caros del marketing B2B.',
        guidance:
          'Pregunta dónde se enteraron por última vez de una herramienta que adoptaron. Observa con qué interactúan, no qué dicen que leen.',
        expectedEvidence:
          'Respuestas de entrevista o datos de interacción observados que nombren canales, comunidades o personas concretas.',
      },
    ],
  },
  {
    key: 'buying_committee',
    order: 6,
    code: '06',
    label: 'Buying Committee',
    objective:
      'Mapear quién tiene que decir que sí, quién puede decir que no y en qué orden — para construir contenido y ventas alrededor de la estructura real de decisión.',
    questions: [
      {
        text: '¿Quién tiene el presupuesto de esta categoría, y es la misma persona que sufre el problema?',
        purpose:
          'Cuando quien paga y quien sufre son distintos, el argumento de negocio tiene que viajar entre ambos. Esa brecha determina toda la estrategia de contenido.',
        guidance:
          'Recorre una operación cerrada de principio a fin. Identifica dónde se originó la petición y dónde se financió.',
        expectedEvidence:
          'Un recorrido documentado de una operación real nombrando los roles en cada etapa.',
      },
      {
        text: '¿Quién puede bloquear unilateralmente esta compra, y con qué argumentos?',
        purpose:
          'Los bloqueadores — IT, seguridad, compras, legal, operaciones — matan más operaciones que los competidores, y lo hacen tarde.',
        guidance:
          'Revisa las oportunidades estancadas para ver dónde murieron. Pregunta qué revisión tuvo que superar cada comprador.',
        expectedEvidence:
          'Registros de deals estancados o declaraciones de compradores que identifiquen la función bloqueadora y sus criterios.',
      },
      {
        text: '¿Cuántas personas intervienen habitualmente, y en cuánto tiempo?',
        purpose:
          'El tamaño del comité y la duración del ciclo fijan el volumen de contenido necesario y el modelo realista de pipeline.',
        guidance:
          'Cuenta las personas distintas que intervinieron en operaciones cerradas y mide los días transcurridos desde el primer contacto hasta la firma.',
        expectedEvidence:
          'Registros de operaciones con número de participantes y fechas, sobre suficientes casos para ver un patrón.',
      },
      {
        text: '¿Qué documento interno necesita construir el campeón para conseguir la aprobación?',
        purpose:
          'Si marketing produce ese documento, la operación se acelera. Si no, el campeón improvisa y a menudo fracasa.',
        guidance:
          'Pregunta a los campeones qué tuvieron que elaborar: un business case, una comparativa, un memo de riesgos, un plan piloto.',
        expectedEvidence:
          'Ejemplos de los documentos internos reales que los compradores tuvieron que montar.',
      },
    ],
  },
  {
    key: 'customer_journey',
    order: 7,
    code: '07',
    label: 'Customer Journey',
    objective:
      'Reconstruir cómo pasaron realmente los compradores del desconocimiento a la compra, usando operaciones reales y no un diagrama de embudo.',
    questions: [
      {
        text: '¿Qué evento hizo que el comprador empezara a buscar, y cuánto tiempo llevaba existiendo el problema antes de eso?',
        purpose:
          'Separa el dolor crónico del detonante agudo. Las campañas deben sincronizarse con los detonantes, no con el dolor.',
        guidance:
          'Pregunta: "¿qué cambió la semana en que empezaste a buscar?". La distancia entre el inicio del problema y la búsqueda suele ser reveladora.',
        expectedEvidence:
          'Relatos en entrevistas que nombren el evento detonante y sus fechas aproximadas.',
      },
      {
        text: '¿Qué hizo el comprador en las primeras 48 horas de búsqueda?',
        purpose:
          'Revela el verdadero inicio del embudo: términos buscados, colegas consultados, comunidades visitadas. Suele diferir de lo que se asume.',
        guidance:
          'Reconstruye las primeras acciones de forma concreta. Las búsquedas y a quién preguntaron importan más que en qué web aterrizaron.',
        expectedEvidence:
          'Relatos de primera mano sobre búsquedas iniciales, conversaciones con colegas y elaboración de la lista corta.',
      },
      {
        text: '¿En qué punto abandonaron los compradores que no compraron, y qué no pudieron resolver?',
        purpose:
          'Los puntos de abandono identifican la prueba o la respuesta concreta que falta, lo cual es más accionable que una tasa de conversión.',
        guidance:
          'Entrevista a prospectos perdidos, no solo a clientes. Sus motivos son más útiles y casi nunca se recogen.',
        expectedEvidence:
          'Entrevistas con prospectos perdidos u objeciones documentadas asociadas a una etapa.',
      },
      {
        text: '¿Qué necesitaba ver el comprador antes de aceptar una conversación comercial?',
        purpose:
          'Define la condición previa para generar pipeline, y por tanto qué tiene que conseguir el contenido más temprano.',
        guidance:
          'Pregunta qué les hizo estar dispuestos a dedicar 30 minutos. Normalmente una prueba concreta o un punto de vista creíble.',
        expectedEvidence:
          'Declaraciones de compradores identificando el contenido o la señal concreta que desbloqueó la reunión.',
      },
    ],
  },
  {
    key: 'competition',
    order: 8,
    code: '08',
    label: 'Competition',
    objective:
      'Entender las alternativas reales — incluidas la inercia y el desarrollo interno — y cómo las comparan de verdad los compradores.',
    questions: [
      {
        text: '¿Contra qué nos comparan realmente los compradores en su lista corta?',
        purpose:
          'El conjunto competitivo que tiene el comprador en la cabeza no suele ser el del deck de la empresa, y esa diferencia desvía los mensajes.',
        guidance:
          'Pregunta a los compradores qué más había en la lista. Incluye hojas de cálculo, desarrollos internos y no hacer nada.',
        expectedEvidence:
          'Listas cortas reportadas por compradores en operaciones reales, no un cuadrante de analista.',
      },
      {
        text: '¿Sobre qué dos o tres criterios deciden realmente los compradores, y quién gana hoy en cada uno?',
        purpose:
          'La mayoría de las comparativas de funcionalidades son irrelevantes para la decisión. Solo los criterios decisivos importan para el posicionamiento.',
        guidance:
          'Extrae los criterios de los motivos de ganado/perdido, no de una matriz de funcionalidades. Sé honesto con los que gana la competencia.',
        expectedEvidence:
          'Análisis de ganado/perdido que asocie los resultados a un conjunto reducido de criterios de decisión.',
      },
      {
        text: '¿Cómo reacciona el incumbente más fuerte cuando lo desplazan?',
        purpose:
          'Predice el riesgo en fase final: descuentos, empaquetados, objeciones basadas en miedo. Determina qué debe llevar preparado el equipo comercial.',
        guidance:
          'Pregunta a los clientes que cambiaron qué hizo el incumbente. Revisa precios públicos y cambios en las condiciones contractuales.',
        expectedEvidence:
          'Relatos de clientes que cambiaron, o respuestas de precio y contractuales documentadas.',
      },
      {
        text: '¿Qué afirmación de la competencia resulta más creíble a los compradores, y qué evidencia la rebatiría?',
        purpose:
          'Identifica la única objeción contra la que más merece la pena construir una prueba concreta.',
        guidance:
          'Localiza la afirmación de la competencia que los compradores te repiten. Después determina qué les haría cambiar de opinión de verdad.',
        expectedEvidence:
          'Afirmaciones repetidas por compradores más una contraprueba concreta y obtenible.',
      },
    ],
  },
  {
    key: 'positioning',
    order: 9,
    code: '09',
    label: 'Positioning',
    objective:
      'Decidir la categoría y la afirmación que la empresa va a defender, fundamentadas en investigación validada y no en aspiraciones.',
    questions: [
      {
        text: '¿En qué categoría nos colocan ya los compradores, y es esa la categoría que queremos?',
        purpose:
          'Los compradores archivan los productos en categorías mentales que ya existen. Pelear contra eso cuesta dinero; aprovecharlo condiciona la afirmación.',
        guidance:
          'Pide a los compradores que describan el producto a un colega. Sus palabras revelan la categoría por defecto.',
        expectedEvidence:
          'Descripciones de compradores con sus propias palabras, recogidas en varias cuentas.',
      },
      {
        text: '¿Qué podemos afirmar que las dos alternativas más fuertes no puedan afirmar de vuelta de forma creíble?',
        purpose:
          'El posicionamiento debe ser disputable pero defendible. Una afirmación que los competidores pueden repetir no es una posición.',
        guidance:
          'Redacta la afirmación y después escribe la réplica del competidor. Si la réplica es fácil y creíble, la afirmación es demasiado débil.',
        expectedEvidence:
          'Una afirmación contrastada contra los materiales de la competencia que demuestre que no pueden igualarla.',
      },
      {
        text: '¿A qué tiene que renunciar la empresa para sostener esta posición?',
        purpose:
          'Una posición sin sacrificio es un eslogan. La renuncia es lo que la hace creíble y operativamente real.',
        guidance:
          'Nombra los segmentos, funcionalidades y oportunidades que la posición descarta, y confirma que la empresa realmente los va a rechazar.',
        expectedEvidence:
          'Una declaración de renuncia explícita y acordada, registrada como decisión.',
      },
      {
        text: '¿Qué hallazgos validados respaldan esta posición, y qué partes siguen apoyándose en hipótesis?',
        purpose:
          'Mantiene el posicionamiento honesto. Una posición que descansa sobre hipótesis no validadas debe marcarse como provisional.',
        guidance:
          'Asocia cada elemento de la posición a la pregunta o decisión que lo respalda. Marca todo lo que no tenga respaldo.',
        expectedEvidence:
          'Un mapeo entre los elementos de la posición y preguntas validadas, decisiones o evidencia.',
      },
    ],
  },
  {
    key: 'messaging',
    order: 10,
    code: '10',
    label: 'Messaging',
    objective:
      'Convertir la posición en lenguaje que los compradores reconozcan, con un mensaje distinto por persona y una prueba detrás de cada afirmación.',
    questions: [
      {
        text: '¿Cuál es la frase que hace que el comprador correcto diga "esos somos nosotros"?',
        purpose:
          'El reconocimiento precede al interés. Sin él, incluso el tráfico bien segmentado no se autoidentifica.',
        guidance:
          'Describe la situación del comprador, no el producto. Pruébalo con compradores reales y observa el reconocimiento, no la cortesía.',
        expectedEvidence:
          'Formulaciones probadas con las reacciones registradas, incluidas las versiones que fallaron.',
      },
      {
        text: 'Por cada afirmación que hacemos, ¿cuál es la prueba, y la aceptaría un escéptico?',
        purpose:
          'En B2B las afirmaciones sin prueba se ignoran. Mapear afirmación-prueba expone qué mensajes todavía no se pueden sostener.',
        guidance:
          'Lista cada afirmación y adjunta su prueba. Lo que no tenga prueba o consigue evidencia o se elimina.',
        expectedEvidence:
          'Una tabla de afirmación/prueba donde cada prueba enlace a evidencia real.',
      },
      {
        text: '¿Cómo cambia el mensaje entre quien sufre el problema y quien firma?',
        purpose:
          'Un solo mensaje para ambos suele estar optimizado para ninguno. El comprador económico necesita otro encuadre.',
        guidance:
          'Escribe las dos versiones una al lado de la otra. Si son casi idénticas, falta el encuadre económico.',
        expectedEvidence:
          'Dos versiones distintas, probadas con cada perfil y con sus reacciones registradas.',
      },
      {
        text: '¿Qué palabras hay que evitar porque activan la categoría equivocada o una objeción conocida?',
        purpose:
          'Determinadas palabras pueden archivar el producto en una comparación perdedora o provocar una revisión de compras que nadie quería.',
        guidance:
          'Anota el vocabulario que produjo malas reacciones en conversaciones reales, y qué asumieron los compradores al oírlo.',
        expectedEvidence:
          'Casos documentados donde términos concretos provocaron una clasificación errónea u objeciones.',
      },
    ],
  },
  {
    key: 'linkedin',
    order: 11,
    code: '11',
    label: 'LinkedIn',
    objective:
      'Determinar si los compradores objetivo son alcanzables en LinkedIn y cómo, a partir de comportamiento observado.',
    questions: [
      {
        text: '¿Están los perfiles objetivo realmente activos en LinkedIn, o solo presentes?',
        purpose:
          'Estar presente no es ser alcanzable. Muchos roles operativos tienen cuenta pero nunca la leen, lo que invalida el canal entero.',
        guidance:
          'Toma 20 personas reales de cuentas objetivo y comprueba su actividad de publicación y comentarios en los últimos 90 días.',
        expectedEvidence:
          'Una auditoría de actividad de perfiles concretos con las fechas observadas, no números de seguidores.',
      },
      {
        text: '¿Con qué cuentas o voces interactúan ya los perfiles objetivo?',
        purpose:
          'La atención existente se puede tomar prestada. Revela tanto el formato como los temas que ya funcionan con esta audiencia.',
        guidance:
          'Mira qué comentan, no a quién siguen. Los comentarios son la señal fiable.',
        expectedEvidence:
          'Interacciones observadas sobre publicaciones y autores concretos, con ejemplos.',
      },
      {
        text: '¿Qué formato de contenido genera interacción en esta audiencia, frente al sector en general?',
        purpose:
          'Las audiencias operativas suelen rechazar los formatos que funcionan con compradores de software. Copiar los consejos genéricos de B2B desperdicia meses.',
        guidance:
          'Compara la interacción en publicaciones de las personas a las que sigue esta audiencia. Anota formato, extensión y uso de jerga.',
        expectedEvidence:
          'Una comparación de publicaciones reales con sus cifras de interacción por formato.',
      },
      {
        text: '¿Debe hacerse desde la página de empresa o desde perfiles personales, y con qué evidencia?',
        purpose:
          'Es una decisión de recursos importante. Las páginas de empresa suelen rendir peor, pero publicar desde perfiles personales exige compromiso sostenido.',
        guidance:
          'Compara el alcance de publicaciones de empresa y personales dentro de este nicho. Después valora si la empresa puede sostener la cadencia personal.',
        expectedEvidence:
          'Comparación de alcance en cuentas equiparables, más una valoración honesta de capacidad.',
      },
    ],
  },
  {
    key: 'content_visual',
    order: 12,
    code: '12',
    label: 'Content & Visual',
    objective:
      'Definir los pilares de contenido y el lenguaje visual que hacen legible la posición, vinculando cada pilar a un hallazgo de investigación.',
    questions: [
      {
        text: '¿Sobre qué tres a cinco temas podemos hablar con más autoridad que nadie, y por qué?',
        purpose:
          'Los pilares de contenido sin base de autoridad producen contenido genérico que compite por volumen — una batalla perdida.',
        guidance:
          'Por cada tema candidato, nombra los datos propios, la experiencia o el acceso que hacen creíble a la empresa en ese terreno.',
        expectedEvidence:
          'Cada pilar acompañado de su base de autoridad concreta, no de una aspiración.',
      },
      {
        text: '¿Qué pregunta hacen los compradores una y otra vez que nadie ha respondido bien públicamente?',
        purpose:
          'Las preguntas de alta intención sin responder son el contenido de mayor retorno en B2B, y salen directamente de las llamadas de ventas.',
        guidance:
          'Extrae las preguntas recurrentes de las llamadas comerciales y los tickets de soporte, y comprueba qué posiciona hoy para ellas. Busca respuestas pobres.',
        expectedEvidence:
          'Preguntas recurrentes con su frecuencia, más una valoración de las respuestas públicas existentes.',
      },
      {
        text: '¿Qué convenciones visuales espera este sector, y cuáles deberíamos romper deliberadamente?',
        purpose:
          'El lenguaje visual señala pertenencia a una categoría. Igualarlo todo significa invisibilidad; romperlo todo, ilegibilidad.',
        guidance:
          'Recopila visuales de competidores y de sectores adyacentes. Decide conscientemente qué convenciones conservar por credibilidad.',
        expectedEvidence:
          'Una auditoría visual documentada con decisiones explícitas de conservar/romper.',
      },
      {
        text: '¿Qué contenido necesita el campeón para vender esto internamente?',
        purpose:
          'El contenido de habilitación de fase final suele tener el mayor impacto en ingresos y suele ser lo último que se produce.',
        guidance:
          'Recupera el hallazgo del comité de compra sobre el documento interno y conviértelo en algo que el campeón pueda reutilizar.',
        expectedEvidence:
          'Una especificación del material de habilitación, trazable a la investigación del comité de compra.',
      },
    ],
  },
  {
    key: 'measurement',
    order: 13,
    code: '13',
    label: 'Measurement',
    objective:
      'Decidir qué se va a medir, qué contaría como prueba de que funciona y qué provocaría un cambio de rumbo.',
    questions: [
      {
        text: '¿Qué indicador adelantado nos diría que el posicionamiento funciona, antes de que se muevan los ingresos?',
        purpose:
          'Los ingresos van un ciclo de venta por detrás. Sin un indicador adelantado, la estrategia no se puede corregir a tiempo.',
        guidance:
          'Candidatos: inbound usando el nuevo lenguaje, tasa de inclusión en listas cortas, calidad de las respuestas. Elige los observables en semanas.',
        expectedEvidence:
          'Un indicador con nombre y su línea base actual, para que el cambio sea detectable.',
      },
      {
        text: '¿Qué resultado nos haría abandonar la estrategia actual, y para cuándo?',
        purpose:
          'Un criterio de abandono comprometido de antemano evita prolongar indefinidamente algo que no funciona.',
        guidance:
          'Fija el umbral y la fecha ahora, antes de que lleguen los datos y aparezca el razonamiento motivado.',
        expectedEvidence:
          'Una decisión registrada que indique umbral, métrica y fecha de revisión.',
      },
      {
        text: '¿Cuáles de nuestras métricas miden actividad en lugar de progreso?',
        purpose:
          'Las métricas de actividad hacen que una estrategia fallida parezca sana, y son el fallo de reporting más común en marketing.',
        guidance:
          'Por cada métrica pregunta: ¿podría subir mientras el negocio empeora? Si la respuesta es sí, es una métrica de actividad.',
        expectedEvidence:
          'Una clasificación métrica por métrica con el razonamiento registrado.',
      },
      {
        text: '¿Qué no podemos medir hoy que necesitaríamos medir, y qué haría falta para lograrlo?',
        purpose:
          'Nombra explícitamente el hueco de instrumentación en lugar de dejar que distorsione en silencio lo que se optimiza.',
        guidance:
          'Lista las decisiones que hoy se toman a ciegas y qué dato informaría cada una.',
        expectedEvidence:
          'Una lista de huecos con la fuente de datos necesaria y el esfuerzo para obtenerla.',
      },
    ],
  },
  {
    key: 'roadmap',
    order: 14,
    code: '14',
    label: 'Roadmap',
    objective:
      'Convertir los hallazgos validados en un plan secuenciado de 90 días donde cada punto sea trazable hasta una decisión.',
    questions: [
      {
        text: '¿Qué hallazgo validado, si se ejecuta primero, desbloquea más trabajo posterior?',
        purpose:
          'Secuenciar por dependencia y no por esfuerzo es lo que hace que un plan de 90 días llegue realmente a completarse.',
        guidance:
          'Mapea las dependencias entre las acciones pendientes y empieza donde la ramificación es mayor.',
        expectedEvidence:
          'Un mapa de dependencias que muestre qué desbloquea cada acción.',
      },
      {
        text: '¿Qué se puede ejecutar con lo que ya sabemos, sin esperar más investigación?',
        purpose:
          'Evita que la investigación se convierta en excusa para no ejecutar. Parte del trabajo ya está plenamente respaldado.',
        guidance:
          'Filtra las acciones cuyas preguntas de soporte ya están validadas o decididas.',
        expectedEvidence:
          'Una lista de acciones donde cada punto cite la pregunta validada o la decisión que lo respalda.',
      },
      {
        text: '¿Qué acciones planificadas siguen dependiendo de una hipótesis no validada?',
        purpose:
          'Hace explícito el riesgo, para que esas acciones se planteen como experimentos en lugar de comprometerse como plan.',
        guidance:
          'Por cada acción, traza su base. Todo lo que descanse sobre una hipótesis abierta es provisional.',
        expectedEvidence:
          'Un mapeo acción-base que marque cada dependencia de una hipótesis.',
      },
      {
        text: '¿Quién es dueño de cada acción, y qué aspecto tiene "terminado"?',
        purpose:
          'Las acciones sin dueño y sin criterio de finalización son el modo de fallo habitual de los planes a 90 días.',
        guidance:
          'Asigna un único responsable con nombre y un resultado verificable a cada punto. Evita la propiedad compartida.',
        expectedEvidence:
          'Un plan donde cada punto tenga un solo responsable y un criterio de finalización observable.',
      },
    ],
  },
];

export const PHASE_BY_KEY = new Map(PHASE_TEMPLATES.map((p) => [p.key, p]));

export function phaseLabel(key: PhaseKey) {
  return PHASE_BY_KEY.get(key)?.label ?? key;
}

export function phaseCode(key: PhaseKey) {
  return PHASE_BY_KEY.get(key)?.code ?? '??';
}
