// Comprobaciones de Sphaera: que cada lámina exista con su crédito, que el build rellene todas las marcas,
// que cada imagen tenga texto alternativo y tamaño, que los enlaces internos lleven a algún sitio, que el
// texto no tenga rayas y que los módulos tengan la sintaxis bien. En Windows `node --test` se queda
// colgado: node test/sphaera.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rellenar } from '../scripts/build.mjs';
import { cielo } from '../app/cielo.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = resolve(repo, 'app');
const laminas = JSON.parse(await readFile(resolve(app, 'media/laminas.json'), 'utf8'));
const fuente = await readFile(resolve(app, 'index.html'), 'utf8');

test('cada lámina tiene sus archivos y su crédito completo', async () => {
    for (const [id, l] of Object.entries(laminas)) {
        for (const k of ['titulo', 'autor', 'fecha', 'obra', 'fuente']) assert.ok(l[k], `${id} sin ${k}`);
        assert.match(l.ficha, /^https:\/\/pdimagearchive\.org\/images\/[0-9a-f-]{36}\/$/, `${id}: ficha`);
        for (const a of l.archivos) {
            const s = await stat(resolve(app, 'media', a.archivo));
            assert.ok(s.size > 1000, `${a.archivo} vacío`);
        }
    }
});

test('la página usa todas las láminas y el build no deja marcas', () => {
    const { html, usadas } = rellenar(fuente, laminas);
    assert.deepEqual([...usadas].sort(), Object.keys(laminas).sort());
    assert.doesNotMatch(html.replaceAll('{{BASE}}', '').replace(/\{\{v:[^}]+\}\}/g, ''), /\{\{|data-l=/);
});

test('cada imagen tiene alt, ancho y alto', () => {
    const { html } = rellenar(fuente, laminas);
    for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
        assert.match(img, /\salt="[^"]+"/, img.slice(0, 80));
        assert.match(img, /\swidth="\d+"/, img.slice(0, 80));
        assert.match(img, /\sheight="\d+"/, img.slice(0, 80));
    }
});

test('los enlaces internos apuntan a un id que existe y hay un solo h1', () => {
    const ids = new Set([...fuente.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    for (const [, id] of fuente.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), `#${id}`);
    assert.equal(fuente.match(/<h1\b/g).length, 1);
});

test('el texto visible no lleva rayas ni semirrayas', () => {
    const texto = fuente.replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(texto, /[—–]/);
});

test('el cielo: sin JavaScript se ve Kepler; con g = 0 la Tierra está en el centro', () => {
    const ptolomeo = cielo(0, 0);
    assert.deepEqual(ptolomeo.tierra, [0, 0]);
    for (const o of ptolomeo.orbitas) assert.equal(o.rx, o.ry, `${o.id}: círculo`);
    const kepler = cielo(1, 1);
    assert.deepEqual(kepler.sol, [0, 0]);
    const marte = kepler.orbitas.find(o => o.id === 'marte');
    assert.ok(Math.abs(Math.hypot(marte.cx, marte.cy) / marte.rx - 0.093) < 1e-9, 'el Sol en el foco de Marte');
});

test('los módulos se cargan sin errores de sintaxis', async () => {
    for (const f of (await readdir(app)).filter(f => f.endsWith('.js'))) {
        execFileSync(process.execPath, ['--check', resolve(app, f)]);
    }
});
