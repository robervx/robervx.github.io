---
title: "Mirall"
title_es: "Mirall"
title_en: "Mirall"
summary_es: "Mirall transforma información pública dispersa en una representación coherente de la ciudad: un mapa de Valencia en tiempo real que agrega movilidad, meteorología, calidad del aire, eventos e incidencias en un único panel — con datos públicos y abiertos, sin backend municipal detrás."
summary_en: "Mirall turns scattered public information into a coherent picture of the city: a real-time map of Valencia that brings together mobility, weather, air quality, events and incidents in a single view — built entirely on open public data, with no city-hall backend behind it."
description: "Mirall: un mapa de Valencia en tiempo real que agrega movilidad, meteorología, calidad del aire, eventos e incidencias en un único panel, sobre datos públicos abiertos."
status: in-progress
status_es: "En desarrollo"
status_en: "In progress"
featured: true
date: 2026-09-28
kicker: "Urban Intelligence Platform"
cover_image: /assets/images/projects/mirall-cover.svg
tags: [urban-intelligence, open-data, geospatial-analysis, data-visualization, real-time-data, civic-tech, product-thinking, decision-support]
tag_pills:
  - { label: "Urban Intelligence", group: urban }
  - { label: "Open Data", group: data }
  - { label: "Geospatial", group: urban }
  - { label: "Product Thinking", group: product }
tech: [typescript, maplibre, deckgl, pwa, git]
---

## Qué es

La misión de Mirall en una frase: transformar información pública dispersa en una representación coherente de la ciudad que permita comprender qué está ocurriendo y tomar mejores decisiones. En la práctica es un mapa en tiempo real de Valencia que agrega en un único panel movilidad, meteorología, calidad del aire, eventos e incidencias — todo sobre datos públicos y gratuitos, sin ningún backend municipal detrás.

Es un proyecto abierto (MIT), sin marca institucional ni empresa detrás: cualquiera puede desplegarlo. Y no es un prototipo — a día de hoy **51 de 57 specs están en estado "Implemented"**. Hay bastante superficie ya construida y en uso.

## Arquitectura: sin framework, a propósito

Esto condiciona todo lo demás, así que prefiero decirlo claro desde el principio: Mirall no usa React, Vue ni Svelte. Es TypeScript vanilla trabajando directamente contra el DOM (`document.createElement`, plantillas de string) en un fichero principal grande, `main.ts`. El CSS vive en un único `estilos.css`, con custom properties (`--mirall-navy`, `--header-h`...) pero sin sistema de diseño ni utilidades tipo Tailwind.

```typescript
// Vocabulario real del proyecto (ilustrativo, no el archivo fuente)
type Agregacion = "punto" | "choropleth" | "linea" | "cluster" | "lista" | "mixta";

interface LayerDefinition {
  id: string;
  grupo: "movilidad" | "ambiental" | "situacional" | "mediatico" | "base";
  agregacion: Agregacion;
  siempreVisible: boolean; // capa "primaria" vs "contexto"
  esSintetico?: boolean;   // si es true, el badge debe ser visible siempre
}
```

¿Por qué importa esto para un rediseño? Porque aquí "modernizar" es sobre todo trabajo de CSS, HTML y JS a mano — no cambiar un tema de componentes. Cualquier propuesta de sistema visual nuevo tiene que asumir ese coste de implementación real, no el de un proyecto con React de por medio.

Para el mapa: MapLibre GL (teselas OpenFreeMap) con deck.gl en modo *interleaved* para las capas de datos. 2D puro — sin globo 3D. Fue una decisión explícita y documentada, y no la voy a reabrir sin pasar antes por un ADR.

## Arquitectura de información

Dos vistas por hash-routing:

- **`#/mapa`** — capas operativas en tiempo real sobre el mapa (tráfico, Pulso de Distrito, incidencias de vía pública) junto con KPIs y alertas.
- **`#/inteligencia`** — contenido de lectura fija: cámaras, contexto mediático, actualidad institucional, tendencia de términos, agenda de eventos.

