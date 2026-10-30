import type { Receta } from '../config/consultas';

const STORAGE_KEY = 'recetas:traducciones-es:v1';
const MAX_ENTRIES = 450;
const MAX_REQUEST_BYTES = 440;
const MAX_ACTIVE_REQUESTS = 2;
const REQUEST_TIMEOUT_MS = 9000;

// Solo se traduce automáticamente el contenido público importado de TheMealDB.
// No se envían nombres, comentarios o recetas de usuarios a terceros.
export const isImportedRecipe = (recipe: Pick<Receta, 'imagen_url'>): boolean =>
    /^https:\/\/(?:www\.)?themealdb\.com\/images\//i.test(recipe.imagen_url || '');

const memo = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();
let loaded = false;
let activeRequests = 0;
const waiting: Array<() => void> = [];

const readCache = (): void => {
    if (loaded) return;
    loaded = true;
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(stored)) return;
        for (const entry of stored) {
            if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string') {
                memo.set(entry[0], entry[1]);
            }
        }
    } catch {
        // El modo privado o los datos antiguos no deben impedir ver recetas.
    }
};

const saveCache = (): void => {
    try {
        while (memo.size > MAX_ENTRIES) {
            const firstKey = memo.keys().next().value;
            if (!firstKey) break;
            memo.delete(firstKey);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...memo]));
    } catch {
        // La caché es una mejora, no un requisito para mostrar las recetas.
    }
};

const limitConcurrency = <T,>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const execute = () => {
            activeRequests += 1;
            void task().then(resolve, reject).finally(() => {
                activeRequests -= 1;
                waiting.shift()?.();
            });
        };
        if (activeRequests < MAX_ACTIVE_REQUESTS) execute();
        else waiting.push(execute);
    });

const byteLength = (value: string): number => new TextEncoder().encode(value).length;

// MyMemory acepta como máximo 500 bytes por segmento. Se separan las frases,
// conservando el orden, para no cortar palabras ni exceder ese límite.
export const splitTranslationSegments = (text: string): string[] => {
    const segments: string[] = [];
    let current = '';
    for (const token of text.match(/\S+\s*/g) ?? []) {
        if (byteLength(token) > MAX_REQUEST_BYTES) {
            if (current.trim()) segments.push(current.trim());
            current = '';
            for (const char of token) {
                if (byteLength(current + char) > MAX_REQUEST_BYTES) {
                    if (current.trim()) segments.push(current.trim());
                    current = '';
                }
                current += char;
            }
            continue;
        }
        if (byteLength(current + token) > MAX_REQUEST_BYTES) {
            if (current.trim()) segments.push(current.trim());
            current = token;
        } else {
            current += token;
        }
    }
    if (current.trim()) segments.push(current.trim());
    return segments;
};

const htmlEntities: Record<string, string> = {
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>',
};
const decodeEntities = (text: string): string =>
    text.replace(/&(?:amp|quot|apos|lt|gt|#39);/g, (value) => htmlEntities[value] ?? value);

const fetchTranslation = async (text: string): Promise<string> =>
    limitConcurrency(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const params = new URLSearchParams({ q: text, langpair: 'en|es' });
            const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
                signal: controller.signal,
            });
            if (!response.ok) throw new Error('Servicio de traducción no disponible');
            const data: unknown = await response.json();
            if (!data || typeof data !== 'object') throw new Error('Respuesta inválida');
            const body = data as { responseStatus?: number; responseData?: { translatedText?: string } };
            const translated = body.responseData?.translatedText?.trim() ?? '';
            if (body.responseStatus !== 200 || !translated || /MYMEMORY WARNING/i.test(translated)) {
                throw new Error('No se obtuvo una traducción válida');
            }
            return decodeEntities(translated);
        } finally {
            clearTimeout(timeout);
        }
    });

export const getCachedSpanish = (text?: string | null): string | undefined => {
    const normalized = text?.trim();
    if (!normalized) return undefined;
    readCache();
    return memo.get(normalized);
};

export const translateImportedText = (text: string): Promise<string> => {
    const normalized = text.trim();
    if (!normalized) return Promise.resolve('');
    readCache();
    const cached = memo.get(normalized);
    if (cached) return Promise.resolve(cached);
    const existing = inFlight.get(normalized);
    if (existing) return existing;

    const task = (async () => {
        const segments = splitTranslationSegments(normalized);
        if (!segments.length) return normalized;
        // Si falla una petición conservamos el original completo:
        // no mostramos instrucciones mezcladas ni traducciones parciales.
        const translated = await Promise.all(segments.map(fetchTranslation));
        const result = translated.join(' ').trim();
        if (!result) return normalized;
        memo.set(normalized, result);
        saveCache();
        return result;
    })().catch(() => normalized).finally(() => {
        inFlight.delete(normalized);
    });
    inFlight.set(normalized, task);
    return task;
};
