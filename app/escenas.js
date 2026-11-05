// Las escenas atadas al scroll. Todo avanza y retrocede con la posición: nada se reproduce solo.
//
// Un solo bucle: en cada scroll se calcula el avance de cada escena (0 al entrar, 1 al salir) y se
// suaviza hacia ese objetivo con algo de inercia, para que el movimiento pese y la rueda del ratón no
// vaya a saltos. Las figuras ya están en el HTML en su estado final; aquí sólo se cambian atributos y
// variables CSS. Los títulos y las láminas también se mueven con el scroll: las palabras suben desde
// debajo de su línea y las láminas se destapan de abajo arriba mientras se asientan.

import { cielo as modeloCielo } from './cielo.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = x => { x = clamp(x); return x * x * (3 - 2 * x); };
// Curva de salida larga (como un cubic-bezier(0.16, 1, 0.3, 1)): arranca rápido y se posa despacio
const posa = x => 1 - (1 - clamp(x)) ** 4;
const tramo = (p, a, b) => suave((p - a) / (b - a));
const lineal = (p, a, b) => clamp((p - a) / (b - a));
const n3 = x => x.toFixed(3);
const INERCIA = 0.11;

// Avance de una parte fija: 0 cuando su borde de arriba toca el de la pantalla, 1 cuando la suelta
function avanceFijo(el, vh) {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - vh));
}

// Avance de algo que sólo pasa: 0 cuando asoma por abajo, 1 cuando se va por arriba
function avancePaso(el, vh) {
    const r = el.getBoundingClientRect();
    return clamp((vh - r.top) / (vh + r.height));
}

// Un texto que entra, se queda y se va: devuelve su opacidad para el avance p
function ventana(p, a, b, c, d) { return Math.min(tramo(p, a, b), 1 - tramo(p, c, d)); }
function mostrar(el, o, y = 0) {
    el.style.setProperty('--o', n3(o));
    el.style.setProperty('--v', o < 0.01 ? 'hidden' : 'visible');
    el.style.setProperty('--y', `${(y * (1 - o)).toFixed(1)}px`);
}

// Parte un texto en palabras envueltas en <span>, para moverlas o entintarlas una a una
function trocear(el, clase) {
    const palabras = el.textContent.trim().split(/\s+/);
    el.replaceChildren(...palabras.flatMap((w, i) => {
        const caja = document.createElement('span');
        caja.className = clase;
        const dentro = document.createElement('span');
        dentro.textContent = w;
        caja.append(dentro);
        return i ? [' ', caja] : [caja];
    }));
    return [...el.querySelectorAll(`.${clase} > span`)];
}

// Títulos: cada palabra sube desde debajo de su línea, una detrás de otra, al entrar en pantalla
function titulo(h) {
    const palabras = trocear(h, 'palabra');
    return {
        el: h, fijo: false,
        pintar(q) {
            palabras.forEach((s, i) => {
                const t = posa(lineal(q, 0.03 + i * 0.03, 0.2 + i * 0.03));
                s.style.transform = `translate3d(0, ${(108 * (1 - t)).toFixed(2)}%, 0)`;
            });
        },
    };
}

// Láminas sueltas: se destapan de abajo arriba mientras la imagen se asienta; luego llega el pie
function lamina(fig) {
    const img = fig.querySelector('img');
    const marco = document.createElement('span');
    marco.className = 'marco';
    img.before(marco);
    marco.append(img);
    const pie = fig.querySelector(':scope > figcaption');
    return {
        el: fig, fijo: false,
        pintar(q) {
            const r = posa(lineal(q, 0.02, 0.34));
            marco.style.setProperty('--tapa', `${(100 * (1 - r)).toFixed(2)}%`);
            img.style.setProperty('--zoom', (1.18 - 0.18 * posa(lineal(q, 0.02, 0.6))).toFixed(4));
            img.style.setProperty('--par', `${((0.5 - q) * 36).toFixed(1)}px`);
            if (pie) {
                const t = posa(lineal(q, 0.2, 0.4));
                pie.style.opacity = n3(t);
                pie.style.transform = `translate3d(0, ${(10 * (1 - t)).toFixed(1)}px, 0)`;
            }
        },
    };
}

