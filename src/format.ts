/**
 * Medidas de la plantilla del meme: banda de color arriba con el texto, y la
 * foto debajo. A diferencia de news-maker aqui no hay PSD del que sacar los
 * numeros, asi que estos son de diseño y se pueden mover. El unico que no se
 * toca es el ancho: 1080 es lo que pide Facebook.
 */

export const CANVAS_W = 1080;

/** 1080x1350 es el 4:5 de Facebook. El lienzo no cambia nunca. */
export const CANVAS_H = 1350;

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
  /** Nombre a secas de la familia, para comprobar si esta instalada. */
  family: string;
  /** Pila completa, con respaldos por si la familia no esta instalada. */
  stack: string;
  weight: number;
  /** True si no es del sistema y hay que esperar a que se descargue. */
  webfont: boolean;
}

/**
 * Las tipografias del rotulo. Las del sistema dependen de lo que tenga cada
 * equipo; Inter viene de Google Fonts y SF Pro va servida por el repo. Ojo con
 * Helvetica: en Windows no viene instalada y cae en Arial.
 *
 * SF Pro es la unica que no es negrita: Medium (500) es bastante mas fina que
 * el resto, asi que el rotulo se ve mas ligero con ella.
 *
 * Arial Black e Impact son familias que ya son gruesas de por si, asi que van
 * a peso 400: pedirles 700 haria que el navegador las engordase encima.
 */
export const FONTS: Font[] = [
  {
    id: "helvetica",
    label: "Helvetica Bold",
    family: "Helvetica",
    stack: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
    weight: 700,
    webfont: false,
  },
  {
    id: "arial",
    label: "Arial Bold",
    family: "Arial",
    stack: "Arial, Helvetica, sans-serif",
    weight: 700,
    webfont: false,
  },
  {
    id: "arial-black",
    label: "Arial Black",
    family: "Arial Black",
    stack: '"Arial Black", Gadget, sans-serif',
    weight: 400,
    webfont: false,
  },
  {
    id: "inter",
    label: "Inter Bold",
    family: "Inter",
    stack: '"Inter", system-ui, sans-serif',
    weight: 700,
    webfont: true,
  },
  {
    id: "sfpro",
    label: "SF Pro Medium",
    family: "SF Pro Display",
    stack: '"SF Pro Display", system-ui, sans-serif',
    weight: 500,
    webfont: true,
  },
  {
    id: "impact",
    label: "Impact",
    family: "Impact",
    stack: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    weight: 400,
    webfont: false,
  },
];

/**
 * Inter Bold. Es la unica que se descarga, asi que sale igual en cualquier
 * equipo; las del sistema dependen de lo que tenga instalado cada uno.
 */
export const FONT_DEFAULT = FONTS.find((f) => f.id === "inter") ?? FONTS[0]!;

export function fontById(id: string): Font {
  return FONTS.find((f) => f.id === id) ?? FONT_DEFAULT;
}

/**
 * Paleta de la casa para los selectores de color. El rosa es el de Cabronazi y
 * el verde el de Cabrodeportes, los mismos `#cc1c65` y `#00ce5c` que en
 * news-maker, medidos alli sobre los logos originales.
 */
export const SWATCHES = ["#ffffff", "#000000", "#cc1c65", "#e11d2f", "#00ce5c"];
