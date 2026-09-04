/**
 * Revision ortografica y gramatical con LanguageTool.
 *
 * Se llama una sola vez, al generar, y nunca por su cuenta: su API publica pide
 * expresamente que no se le manden peticiones automaticas, y una pulsacion del
 * usuario no lo es. Ademas obliga a un enlace visible a languagetool.org, que
 * esta en el HTML junto al aviso.
 *
 * El dia que haya un LanguageTool propio levantado, esto vale igual cambiando
 * `ENDPOINT`: ahi se caen los terminos, el enlace y los limites.
 */

const ENDPOINT = "https://api.languagetool.org/v2/check";

/** Corta la espera: si tarda mas, se genera igual y sin revisar. */
const TIMEOUT_MS = 8000;

/** Mas de tres sugerencias no caben en una linea y no ayudan a decidir. */
const MAX_REPLACEMENTS = 3;

export interface Issue {
  /** El trozo del rotulo que se marca. */
  text: string;
  message: string;
  replacements: string[];
}

interface RawMatch {
  offset: number;
  length: number;
  message: string;
  replacements?: { value: string }[];
}

/**
 * Quita los asteriscos del resaltado antes de mandar el texto: son marca
 * nuestra, no del idioma, y pegados a la palabra la convierten en otra cosa.
 */
function plain(text: string): string {
  return text.replace(/\*/g, "");
}

/**
 * Devuelve lo que LanguageTool encuentra. Lanza si no se puede consultar, para
 * que quien llama decida — aqui la revision nunca debe estorbar al generado.
 */
export async function check(text: string): Promise<Issue[]> {
  const clean = plain(text).trim();
  if (clean.length === 0) return [];

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ text: clean, language: "es" }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`LanguageTool respondió ${res.status}`);

  const data = (await res.json()) as { matches?: RawMatch[] };
  return (data.matches ?? []).map((m) => ({
    text: clean.slice(m.offset, m.offset + m.length),
    message: m.message,
    replacements: (m.replacements ?? [])
      .slice(0, MAX_REPLACEMENTS)
      .map((r) => r.value),
  }));
}
