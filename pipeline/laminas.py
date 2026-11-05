"""Prepara las láminas de la web desde el Public Domain Image Archive.

Si una lámina lleva «commons», el original se baja de Wikimedia Commons, que tiene el mismo escaneo a más
resolución; la ficha y el crédito siguen siendo los del archivo.

Descarga cada original (una vez, a pipeline/.originales/), lo recorta según pipeline/laminas.json y lo
guarda en WebP en app/media/<archivo>-<ancho>.webp. Deja en app/media/laminas.json el tamaño de cada
archivo y el crédito completo, que el build y las comprobaciones leen. No redibuja nada: sólo recorta,
escala y comprime.

Uso: python pipeline/laminas.py
"""
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parent.parent
ORIGINALES = RAIZ / 'pipeline' / '.originales'
MEDIA = RAIZ / 'app' / 'media'
FICHA = 'https://pdimagearchive.org/images/{}/'
UA = {'User-Agent': 'Mozilla/5.0 (sphaera; https://www.pedrogomez.dev/proyecto/sphaera/)'}


def catalogo(uuid):
    """Lee la ficha del archivo y devuelve la ruta de la imagen y su ancho original."""
    s = urllib.request.urlopen(urllib.request.Request(FICHA.format(uuid), headers=UA), timeout=60).read().decode('utf8')
    src = re.search(r'&quot;src&quot;:\[0,&quot;([^&]+)&quot;\]', s).group(1)
    ancho = int(re.search(r'&quot;width&quot;:\[0,(\d+)\]', s).group(1))
    return html.unescape(src), ancho


def commons(archivo, ancho=3000):
    """URL de la imagen de Wikimedia Commons a ese ancho: para las láminas que el archivo sólo da pequeñas."""
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'titles': archivo, 'prop': 'imageinfo', 'iiprop': 'url', 'iiurlwidth': ancho, 'format': 'json'})
    respuesta = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
    ii = next(iter(respuesta['query']['pages'].values()))['imageinfo'][0]
    return ii.get('thumburl') or ii['url']


def original(lam):
    ORIGINALES.mkdir(parents=True, exist_ok=True)
    if 'commons' in lam:
        dest = ORIGINALES / f"{lam['archivo']}-commons.jpg"
        if not dest.exists():
            dest.write_bytes(urllib.request.urlopen(urllib.request.Request(commons(lam['commons']), headers=UA), timeout=180).read())
        return dest
    dest = ORIGINALES / f"{lam['uuid'][:8]}.jpg"
    if dest.exists():
        return dest
    src, ancho = catalogo(lam['uuid'])
    base = 'https://images.pdimagearchive.org' + urllib.parse.quote(src)
    for url in (f'{base}?width={min(ancho, 3200)}', base):
        try:
            dest.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read())
            return dest
        except OSError:
            continue
    raise SystemExit(f"No se pudo descargar {lam['uuid']}")


def recortar(im, lam):
    w, h = im.size
    if 'recorte' in lam:
        x0, y0, x1, y1 = lam['recorte']
        return im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
    if 'cuadrado' in lam:
        cx, cy, k = lam['cuadrado']
        lado = round(min(w, h) * k)
        x = min(max(round(cx * w - lado / 2), 0), w - lado)
        y = min(max(round(cy * h - lado / 2), 0), h - lado)
        return im.crop((x, y, x + lado, y + lado))
    return im


def main():
    datos = json.loads((RAIZ / 'pipeline' / 'laminas.json').read_text(encoding='utf8'))
    MEDIA.mkdir(parents=True, exist_ok=True)
    salida = {}
    for lam in datos['laminas']:
        im = recortar(Image.open(original(lam)).convert('RGB'), lam)
        archivos = []
        for ancho in lam['anchos']:
            ancho = min(ancho, im.width)
            alto = round(im.height * ancho / im.width)
            nombre = f"{lam['archivo']}-{ancho}.webp"
            im.resize((ancho, alto), Image.LANCZOS).save(MEDIA / nombre, 'WEBP', quality=80, method=6)
            if not any(a['ancho'] == ancho for a in archivos):
                archivos.append({'archivo': nombre, 'ancho': ancho, 'alto': alto})
        credito = {k: lam[k] for k in ('titulo', 'autor', 'fecha', 'obra', 'fuente')}
        salida[lam['archivo']] = {**credito, 'ficha': FICHA.format(lam['uuid']), 'archivos': archivos}
        print(lam['archivo'], ' '.join(f"{a['ancho']}x{a['alto']}" for a in archivos))
    (MEDIA / 'laminas.json').write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding='utf8')
    # Fuera los WebP de recortes o anchos que ya no se usan
    vivos = {a['archivo'] for l in salida.values() for a in l['archivos']}
    for f in MEDIA.glob('*.webp'):
        if f.name not in vivos:
            f.unlink()


if __name__ == '__main__':
    main()
