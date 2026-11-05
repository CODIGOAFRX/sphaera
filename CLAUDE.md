# Sphaera (pedrogomez.dev/proyecto/sphaera)

Web estática (HTML, CSS y JavaScript sin frameworks) servida por un Worker de Cloudflare. Todo el texto de
la web y de los comentarios va en español de España, sin rayas (el test lo comprueba).

- Contexto de producto: [PRODUCT.md](PRODUCT.md). Sistema visual: [DESIGN.md](DESIGN.md). Créditos: [CREDITOS.md](CREDITOS.md).
- `pipeline/laminas.json` es la fuente de las láminas (recorte y crédito); `python pipeline/laminas.py` genera
  `app/media/*.webp` y `app/media/laminas.json`, que el build usa para rellenar cada `<img data-l="…">`.
- `scripts/figuras.mjs` dibuja las figuras SVG que el build escribe en `{{svg:nombre}}`; `app/cielo.js` es el
  modelo de las órbitas, compartido por el build y la escena.
- Vista local: `npm run dev` (http://127.0.0.1:8070/proyecto/sphaera/).
- Tests: en Windows `node --test` se queda colgado; ejecuta `node test/sphaera.test.mjs`.

| Archivo | Qué hace |
|---|---|
| `app/escenas.js` | Escenas ligadas al scroll: compás de la portada, radios, polígonos de Arquímedes, torno, esfera, cenotafio, cielo, eclipse, deriva de los planetas, ocular y cierre |
| `app/sphaera.js` | Arranque, entradas de las láminas y cabecera (capítulo y arco de avance) |

Reglas: las escenas avanzan y retroceden con el scroll (nada se reproduce solo), la página se lee sin
JavaScript y con `prefers-reduced-motion` no se fija nada. Sólo láminas reales con su crédito: nada
generado ni redibujado. Los números que se enseñan se calculan. Sin analítica ni cookies.
