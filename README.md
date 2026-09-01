# memegenerator

Generador de memes rotulados: una **banda con el texto arriba** y la **foto
debajo**. Sin logo y sin plantilla fija, al contrario que
[news-maker](../news-maker), que reproduce el PSD de las noticias de Cabronazi.

El ancho siempre es **1080**, que es lo que pide Facebook.

## Uso

1. Escribe el **rótulo**. La banda crece sola con las líneas que ocupe: no hay
   un alto reservado de antemano. Lo que envuelvas en `*asteriscos*` sale en el
   color de resaltado, igual que en news-maker.
2. Elige **tipografía** y **cuerpo**. Arial va por defecto porque es la del
   formato clásico de meme y está en todos los equipos, así que no depende de
   ninguna descarga.
3. Arrastra la **foto** (o elígela con el botón, o **pégala** con Ctrl+V desde
   una captura).
4. Elige el **lienzo**, que es la única decisión de verdad:
   - **Alto libre** — la foto se deja entera y el lienzo crece hacia abajo.
     El alto final depende de la foto y del texto.
   - **1080 × 1350** — el 4:5 de Facebook, alto fijo. Como la banda se come
     parte del hueco, aquí la foto **se recorta**: aparece un deslizador de
     zoom y puedes arrastrar la vista previa para encuadrarla.
5. Cambia los **colores** si quieres: banda, texto y resaltado, cada uno con la
   paleta de la casa además del selector libre.
6. **GENERA**, y abajo aparece la imagen con el botón de descarga.

Las dos cosas no salen a la vez: si el alto es fijo y el texto crece, o cede el
lienzo o cede el encuadre de la foto. Por eso son dos modos y no uno.

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
| `src/format.ts` | Las medidas y la paleta. Es lo único que hay que tocar para cambiar el diseño. |
| `src/render.ts` | El ajuste del texto y el dibujo sobre el lienzo. No toca el DOM. |
| `src/main.ts` | La interfaz: carga de foto, encuadre, colores y descarga. |

## Pendiente

- **La tipografía definitiva.** Ahora mismo hay cuatro para elegir y Arial va
  por defecto, pero esto es un marcador de posición: en cuanto esté decidida,
  se fija en `FONT_DEFAULT` de `src/format.ts`.
- **Medir la referencia.** Lo que hizo que news-maker saliera clavado fue medir
  el PSD en vez de estimar. Aquí los márgenes y el cuerpo son de diseño, así que
  si aparece una referencia hay que volver a medir sobre ella.