Las capas se activan como checkboxes en un sidebar navy colapsable, agrupadas en dos bloques: **primaria** (siempre visibles, con acento de color) y **contexto** (plegable). Sobre el mapa, paneles flotantes blancos —tarjetas con radio de 4-6px y sombra suave— muestran aire, meteorología, alertas o congestión histórica. No es un dashboard de rejilla fija: son tarjetas superpuestas al mapa, y así se quedan.

En móvil, un *bottom sheet* compartido reparenta esos mismos paneles en lugar de duplicar la lógica. Y Mirall es instalable como PWA con service worker: cuando hay una versión nueva, avisa explícitamente — nunca recarga sola por detrás.

## Identidad visual actual

```css
:root {
  --mirall-navy: #0b1f33;
  --mirall-navy-soft: #14304f;
  --header-h: 56px;
}
```

| Elemento | Valor |
|---|---|
| Color principal | Navy `#0b1f33` (header y sidebar) |
| Tipografía de marca | 'Space Grotesk' (solo el wordmark "Mirall") |
| Tipografía de cuerpo | system-ui, sans-serif |
| Tarjetas de datos | Fondo blanco, radio 4-6px, sombra sutil |
| Estado: ok | Verde `#22c55e` / `#86efac` |
| Estado: alerta | Ámbar `#fbbf24` |
| Estado: sin datos | Gris `#94a3b8` |

Es una estética de panel de control institucional: sobria, funcional, con poco color de marca más allá del navy. Y, siendo honesto, es la parte más obvia a mejorar — hoy no hay realmente una identidad visual distintiva más allá del navy y el Space Grotesk del logotipo. Por ahí va mi próximo foco.

## Qué hay que representar: el inventario de capas

| Grupo | Capas |
|---|---|
| Movilidad | Tráfico en tiempo real, Valenbisi, aparcamiento, incidencias de vía pública, avisos de movilidad |
| Ambiental | Calidad del aire, meteorología, temperatura por zona, precipitación por zona, Zonas Acústicamente Saturadas, riesgo de escorrentía, altimetría |
| Situacional | Pulso de Distrito (escenarios compuestos), cámaras (DGT/webcams), agenda de eventos, Fallas |
| Mediático | Contexto mediático (RSS + GDELT), tendencia de términos |
| Base | Distritos (choropleth base) |

Cada capa se pinta con una de seis técnicas ya establecidas en el vocabulario del proyecto: punto, choropleth por distrito, línea, cluster, lista o mixta.

## Cómo se trabaja: spec-driven development

Aquí no se toca una capa ni un endpoint sin una spec previa en `specs/`. Un rediseño puramente visual —CSS, layout— probablemente no necesita spec nueva; pero si cambia la estructura de la información (qué capas existen, cómo se agrupan) sí entra en ese proceso. Es una disciplina que frena la tentación de "total, es solo un ajuste rápido", y que hasta ahora ha merecido la pena.

<div class="callout">
  <div>
    <strong data-es="Un límite que no negocio" data-en="A line I don't cross">Un límite que no negocio</strong>
    <span data-es="Cualquier capa con datos simulados mantiene siempre visible su badge de 'esSintetico'. El globo 3D, el multi-idioma más allá de ES/VA/EN y la monetización están explícitamente fuera de alcance." data-en="Any layer built on simulated data always keeps its 'esSintetico' (synthetic) badge visible. A 3D globe, languages beyond ES/VA/EN, and monetisation are explicitly out of scope.">Cualquier capa con datos simulados mantiene siempre visible su badge de "esSintetico". El globo 3D, el multi-idioma más allá de ES/VA/EN y la monetización están explícitamente fuera de alcance.</span>
  </div>
</div>

## Próximos pasos

- Cerrar las 6 specs que quedan del roadmap actual.
- Explorar una identidad visual más distintiva sin tocar la arquitectura de información ni reabrir decisiones ya cerradas (sin framework de componentes, sin globo 3D).
- Documentar el proceso de spec-driven development como referencia para el resto de proyectos del lab.
