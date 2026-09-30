---
title: "Predicción de necesidades de patrullas en Valencia"
title_es: "Predicción de necesidades de patrullas en Valencia"
title_en: "Predicting Patrol Staffing Needs in Valencia"
description: "Un modelo predictivo que cruza la tipología de intervenciones policiales con la dotación de patrullas disponible para estimar cuántas unidades hacen falta cada día."
summary_es: "Un modelo predictivo que cruza la tipología de intervenciones policiales con la dotación de patrullas disponible para estimar, día a día, cuántas unidades propias —y de refuerzo de otras unidades— hacen falta, según el histórico y los eventos previstos en la ciudad."
summary_en: "A predictive model that combines the typology of police interventions with available patrol staffing to estimate, day by day, how many own and reinforcement units are needed — based on historical demand and scheduled city events."
status: in-progress
status_es: "En desarrollo"
status_en: "In progress"
featured: true
date: 2026-09-15
kicker: "Data Science · Python"
cover_image: /assets/images/projects/patrullas-valencia-cover.svg
tags: [urban-intelligence, public-safety, predictive-modelling, police-operations, resource-planning, data-visualization, python, machine-learning, decision-support]
tag_pills:
  - { label: "Predictive Modelling", group: ai }
  - { label: "Police Operations", group: urban }
  - { label: "Resource Planning", group: product }
  - { label: "Python", group: data }
tech: [python, pandas, scikit-learn, xgboost, sql, jupyter, streamlit]
repo_url: "https://github.com/robervx/patrullas-valencia"
---

## Contexto

Cada turno, la sala de coordinación decide —en gran medida a ojo y con la experiencia de quien está de servicio— cuántas patrullas propias hacen falta y si conviene pedir refuerzo a otras unidades. Ese criterio funciona, pero es difícil de transferir, de auditar y de anticipar cuando cambian las condiciones (un festivo, un partido, una alerta meteorológica).

Este proyecto explora si el histórico de intervenciones, cruzado con la dotación real disponible y el calendario de eventos de la ciudad, puede convertirse en una **estimación orientativa** de cuántas unidades se van a necesitar mañana — no para sustituir la decisión operativa, sino para darle un punto de partida basado en datos.

<div class="callout">
  <div>
    <strong data-es="Nota sobre los datos" data-en="A note on the data">Nota sobre los datos</strong>
    <span data-es="Todos los datos, cifras y capturas de este proyecto son sintéticos o están anonimizados y agregados con fines ilustrativos. No reflejan dotaciones, ubicaciones ni operativos reales." data-en="All data, figures and screenshots in this project are synthetic or anonymised and aggregated for illustration only. They do not reflect real staffing, locations or operations.">Todos los datos, cifras y capturas de este proyecto son sintéticos o están anonimizados y agregados con fines ilustrativos. No reflejan dotaciones, ubicaciones ni operativos reales.</span>
  </div>
</div>

## Los datos

Tres fuentes alimentan el modelo:

- **Histórico de intervenciones** — tipología, franja horaria, distrito y unidad que atendió cada aviso.
- **Dotación por turno** — patrullas propias disponibles, bajas y unidades de refuerzo solicitadas en el pasado.
- **Calendario de eventos de ciudad** — partidos, fiestas locales, manifestaciones y otros eventos que históricamente disparan la demanda.

```python
import pandas as pd

interventions = pd.read_csv("data/intervenciones_2023_2026.csv", parse_dates=["timestamp"])
staffing = pd.read_csv("data/dotacion_turnos.csv", parse_dates=["fecha"])
events = pd.read_csv("data/eventos_ciudad.csv", parse_dates=["fecha"])

interventions["turno"] = interventions["timestamp"].dt.hour.map(shift_from_hour)
interventions["dia_semana"] = interventions["timestamp"].dt.day_name(locale="es_ES")
interventions.head()
```

## De la tipología de intervenciones a la carga por turno

El primer paso es traducir cada tipo de intervención en una **carga estimada** (tiempo medio de ocupación de una patrulla), para no tratar por igual un aviso de tráfico leve que una intervención que moviliza varias unidades.

```python
carga_media_min = (
    interventions
    .groupby("tipologia")["duracion_min"]
    .median()
    .rename("carga_media_min")
)

interventions = interventions.merge(carga_media_min, on="tipologia", how="left")

carga_por_turno = (
    interventions
    .groupby(["fecha", "turno", "distrito"])["carga_media_min"]
    .sum()
    .div(60)
    .rename("horas_patrulla_necesarias")
    .reset_index()
)
```

## Eventos de ciudad como variable de refuerzo

Los eventos no generan intervenciones por sí solos, pero sí alteran el patrón habitual: más movimiento de personas, más tráfico, más probabilidad de avisos de aglomeración. Se incorporan como variables categóricas y como una ventana de horas antes/después del evento.

```python
def flag_event_window(df, events, hours_before=2, hours_after=3):
    df = df.copy()
    df["evento_cercano"] = False
    df["tipo_evento"] = "ninguno"

    for _, ev in events.iterrows():
        window = (
            (df["timestamp"] >= ev["inicio"] - pd.Timedelta(hours=hours_before)) &
            (df["timestamp"] <= ev["fin"] + pd.Timedelta(hours=hours_after)) &
            (df["distrito"] == ev["distrito"])
        )
        df.loc[window, "evento_cercano"] = True
        df.loc[window, "tipo_evento"] = ev["tipo"]

    return df
```