// Bloques de texto sueltos: suben y aparecen con el scroll
function bloque(el) {
    return {
        el, fijo: false,
        pintar(q) {
            const t = posa(lineal(q, 0.04, 0.3));
            el.style.opacity = n3(t);
            el.style.transform = `translate3d(0, ${(40 * (1 - t)).toFixed(1)}px, 0)`;
        },
    };
}

// Al soltarse una escena fija, lo que se queda arriba se apaga un poco: la escena se cierra
function salida(fijo) {
    const escenario = fijo.firstElementChild;
    return {
        el: fijo, fijo: true,
        pintar(p) {
            const t = tramo(p, 0.9, 1);
            escenario.style.opacity = n3(1 - 0.65 * t);
            escenario.style.transform = `scale(${(1 - 0.03 * t).toFixed(4)})`;
        },
    };
}

// La portada: aparece el brazo del compás, da la vuelta dejando el círculo y dentro se abre la luz
function portada(seccion) {
    const disco = seccion.querySelector('.portada__disco');
    const lamina = seccion.querySelector('.portada__lamina');
    const texto = seccion.querySelector('.portada__texto');
    return {
        el: seccion, fijo: true,
        pintar(p) {
            const vuelta = tramo(p, 0.05, 0.5);
            disco.style.setProperty('--giro', `${(360 * vuelta).toFixed(2)}deg`);
            disco.style.setProperty('--traza', n3(1 - vuelta));
            disco.style.setProperty('--brazo', n3(tramo(p, 0, 0.05) * (1 - tramo(p, 0.5, 0.58))));
            const abre = posa(lineal(p, 0.54, 0.9));
            disco.style.setProperty('--abre', `${(50 * abre).toFixed(2)}%`);
            disco.style.setProperty('--pz', (1.25 - 0.25 * abre).toFixed(4));
            disco.style.setProperty('--pg', `${(-40 * (1 - abre)).toFixed(2)}deg`);
            lamina.style.setProperty('--pie', n3(tramo(p, 0.84, 0.94)));
            texto.style.transform = `translate3d(0, ${(-3 * p).toFixed(2)}svh, 0)`;
        },
    };
}

// Un centro y una distancia: la cita se entinta palabra a palabra, los radios se doblan (1, 2, 4… 64)
// mientras la rueda gira despacio, y luego el borde pasa por sus puntas
function radiacion(fijo) {
    const radios = [...fijo.querySelectorAll('.radio')].map(g => ({ g, o: Number(g.dataset.o) }));
    const svg = fijo.querySelector('.radios');
    const cuenta = fijo.querySelector('#cuenta-radios');
    const palabras = trocear(fijo.querySelector('.cita p'), 'tinta');
    return {
        el: fijo, fijo: true,
        pintar(p) {
            const k = 6 * tramo(p, 0.04, 0.7);
            const n = 2 ** Math.floor(k), sig = Math.min(64, n * 2), f = k - Math.floor(k);
            for (const { g, o } of radios) g.style.opacity = o < n ? 1 : o < sig ? n3(suave(f)) : 0;
            svg.style.setProperty('--borde', n3(1 - tramo(p, 0.72, 0.94)));
            svg.style.setProperty('--rueda', `${(40 * posa(lineal(p, 0, 0.94))).toFixed(2)}deg`);
            cuenta.textContent = k >= 6 ? 64 : n;
            palabras.forEach((s, i) => {
                const a = 0.02 + 0.5 * i / palabras.length;
                s.style.opacity = n3(0.22 + 0.78 * tramo(p, a, a + 0.08));
            });
        },
    };
}

// Arquímedes: los polígonos de 6, 12, 24, 48 y 96 lados se dibujan uno tras otro; los ya pasados se
// quedan tenues y se ve cómo se van pegando al círculo
function arquimedes(fijo) {
    const pasos = [...fijo.querySelectorAll('.poligonos__paso')];
    const filas = [...fijo.querySelectorAll('.cerco tbody tr')];
    let ahora = -1;
    return {
        el: fijo, fijo: true,
        pintar(p) {
            const f = 5 * lineal(p, 0.04, 0.9);
            pasos.forEach((g, j) => {
                const d = f - (j + 0.5);
                let o = j === pasos.length - 1 && d > 0 ? 1 : clamp(1 - (Math.abs(d) - 0.3) / 0.25);
                if (d > 0.5) o = Math.max(o, 0.16);
                g.style.setProperty('--o', n3(o));
                g.style.setProperty('--d', n3(posa(clamp((f - j) / 0.55))));
            });
            const i = Math.min(pasos.length - 1, Math.floor(f));
            if (i !== ahora) { filas.forEach((tr, j) => tr.classList.toggle('es-ahora', j === i)); ahora = i; }
        },
    };
}

