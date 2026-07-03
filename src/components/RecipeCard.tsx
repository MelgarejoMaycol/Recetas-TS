import type { Receta } from '../config/consultas';
import { getAverageRating, getRecipeDisplay } from '../utils/recipeText';

interface RecipeCardProps {
    recipe: Receta;
    variant?: 'featured' | 'owned';
    onSelect?: (recipe: Receta) => void;
}

const fallbackImage =
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80';

const RecipeCard = ({ recipe, variant = 'featured', onSelect }: RecipeCardProps) => {
    const display = getRecipeDisplay(recipe);
    const rating = getAverageRating(recipe);
    const time = Number(recipe.tiempo_preparacion) > 0 ? `${recipe.tiempo_preparacion} min` : 'Tiempo pendiente';
    const portions = Number(recipe.porciones) > 0 ? `${recipe.porciones} porciones` : 'Porciones pendientes';

    return (
        <button
            type="button"
            className={`recipe-card recipe-card--${variant}`}
            onClick={() => onSelect?.(recipe)}
            aria-label={`Ver detalle de ${display.name}`}
        >
            <div className="recipe-media">
                <img src={recipe.imagen_url || fallbackImage} alt={display.name} loading="lazy" />
                <span className="recipe-chip">{display.difficulty}</span>
            </div>
            <div className="recipe-card-body">
                <div>
                    <h3>{display.name}</h3>
                    <p>{display.description}</p>
                </div>
                <div className="recipe-meta">
                    <span className="rating-pill">{rating > 0 ? `${rating.toFixed(1)}/5 ★` : 'Sin valoraciones'}</span>
                    <span>{display.country}</span>
                    <span>{time}</span>
                    <span>{portions}</span>
                </div>
            </div>
        </button>
    );
};

export default RecipeCard;
