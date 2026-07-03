import type { Receta } from '../config/consultas';
import RecipeCard from './RecipeCard';

interface FeaturedRecipesProps {
    recipes: Receta[];
    eyebrow?: string;
    title?: string;
    copy?: string;
    onSelectRecipe?: (recipe: Receta) => void;
}

const FeaturedRecipes = ({
    recipes,
    eyebrow = 'Destacadas',
    title = 'Recetas mas valoradas',
    copy = 'Las favoritas de la comunidad con mejor presentacion.',
    onSelectRecipe,
}: FeaturedRecipesProps) => {
    return (
        <section className="recipes-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h2>{title}</h2>
                    <p className="section-copy">{copy}</p>
                </div>
            </div>

            <div className="recipe-grid">
                {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} onSelect={onSelectRecipe} />
                    ))
                ) : (
                    <div className="empty-state">No hay recetas que coincidan con los filtros.</div>
                )}
            </div>
        </section>
    );
};

export default FeaturedRecipes;
