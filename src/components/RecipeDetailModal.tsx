import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { Receta, RecipeDetail } from '../config/consultas';
import { getIngredientDisplay, getRecipeDisplay, getStepDisplay } from '../utils/recipeText';

interface RecipeDetailModalProps {
    recipe: Receta | null;
    detail: RecipeDetail | null;
    loading: boolean;
    error: string;
    actionMessage: string;
    isFavorite: boolean;
    onToggleFavorite: () => Promise<void>;
    onCreateComment: (comment: string, rating: number) => Promise<void>;
    onClose: () => void;
}

const fallbackImage =
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80';

const RecipeDetailModal = ({
    recipe,
    detail,
    loading,
    error,
    actionMessage,
    isFavorite,
    onToggleFavorite,
    onCreateComment,
    onClose,
}: RecipeDetailModalProps) => {
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

    useEffect(() => {
        if (!recipe) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [recipe]);

    if (!recipe) return null;

    const currentRecipe = detail?.recipe ?? recipe;
    const ingredients = detail?.ingredients ?? [];
    const preparations = detail?.preparations ?? [];
    const comments = detail?.comments ?? [];
    const favoriteCount = detail?.favoriteCount ?? 0;
    const display = getRecipeDisplay(currentRecipe);
    const scoreCount = comments.filter((comment) => Number(comment.calificacion) > 0).length;
    const averageScore = scoreCount > 0
        ? comments.reduce((sum, comment) => sum + Number(comment.calificacion || 0), 0) / scoreCount
        : 0;

    const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const cleanComment = comment.trim();
        if (cleanComment.length < 2) return;

        setIsSubmitting(true);
        await onCreateComment(cleanComment, rating);
        setComment('');
        setRating(5);
        setIsSubmitting(false);
    };

    const handleToggleFavorite = async () => {
        setIsFavoriteLoading(true);
        await onToggleFavorite();
        setIsFavoriteLoading(false);
    };

    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="recipe-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="recipe-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar detalle">
                    x
                </button>

                <div className="modal-hero">
                    <img src={currentRecipe.imagen_url || fallbackImage} alt={display.name} />
                    <div className="modal-hero-content">
                        <p className="eyebrow">{display.category}</p>
                        <h2 id="recipe-detail-title">{display.name}</h2>
                        <p>{display.description}</p>
                        <div className="modal-stats">
                            <span>{display.country}</span>
                            <span>{currentRecipe.tiempo_preparacion || 0} min</span>
                            <span>{currentRecipe.porciones || 0} porciones</span>
                            <span>{display.difficulty}</span>
                        </div>
                        <button
                            type="button"
                            className={`favorite-button ${isFavorite ? 'active' : ''}`}
                            onClick={() => void handleToggleFavorite()}
                            disabled={loading || isFavoriteLoading}
                        >
                            {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        </button>
                    </div>
                </div>

                {loading && <div className="loading-state">Cargando detalle de la receta...</div>}
                {error && <div className="auth-message error">{error}</div>}
                {actionMessage && <div className="auth-message success modal-message">{actionMessage}</div>}

                {!loading && !error && (
                    <div className="modal-content-grid">
                        <aside className="detail-panel detail-panel--summary">
                            <h3>Resumen</h3>
                            <div className="summary-list">
                                <div>
                                    <span>Autor</span>
                                    <strong>{currentRecipe.nombre_usuario || 'Comunidad'}</strong>
                                </div>
                                <div>
                                    <span>Favoritos</span>
                                    <strong>{favoriteCount}</strong>
                                </div>
                                <div>
                                    <span>Comentarios</span>
                                    <strong>{comments.length}</strong>
                                </div>
                                <div>
                                    <span>Calificacion</span>
                                    <strong>{averageScore > 0 ? `${averageScore.toFixed(1)}/5 ★` : 'Sin datos'}</strong>
                                </div>
                            </div>
                        </aside>

                        <section className="detail-panel detail-panel--ingredients">
                            <h3>Ingredientes</h3>
                            {ingredients.length > 0 ? (
                                <div className="ingredient-list">
                                    {ingredients.map((ingredient) => (
                                        <div key={ingredient.id} className="ingredient-item">
                                            <div>
                                                <strong>{getIngredientDisplay(ingredient).name}</strong>
                                                <span>{getIngredientDisplay(ingredient).category}</span>
                                            </div>
                                            <em>{getIngredientDisplay(ingredient).amount}</em>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="detail-empty">Esta receta aun no tiene ingredientes registrados.</p>
                            )}
                        </section>

                        <section className="detail-panel detail-panel--steps">
                            <h3>Preparacion</h3>
                            {preparations.length > 0 ? (
                                <ol className="steps-list">
                                    {preparations.map((step) => (
                                        <li key={step.id}>
                                            <span>{step.numero_paso}</span>
                                            <p>{getStepDisplay(step)}</p>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="detail-empty">No hay pasos de preparacion registrados.</p>
                            )}
                        </section>

                        <section className="detail-panel detail-panel--comments">
                            <h3>Comentarios</h3>
                            <form className="comment-form" onSubmit={(event) => void handleSubmitComment(event)}>
                                <label>
                                    Calificacion
                                    <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                                        <option value={5}>5 - Excelente</option>
                                        <option value={4}>4 - Muy buena</option>
                                        <option value={3}>3 - Buena</option>
                                        <option value={2}>2 - Regular</option>
                                        <option value={1}>1 - Baja</option>
                                    </select>
                                </label>
                                <label>
                                    Comentario
                                    <textarea
                                        value={comment}
                                        onChange={(event) => setComment(event.target.value)}
                                        placeholder="Escribe tu opinion sobre esta receta"
                                        minLength={2}
                                        maxLength={1000}
                                        required
                                    />
                                </label>
                                <button type="submit" className="primary-button" disabled={isSubmitting || comment.trim().length < 2}>
                                    {isSubmitting ? 'Publicando...' : 'Publicar comentario'}
                                </button>
                            </form>
                            {comments.length > 0 ? (
                                <div className="comment-list">
                                    {comments.slice(0, 4).map((comment) => (
                                        <article key={comment.id} className="comment-item">
                                            <div>
                                                <strong>{comment.nombre_usuario || 'Usuario'}</strong>
                                                <span>{`${comment.calificacion}/5 ★`}</span>
                                            </div>
                                            <p>{comment.comentario}</p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="detail-empty">Todavia no hay comentarios para esta receta.</p>
                            )}
                        </section>
                    </div>
                )}
            </section>
        </div>
    );
};

export default RecipeDetailModal;
