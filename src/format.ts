/**
 * Medidas de la plantilla del meme: banda de color arriba con el texto, y la
 * foto debajo. A diferencia de news-maker aqui no hay PSD del que sacar los
 * numeros, asi que estos son de diseño y se pueden mover. El unico que no se
 * toca es el ancho: 1080 es lo que pide Facebook.
 */

export const CANVAS_W = 1080;

/**
 * Alto del lienzo en modo 4:5. La banda crece con el texto y la foto se deja
 * entera, asi que las dos cosas a la vez solo salen si el lienzo crece hacia
 * abajo. De ahi los dos modos: en `auto` manda la foto y el alto es libre; en
 * `fixed` manda el 1080x1350 y lo que cede es el encuadre de la foto.
 */
export const CANVAS_H_FIXED = 1350;

export type CanvasMode = "auto" | "fixed";

/** Alto del hueco de la foto mientras no hay ninguna cargada. */
export const PLACEHOLDER_H = 1080;

/** Margenes de la banda. El lateral fija de paso el ancho de composicion. */
export const BAND_PAD_X = 56;
export const BAND_PAD_Y = 44;

/** Ancho de composicion del texto. */
export const TEXT_MAX_W = CANVAS_W - BAND_PAD_X * 2;

export const FONT_SIZE = 52;
export const FONT_SIZE_MIN = 26;
export const FONT_SIZE_MAX = 84;

export const LINE_RATIO = 1.25;

/**
 * Altura de mayusculas como fraccion del cuerpo. Sirve para centrar cada linea
 * dentro de su caja sin depender de las metricas de la fuente, que cambian de
 * una familia a otra.
 */
export const CAP_RATIO = 0.72;

export const COLOR_BAND = "#ffffff";
export const COLOR_TEXT = "#000000";

/** Color de lo que va entre *asteriscos*. Solo sale si se usan. */
export const COLOR_HIGHLIGHT = "#e11d2f";

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

export interface Font {
  id: string;
  label: string;
  /** Pila completa, con respaldos por si la familia no esta instalada. */
  stack: string;
  weight: number;
  /** True si hay que esperar a que la descargue Google Fonts. */
  webfont: boolean;
}

/**
 * Tipografias disponibles. Arial va por defecto porque es la del formato
 * clasico de meme rotulado y esta en todos los equipos, asi que no depende de
 * ninguna descarga.
 */
export const FONTS: Font[] = [
  {
    id: "arial",
    label: "Arial",
    stack: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    weight: 700,
    webfont: false,
  },
  {
    id: "impact",
    label: "Impact",
    stack: 'Impact, "Haettenschweiler", "Arial Narrow Bold", sans-serif',
    weight: 400,
    webfont: false,
  },
  {
    id: "poppins",
    label: "Poppins",
    stack: '"Poppins", system-ui, sans-serif',
    weight: 700,
    webfont: true,
  },
  {
    id: "roboto",
    label: "Roboto",
    stack: '"Roboto", system-ui, sans-serif',
    weight: 700,
    webfont: true,
  },
];

export const FONT_DEFAULT = FONTS[0]!;

export function fontById(id: string): Font {
  return FONTS.find((f) => f.id === id) ?? FONT_DEFAULT;
}

/** Paleta de la casa para los selectores de color. */
export const SWATCHES = ["#ffffff", "#000000", "#e11d2f", "#ffd400", "#111111"];
