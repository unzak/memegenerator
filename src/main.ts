import {
  CANVAS_W,
  COLOR_BAND,
  COLOR_HIGHLIGHT,
  COLOR_TEXT,
  FONTS,
  FONT_DEFAULT,
  FONT_SIZE,
  SWATCHES,
  ZOOM_MAX,
  ZOOM_MIN,
  fontById,
  type Font,
} from "./format.js";
import {
  clampPhotoOffset,
  computeLayout,
  render,
  type PhotoTransform,
  type RenderOptions,
} from "./render.js";
import "./style.css";

function need<T extends Element>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta el elemento #${id} en el HTML`);
  return el as unknown as T;
}

const textEl = need<HTMLTextAreaElement>("text");
const fontEl = need<HTMLSelectElement>("font");
const sizeEl = need<HTMLInputElement>("size");
const sizeValueEl = need<HTMLSpanElement>("size-value");
const dropEl = need<HTMLDivElement>("drop");
const fileEl = need<HTMLInputElement>("file");
const pickEl = need<HTMLButtonElement>("pick");
const fileNameEl = need<HTMLParagraphElement>("file-name");
const zoomEl = need<HTMLInputElement>("zoom");
const bandEl = need<HTMLInputElement>("color-band");
const textColorEl = need<HTMLInputElement>("color-text");
const highlightEl = need<HTMLInputElement>("color-highlight");
const generateEl = need<HTMLButtonElement>("generate");
const statusEl = need<HTMLParagraphElement>("status");
const previewEl = need<HTMLCanvasElement>("preview");
const previewInfoEl = need<HTMLParagraphElement>("preview-info");
const outputEl = need<HTMLElement>("output");
const resultEl = need<HTMLCanvasElement>("result");
const resultInfoEl = need<HTMLParagraphElement>("result-info");
const downloadEl = need<HTMLButtonElement>("download");

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador no soporta canvas 2D");
  return ctx;
}

const previewCtx = context(previewEl);
const resultCtx = context(resultEl);

interface State {
  photo: HTMLImageElement | null;
  photoSize: { width: number; height: number } | null;
  photoName: string;
  transform: PhotoTransform;
}

const state: State = {
  photo: null,
  photoSize: null,
  photoName: "",
  transform: { zoom: 1, offsetX: 0, offsetY: 0 },
};

function options(): RenderOptions {
  return {
    photo: state.photo,
    photoSize: state.photoSize,
    transform: state.transform,
    text: textEl.value,
    font: fontById(fontEl.value),
    fontSize: Number(sizeEl.value),
    colorBand: bandEl.value,
    colorText: textColorEl.value,
    colorHighlight: highlightEl.value,
  };
}

function setStatus(message: string, kind: "" | "error" = ""): void {
  statusEl.textContent = message;
  statusEl.className = kind === "error" ? "status error" : "status";
}

// --- Tipografias -----------------------------------------------------------

for (const font of FONTS) {
  const opt = document.createElement("option");
  opt.value = font.id;
  opt.textContent = font.label;
  fontEl.append(opt);
}
fontEl.value = FONT_DEFAULT.id;

/**
 * True si la familia esta en el equipo. Se mide un texto con ella y con tres
 * genericas: si el ancho no cambia respecto a ninguna, es que no existe y el
 * navegador esta cayendo en la de respaldo.
 *
 * Ojo con lo que NO detecta: Windows sustituye Helvetica por Arial a nivel de
 * sistema, y ademas las dos son metricamente identicas a proposito, asi que
 * ninguna medida de anchura puede distinguirlas. Esto solo pilla las familias
 * que faltan del todo, sin sustituta.
 */
function fontInstalled(font: Font): boolean {
  const probe = "MMMWWWmmmwww@#$%";
  return ["monospace", "serif", "sans-serif"].some((generic) => {
    previewCtx.font = `${font.weight} 72px ${generic}`;
    const base = previewCtx.measureText(probe).width;
    previewCtx.font = `${font.weight} 72px "${font.family}", ${generic}`;
    return previewCtx.measureText(probe).width !== base;
  });
}

/**
 * Espera a la fuente elegida antes de medir. Sin esto, la primera pasada mide
 * con la de respaldo y el texto sale con un ajuste que no corresponde.
 */