// El torno: la pista cruza la pantalla como bajo una lente: la muestra del centro crece y se enciende,
// las de los lados se apagan; cada una gira, unas a un lado y otras al otro
function torno(seccion) {
    const pista = seccion.querySelector('.torno__pista');
    const piezas = [...pista.querySelectorAll('li')];
    let desde = 0, hasta = 0;
    return {
        el: seccion, fijo: true,
        medir() {
            const margen = parseFloat(getComputedStyle(pista).paddingLeft) || 0;
            desde = innerWidth * 0.5 - margen;
            hasta = -(pista.scrollWidth - innerWidth * 0.5);
        },
        pintar(p) {
            const t = lineal(p, 0.02, 0.98);
            pista.style.setProperty('--x', `${(desde + (hasta - desde) * t).toFixed(1)}px`);
            const medio = innerWidth / 2;
            piezas.forEach((li, i) => {
                li.style.setProperty('--g', `${((i % 2 ? -1 : 1) * 300 * t + i * 23).toFixed(2)}deg`);
                const r = li.getBoundingClientRect();
                const d = suave(Math.abs(r.left + r.width / 2 - medio) / (innerWidth * 0.55));
                li.style.setProperty('--s', (1 - 0.3 * d).toFixed(4));
                li.style.setProperty('--l', n3(1 - 0.62 * d));
            });
        },
    };
}

// La esfera: el círculo gira sobre su eje dejando meridianos, luego paralelos y al final el cilindro
function esfera(fijo) {
    const R = 380;
    const giro = fijo.querySelector('.esfera__giro');
    const svg = fijo.querySelector('.esfera');
    const meridianos = [...fijo.querySelectorAll('.esfera__meridiano')].map(el => ({ el, g: Number(el.dataset.g) }));
    const paralelos = [...fijo.querySelectorAll('.esfera__paralelo')].map(el => ({ el, l: Number(el.dataset.lat) }));
    const [uno, dos] = fijo.querySelectorAll('.paso');
    return {
        el: fijo, fijo: true,
        pintar(p) {
            const th = 180 * tramo(p, 0.04, 0.5);
            giro.setAttribute('rx', Math.abs(R * Math.cos(th * Math.PI / 180)).toFixed(2));
            svg.style.setProperty('--giro-o', n3(1 - tramo(p, 0.5, 0.58)));
            for (const { el, g } of meridianos) el.style.setProperty('--o', n3(0.5 * clamp((th - g) / 8 + (g === 0 ? 1 : 0))));
            for (const { el, l } of paralelos) {
                const a = 0.5 + Math.abs(l) / 300;
                el.style.setProperty('--o', n3(0.5 * tramo(p, a, a + 0.06)));
            }
            svg.style.setProperty('--cil', n3(posa(lineal(p, 0.7, 0.86))));
            svg.style.setProperty('--vuelta', `${(-8 + 8 * posa(lineal(p, 0, 0.6))).toFixed(2)}deg`);
            mostrar(uno, 1 - tramo(p, 0.62, 0.7), -24);
            mostrar(dos, tramo(p, 0.74, 0.84), 24);
        },
    };
}

// El cenotafio: de día, dentro es de noche; al bajar se hace de noche, se enciende el sol de dentro
// y la cámara se acerca despacio al centro de la esfera
function cenotafio(seccion) {
    return {
        el: seccion, fijo: true,
        pintar(p) {
            seccion.style.setProperty('--noche', n3(tramo(p, 0.36, 0.7)));
            seccion.style.setProperty('--kb', (1 + 0.08 * posa(lineal(p, 0, 1))).toFixed(4));
        },
    };
}

