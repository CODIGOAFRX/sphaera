# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

HTML, CSS y JavaScript sin frameworks ni dependencias, como Catábasis, Comedia, Ornamentos y Herbario. El build (`scripts/build.mjs`) rellena las imágenes desde `app/media/laminas.json`, escribe las figuras SVG de `scripts/figuras.mjs` y versiona los archivos. Se sirve como Worker de Cloudflare con archivos estáticos en `pedrogomez.dev/proyecto/sphaera`. Las láminas se preparan una vez con Python (Pillow) en `pipeline/`.

## Users

Gente curiosa que recuerda vagamente la geometría del colegio y disfruta de las láminas antiguas: quiere entender de un vistazo qué tiene de especial el círculo (un centro y una distancia, π, la esfera, las órbitas, las pompas) sin fórmulas. La web forma parte del portfolio de Pedro Gómez, que hace de escaparate, pero tiene que servir de verdad a quien no busca un portfolio.

## Product Purpose

Contar el círculo y la esfera en una sola bajada de scroll que empieza en un punto y termina en un punto. Funciona si el visitante sale sabiendo tres cosas que no sabía: por qué π no se acaba, por qué Sol y Luna miden lo mismo en el cielo y por qué una pompa es redonda.

## Positioning

Cada capítulo es una figura que se construye con el scroll (los radios, los polígonos, la esfera, las órbitas, el eclipse) acompañada de láminas reales que la cuentan. Nada de imágenes generadas: las figuras se calculan y las láminas se recortan.

## Operating Context

- Se lee en el móvil tanto como en el ordenador; todas las escenas caben en una pantalla de móvil.
- Proyectos hermanos del mismo autor: Catábasis y Ornamentos (papel y serif de libro), Comedia (color plano por capítulos y una grotesca), Bóveda (azul de noche). Sphaera no debe parecerse a ellos: negro, una geométrica (Jost) y un solo rojo para la geometría.

## Capabilities and Constraints

- Escenas ligadas al scroll: todo avanza y retrocede con la posición; nada se reproduce solo.
- La página se lee entera sin JavaScript (las figuras están en el HTML en su estado final) y no fija nada con `prefers-reduced-motion`.
- Todo el texto en español de España, sin rayas.

## Brand Commitments

- Sin analítica, sin cookies y sin enviar datos del visitante a ningún sitio. CSP estricta en `app/_headers`.
- Firma: Pedro Gómez, pedrogomez.dev. Código público en `CODIGOAFRX/sphaera`.

## Evidence on Hand

- 58 láminas de dominio público del Public Domain Image Archive, con su ficha en `CREDITOS.md` y en el pie.
- Los números que se enseñan se calculan: perímetros de los polígonos, porcentaje tapado del eclipse, excentricidades reales de las órbitas.

## Product Principles

1. Empieza en un punto y acaba en un punto.
2. Cada figura se construye delante del visitante, al ritmo de su scroll.
3. La lámina es la prueba: cada idea tiene al menos una imagen real que la muestra.
4. Ningún dato sin fuente ni número inventado.

## Accessibility & Inclusion

Navegable con teclado, texto alternativo en cada lámina, figuras decorativas ocultas al lector de pantalla con su contenido en texto, contraste AA sobre el negro, alternativa con `prefers-reduced-motion` y contenido completo sin JavaScript.
