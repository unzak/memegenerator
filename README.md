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
2. Elige **tipografía** y **tamaño de letra**. Manda el tamaño: **la banda se
   adapta** a lo que ocupe el texto, no hay un alto reservado de antemano.

   Hay seis: Helvetica Bold, Arial Bold, Arial Black, Inter Bold, SF Pro Medium
   e Impact. Inter viene de Google Fonts y SF Pro la sirve el propio repo; las
   otras cuatro son del sistema y dependen de lo que tenga instalado cada
   equipo. **Inter Bold va por defecto**, precisamente porque al descargarse
   sale igual en todas partes.

   SF Pro es la única que no es negrita — Medium (500) —, así que el rótulo se
   ve bastante más ligero con ella.

   **Helvetica solo sale como Helvetica donde esté instalada**, que en la
   práctica es Mac. Windows la sustituye por Arial a nivel de sistema, y como
   las dos son métricamente idénticas a propósito, el resultado es exactamente
   el mismo que «Arial Bold» y no hay forma de detectarlo desde el navegador.
3. Arrastra la **foto**, elígela con el botón, o **pégala**: con **Ctrl+V** en
   cualquier parte de la página, o con el botón «Pegar del portapapeles». Los
   dos caminos no son iguales: Ctrl+V recibe la imagen con el propio evento y
   funciona siempre, mientras que el botón lee el portapapeles por su cuenta y
   necesita permiso del navegador y un origen seguro. Si no lo consigue, lo
   dice y te remite a Ctrl+V.
4. Ajusta el **encuadre**. Como el lienzo no se mueve, lo que la banda ocupa se
   lo quita al hueco de la foto, y la foto se recorta para llenarlo. El
   deslizador hace zoom, y arrastrando sobre la vista previa la mueves.
5. Cambia los **colores** si quieres: banda, texto y resaltado, cada uno con la
   paleta de la casa además del selector libre. El rosa es el de Cabronazi, el
   mismo `#cc1c65` de news-maker.
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
| `src/format.ts` | Las medidas, las tipografías y la paleta. Es lo único que hay que tocar para cambiar el diseño. |
| `src/render.ts` | El ajuste del texto y el dibujo sobre el lienzo. No toca el DOM. |
| `src/main.ts` | La interfaz: carga de foto, encuadre, colores y descarga. |

## Pendiente

- **Medir la referencia.** Lo que hizo que news-maker saliera clavado fue medir
  el PSD en vez de estimar. Aquí los márgenes y el cuerpo son de diseño, así que
  si aparece una referencia hay que volver a medir sobre ella.
