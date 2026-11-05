// Se carga en el <head>, antes del primer pintado. El HTML trae la portada abierta (es lo que se ve sin
// JavaScript); si va a haber escenas, la marca «arranca» la deja cerrada desde el primer fotograma para
// que no se vea un instante abierta mientras llega el módulo de las escenas.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('arranca');
