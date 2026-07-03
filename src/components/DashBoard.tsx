import { useEffect, useMemo, useState } from 'react';
import type { ActualizarRecetaPayload, CategoriaReceta, CrearRecetaCompletaPayload, IngredienteCatalogo, Receta, RecipeDetail, User } from '../config/consultas';
import {
    actualizarReceta,
    crearComentario,
    crearFavorito,
    crearReceta,
    eliminarFavorito,
    eliminarReceta as eliminarRecetaApi,
    enriquecerRecetasConValoraciones,
    obtenerCategoriasRecetas,
    obtenerDetalleReceta,
    obtenerFavoritosUsuario,
    obtenerIngredientesCatalogo,
    obtenerMisRecetas,
    obtenerRecetasMasValoradas,
    obtenerRecetasRecientes,
    obtenerTodasLasRecetasPublicas,
} from '../config/consultas';
import '../styles/App.css';
import { getRecipeSearchText, translateValue } from '../utils/recipeText';
import FeaturedRecipes from './FeaturedRecipes';
import MyRecipes from './MyRecipes';
import RecipeDetailModal from './RecipeDetailModal';

interface DashBoardProps {
    user: User;
    userId: number;
    token: string;
    onLogout: () => void;
}

type ActiveView = 'featured' | 'recent' | 'favorites' | 'mine';

