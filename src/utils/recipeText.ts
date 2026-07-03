import type { IngredienteReceta, PreparacionReceta, Receta } from '../config/consultas';

const valueTranslations: Record<string, string> = {
    american: 'Estados Unidos',
    beef: 'Res',
    bread: 'Pan',
    breakfast: 'Desayuno',
    british: 'Reino Unido',
    cake: 'Pastel',
    canadian: 'Canadá',
    chicken: 'Pollo',
    chinese: 'China',
    dessert: 'Postre',
    difficult: 'Difícil',
    easy: 'Fácil',
    egg: 'Huevo',
    eggs: 'Huevos',
    french: 'Francia',
    general: 'General',
    greek: 'Grecia',
    ham: 'Jamón',
    indian: 'India',
    italian: 'Italia',
    japanese: 'Japón',
    lamb: 'Cordero',
    lettuce: 'Lechuga',
    mexican: 'México',
    moderate: 'Media',
    mozzarella: 'Mozzarella',
    onion: 'Cebolla',
    pasta: 'Pasta',
    pepper: 'Pimienta',
    pork: 'Cerdo',
    seafood: 'Mariscos',
    spanish: 'España',
    starter: 'Entrada',
    tomato: 'Tomate',
    tuna: 'Atún',
    turkish: 'Turquía',
    uruguayan: 'Uruguay',
    vegan: 'Vegana',
    vegetarian: 'Vegetariana',
    easygoing: 'Sencilla',
    medium: 'Media',
    hard: 'Difícil',
    appetizer: 'Aperitivo',
    main: 'Principal',
    stew: 'Guiso',
    grill: 'Parrilla',
    soup: 'Sopa',
    sauce: 'Salsa',
};

const exactTextTranslations: Record<string, string> = {
    'cover with the other half of the bread and serve.': 'Cubre con la otra mitad del pan y sirve.',
    'crush the meat so that it is finite and we put it on a griddle to brown.': 'Aplasta la carne hasta dejarla fina y dóralo en una plancha.',
    'put the eggs, bacon and ham to fry.': 'Fríe los huevos, la tocineta y el jamón.',
    'cut the bread in half, put the beef brisket, the fried eggs, the bacon, the ham, the mozzarella, the tomato and the lettuce.': 'Corta el pan por la mitad y agrega la carne, los huevos fritos, la tocineta, el jamón, la mozzarella, el tomate y la lechuga.',
};

const wordTranslations: Record<string, string> = {
    bacon: 'tocineta',
    bake: 'hornear',
    baked: 'horneado',
    beef: 'res',
    bread: 'pan',
    bowl: 'tazón',
    chicken: 'pollo',
    cook: 'cocinar',
    cooked: 'cocido',
    cut: 'corta',
    egg: 'huevo',
    eggs: 'huevos',
    flour: 'harina',
    fry: 'freír',
    garlic: 'ajo',
    ham: 'jamón',
    heat: 'calienta',
    lettuce: 'lechuga',
    meat: 'carne',
    mix: 'mezcla',
    mozzarella: 'mozzarella',
    oil: 'aceite',
    onion: 'cebolla',
    onions: 'cebollas',
    pepper: 'pimienta',
    potato: 'papa',
    potatoes: 'papas',
    rice: 'arroz',
    salt: 'sal',
    serve: 'sirve',
    tomato: 'tomate',
    tomatoes: 'tomates',
    water: 'agua',
    add: 'agrega',
    addd: 'agrega',
    put: 'pon',
    putt: 'pon',
    stir: 'revuelve',
    mix: 'mezcla',
    bake: 'hornea',
    baked: 'horneado',
    roast: 'asar',
    grilled: 'a la parrilla',
    grill: 'parrilla',
    simmer: 'hervir a fuego lento',
    boil: 'hierve',
    chopped: 'picado',
    slice: 'corta',
    sliced: 'en rodajas',
    dice: 'corta en cubos',
    diced: 'picado',
    minced: 'picado fino',
    cook: 'cocina',
    cooked: 'cocido',
    preheat: 'precalienta',
    until: 'hasta',
    heat: 'calienta',
    serve: 'sirve',
    sprinkle: 'espolvorea',
    season: 'sazona',
    combine: 'combina',
    whisk: 'bate',
    whisked: 'batido',
    tablespoon: 'cucharada',
    tablespoons: 'cucharadas',
    teaspoon: 'cucharadita',
    teaspoons: 'cucharaditas',
    cup: 'taza',
    cups: 'tazas',
    ounce: 'onza',
    ounces: 'onzas',
    gram: 'gramo',
    grams: 'gramos',
    liter: 'litro',
    liters: 'litros',
    ml: 'ml',
    pinch: 'pizca',
    tablespoon: 'cucharada',
    garlic: 'ajo',
    onion: 'cebolla',
    tomato: 'tomate',
    tomatoes: 'tomates',
    pepper: 'pimienta',
    salt: 'sal',
    sugar: 'azúcar',
    butter: 'mantequilla',
    cheese: 'queso',
    water: 'agua',
    broth: 'caldo',
    stock: 'caldo',
    olive: 'oliva',
    oil: 'aceite',
    herbs: 'hierbas',
};

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export const translateValue = (value?: string | null) => {
    const cleanValue = value?.trim();
    if (!cleanValue) return '';
    return valueTranslations[normalize(cleanValue)] ?? cleanValue;
};

export const translateText = (value?: string | null) => {
    const cleanValue = value?.trim();
    if (!cleanValue) return '';

    const exactTranslation = exactTextTranslations[normalize(cleanValue)];
    if (exactTranslation) return exactTranslation;

    return cleanValue.replace(/\b[A-Za-z]+\b/g, (word) => {
        const translated = wordTranslations[word.toLowerCase()];
        if (!translated) return word;
        return word[0] === word[0].toUpperCase()
            ? translated.charAt(0).toUpperCase() + translated.slice(1)
            : translated;
    });
};

export const getRecipeDisplay = (recipe: Receta) => ({
    name: translateText(recipe.nombre) || 'Receta sin nombre',
    description: translateText(recipe.descripcion) || 'Sin descripcion disponible.',
    country: translateValue(recipe.pais) || 'Sin pais',
    difficulty: translateValue(recipe.dificultad) || 'Sin dificultad',
    category: translateValue(recipe.nombre_categoria) || 'Receta',
});

export const getAverageRating = (recipe: Receta) => {
    const rating = Number(recipe.calificacion_promedio ?? 0);
    return Number.isFinite(rating) ? rating : 0;
};

export const getIngredientDisplay = (ingredient: IngredienteReceta) => ({
    name: translateValue(ingredient.nombre_ingrediente) || ingredient.nombre_ingrediente,
    category: translateValue(ingredient.nombre_categoria) || ingredient.nombre_categoria,
    amount: [ingredient.cantidad, translateValue(ingredient.unidad)].filter(Boolean).join(' ') || 'Al gusto',
});

export const getStepDisplay = (step: PreparacionReceta) => translateText(step.descripcion);

export const getRecipeSearchText = (recipe: Receta) => {
    const display = getRecipeDisplay(recipe);
    return [
        recipe.nombre,
        recipe.descripcion,
        recipe.pais,
        recipe.dificultad,
        recipe.nombre_categoria,
        display.name,
        display.description,
        display.country,
        display.difficulty,
        display.category,
    ].filter(Boolean).join(' ').toLowerCase();
};