// El cielo: las órbitas se dibujan, Ptolomeo, la Tierra al Sol con Copérnico y los círculos que
// Kepler vuelve elipses
function cielo(fijo) {
    const svg = fijo.querySelector('.cielo');
    const grupos = [...svg.querySelectorAll('.cielo__orbita')];
    const orbitas = new Map(grupos.map(g => [g.dataset.id, {
        g, elipse: g.querySelector('ellipse'), cuerpo: g.querySelector('circle'), texto: g.querySelector('text'),
    }]));
    const sol = svg.querySelector('.cielo__sol'), tierra = svg.querySelector('.cielo__tierra');
    const pasos = [...fijo.querySelectorAll('.paso')];
    const pon = (el, attrs) => { for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, typeof v === 'number' ? v.toFixed(2) : v); };
    const marca = (g, [x, y], dx, dy) => { pon(g.querySelector('circle'), { cx: x, cy: y }); pon(g.querySelector('text'), { x: x + dx, y: y + dy }); };
    return {
        el: fijo, fijo: true,
        pintar(p) {
            const c = modeloCielo(tramo(p, 0.3, 0.56), tramo(p, 0.68, 0.88));
            c.orbitas.forEach((o, i) => {
                const el = orbitas.get(o.id);
                pon(el.elipse, { cx: o.cx, cy: o.cy, rx: o.rx, ry: o.ry, transform: `rotate(${o.giro} ${o.cx.toFixed(2)} ${o.cy.toFixed(2)})` });
                el.g.style.setProperty('--d', n3(posa(lineal(p, 0.01 + i * 0.025, 0.13 + i * 0.025))));
                if (o.cuerpo && el.cuerpo) {
                    pon(el.cuerpo, { cx: o.cuerpo[0], cy: o.cuerpo[1] });
                    pon(el.texto, { x: o.cuerpo[0] + 12, y: o.cuerpo[1] - 10 });
                }
            });
            marca(sol, c.sol, 22, 6);
            marca(tierra, c.tierra, 16, 26);
            mostrar(pasos[0], 1 - tramo(p, 0.22, 0.3), -24);
            mostrar(pasos[1], ventana(p, 0.32, 0.4, 0.6, 0.66), 24);
            mostrar(pasos[2], tramo(p, 0.68, 0.76), 24);
        },
    };
}

// El eclipse: la Luna cruza el Sol, el halo se apaga a medida que lo tapa, se para un rato justo
// encima y en ese rato aparece la corona
function eclipse(seccion) {
    const luna = seccion.querySelector('.eclipse__luna');
    const cuenta = seccion.querySelector('#tapado');
    const r1 = 190, r2 = 196;
    // Parte del disco del Sol que tapa la Luna, a distancia d entre centros (área de la lente)
    const tapado = d => {
        if (d >= r1 + r2) return 0;
        if (d <= r2 - r1) return 1;
        const a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
        const b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
        const c = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
        return (a + b - c) / (Math.PI * r1 * r1);
    };
    return {
        el: seccion, fijo: true,
        pintar(p) {
            const u = p < 0.42 ? 0.5 * suave(p / 0.42) : p > 0.58 ? 0.5 + 0.5 * suave((p - 0.58) / 0.42) : 0.5;
            const x = -760 + 1520 * u;
            luna.setAttribute('cx', x.toFixed(1));
            const t = tapado(Math.abs(x));
            cuenta.textContent = Math.floor(t * 100);
            const corona = clamp((t - 0.985) / 0.015);
            seccion.style.setProperty('--corona', n3(corona));
            seccion.style.setProperty('--halo', n3(1 - t));
            seccion.style.setProperty('--cz', (1.06 - 0.06 * posa(corona)).toFixed(4));
        },
    };
}

// Lo grande es redondo: los planetas aparecen y derivan a velocidades distintas, como a distintas distancias
function planeta(figura, fuerza) {
    const img = figura.querySelector('img');
    const pie = figura.querySelector('figcaption');
    return {
        el: figura, fijo: false,
        pintar(q) {
            const t = posa(lineal(q, 0.02, 0.4));
            img.style.setProperty('--deriva', `${((0.5 - q) * fuerza).toFixed(1)}px`);
            img.style.setProperty('--ps', (0.86 + 0.14 * t).toFixed(4));
            img.style.opacity = n3(t);
            pie.style.opacity = n3(posa(lineal(q, 0.22, 0.42)));
        },
    };
}

