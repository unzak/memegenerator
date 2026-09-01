# memegenerator

Generador de memes rotulados: una **banda con el texto arriba** y la **foto
debajo**. Sin logo y sin plantilla fija, al contrario que
[news-maker](../news-maker), que reproduce el PSD de las noticias de Cabronazi.

El lienzo es siempre **1080 × 1350**, el 4:5 de Facebook.

## Uso

1. Escribe el **rótulo**. Lo que envuelvas en `*asteriscos*` sale en el color de
   resaltado, igual que en news-maker.

   La **alineación** puede ser centrada o a la izquierda. A la izquierda el
   bloque sigue centrado en el lienzo y son las líneas las que se alinean entre
   sí, tomando como referencia la más larga: nunca se pega al margen salvo que
   esa línea ocupe todo el ancho de composición.
2. Ajusta el **tamaño de letra**. Manda el tamaño: **la banda se adapta** a lo
   que ocupe el texto, no hay un alto reservado de antemano.

   La tipografía es siempre **SF Pro Display Medium**, que sirve el propio repo,
   así que sale igual en cualquier equipo sin depender de lo que tenga
   instalado. No es una negrita — Medium es peso 500 —, así que el rótulo se ve
   ligero a propósito.

   **Helvetica solo sale como Helvetica donde esté instalada**, que en la
   práctica es Mac. Windows la sustituye por Arial a nivel de sistema, y como
   las dos son métricamente idénticas a propósito, el resultado es exactamente
   el mismo que «Arial Bold» y no hay forma de detectarlo desde el navegador.
3. Arrastra la **foto**, elígela con el botón, o pégala con **Ctrl+V** en
   cualquier parte de la página. El atajo sigue funcionando aunque no se
   anuncie en el panel.
4. Ajusta el **encuadre**. Como el lienzo no se mueve, lo que la banda ocupa se
   lo quita al hueco de la foto, y la foto se recorta para llenarlo. El
   deslizador hace zoom, y arrastrando sobre la vista previa la mueves.
5. Cambia los **colores** si quieres: banda, texto y resaltado, cada uno con un
   desplegable de la paleta de la casa. El rosa es el de Cabronazi y el verde el
   de Cabrodeportes, los mismos `#cc1c65` y `#00ce5c` de news-maker.
6. **GENERA**, y abajo aparece la imagen con el botón de descarga.

La **rueda del ratón** y el **pellizco de dos dedos** actúan sobre lo que haya
debajo, como en news-maker: encima de la foto hacen zoom de la foto, y encima
del rótulo cambian el tamaño de la letra. Al pellizcar la foto, el punto medio
de los dedos arrastra a la vez, así que se coloca y se dimensiona en un solo
gesto. Arrastrar solo mueve la foto: el rótulo va siempre centrado en su banda.
El encuadre está topado para que la foto no deje nunca hueco, y se recorta en
cada dibujo, así que tampoco escribir puede descolocarla.

Si no escribes nada, no hay banda y sale la foto sola. Si dejas una línea en
blanco entre dos párrafos, la banda la respeta.

## Requisitos

- Node.js >= 20

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Publicar

```bash
npm run build
```

La build sale en `dist/` con rutas relativas, así que funciona tanto en GitHub
Pages como abriendo el HTML directamente. El workflow de `.github/workflows`
despliega a Pages en cada push a `main`.

## Estructura

| Archivo | Qué hay dentro |
| --- | --- |
| `src/assets/` | La SF Pro, reducida a Latin y en woff2 (54 KB). |
| `src/format.ts` | Las medidas, la tipografía y la paleta. Es lo único que hay que tocar para cambiar el diseño. |
| `src/render.ts` | El ajuste del texto y el dibujo sobre el lienzo. No toca el DOM. |
| `src/main.ts` | La interfaz: carga de foto, encuadre, colores y descarga. |

## Pendiente

- **Medir la referencia.** Lo que hizo que news-maker saliera clavado fue medir
  el PSD en vez de estimar. Aquí los márgenes y el cuerpo son de diseño, así que
  si aparece una referencia hay que volver a medir sobre ella.
