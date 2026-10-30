---
title: "¿Más renta, más quejas?"
title_es: "¿Más renta, más quejas?"
title_en: "More Income, More Complaints?"
description: "Visualización exploratoria en Flourish que cruza la renta por distrito con las quejas y sugerencias municipales de València en 2023. Primer proyecto de visualización de datos del Máster de Ciencia de Datos (UOC)."
summary_es: "Un gráfico de burbujas interactivo que cruza la renta media y las quejas y sugerencias por distrito en València durante 2023, para explorar — sin presuponer la respuesta — si los distritos con más renta reclaman más."
summary_en: "An interactive bubble chart crossing average income with complaints and suggestions by district in València during 2023, exploring — without presupposing the answer — whether wealthier districts complain more."
status: prototype
status_es: "Exploratorio"
status_en: "Exploratory"
featured: false
date: 2026-10-20
kicker: "Data Visualization · Flourish"
cover_image: /assets/images/projects/mas-renta-mas-quejas-cover.svg
cover_embed: "https://flo.uri.sh/visualisation/30742178/embed"
tags: [data-visualization, exploratory-analysis, open-data, flourish, excel, bubble-chart, public-participation, urban-intelligence]
tag_pills:
  - { label: "Data Visualization", group: data }
  - { label: "Exploratory Analysis", group: data }
  - { label: "Open Data", group: urban }
  - { label: "Flourish", group: data }
  - { label: "Public Participation", group: comm }
tech: [excel, flourish]
demo_url: "https://public.flourish.studio/visualisation/30742178/"
---

## Contexto

Este fue mi primer proyecto de visualización de datos: un trabajo para la asignatura de Visualización de Datos del Máster de Ciencia de Datos de la UOC, con el objetivo de combinar datos municipales de València y construir un gráfico interactivo en Flourish. Lo dejo aquí tal cual, como punto de partida — con sus decisiones, sus dudas y sus límites — más que como un caso cerrado.

La propuesta inicial giraba en torno a la renta y el envejecimiento de los barrios de la ciudad. Explorando fuentes abiertas del Ayuntamiento, encontré también un conjunto de datos de vulnerabilidad territorial y, finalmente, decidí cruzar la renta con las quejas y sugerencias presentadas por la ciudadanía. Esa combinación permitía una pregunta concreta, ligada a participación ciudadana y gestión municipal:

> ¿Los distritos con mayor renta registran más quejas y sugerencias por habitante?

La intención desde el principio fue explorar los datos sin presuponer que existiera esa relación.

## Las fuentes

| Fuente | Información utilizada |
|---|---|
| Atlas de renta de los hogares | Renta neta media anual por persona y distrito |
| Padrón Municipal | Población de cada distrito |
| Registros municipales de quejas y sugerencias | Tipo de solicitud, fecha de entrada y distrito del solicitante |

Fijé **2023 como año común de comparación** y trabajé con los **19 distritos de València**.

El registro de quejas y sugerencias distingue entre el **distrito del solicitante** (residencia de quien presenta la solicitud) y el **distrito de localización** (lugar al que se refiere el problema). Usé el primero, porque la pregunta se refiere a la renta de la zona de residencia de quien reclama — no al lugar donde ocurre el problema.

## Filtrado, agrupación y tasa

La preparación siguió estos pasos sobre el fichero de quejas y sugerencias:

1. Seleccionar las solicitudes registradas durante 2023.
2. Conservar únicamente los tipos **Queja** y **Sugerencia**.
3. Excluir de la comparación territorial los registros sin distrito del solicitante conocido.
4. Agrupar los registros restantes por distrito y contar las solicitudes.

<div class="callout warn">
  <div>
    <strong data-es="Nota sobre los datos" data-en="A note on the data">Nota sobre los datos</strong>
    <span data-es="De las 25.404 quejas y sugerencias de 2023, solo 4.498 (un 17,7 %) tenían distrito de residencia identificado. Los domicilios desconocidos no se sustituyeron por la ubicación del problema, porque eso habría cambiado el significado del análisis — así que la comparación trabaja con una muestra parcial, no con el total de solicitudes." data-en="Of the 25,404 complaints and suggestions filed in 2023, only 4,498 (17.7%) had an identified home district. Unknown addresses were not replaced with the problem's location, since that would have changed what the analysis measures — so the comparison runs on a partial sample, not the full set of requests.">De las 25.404 quejas y sugerencias de 2023, solo 4.498 (un 17,7 %) tenían distrito de residencia identificado. Los domicilios desconocidos no se sustituyeron por la ubicación del problema, porque eso habría cambiado el significado del análisis — así que la comparación trabaja con una muestra parcial, no con el total de solicitudes.</span>
  </div>