## El modelo predictivo

Con la carga por turno ya calculada, un modelo de gradient boosting aprende a estimar las horas-patrulla necesarias a partir del día de la semana, la franja horaria, el distrito, la meteorología prevista y la presencia (y tipo) de evento cercano. La salida se traduce después en un número entero de patrullas, dividiendo entre la duración del turno.

```python
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor

features = ["dia_semana", "turno", "distrito", "meteo", "tipo_evento"]
target = "horas_patrulla_necesarias"

X_train, X_test, y_train, y_test = train_test_split(
    dataset[features], dataset[target], test_size=0.2, random_state=42
)

preprocess = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), features),
])

model = Pipeline([
    ("preprocess", preprocess),
    ("regressor", XGBRegressor(
        n_estimators=400,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42,
    )),
])

model.fit(X_train, y_train)
print("MAE (horas-patrulla):", mean_absolute_error(y_test, model.predict(X_test)))
```

La primera validación con datos sintéticos apunta a un error medio de poco más de media patrulla por turno — suficiente para usarse como referencia, no como decisión automática.

## Simulador: ¿cuántas patrullas hacen falta mañana?

Una forma sencilla de ver el modelo en acción: fija las condiciones de mañana y observa cómo cambia la previsión. (Es una simulación ilustrativa en el navegador, no el modelo real ejecutándose.)

<div class="explainer" data-base="7" data-variance="1">
  <h4 data-es="Dentro del modelo predictivo" data-en="Inside the predictive model">Dentro del modelo predictivo</h4>
  <p data-es="Ajusta las condiciones de mañana y ejecuta la previsión para ver cómo cambian las patrullas estimadas." data-en="Adjust tomorrow's conditions and run the forecast to see the estimated patrols change.">Ajusta las condiciones de mañana y ejecuta la previsión para ver cómo cambian las patrullas estimadas.</p>

  <div class="explainer-grid">
    <div>
      <div class="explainer-col-label" data-es="Datos disponibles" data-en="Available data">Datos disponibles</div>
      <div class="explainer-inputs">
        <div class="explainer-field">
          <div class="explainer-field-label" data-es="Intervenciones pasadas (3 años)" data-en="Past interventions (3 years)">Intervenciones pasadas (3 años)</div>
          <div class="explainer-field-fixed" data-es="Histórico fijo" data-en="Fixed historical data">Histórico fijo</div>
        </div>
        <div class="explainer-field">
          <div class="explainer-field-label" data-es="Meteorología prevista" data-en="Forecast weather">Meteorología prevista</div>
          <div class="pill-group">
            <button type="button" class="pill-toggle active" data-weight="1">Soleado</button>
            <button type="button" class="pill-toggle" data-weight="1.2">Lluvioso</button>
          </div>
        </div>
        <div class="explainer-field">
          <div class="explainer-field-label" data-es="Tipo de día" data-en="Day type">Tipo de día</div>
          <div class="pill-group">
            <button type="button" class="pill-toggle active" data-weight="1">Laborable</button>
            <button type="button" class="pill-toggle" data-weight="1.15">Fin de semana</button>
            <button type="button" class="pill-toggle" data-weight="1.35">Festivo</button>
          </div>
        </div>
        <div class="explainer-field">
          <div class="explainer-field-label" data-es="Eventos en la ciudad" data-en="City events">Eventos en la ciudad</div>
          <div class="pill-group">
            <button type="button" class="pill-toggle active" data-weight="1">Ninguno cerca</button>
            <button type="button" class="pill-toggle" data-weight="1.6">Gran evento cercano</button>
          </div>
        </div>
      </div>
    </div>

    <div class="explainer-arrow">→</div>

    <div>
      <div class="explainer-col-label" data-es="El modelo" data-en="The model">El modelo</div>
      <div class="explainer-model">
        <span><b>1</b> <span data-es="Combinar las variables" data-en="Combine the features">Combinar las variables</span></span>
        <span><b>2</b> <span data-es="Ejecutar XGBoost" data-en="Run XGBoost">Ejecutar XGBoost</span></span>
      </div>
    </div>

    <div class="explainer-arrow">→</div>

    <div>
      <div class="explainer-col-label" data-es="Patrullas previstas para mañana" data-en="Predicted patrols for tomorrow">Patrullas previstas para mañana</div>
      <div class="explainer-output">
        <span class="value">7</span>
        <span class="unit" data-es="patrullas" data-en="patrols">patrullas</span>
      </div>
      <button type="button" class="button primary explainer-run" data-es="Ejecutar la previsión" data-en="Run the forecast">Ejecutar la previsión</button>
    </div>
  </div>
</div>

## Próximos pasos

- Sustituir los datos sintéticos por un histórico real anonimizado y validar el error por distrito, no solo en global.
- Añadir un intervalo de confianza a la previsión, en lugar de un único número.
- Explorar si conviene un modelo por distrito o uno global con el distrito como variable.
- Empaquetar el simulador como una app interna sencilla (Streamlit) para que sala de coordinación pueda probarlo con datos reales.