// El ocular: ocho muestras se suceden en el mismo círculo; el anillo graduado gira como si se enfocara
function ocular(fijo) {
    const items = [...fijo.querySelectorAll('.ocular__muestras li')];
    const anillo = fijo.querySelector('.anillo__marcas');
    const N = items.length;
    return {
        el: fijo, fijo: true,
        pintar(p) {
            const f = N * lineal(p, 0.02, 0.96);
            items.forEach((li, j) => {
                const d = f - (j + 0.5);
                let o = clamp(1 - (Math.abs(d) - 0.3) / 0.2);
                if ((j === 0 && d < 0) || (j === N - 1 && d > 0)) o = 1;
                mostrar(li, o);
                li.style.setProperty('--z', (1.08 - 0.08 * posa(clamp(d + 0.5))).toFixed(4));
                li.style.setProperty('--r', `${(-12 * d).toFixed(2)}deg`);
                li.style.setProperty('--desenfoque', `${(6 * (1 - o)).toFixed(2)}px`);
            });
            anillo.style.transform = `rotate(${(-45 * f).toFixed(2)}deg)`;
        },
    };
}

// El final: el círculo se cierra hasta ser un punto, el punto se apaga y queda la nada de Fludd
function final(seccion) {
    const svg = seccion.querySelector('.punto');
    return {
        el: seccion, fijo: true,
        pintar(p) {
            svg.style.setProperty('--s', Math.max(0.0001, 1 - posa(lineal(p, 0.04, 0.5))).toFixed(4));
            svg.style.setProperty('--p', n3(1 - tramo(p, 0.56, 0.68)));
            seccion.style.setProperty('--nada', n3(tramo(p, 0.7, 0.88)));
            seccion.style.setProperty('--nz', (1.08 - 0.08 * posa(lineal(p, 0.7, 1))).toFixed(4));
        },
    };
}

export function montarEscenas() {
    const q = s => document.querySelector(s);
    const qq = s => [...document.querySelectorAll(s)];
    const escenas = [];
    const poner = (el, fn, ...args) => { if (el) escenas.push(fn(el, ...args)); };

    poner(q('.portada'), portada);
    poner(q('.fijo--radiacion'), radiacion);
    poner(q('.fijo--arquimedes'), arquimedes);
    poner(q('.torno'), torno);
    poner(q('.fijo--esfera-cap'), esfera);
    poner(q('.cenotafio'), cenotafio);
    poner(q('.fijo--cielo-cap'), cielo);
    poner(q('.eclipse'), eclipse);
    poner(q('.grande__planeta--saturno'), planeta, 90);
    poner(q('.grande__planeta--jupiter'), planeta, 50);
    poner(q('.grande__planeta--marte'), planeta, 140);
    poner(q('.fijo--ocular'), ocular);
    poner(q('.final'), final);
    qq('.fijo').forEach(f => poner(f, salida));
    qq('.titulo, .subtitulo').forEach(h => poner(h, titulo));
    qq('figure[data-entra]').forEach(f => poner(f, lamina));
    qq('[data-entra]:not(figure)').forEach(el => poner(el, bloque));
    document.documentElement.classList.add('escenas');

    let vh = innerHeight, anchoPrevio = innerWidth, pendiente = false;
    const estado = new Map(escenas.map(e => [e, { cur: -1, obj: 0 }]));

    function medir() {
        vh = innerHeight;
        for (const e of escenas) if (e.medir) e.medir();
    }

    function cuadro() {
        pendiente = false;
        let sigue = false;
        for (const e of escenas) {
            const s = estado.get(e);
            s.obj = e.fijo ? avanceFijo(e.el, vh) : avancePaso(e.el, vh);
            const antes = s.cur;
            s.cur = s.cur < 0 ? s.obj : s.cur + (s.obj - s.cur) * INERCIA;
            if (Math.abs(s.obj - s.cur) < 0.0004) s.cur = s.obj; else sigue = true;
            if (s.cur !== antes) e.pintar(s.cur);
        }
        if (sigue) pedir();
    }

    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } }

    addEventListener('scroll', pedir, { passive: true });
    addEventListener('resize', () => {
        // En el móvil la barra del navegador cambia el alto al hacer scroll: sólo se recalcula si cambia el ancho
        if (innerWidth === anchoPrevio && Math.abs(innerHeight - vh) < 160) return;
        anchoPrevio = innerWidth;
        for (const s of estado.values()) s.cur = -1;
        medir(); pedir();
    });
    document.fonts?.ready.then(() => { medir(); pedir(); });
    addEventListener('load', () => { medir(); pedir(); });
    medir(); pedir();
}
