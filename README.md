# jorgeress.github.io

Mi web: [jorgeress.github.io](https://jorgeress.github.io).

HTML, CSS y JavaScript sin frameworks ni paso de compilación: GitHub Pages
sirve la rama `main` tal cual.

- `index.html`, `css/`, `js/`: la página. Los proyectos están en un único
  array al principio de `js/main.js`, del que tiran las tarjetas y la terminal.
- `img/proyectos/`: una imagen 1280x640 por proyecto. Es la misma que uso
  como social preview de cada repo y como banner en mi README de perfil.
- `tools/previews.py`: genera esas imágenes (necesita `rsvg-convert` y
  Pillow). `tools/cabecera.py` genera la cabecera animada del perfil.

Para verla en local: `python3 -m http.server` y abrir `localhost:8000`.
Pulsa `º` o `` ` `` para abrir la terminal.
