import test from 'node:test';
import assert from 'node:assert/strict';
import type { Receta } from '../src/config/consultas.tsx';
import {
    isImportedRecipe, splitTranslationSegments, translateImportedText,
} from '../src/utils/recipeTranslation.ts';
import { translateMeasure, translateText, translateValue } from '../src/utils/recipeText.ts';

const importedRecipe = { imagen_url: 'https://www.themealdb.com/images/media/meals/test.jpg' } as Receta;

test('solo las recetas públicas importadas se envían al traductor', () => {
    assert.equal(isImportedRecipe(importedRecipe), true);
    assert.equal(isImportedRecipe({ imagen_url: 'https://images.example.com/photo.jpg' }), false);
    assert.equal(isImportedRecipe({ imagen_url: '' }), false);
    assert.equal(isImportedRecipe({ imagen_url: 'https://themealdb.com.evil.test/images/a.png' }), false);
});

test('las instrucciones sin traducción conocida no quedan mezcladas', () => {
    const original = 'Preheat the oven and stir everything until golden brown.';
    assert.equal(translateText(original), original);
    assert.equal(translateText('Put the eggs, bacon and ham to fry.'), 'Fríe los huevos, la tocineta y el jamón.');
});

test('glosario de ingredientes y medidas en español', () => {
    assert.equal(translateValue('chicken breasts'), 'Pechugas de pollo');
    assert.equal(translateValue('brown sugar'), 'Azúcar morena');
    assert.equal(translateMeasure('2 tablespoons'), '2 cucharadas');
    assert.equal(translateMeasure('1/2 cup'), '1/2 taza');
});

test('las instrucciones largas se separan sin exceder 440 bytes por segmento', () => {
    const text = Array.from({ length: 100 }, () => 'Cook with water and spices.').join(' ');
    const segments = splitTranslationSegments(text);
    assert.ok(segments.length > 1);
    for (const segment of segments) {
        assert.ok(new TextEncoder().encode(segment).length <= 440);
    }
    assert.equal(segments.join(' '), text);
});

test('la traducción reutiliza consultas concurrentes para un mismo texto', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (input: string | URL | Request) => {
        calls += 1;
        const url = new URL(String(input));
        assert.equal(url.searchParams.get('langpair'), 'en|es');
        return Response.json({
            responseStatus: 200,
            responseData: { translatedText: 'Hornea la receta a fuego lento.' },
        });
    };
    try {
        const text = 'Bake the dish gently over a low heat.';
        const [a, b] = await Promise.all([translateImportedText(text), translateImportedText(text)]);
        assert.equal(a, 'Hornea la receta a fuego lento.');
        assert.equal(b, a);
        assert.equal(calls, 1);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
