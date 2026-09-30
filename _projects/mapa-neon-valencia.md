---
title: "Mapa de intervenciones por barrio"
title_es: "Mapa de intervenciones por barrio — calles en neón sobre Valencia"
title_en: "Neighbourhood Intervention Map — Neon Streets Over Valencia"
description: "Un mapa geoespacial en R que cruza tasas de intervención por distrito y barrio con capas de flujo de movimiento, en una estética oscura de calles en neón."
summary_es: "Un mapa geoespacial en R que cruza tasas de intervención por distrito y barrio con capas de flujo de movimiento, en una estética oscura de calles en neón, para detectar de un vistazo las zonas de mayor concentración y las problemáticas que las explican."
summary_en: "A geospatial map built in R that overlays district and neighbourhood intervention rates with movement-flow layers, in a dark neon-street aesthetic, to spot high-concentration zones and the issues behind them at a glance."
status: prototype
status_es: "Prototipo"
status_en: "Prototype"
featured: false
date: 2026-08-20
kicker: "Data Science · R"
cover_image: /assets/images/projects/mapa-neon-valencia-cover.svg
tags: [urban-intelligence, public-safety, geospatial-analysis, data-visualization, r, cartography, neighbourhood-analysis, decision-support]
tag_pills:
  - { label: "Geospatial Analysis", group: urban }
  - { label: "Cartography", group: comm }
  - { label: "Data Visualization", group: data }
  - { label: "R", group: data }
tech: [r, tidyverse, sf, ggplot2, leaflet]
repo_url: "https://github.com/robervx/mapa-neon-valencia"
---

## Contexto

Un cuadro de mando con tablas y KPIs cuenta cuánto pasa. Un mapa cuenta **dónde**. Este proyecto nace de una pregunta sencilla: si coloco las tasas de intervención sobre el callejero real de Valencia, distrito a distrito y barrio a barrio, ¿se ven patrones que las tablas esconden? ¿Coinciden las zonas de mayor concentración con corredores de movimiento de personas, con ocio nocturno, con ejes de tráfico?

La estética oscura con calles en neón no es solo decorativa: sobre fondo negro, el ojo distingue mejor los focos de concentración que sobre un mapa claro tradicional — es el mismo principio que usan los mapas de movilidad nocturna de las grandes ciudades.

<div class="callout warn">
  <div>
    <strong data-es="Nota sobre los datos" data-en="A note on the data">Nota sobre los datos</strong>
    <span data-es="Los límites administrativos son reales (Valencia), pero las tasas, focos y flujos mostrados son sintéticos con fines ilustrativos. No representan cifras, barrios ni operativos reales." data-en="Administrative boundaries are real (Valencia), but the rates, hotspots and flows shown are synthetic and for illustration only. They do not represent real figures, neighbourhoods or operations.">Los límites administrativos son reales (Valencia), pero las tasas, focos y flujos mostrados son sintéticos con fines ilustrativos. No representan cifras, barrios ni operativos reales.</span>
  </div>
</div>

## Los datos geográficos

Tres capas espaciales se combinan: los límites de distritos y barrios (datos abiertos del Ayuntamiento), la red de calles (OpenStreetMap vía `osmdata`) y el histórico de intervenciones geolocalizado y agregado por barrio.

```r
library(sf)
library(tidyverse)

barrios <- st_read("data/barrios_valencia.geojson") |>
  st_transform(crs = 4326)

intervenciones <- read_csv("data/intervenciones_geo.csv") |>
  st_as_sf(coords = c("lon", "lat"), crs = 4326)

# número de intervenciones y tasa por 1.000 habitantes, por barrio
barrios_tasas <- st_join(barrios, intervenciones) |>
  st_drop_geometry() |>
  count(barrio, poblacion, name = "n_intervenciones") |>
  mutate(tasa_1000 = n_intervenciones / poblacion * 1000) |>
  right_join(barrios, by = "barrio") |>
  st_as_sf()
```

## Tasas de intervención por barrio

Una coropleta clásica, pero con paleta y tipografía coherentes con el resto del portfolio, sirve como capa base antes de añadir las calles en neón.

```r
ggplot(barrios_tasas) +
  geom_sf(aes(fill = tasa_1000), color = "#0b0e17", linewidth = 0.15) +
  scale_fill_gradientn(
    colours = c("#131a2b", "#1d6f75", "#39e6c8"),
    name = "Tasa / 1.000 hab."
  ) +
  theme_void(base_family = "Inter") +
  theme(
    plot.background = element_rect(fill = "#0b0e17", colour = NA),
    legend.text = element_text(colour = "#c9d1e6"),
    legend.title = element_text(colour = "#f4f6fb")
  )
```

## La capa de calles en neón

El efecto de "brillo" en `ggplot2` se consigue dibujando la misma geometría varias veces, con trazo cada vez más ancho y más transparente por debajo del trazo nítido final — el mismo truco que usan las ilustraciones de neón digital.

```r
calles <- st_read("data/callejero_valencia.geojson")

glow_layer <- function(width, alpha, colour) {
  geom_sf(data = calles, colour = colour, linewidth = width, alpha = alpha)
}

ggplot() +
  glow_layer(3.2, 0.06, "#39e6c8") +
  glow_layer(2.0, 0.12, "#39e6c8") +
  glow_layer(0.9, 0.35, "#39e6c8") +
  glow_layer(0.35, 0.9, "#eafffb") +
  theme_void() +
  theme(plot.background = element_rect(fill = "#0b0e17", colour = NA))
```

## Flujos de movimiento y concentración

Sobre la base de calles en neón, una capa de densidad de puntos (llegadas de avisos, o datos de movilidad agregados) revela los focos reales de concentración, más allá de los límites administrativos del barrio.

```r
ggplot(intervenciones) +
  stat_density_2d(
    aes(x = st_coordinates(geometry)[, 1], y = st_coordinates(geometry)[, 2], fill = after_stat(level)),
    geom = "polygon", contour = TRUE, alpha = 0.35
  ) +
  scale_fill_gradientn(colours = c("#0b0e17", "#ff5da2", "#ffd27f")) +
  theme_void() +
  theme(plot.background = element_rect(fill = "#0b0e17", colour = NA), legend.position = "none")
```

## Detectar zonas con problemáticas específicas

Un foco de concentración por sí solo no explica nada; lo interesante es cruzarlo con la tipología dominante de intervención en ese punto — ocio nocturno, tráfico, aglomeración en eventos — para distinguir un barrio con un problema puntual de otro con un patrón estructural.

```r
focos_por_tipologia <- intervenciones |>
  st_join(barrios) |>
  st_drop_geometry() |>
  count(barrio, tipologia, sort = TRUE) |>
  group_by(barrio) |>
  slice_max(n, n = 1) |>
  ungroup() |>
  rename(tipologia_dominante = tipologia)
```

Con esa tabla, cada foco del mapa puede etiquetarse con su problemática más probable, en lugar de quedarse en "aquí hay mucho".

## Próximos pasos

- Sustituir los datos sintéticos por el histórico real agregado por barrio, con las anonimizaciones necesarias.
- Añadir un slider temporal (franja horaria / día de la semana) con `leaflet` para ver cómo se mueven los focos a lo largo del día.
- Cruzar los focos con el mapa de dotación de patrullas del [proyecto de predicción de patrullas]({{ "/projects/patrullas-valencia/" | relative_url }}) para ver si la respuesta actual ya cubre las zonas de mayor concentración.
