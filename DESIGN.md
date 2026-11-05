---
name: Sphaera
description: El círculo y la esfera con el scroll, en negro, con una geométrica y un solo rojo.
colors:
  tinta: "#0f0f0e"
  luz: "#ebe8e1"
  luz-2: "#c9c5bc"
  gris: "#8f8b83"
  hilo: "rgb(235 232 225 / 0.16)"
  rojo: "#e8553a"
typography:
  display:
    fontFamily: "Jost, Futura, 'Century Gothic', Arial, sans-serif"
    fontSize: "clamp(4.75rem, 2rem + 13vw, 15rem)"
    fontWeight: 300
    lineHeight: 0.86
    letterSpacing: "-0.045em"
  titulo:
    fontFamily: "Jost"
    fontSize: "clamp(2.5rem, 1.4rem + 3.6vw, 5.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
  entrada:
    fontFamily: "Jost"
    fontSize: "clamp(1.25rem, 1rem + 0.9vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.32
  cuerpo:
    fontFamily: "Jost"
    fontSize: "clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.55
  pie:
    fontFamily: "Jost"
    fontSize: "0.8125rem"
    lineHeight: 1.45
rounded:
  lamina: "0"
  disco: "50%"
  control: "999px"
spacing:
  margen: "clamp(16px, 4vw, 64px)"
  hueco: "clamp(112px, 13vw, 220px)"
---

# Sphaera

## Idea

Negro de noche, como el fondo de los grabados de Fludd, las fotografías de Woolsey y Filbri y los pasteles de Trouvelot, que así se funden con la página. Una sola tipografía, Jost, heredera libre de la Futura, construida con círculo, triángulo y cuadrado. Un solo color, el rojo, reservado para la geometría: el compás, el borde, el Sol, el cilindro.

## Reglas

- **Un rojo.** `#e8553a` sólo para lo que se traza (líneas de las figuras, el centro, el Sol del cielo, el arco de avance de la cabecera) y para el foco y el hover de los enlaces. Contraste 5,2:1 sobre el negro.
- **Tres formas.** Las láminas de papel se ven como son, en ángulo recto. Lo que es redondo (las muestras de torno, el ocular, la luz de Fludd) se ve en disco. Lo que se toca (el botón, el desplegable de créditos) es una píldora.
- **Texto.** Títulos en 400 con interletraje negativo; la portada en 300. Cursiva sólo para el lema de Homo bulla y los títulos de obras. Sin rayas: punto, coma o dos puntos.
- **Pies de lámina.** Primero qué mirar, en `luz-2`; debajo, autor y fecha en `gris`.
- **Mesas.** Las láminas sueltas de cada capítulo van en una rejilla de 12 columnas con posiciones distintas en cada capítulo; en el móvil, una columna alternando a izquierda y derecha.
- **Movimiento.** Sólo con el scroll, suavizado hacia la posición. Las partes fijas viven en un `.fijo` para soltarse antes de las láminas de detrás. Sin JavaScript o con menos movimiento, nada se fija.