async function ensureFont(): Promise<void> {
  const font = fontById(fontEl.value);
  if (font.webfont) {
    try {
      await document.fonts.load(`${font.weight} 64px ${font.stack}`);
      await document.fonts.ready;
    } catch {
      setStatus(`No se pudo cargar ${font.label}; se usará una de respaldo.`, "error");
      return;
    }
  }
  if (!fontInstalled(font)) {
    setStatus(
      `${font.label} no está instalada en este equipo: se rotulará con la de respaldo.`,
      "error",
    );
  } else {
    setStatus("");
  }
}

// --- Colores ---------------------------------------------------------------

for (const row of document.querySelectorAll<HTMLDivElement>(".swatches")) {
  const target = need<HTMLInputElement>(row.dataset.for ?? "");
  for (const color of SWATCHES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.style.background = color;
    btn.title = color;
    btn.addEventListener("click", () => {
      target.value = color;
      draw();
    });
    row.append(btn);
  }
}

// --- Imagen ----------------------------------------------------------------

/**
 * Carga por evento y no con `img.decode()`: la promesa de decode se queda
 * colgada con blob URLs en algunos navegadores, y entonces la foto no aparece
 * sin dar ni un error.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

async function loadFile(file: File): Promise<void> {
  if (!file.type.startsWith("image/")) {
    setStatus("Ese archivo no es una imagen.", "error");
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    state.photo = img;
    state.photoSize = { width: img.naturalWidth, height: img.naturalHeight };
    state.photoName = file.name;
    state.transform = { zoom: 1, offsetX: 0, offsetY: 0 };
    zoomEl.value = "1";
    fileNameEl.textContent = `${file.name} · ${img.naturalWidth} × ${img.naturalHeight}`;
    if (img.naturalWidth < CANVAS_W) {
      setStatus(
        `Aviso: la foto tiene ${img.naturalWidth} px de ancho y el formato pide ${CANVAS_W}. Se verá pixelada.`,
        "error",
      );
    } else {
      setStatus("Listo para generar.");
    }
    draw();
  } catch {
    URL.revokeObjectURL(url);
    setStatus("No se pudo abrir la imagen.", "error");
  }
}

pickEl.addEventListener("click", () => fileEl.click());
fileEl.addEventListener("change", () => {
  const file = fileEl.files?.[0];
  if (file) void loadFile(file);
});

for (const type of ["dragenter", "dragover"]) {
  dropEl.addEventListener(type, (e) => {
    e.preventDefault();
    dropEl.classList.add("over");
  });
}
for (const type of ["dragleave", "drop"]) {
  dropEl.addEventListener(type, () => dropEl.classList.remove("over"));
}
dropEl.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = (e as DragEvent).dataTransfer?.files?.[0];
  if (file) void loadFile(file);
});

// Pegar desde el portapapeles: es lo mas rapido cuando la foto viene de una
// captura o de otra pestaña.
window.addEventListener("paste", (e) => {
  const file = e.clipboardData?.files?.[0];
  if (file) void loadFile(file);
});

// --- Encuadre --------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Del espacio de pantalla al del lienzo: la previa va escalada. */
function canvasScale(): number {
  return previewEl.width / previewEl.getBoundingClientRect().width;
}

/** Recorta el encuadre despues de cada gesto, para no dejarlo nunca invalido. */
function clampOffset(): void {
  if (!state.photoSize) return;
  const layout = computeLayout(previewCtx, options());
  clampPhotoOffset(state.photoSize, layout.photoArea, state.transform);
}

function setZoom(zoom: number): void {
  state.transform.zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  zoomEl.value = String(state.transform.zoom);
  clampOffset();
  draw();
}

zoomEl.addEventListener("input", () => setZoom(Number(zoomEl.value)));

const pointers = new Map<number, { x: number; y: number }>();
let dragging = false;
let lastX = 0;
let lastY = 0;
/** Distancia y zoom con los que arranco el pellizco en curso. */
let pinch: { dist: number; zoom: number } | null = null;

/** Distancia y punto medio entre los dos primeros dedos. */
function pinchGeometry(): { dist: number; mx: number; my: number } | null {
  const [a, b] = [...pointers.values()];
  if (!a || !b) return null;
  return {
    dist: Math.hypot(a.x - b.x, a.y - b.y),
    mx: (a.x + b.x) / 2,
    my: (a.y + b.y) / 2,
  };
}

previewEl.addEventListener("pointerdown", (e) => {
  if (!state.photo) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragging = true;

  if (pointers.size >= 2) {
    const g = pinchGeometry();
    if (!g) return;
    pinch = { dist: g.dist, zoom: state.transform.zoom };
    lastX = g.mx;
    lastY = g.my;
    return;
  }

  lastX = e.clientX;
  lastY = e.clientY;
  previewEl.setPointerCapture(e.pointerId);
});

