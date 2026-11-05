// Las figuras geométricas de la página, en SVG. El build las escribe en el HTML en su estado final, que es
// lo que se ve sin JavaScript o con prefers-reduced-motion; las escenas sólo cambian sus atributos.
// Todas se dibujan en un lienzo de 1000 × 1000 con el origen en el centro.
import { cielo, RADIO } from '../app/cielo.js';

const R = 440;
const f = n => Number(n.toFixed(2));
const caja = 'viewBox="-500 -500 1000 1000"';

// Orden de aparición de los radios: al invertir los bits del índice, cada vez que se dobla su número los
// nuevos caen justo entre los que ya había, y la rueda se llena pareja (1, 2, 4, 8… 64)
const invertir = (k, bits) => [...k.toString(2).padStart(bits, '0')].reverse().join('');

const figuras = {
    // El compás de la portada: un punto, un brazo que gira y la línea que deja
    compas: () => `<svg class="compas" ${caja} aria-hidden="true" focusable="false">
                <circle class="compas__traza" r="${R}" pathLength="1" transform="rotate(-90)"/>
                <line class="compas__brazo" x1="0" y1="0" x2="0" y2="${-R}"/>
                <circle class="compas__centro" r="6"/>
            </svg>`,

    // Sesenta y cuatro radios iguales y el borde que pasa por sus puntas
    radios: () => {
        const n = 64;
        const lineas = Array.from({ length: n }, (_, k) => {
            const a = (k / n) * 2 * Math.PI - Math.PI / 2;
            const x = f(R * Math.cos(a)), y = f(R * Math.sin(a));
            return `<g class="radio" data-o="${parseInt(invertir(k, 6), 2)}"><line x1="0" y1="0" x2="${x}" y2="${y}"/><circle cx="${x}" cy="${y}" r="4"/></g>`;
        });
        return `<svg class="radios" ${caja} aria-hidden="true" focusable="false">
                <circle class="radios__borde" r="${R}" pathLength="1" transform="rotate(-90)"/>
                ${lineas.join('\n                ')}
                <circle class="radios__centro" r="7"/>
            </svg>`;
    },

    // Arquímedes: el círculo entre dos polígonos de 6, 12, 24, 48 y 96 lados
    poligonos: () => {
        const r = 400;
        const poligono = (n, radio) => Array.from({ length: n }, (_, k) => {
            const a = (k / n) * 2 * Math.PI - Math.PI / 2;
            return `${f(radio * Math.cos(a))},${f(radio * Math.sin(a))}`;
        }).join(' ');
        const grupos = [6, 12, 24, 48, 96].map(n => `<g class="poligonos__paso" data-n="${n}">
                    <polygon class="poligonos__fuera" pathLength="1" points="${poligono(n, r / Math.cos(Math.PI / n))}"/>
                    <polygon class="poligonos__dentro" pathLength="1" points="${poligono(n, r)}"/>
                </g>`);
        return `<svg class="poligonos" ${caja} aria-hidden="true" focusable="false">
                ${grupos.join('\n                ')}
                <circle class="poligonos__circulo" r="${r}"/>
            </svg>`;
    },

    // Un círculo que gira sobre su diámetro y deja meridianos; después los paralelos y el cilindro
    esfera: () => {
        const r = 380;
        const meridianos = Array.from({ length: 12 }, (_, i) => i * 15).map(g =>
            `<ellipse class="esfera__meridiano" data-g="${g}" rx="${f(Math.abs(r * Math.cos(g * Math.PI / 180)))}" ry="${r}"/>`);
        const paralelos = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75].map(l => {
            const y = f(-r * Math.sin(l * Math.PI / 180)), x = f(r * Math.cos(l * Math.PI / 180));
            return `<line class="esfera__paralelo" data-lat="${l}" x1="${-x}" y1="${y}" x2="${x}" y2="${y}"/>`;
        });
        return `<svg class="esfera" ${caja} aria-hidden="true" focusable="false">
                <rect class="esfera__cilindro" pathLength="1" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}"/>
                ${meridianos.join('\n                ')}
                ${paralelos.join('\n                ')}
                <ellipse class="esfera__giro" rx="${r}" ry="${r}"/>
                <line class="esfera__eje" x1="0" y1="${-r - 50}" x2="0" y2="${r + 50}"/>
            </svg>`;
    },

    // Ptolomeo, Copérnico y Kepler en un mismo dibujo; sin JavaScript se queda en Kepler
    cielo: () => {
        const c = cielo(1, 1);
        const orbitas = c.orbitas.map(o => `<g class="cielo__orbita" data-id="${o.id}">
                    <ellipse pathLength="1" cx="${f(o.cx)}" cy="${f(o.cy)}" rx="${f(o.rx)}" ry="${f(o.ry)}" transform="rotate(${o.giro} ${f(o.cx)} ${f(o.cy)})"/>
                    ${o.cuerpo ? `<circle class="cielo__cuerpo" cx="${f(o.cuerpo[0])}" cy="${f(o.cuerpo[1])}" r="6"/>
                    <text x="${f(o.cuerpo[0] + 12)}" y="${f(o.cuerpo[1] - 10)}">${o.nombre}</text>` : ''}
                </g>`);
        return `<svg class="cielo" viewBox="-${RADIO + 60} -${RADIO + 60} ${2 * RADIO + 120} ${2 * RADIO + 120}" role="img" aria-labelledby="cielo-titulo">
                <title id="cielo-titulo">Las órbitas de los planetas alrededor del Sol, en elipses con su excentricidad real</title>
                ${orbitas.join('\n                ')}
                <g class="cielo__sol"><circle cx="${f(c.sol[0])}" cy="${f(c.sol[1])}" r="16"/><text x="${f(c.sol[0] + 22)}" y="${f(c.sol[1] + 6)}">Sol</text></g>
                <g class="cielo__tierra"><circle cx="${f(c.tierra[0])}" cy="${f(c.tierra[1])}" r="9"/><text x="${f(c.tierra[0] + 16)}" y="${f(c.tierra[1] + 26)}">Tierra</text></g>
            </svg>`;
    },

    // Dos discos del mismo tamaño aparente: el Sol y la Luna que pasa por delante
    eclipse: () => `<svg class="eclipse__svg" viewBox="-800 -300 1600 600" aria-hidden="true" focusable="false">
                <defs>
                    <radialGradient id="halo">
                        <stop offset="0.5" stop-color="#ebe8e1" stop-opacity="0.32"/>
                        <stop offset="0.62" stop-color="#ebe8e1" stop-opacity="0.12"/>
                        <stop offset="1" stop-color="#ebe8e1" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle class="eclipse__halo" r="380" fill="url(#halo)"/>
                <circle class="eclipse__sol" r="190"/>
                <circle class="eclipse__luna" cx="0" r="196"/>
            </svg>`,

    // El anillo graduado del ocular: 120 marcas, más largas cada 5 y cada 10, y un índice rojo fijo arriba
    anillo: () => {
        const marcas = Array.from({ length: 120 }, (_, k) => {
            const a = (k / 120) * 2 * Math.PI, l = k % 10 === 0 ? 22 : k % 5 === 0 ? 14 : 7;
            const c = Math.cos(a), s = Math.sin(a);
            return `<line x1="${f(486 * c)}" y1="${f(486 * s)}" x2="${f((486 - l) * c)}" y2="${f((486 - l) * s)}"/>`;
        });
        return `<svg class="anillo" ${caja} aria-hidden="true" focusable="false">
                <g class="anillo__marcas">${marcas.join('')}</g>
                <line class="anillo__indice" x1="0" y1="-500" x2="0" y2="-458"/>
            </svg>`;
    },

    // El cierre: el círculo vuelve a ser un punto
    punto: () => `<svg class="punto" ${caja} aria-hidden="true" focusable="false">
                <circle class="punto__circulo" r="${R}"/>
                <circle class="punto__centro" r="6"/>
            </svg>`,
};

export function figura(nombre) {
    if (!figuras[nombre]) throw new Error(`Figura desconocida: ${nombre}`);
    return figuras[nombre]();
}
