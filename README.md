# memegenerator

Generador de memes rotulados: una **banda con el texto arriba** y la **foto
debajo**. Sin logo y sin plantilla fija, al contrario que
[news-maker](../news-maker), que reproduce el PSD de las noticias de Cabronazi.

El lienzo es siempre **1080 × 1350**, el 4:5 de Facebook.

## Uso

1. Escribe el **rótulo**. Lo que envuelvas en `*asteriscos*` sale en el color de
   resaltado, igual que en news-maker.
2. Elige **tipografía** y **tamaño de letra**. Manda el tamaño: **la banda se
   adapta** a lo que ocupe el texto, no hay un alto reservado de antemano.
   Arial va por defecto porque es la del formato clásico de meme y está en todos
   los equipos, así que no depende de ninguna descarga.
3. Arrastra la **foto** (o elígela con el botón, o **pégala** con Ctrl+V desde
   una captura).
4. Ajusta el **encuadre**. Como el lienzo no se mueve, lo que la banda ocupa se
   lo quita al hueco de la foto, y la foto se recorta para llenarlo. El
   deslizador hace zoom, y arrastrando sobre la vista previa la mueves.
5. Cambia los **colores** si quieres: banda, texto y resaltado, cada uno con la
   paleta de la casa además del selector libre. El rosa es el de Cabronazi, el
   mismo `#cc1c65` de news-maker.
6. **GENERA**, y abajo aparece la imagen con el botón de descarga.

Para el zoom, la **rueda del ratón** en el ordenador y el **pellizco de dos
dedos** en el móvil, igual que en news-maker. Al pellizcar, el punto medio de
los dedos arrastra a la vez, así que se coloca y se dimensiona en un solo gesto.
El encuadre está topado para que la foto no deje nunca hueco.

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
| `src/format.ts` | Las medidas, las tipografías y la paleta. Es lo único que hay que tocar para cambiar el diseño. |
| `src/render.ts` | El ajuste del texto y el dibujo sobre el lienzo. No toca el DOM. |
| `src/main.ts` | La interfaz: carga de foto, encuadre, colores y descarga. |

## Pendiente

- **La tipografía definitiva.** Ahora mismo hay cuatro para elegir y Arial va
  por defecto, pero esto es un marcador de posición: en cuanto esté decidida,
  se fija en `FONT_DEFAULT` de `src/format.ts`.
- **Medir la referencia.** Lo que hizo que news-maker saliera clavado fue medir
  el PSD en vez de estimar. Aquí los márgenes y el cuerpo son de diseño, así que
  si aparece una referencia hay que volver a medir sobre ella.
