import {
  CANVAS_H_FIXED,
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
  type CanvasMode,
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
const modeEl = need<HTMLSelectElement>("mode");
const modeHelpEl = need<HTMLParagraphElement>("mode-help");
const zoomFieldEl = need<HTMLDivElement>("zoom-field");
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
  mode: CanvasMode;
}

const state: State = {
  photo: null,
  photoSize: null,
  photoName: "",
  transform: { zoom: 1, offsetX: 0, offsetY: 0 },
  mode: "auto",
};

function options(): RenderOptions {
  return {
    photo: state.photo,
    photoSize: state.photoSize,
    transform: state.transform,
    mode: state.mode,
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
 * Espera a la fuente elegida antes de medir. Sin esto, la primera pasada mide
 * con la de respaldo y el texto sale con un ajuste que no corresponde.
 */
async function ensureFont(): Promise<void> {
  const font = fontById(fontEl.value);
  if (!font.webfont) return;
  try {
    await document.fonts.load(`${font.weight} 64px ${font.stack}`);
    await document.fonts.ready;
  } catch {
    setStatus(`No se pudo cargar ${font.label}; se usará una fuente de respaldo.`, "error");
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

// --- Encuadre (solo en 4:5, que es donde se recorta) ------------------------

function fixedMode(): boolean {
  return state.mode === "fixed";
}

function clamp(): void {
  if (!state.photoSize || !fixedMode()) return;
  const layout = computeLayout(previewCtx, options());
  clampPhotoOffset(state.photoSize, layout.photoArea, state.transform);
}

let dragging = false;
let lastX = 0;
let lastY = 0;

previewEl.addEventListener("pointerdown", (e) => {
  if (!state.photo || !fixedMode()) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  previewEl.setPointerCapture(e.pointerId);
});

previewEl.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  // Del espacio de pantalla al del lienzo: la previa va escalada.
  const scale = previewEl.width / previewEl.getBoundingClientRect().width;
  state.transform.offsetX += (e.clientX - lastX) * scale;
  state.transform.offsetY += (e.clientY - lastY) * scale;
  lastX = e.clientX;
  lastY = e.clientY;
  clamp();
  draw();
});

for (const type of ["pointerup", "pointercancel"]) {
  previewEl.addEventListener(type, () => {
    dragging = false;
  });
}

previewEl.addEventListener(
  "wheel",
  (e) => {
    if (!state.photo || !fixedMode()) return;
    e.preventDefault();
    const step = e.deltaY < 0 ? 1.05 : 1 / 1.05;
    setZoom(state.transform.zoom * step);
  },
  { passive: false },
);

function setZoom(zoom: number): void {
  state.transform.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
  zoomEl.value = String(state.transform.zoom);
  clamp();
  draw();
}

zoomEl.addEventListener("input", () => setZoom(Number(zoomEl.value)));

// --- Modo de lienzo --------------------------------------------------------

function syncMode(): void {
  state.mode = modeEl.value === "fixed" ? "fixed" : "auto";
  zoomFieldEl.hidden = !fixedMode();
  modeHelpEl.textContent = fixedMode()
    ? `Alto fijo de ${CANVAS_H_FIXED} px: la banda se come el hueco de la foto, así que la foto se recorta.`
    : "La foto se deja entera y el lienzo crece hacia abajo con el texto.";
  if (fixedMode()) {
    clamp();
  } else {
    state.transform = { zoom: 1, offsetX: 0, offsetY: 0 };
    zoomEl.value = "1";
  }
  draw();
}

modeEl.addEventListener("change", syncMode);

// --- Dibujo ----------------------------------------------------------------

function draw(): void {
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
syncMode();
void ensureFont().then(draw);
