// Sphaera: arranque. Marca la página como «con JavaScript», monta las escenas de scroll (si no se pide
// menos movimiento; con ellas, también los títulos y las láminas se mueven con el scroll) y lleva la
// cabecera: el capítulo que se lee y un círculo que se cierra a medida que se baja.

import { montarEscenas } from './escenas.js';

const raiz = document.documentElement;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
raiz.classList.add('js');
if (!quieto) montarEscenas();

// La cabecera: el capítulo que está bajo su línea da el nombre, y el arco dice cuánto queda
const cabecera = document.querySelector('.cabecera');
const donde = document.getElementById('donde');
const capitulos = [...document.querySelectorAll('[data-lugar]')];
let pendiente = false, actual = null;
function cabeceraAlDia() {
    pendiente = false;
    const total = document.documentElement.scrollHeight - innerHeight;
    cabecera.style.setProperty('--avance', (1 - Math.min(1, scrollY / Math.max(1, total))).toFixed(4));
    const y = cabecera.offsetHeight + 8;
    const c = capitulos.find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    if (c === actual) return;
    actual = c;
    donde.textContent = c ? c.dataset.lugar : '';
}
addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(cabeceraAlDia); } }, { passive: true });
cabeceraAlDia();
