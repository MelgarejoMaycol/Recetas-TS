import { useEffect, useState } from 'react';
import type { Receta } from '../config/consultas';
import { translateText, translateValue } from '../utils/recipeText';
import {
    getCachedSpanish, isImportedRecipe, translateImportedText,
} from '../utils/recipeTranslation';

type TextKind = 'phrase' | 'value';

export const useSpanishText = (
    value: string | null | undefined,
    imported: boolean,
    kind: TextKind = 'phrase',
): string => {
    const original = value?.trim() ?? '';
    const local = kind === 'value' ? translateValue(original) : translateText(original);
    const cached = imported && local === original ? getCachedSpanish(original) : undefined;
    const [result, setResult] = useState<{ source: string; text: string } | null>(null);

    useEffect(() => {
        if (!imported || !original || local !== original || cached) return;

        let mounted = true;
        void translateImportedText(original).then((translated) => {
            if (mounted && translated !== original) {
                setResult({ source: original, text: translated });
            }
        });
        return () => { mounted = false; };
    }, [imported, original, local, cached]);

    return result?.source === original ? result.text : cached ?? local;
};

export const useSpanishRecipe = (recipe: Receta) => {
    const imported = isImportedRecipe(recipe);
    const name = useSpanishText(recipe.nombre, imported);
    const description = useSpanishText(recipe.descripcion, imported);
    const country = useSpanishText(recipe.pais, imported, 'value');
    const category = useSpanishText(recipe.nombre_categoria, imported, 'value');
    return {
        imported,
        name: name || 'Receta sin nombre',
        description: description || 'Sin descripción disponible.',
        country: country || 'Sin país',
        category: category || 'Receta',
        difficulty: translateValue(recipe.dificultad) || 'Sin dificultad',
    };
};
