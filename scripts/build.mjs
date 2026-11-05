// Genera dist/proyecto/sphaera (servido en pedrogomez.dev/proyecto/sphaera) desde app/: rellena cada
// <img data-l="…"> con su src, srcset y tamaño a partir de app/media/laminas.json, escribe las figuras
// geométricas ({{svg:nombre}}) y la lista de créditos del pie, versiona CSS y JS con un hash de su
// contenido y deja _headers en la raíz de dist, donde lo lee el Worker de archivos estáticos.
import { cp, readFile, rm, writeFile, rename, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { figura } from './figuras.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = '/proyecto/sphaera';
const dist = resolve(repo, 'dist');
const out = resolve(dist, base.slice(1));

const escapar = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

export function rellenar(html, laminas) {
    const usadas = new Set();
    html = html.replace(/<img([^>]*?) data-l="([^"]+)"/g, (_, antes, id) => {
        const l = laminas[id];
        if (!l) throw new Error(`Lámina desconocida: ${id}`);
        usadas.add(id);
        const a = l.archivos;
        const src = a.find(f => f.ancho >= 900) || a.at(-1);
        const mayor = a.at(-1);
        const srcset = a.map(f => `{{BASE}}/media/${f.archivo} ${f.ancho}w`).join(', ');
        return `<img${antes} src="{{BASE}}/media/${src.archivo}" srcset="${srcset}" width="${mayor.ancho}" height="${mayor.alto}" decoding="async"`;
    });
    html = html.replace(/\{\{svg:([a-z]+)\}\}/g, (_, nombre) => figura(nombre));
    // Un crédito por lámina distinta (las diez muestras de torno comparten ficha de autor, no de imagen)
    const creditos = Object.entries(laminas).filter(([id]) => usadas.has(id)).map(([, l]) =>
        `                    <li><a href="${l.ficha}" rel="noopener">${escapar(l.titulo)}</a>. ${escapar(l.autor)}, ${escapar(l.fecha)}. <i>${escapar(l.obra)}</i>. ${escapar(l.fuente)}.</li>`);
    html = html.replace('{{creditos}}', creditos.join('\n')).replaceAll('{{n}}', String(creditos.length));
    return { html, usadas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await rm(dist, { recursive: true, force: true });
    await cp(resolve(repo, 'app'), out, { recursive: true });
    await rename(resolve(out, '_headers'), resolve(dist, '_headers'));
    await rm(resolve(out, 'media/laminas.json'));

    const laminas = JSON.parse(await readFile(resolve(repo, 'app/media/laminas.json'), 'utf8'));
    const hash = async file => createHash('sha256').update(await readFile(resolve(out, file))).digest('hex').slice(0, 10);

    let { html, usadas } = rellenar(await readFile(resolve(out, 'index.html'), 'utf8'), laminas);
    for (const [, file] of html.matchAll(/\{\{v:([^}]+)\}\}/g)) html = html.replace(`{{v:${file}}}`, await hash(file));
    html = html.replaceAll('{{BASE}}', base);
    if (/\{\{/.test(html)) throw new Error('Queda una marca sin rellenar en index.html');
    await writeFile(resolve(out, 'index.html'), html);

    // Los módulos se importan entre sí sin versión: se les pone la del archivo importado
    for (const f of (await readdir(out)).filter(f => f.endsWith('.js'))) {
        let js = await readFile(resolve(out, f), 'utf8');
        for (const [m, dep] of js.matchAll(/from '\.\/([^']+\.js)'/g)) js = js.replace(m, `from './${dep}?v=${await hash(dep)}'`);
        await writeFile(resolve(out, f), js);
    }
    console.log(`Generado ${out} (${usadas.size} láminas)`);
}
