// El modelo del cielo de la escena «Esferas dentro de esferas». Lo usan el build (para dibujar el estado
// final en SVG, que es lo que se ve sin JavaScript) y la escena (para moverlo con el scroll).
//
// Dos avances: g (0 Ptolomeo, 1 Copérnico) recentra las órbitas de la Tierra al Sol; k (0 círculos,
// 1 Kepler) las convierte en elipses con su excentricidad real y el Sol en uno de los focos.
// Las distancias van comprimidas (raíz cuadrada del semieje en unidades astronómicas) para que Mercurio
// y Saturno quepan en el mismo dibujo; las excentricidades no se exageran.

export const RADIO = 440;
const escala = a => RADIO * Math.sqrt(a / 9.537);
const rad = g => g * Math.PI / 180;

// Dirección Tierra-Sol del dibujo: el Sol visto desde la Tierra está justo enfrente de la Tierra vista desde el Sol
const ANG_SOL = 20;
export const TIERRA_H = [escala(1) * Math.cos(rad(ANG_SOL + 180)), escala(1) * Math.sin(rad(ANG_SOL + 180))];
export const SOL_G = [250 * Math.cos(rad(ANG_SOL)), 250 * Math.sin(rad(ANG_SOL))];

// geo: radio en el orden de Ptolomeo; a: semieje mayor (UA); e: excentricidad; w: ángulo del perihelio
// en el dibujo; ang: dónde está el planeta en su órbita
export const ORBITAS = [
    { id: 'luna', nombre: 'Luna', geo: 70, luna: 30, e: 0.055, w: 40, ang: 300 },
    { id: 'mercurio', nombre: 'Mercurio', geo: 130, a: 0.387, e: 0.206, w: 77, ang: 130 },
    { id: 'venus', nombre: 'Venus', geo: 190, a: 0.723, e: 0.007, w: 131, ang: 60 },
    { id: 'sol', nombre: 'Sol', geo: 250, a: 1, e: 0.017, w: 103, ang: ANG_SOL, cambia: true },
    { id: 'marte', nombre: 'Marte', geo: 310, a: 1.524, e: 0.093, w: 336, ang: 250 },
    { id: 'jupiter', nombre: 'Júpiter', geo: 370, a: 5.203, e: 0.049, w: 14, ang: 95 },
    { id: 'saturno', nombre: 'Saturno', geo: 430, a: 9.537, e: 0.057, w: 92, ang: 205 },
];

const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

// Devuelve, para g y k dados, la elipse de cada órbita, dónde está su cuerpo y dónde están la Tierra y el Sol
export function cielo(g, k) {
    const tierra = lerp2([0, 0], TIERRA_H, g);
    const sol = lerp2(SOL_G, [0, 0], g);
    const orbitas = ORBITAS.map(o => {
        const e = o.e * k;
        let centro, r;
        if (o.luna) {
            centro = tierra;
            r = lerp(o.geo, o.luna, g);
        } else {
            // Cada órbita pasa de estar centrada en la Tierra a estarlo en el Sol
            centro = lerp2(tierra, sol, g);
            r = lerp(o.geo, escala(o.a), g);
        }
        // Elipse de Kepler: semieje r, el foco donde estaba el centro (el Sol) y el centro desplazado e·r
        const b = r * Math.sqrt(1 - e * e);
        const cx = centro[0] - e * r * Math.cos(rad(o.w));
        const cy = centro[1] - e * r * Math.sin(rad(o.w));
        // Posición del cuerpo en la elipse (ángulo excéntrico, que basta para el dibujo)
        const u = rad(o.ang - o.w);
        const px = cx + r * Math.cos(u) * Math.cos(rad(o.w)) - b * Math.sin(u) * Math.sin(rad(o.w));
        const py = cy + r * Math.cos(u) * Math.sin(rad(o.w)) + b * Math.sin(u) * Math.cos(rad(o.w));
        return { id: o.id, nombre: o.nombre, cx, cy, rx: r, ry: b, giro: o.w, cuerpo: o.cambia ? null : [px, py] };
    });
    return { tierra, sol, orbitas };
}
