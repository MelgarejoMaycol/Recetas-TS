import type { IngredienteReceta, PreparacionReceta, Receta } from '../config/consultas';

const valueTranslations: Record<string, string> = {
    american: 'Estados Unidos',
    beef: 'Res',
    bread: 'Pan',
    breakfast: 'Desayuno',
    british: 'Reino Unido',
    cake: 'Pastel',
    cup: 'taza',
    cups: 'tazas',
    tablespoon: 'cucharada',
    tablespoons: 'cucharadas',
    teaspoon: 'cucharadita',
    teaspoons: 'cucharaditas',
    gram: 'gramo',
    grams: 'gramos',
    ounce: 'onza',
    ounces: 'onzas',
    liter: 'litro',
    liters: 'litros',
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
    'african': 'África',
    'argentinian': 'Argentina',
    'australian': 'Australia',
    'belgian': 'Bélgica',
    'dutch': 'Países Bajos',
    'egyptian': 'Egipto',
    'filipino': 'Filipinas',
    'irish': 'Irlanda',
    'jamaican': 'Jamaica',
    'kenyan': 'Kenia',
    'malaysian': 'Malasia',
    'moroccan': 'Marruecos',
    'polish': 'Polonia',
    'portuguese': 'Portugal',
    'russian': 'Rusia',
    'thai': 'Tailandia',
    'tunisian': 'Túnez',
    'ukrainian': 'Ucrania',
    'vietnamese': 'Vietnam',
    'croatian': 'Croacia',
    'unknown': 'Internacional',
    'miscellaneous': 'Variados',
    'side': 'Acompañamiento',
    'goat': 'Cabra',
    'carrots': 'Zanahorias',
    'carrot': 'Zanahoria',
    'garlic': 'Ajo',
    'minced garlic': 'Ajo picado',
    'ground ginger': 'Jengibre molido',
    'ginger': 'Jengibre',
    'potato': 'Papa',
    'potatoes': 'Papas',
    'chicken breasts': 'Pechugas de pollo',
    'chicken breast': 'Pechuga de pollo',
    'chicken thighs': 'Muslos de pollo',
    'ground beef': 'Carne molida',
    'beef brisket': 'Pecho de res',
    'red onion': 'Cebolla morada',
    'green onion': 'Cebolla larga',
    'spring onions': 'Cebollas largas',
    'olive oil': 'Aceite de oliva',
    'vegetable oil': 'Aceite vegetal',
    'soy sauce': 'Salsa de soya',
    'tomato sauce': 'Salsa de tomate',
    'brown sugar': 'Azúcar morena',
    'sugar': 'Azúcar',
    'salt': 'Sal',
    'salt and pepper': 'Sal y pimienta',
    'butter': 'Mantequilla',
    'milk': 'Leche',
    'cream': 'Crema',
    'flour': 'Harina',
    'plain flour': 'Harina de trigo',
    'self-raising flour': 'Harina leudante',
    'baking powder': 'Polvo de hornear',
    'baking soda': 'Bicarbonato de sodio',
    'cheese': 'Queso',
    'cheddar cheese': 'Queso cheddar',
    'parmesan cheese': 'Queso parmesano',
    'cream cheese': 'Queso crema',
    'sour cream': 'Crema agria',
    'heavy cream': 'Crema de leche',
    'double cream': 'Crema doble',
    'cornstarch': 'Fécula de maíz',
    'corn starch': 'Fécula de maíz',
    'brown rice': 'Arroz integral',
    'white rice': 'Arroz blanco',
    'rice': 'Arroz',
    'black pepper': 'Pimienta negra',
    'bell pepper': 'Pimentón',
    'red pepper': 'Pimentón rojo',
    'green pepper': 'Pimentón verde',
    'mushrooms': 'Champiñones',
    'mushroom': 'Champiñón',
    'tomato paste': 'Pasta de tomate',
    'chicken stock': 'Caldo de pollo',
    'beef stock': 'Caldo de res',
    'vegetable stock': 'Caldo de verduras',
    'vegetable broth': 'Caldo de verduras',
    'lemon juice': 'Jugo de limón',
    'lemon': 'Limón',
    'lime': 'Lima',
    'lemon zest': 'Ralladura de limón',
    'orange juice': 'Jugo de naranja',
    'parsley': 'Perejil',
    'cilantro': 'Cilantro',
    'coriander': 'Cilantro',
    'cumin': 'Comino',
    'paprika': 'Pimentón en polvo',
    'cinnamon': 'Canela',
    'basil': 'Albahaca',
    'oregano': 'Orégano',
    'thyme': 'Tomillo',
    'rosemary': 'Romero',
    'vinegar': 'Vinagre',
    'honey': 'Miel',
    'vanilla extract': 'Extracto de vainilla',
    'vanilla': 'Vainilla',
    'walnuts': 'Nueces',
    'almonds': 'Almendras',
    'peanuts': 'Maní',
    'peanut butter': 'Mantequilla de maní',
    'oats': 'Avena',
    'rolled oats': 'Avena en hojuelas',
    'yogurt': 'Yogur',
    'spinach': 'Espinaca',
    'cabbage': 'Repollo',
    'cucumber': 'Pepino',
    'red wine': 'Vino tinto',
    'white wine': 'Vino blanco',
    'boiling water': 'Agua hirviendo',
    'water': 'Agua',
    'to taste': 'al gusto',
    'a pinch': 'una pizca',
};

const exactTextTranslations: Record<string, string> = {
    'cover with the other half of the bread and serve.': 'Cubre con la otra mitad del pan y sirve.',
    'crush the meat so that it is finite and we put it on a griddle to brown.': 'Aplasta la carne hasta dejarla fina y dóralo en una plancha.',
    'put the eggs, bacon and ham to fry.': 'Fríe los huevos, la tocineta y el jamón.',
    'cut the bread in half, put the beef brisket, the fried eggs, the bacon, the ham, the mozzarella, the tomato and the lettuce.': 'Corta el pan por la mitad y agrega la carne, los huevos fritos, la tocineta, el jamón, la mozzarella, el tomate y la lechuga.',
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

    // No traducir palabras sueltas: las frases quedan mezcladas y pierden sentido.
    return translateValue(cleanValue);
};

export const translateMeasure = (value?: string | null) => {
    const text = value?.trim();
    if (!text) return '';
    return text.replace(/\b(tablespoons?|teaspoons?|cups?|grams?|ounces?|liters?|pinches|pinch|tbsp|tsp|lbs?|pounds?)\b/gi, (unit) => {
        const units: Record<string, string> = {
            tablespoon: 'cucharada', tablespoons: 'cucharadas',
            teaspoon: 'cucharadita', teaspoons: 'cucharaditas',
            cup: 'taza', cups: 'tazas', gram: 'gramo', grams: 'gramos',
            ounce: 'onza', ounces: 'onzas', liter: 'litro', liters: 'litros',
            pinch: 'pizca', pinches: 'pizcas', tbsp: 'cucharadas',
            tsp: 'cucharaditas', lb: 'libra', lbs: 'libras',
            pound: 'libra', pounds: 'libras',
        };
        return units[unit.toLowerCase()] ?? unit;
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
    amount: translateMeasure([ingredient.cantidad, translateValue(ingredient.unidad)].filter(Boolean).join(' ')) || 'Al gusto',
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