</div>

Para no confundir recuento absoluto con distritos simplemente más poblados, calculé una tasa:

**Quejas y sugerencias por 1.000 habitantes = (registros con distrito conocido / población del distrito) × 1.000**

Esta tasa describe solicitudes con residencia identificada, no personas distintas: alguien puede presentar varias.

Uní estos recuentos con la renta y la población por distrito en un Excel con dos hojas: **Datos_Flourish** (la tabla a representar) y **Fuentes_y_notas** (procedencia, filtros y limitaciones), con una fila por distrito y estas columnas:

| Variable | Descripción |
|---|---|
| Código y nombre del distrito | Identificación territorial |
| Año | 2023 |
| Renta neta anual por persona | Ingresos medios por persona, en euros |
| Población | Habitantes del distrito |
| Quejas y sugerencias | Registros con residencia identificada |
| Quejas y sugerencias por 1.000 habitantes | Tasa calculada para la comparación |

## Por qué un gráfico de burbujas

Elegí esta técnica porque permite representar tres variables cuantitativas a la vez:

| Elemento visual | Variable |
|---|---|
| Posición horizontal | Renta neta anual por persona |
| Posición vertical | Quejas y sugerencias por 1.000 habitantes |
| Área de la burbuja | Población del distrito |
| Color | Refuerzo visual de la tasa de quejas y sugerencias |
| Etiqueta y ventana emergente | Identificación y valores de cada distrito |

Construí la visualización en Flourish y fui ajustando el diseño en varias pasadas: reduje solapamientos entre burbujas, fijé el eje vertical en cero, cambié los nombres técnicos de las variables por textos legibles, seleccioné solo algunas etiquetas para no saturar el gráfico, usé una escala secuencial de color y acorté los textos de las ventanas emergentes. También unifiqué la terminología en torno a «quejas y sugerencias», para evitar la ambigüedad de expresiones más genéricas como «comunicaciones».

El resultado es la visualización interactiva de la portada — puedes explorarla ahí mismo, o <a href="https://public.flourish.studio/visualisation/30742178/" target="_blank" rel="noopener">verla a pantalla completa en Flourish ↗</a>.

## Lectura exploratoria

La visualización muestra diferencias entre distritos, pero no una relación uniforme entre renta y quejas y sugerencias. **Ciutat Vella** destaca con unas doce solicitudes por cada mil habitantes; **l'Eixample y el Pla del Real**, con rentas superiores, tienen tasas menores; y **Poblats Marítims** presenta una tasa próxima a la de l'Eixample con una renta considerablemente inferior.

Son observaciones descriptivas: en esta fase no he cuantificado la correlación ni he hecho un análisis causal.

## Limitaciones

La principal es la que ya marca la nota de más arriba: la comparación usa solo el 17,7 % de las quejas y sugerencias de 2023, así que si la disponibilidad del domicilio varía entre canales de entrada o distritos, el patrón mostrado puede estar sesgado. Además:

- Se cuentan solicitudes, no personas únicas.
- La renta es un promedio del distrito, no la renta individual de quien reclama.
- Una tasa elevada no demuestra más problemas ni más insatisfacción.
- El análisis es de un único año y a escala territorial agregada.

Por tanto, estos datos no permiten afirmar que las personas con mayores ingresos se quejen más.

## Qué aprendí

El aprendizaje principal no fue de Flourish, sino de todo lo anterior: preparar una visualización implica tomar decisiones antes de diseñarla — definir la pregunta, distinguir ubicaciones, fijar un periodo común, normalizar los recuentos y comprobar qué parte de los datos puede usarse realmente. El gráfico en sí fue la parte más rápida del proceso.

El proyecto queda en fase exploratoria. Como continuación, sería útil estudiar la falta de domicilios por canal de entrada y comprobar si el patrón se mantiene en otros años.

**Herramientas:** Excel (tabla integrada y documentación de fuentes), Flourish (construcción y diseño) y GitHub (documentación del proceso).