previewEl.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  if (pointers.has(e.pointerId)) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  const s = canvasScale();

  if (pinch && pointers.size >= 2) {
    const g = pinchGeometry();
    if (!g || pinch.dist === 0) return;
    state.transform.zoom = clamp(pinch.zoom * (g.dist / pinch.dist), ZOOM_MIN, ZOOM_MAX);
    zoomEl.value = String(state.transform.zoom);
    // El punto medio tambien arrastra, que es lo que espera el dedo: se coloca
    // y se dimensiona en un solo gesto.
    state.transform.offsetX += (g.mx - lastX) * s;
    state.transform.offsetY += (g.my - lastY) * s;
    lastX = g.mx;
    lastY = g.my;
    clampOffset();
    draw();
    return;
  }

  state.transform.offsetX += (e.clientX - lastX) * s;
  state.transform.offsetY += (e.clientY - lastY) * s;
  lastX = e.clientX;
  lastY = e.clientY;
  clampOffset();
  draw();
});

for (const type of ["pointerup", "pointercancel"] as const) {
  previewEl.addEventListener(type, (e) => {
    pointers.delete(e.pointerId);
    pinch = null;
    if (pointers.size === 1) {
      // Al levantar un dedo, seguir arrastrando con el que queda en vez de dar
      // un salto la proxima vez que se mueva.
      const [p] = [...pointers.values()];
      if (p) {
        lastX = p.x;
        lastY = p.y;
      }
    } else if (pointers.size === 0) {
      dragging = false;
    }
  });
}

/**
 * Suavidad de la rueda. Una muesca tipica manda deltaY 100, asi que con 2000
 * sale un ~5% por muesca. Cuanto mas alto, mas progresivo.
 */
const WHEEL_DIVISOR = 2000;
/** Tope por evento, para que un golpe fuerte de rueda no pegue un salto. */
const WHEEL_MAX_DELTA = 120;

previewEl.addEventListener(
  "wheel",
  (e) => {
    if (!state.photo) return;
    e.preventDefault();
    // deltaMode: 0 = px, 1 = lineas (Firefox), 2 = paginas.
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
    const delta = clamp(e.deltaY * unit, -WHEEL_MAX_DELTA, WHEEL_MAX_DELTA);
    // Exponencial, para que el paso se note igual en cualquier escala.
    setZoom(state.transform.zoom * Math.exp(-delta / WHEEL_DIVISOR));
  },
  { passive: false },
);

// --- Dibujo ----------------------------------------------------------------

function draw(): void {
  // Centralizado aqui: asi ningun cambio puede dejar un encuadre invalido.
  // Escribir tambien mueve el hueco de la foto, y sin esto un desplazamiento
  // que era valido con la banda corta destapaba la banda al crecer.
  clampOffset();
  const opts = options();
  const layout = render(previewCtx, opts);
  sizeValueEl.textContent = sizeEl.value;
  const n = layout.lines.length;
  const band = n > 0 ? `banda ${layout.bandH} px · ${n} ${n === 1 ? "línea" : "líneas"}` : "sin banda";
  previewInfoEl.textContent = `${layout.width} × ${layout.height} px · ${band}`;
}

for (const el of [textEl, sizeEl, bandEl, textColorEl, highlightEl]) {
  el.addEventListener("input", draw);
}

fontEl.addEventListener("change", () => {
  void ensureFont().then(draw);
});

// --- Salida ----------------------------------------------------------------

generateEl.addEventListener("click", () => {
  if (!state.photo) {
    setStatus("Falta la foto.", "error");
    return;
  }
  void ensureFont().then(() => {
    const layout = render(resultCtx, options());
    outputEl.hidden = false;
    resultInfoEl.textContent = `${layout.width} × ${layout.height} px`;
    setStatus("Listo.");
    outputEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

downloadEl.addEventListener("click", () => {
  resultEl.toBlob((blob) => {
    if (!blob) {
      setStatus("No se pudo generar el PNG.", "error");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.photoName.replace(/\.[^.]+$/, "") || "meme";
    a.download += "-meme.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});

// --- Arranque --------------------------------------------------------------

textEl.value = "";
sizeEl.value = String(FONT_SIZE);
bandEl.value = COLOR_BAND;
textColorEl.value = COLOR_TEXT;
highlightEl.value = COLOR_HIGHLIGHT;
previewEl.width = CANVAS_W;
void ensureFont().then(draw);