const DashBoard = ({ user, userId, token, onLogout }: DashBoardProps) => {
    const [featuredRecipes, setFeaturedRecipes] = useState<Receta[]>([]);
    const [recentRecipes, setRecentRecipes] = useState<Receta[]>([]);
    const [allRecipes, setAllRecipes] = useState<Receta[]>([]);
    const [myRecipes, setMyRecipes] = useState<Receta[]>([]);
    const [categories, setCategories] = useState<CategoriaReceta[]>([]);
    const [ingredientsCatalog, setIngredientsCatalog] = useState<IngredienteCatalogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState<ActiveView>('featured');
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [selectedRecipe, setSelectedRecipe] = useState<Receta | null>(null);
    const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<number[]>([]);
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [allRaw, topRated, recent, mineRaw, favorites, recipeCategories, ingredients] = await Promise.all([
                    obtenerTodasLasRecetasPublicas(),
                    obtenerRecetasMasValoradas(1, 10),
                    obtenerRecetasRecientes(1, 10),
                    obtenerMisRecetas(userId, token),
                    obtenerFavoritosUsuario(userId, token),
                    obtenerCategoriasRecetas(),
                    obtenerIngredientesCatalogo(),
                ]);
                const [all, featured, recentWithRatings, mine] = await Promise.all([
                    enriquecerRecetasConValoraciones(allRaw),
                    enriquecerRecetasConValoraciones(topRated.data ?? []),
                    enriquecerRecetasConValoraciones(recent.data ?? []),
                    enriquecerRecetasConValoraciones(mineRaw.data ?? []),
                ]);
                setAllRecipes(all);
                setFeaturedRecipes(featured);
                setRecentRecipes(recentWithRatings);
                setMyRecipes(mine);
                setFavoriteRecipeIds(favorites.map((favorite) => favorite.receta_id));
                setCategories(recipeCategories);
                setIngredientsCatalog(ingredients);
                setError('');
            } catch (err) {
                const error = err as Error & { status?: number; response?: unknown };
                const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
                const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
                setError(`${error.message}${statusInfo}${detail}`);
            } finally {
                setLoading(false);
            }
        };
        void loadData();
    }, [userId, token]);

    const handleCreateRecipe = async (payload: CrearRecetaCompletaPayload, onProgress?: (progress: number) => void) => {
        try {
            const newRecipe = await crearReceta(payload, token, onProgress);
            const enriched = (await enriquecerRecetasConValoraciones([newRecipe]))[0];
            setMyRecipes((prev) => [enriched, ...prev]);
            setAllRecipes((prev) => [enriched, ...prev]);
            setRecentRecipes((prev) => [enriched, ...prev].slice(0, 10));
            setActiveView('mine');
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setError(`${error.message}${statusInfo}${detail}`);
        }
    };

    const handleUpdateRecipe = async (recipeId: number, payload: ActualizarRecetaPayload, onProgress?: (progress: number) => void) => {
        try {
            const updatedRecipe = await actualizarReceta(recipeId, payload, token, onProgress);
            const enriched = (await enriquecerRecetasConValoraciones([updatedRecipe]))[0];
            setMyRecipes((prev) => prev.map((recipe) => recipe.id === recipeId ? { ...recipe, ...enriched } : recipe));
            setAllRecipes((prev) => prev.map((recipe) => recipe.id === recipeId ? { ...recipe, ...enriched } : recipe));
            setFeaturedRecipes((prev) => prev.map((recipe) => recipe.id === recipeId ? { ...recipe, ...enriched } : recipe));
            setRecentRecipes((prev) => prev.map((recipe) => recipe.id === recipeId ? { ...recipe, ...enriched } : recipe));
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setError(`${error.message}${statusInfo}${detail}`);
        }
    };

    const handleDeleteRecipe = async (recipeId: number) => {
        try {
            await eliminarRecetaApi(recipeId, token);
            setMyRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
            setAllRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
            setFeaturedRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
            setRecentRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
            setFavoriteRecipeIds((prev) => prev.filter((id) => id !== recipeId));
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setError(`${error.message}${statusInfo}${detail}`);
        }
    };

    const filtersAreEmpty = searchTerm.trim() === '' && difficultyFilter === 'all' && countryFilter === 'all';
    const favoriteRecipes = useMemo(
        () => allRecipes.filter((recipe) => favoriteRecipeIds.includes(recipe.id)),
        [allRecipes, favoriteRecipeIds],
    );
    const currentRecipes = activeView === 'featured'
        ? filtersAreEmpty ? featuredRecipes : allRecipes
        : activeView === 'recent'
            ? recentRecipes
            : activeView === 'favorites'
                ? favoriteRecipes
                : myRecipes;

    const filteredRecipes = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return currentRecipes.filter((recipe) => {
            const matchesSearch = !normalizedSearch || getRecipeSearchText(recipe).includes(normalizedSearch);
            const matchesDifficulty = difficultyFilter === 'all' || recipe.dificultad === difficultyFilter;
            const matchesCountry = countryFilter === 'all' || recipe.pais === countryFilter;

            return matchesSearch && matchesDifficulty && matchesCountry;
        });
    }, [countryFilter, currentRecipes, difficultyFilter, searchTerm]);

    const visibleRecipes = useMemo(() => {
        const sorted = [...filteredRecipes];

        if (activeView === 'recent') {
            return sorted.sort((a, b) => {
                const aDate = Date.parse(a.fecha_creacion ?? '');
                const bDate = Date.parse(b.fecha_creacion ?? '');
                return Number.isFinite(bDate) && Number.isFinite(aDate)
                    ? bDate - aDate
                    : 0;
            });
        }

        return sorted.sort((a, b) => Number(b.calificacion_promedio || 0) - Number(a.calificacion_promedio || 0));
    }, [activeView, filteredRecipes]);

    const difficulties = useMemo(
        () => Array.from(new Set(allRecipes.map((recipe) => recipe.dificultad).filter(Boolean))).sort(),
        [allRecipes],
    );
    const countries = useMemo(
        () => Array.from(new Set(allRecipes.map((recipe) => recipe.pais).filter(Boolean))).sort(),
        [allRecipes],
    );

    const handleSelectRecipe = async (recipe: Receta) => {
        setSelectedRecipe(recipe);
        setRecipeDetail(null);
        setDetailError('');
        setActionMessage('');
        setDetailLoading(true);

        try {
            const detail = await obtenerDetalleReceta(recipe.id);
            setRecipeDetail(detail);
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setDetailError(`${error.message}${statusInfo}${detail}`);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeRecipeDetail = () => {
        setSelectedRecipe(null);
        setRecipeDetail(null);
        setDetailError('');
        setActionMessage('');
        setDetailLoading(false);
    };

    const refreshRecipeDetail = async (recipeId: number) => {
        const detail = await obtenerDetalleReceta(recipeId);
        setRecipeDetail(detail);
    };

    const handleToggleFavorite = async () => {
        if (!selectedRecipe) return;

        setActionMessage('');
        setDetailError('');
        const isFavorite = favoriteRecipeIds.includes(selectedRecipe.id);

        try {
            if (isFavorite) {
                await eliminarFavorito(userId, selectedRecipe.id, token);
                setFavoriteRecipeIds((prev) => prev.filter((id) => id !== selectedRecipe.id));
                setRecipeDetail((prev) => prev ? { ...prev, favoriteCount: Math.max(0, prev.favoriteCount - 1) } : prev);
                setActionMessage('Receta quitada de favoritos.');
            } else {
                await crearFavorito(selectedRecipe.id, token);
                setFavoriteRecipeIds((prev) => [...new Set([...prev, selectedRecipe.id])]);
                setRecipeDetail((prev) => prev ? { ...prev, favoriteCount: prev.favoriteCount + 1 } : prev);
                setActionMessage('Receta agregada a favoritos.');
            }
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setDetailError(`${error.message}${statusInfo}${detail}`);
        }
    };

    const handleCreateComment = async (comment: string, rating: number) => {
        if (!selectedRecipe) return;

        setActionMessage('');
        setDetailError('');

        try {
            await crearComentario({ receta_id: selectedRecipe.id, comentario: comment, calificacion: rating }, token);
            await refreshRecipeDetail(selectedRecipe.id);
            const applyRating = (recipe: Receta) => {
                if (recipe.id !== selectedRecipe.id) return recipe;

                const previousCount = Number(recipe.total_comentarios || 0);
                const previousAverage = Number(recipe.calificacion_promedio || 0);
                const nextCount = previousCount + 1;

                return {
                    ...recipe,
                    calificacion_promedio: ((previousAverage * previousCount) + rating) / nextCount,
                    total_comentarios: nextCount,
                };
            };
            setAllRecipes((prev) => prev.map(applyRating));
            setFeaturedRecipes((prev) => prev.map(applyRating));
            setRecentRecipes((prev) => prev.map(applyRating));
            setMyRecipes((prev) => prev.map(applyRating));
            setActionMessage('Comentario publicado correctamente.');
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setDetailError(`${error.message}${statusInfo}${detail}`);
        }
    };

    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="brand-panel">
                    <div className="brand-mark">R</div>
                    <div>
                        <p className="brand-name">Recetas</p>
                        <p className="brand-tag">Cocina creativa, paso a paso</p>
                    </div>
                </div>

                <div className="user-card">
                    <p className="user-greeting">Hola, {user.nombre}</p>
                    <p className="user-email">{user.email}</p>
                </div>

                <button type="button" className="logout-button" onClick={onLogout}>
                    Cerrar sesion
                </button>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <p className="eyebrow">Panel de recetas</p>
                        <h1>Explora y crea recetas</h1>
                        <p className="dashboard-intro">
                            Busca en toda la base de datos. Si no escribes nada, veras 9 recetas para comenzar.
                        </p>
                    </div>
                </header>

                {error && <div className="auth-message error">{error}</div>}

                {loading ? (
                    <div className="loading-state">Cargando recetas...</div>
                ) : (
                    <>
                        <section className="recipe-toolbar" aria-label="Filtros de recetas">
                            <div className="view-tabs">
                                <button
                                    type="button"
                                    className={activeView === 'featured' ? 'active' : ''}
                                    onClick={() => setActiveView('featured')}
                                >
                                    Destacadas
                                </button>
                                <button
                                    type="button"
                                    className={activeView === 'recent' ? 'active' : ''}
                                    onClick={() => setActiveView('recent')}
                                >
                                    Recientes
                                </button>
                                <button
                                    type="button"
                                    className={activeView === 'favorites' ? 'active' : ''}
                                    onClick={() => setActiveView('favorites')}
                                >
                                    Favoritas
                                </button>
                                <button
                                    type="button"
                                    className={activeView === 'mine' ? 'active' : ''}
                                    onClick={() => setActiveView('mine')}
                                >
                                    Mis recetas
                                    <span>{myRecipes.length}</span>
                                </button>
                            </div>

                            <div className="filters-row">
                                <label className="search-field">
                                    Buscar receta
                                    <input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Nombre, pais o dificultad"
                                    />
                                </label>
                                <label>
                                    Dificultad
                                    <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}>
                                        <option value="all">Todas</option>
                                        {difficulties.map((difficulty) => (
                                            <option key={difficulty} value={difficulty}>{translateValue(difficulty)}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Pais
                                    <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
                                        <option value="all">Todos</option>
                                        {countries.map((country) => (
                                            <option key={country} value={country}>{translateValue(country)}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </section>

                        {activeView === 'featured' ? (
                            <FeaturedRecipes
                                recipes={visibleRecipes}
                                title={filtersAreEmpty ? 'Recetas destacadas' : 'Resultados de busqueda'}
                                copy={filtersAreEmpty ? 'Las recetas mejor valoradas. Usa el buscador para explorar toda la base.' : 'Busqueda realizada sobre todas las recetas disponibles.'}
                                onSelectRecipe={(recipe) => void handleSelectRecipe(recipe)}
                            />
                        ) : activeView === 'recent' ? (
                            <FeaturedRecipes
                                recipes={visibleRecipes}
                                eyebrow="Recientes"
                                title="Recetas recientes"
                                copy="Las recetas agregadas mas recientemente."
                                onSelectRecipe={(recipe) => void handleSelectRecipe(recipe)}
                            />
                        ) : activeView === 'favorites' ? (
                            <FeaturedRecipes
                                recipes={visibleRecipes}
                                eyebrow="Favoritas"
                                title="Mis recetas favoritas"
                                copy="Tus recetas guardadas para encontrarlas rapido."
                                onSelectRecipe={(recipe) => void handleSelectRecipe(recipe)}
                            />
                        ) : (
                            <MyRecipes
                                recipes={visibleRecipes}
                                categories={categories}
                                ingredientsCatalog={ingredientsCatalog}
                                onCreate={handleCreateRecipe}
                                onUpdate={handleUpdateRecipe}
                                onDelete={handleDeleteRecipe}
                                onSelectRecipe={(recipe) => void handleSelectRecipe(recipe)}
                            />
                        )}
                    </>
                )}
            </main>

            <RecipeDetailModal
                recipe={selectedRecipe}
                detail={recipeDetail}
                loading={detailLoading}
                error={detailError}
                actionMessage={actionMessage}
                isFavorite={selectedRecipe ? favoriteRecipeIds.includes(selectedRecipe.id) : false}
                onToggleFavorite={handleToggleFavorite}
                onCreateComment={handleCreateComment}
                onClose={closeRecipeDetail}
            />
        </div>
    );
};

export default DashBoard;
