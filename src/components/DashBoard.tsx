import { useEffect, useMemo, useState } from 'react';
import type { Receta, RecipeDetail, User } from '../config/consultas';
import {
    crearComentario,
    crearFavorito,
    crearReceta,
    eliminarFavorito,
    obtenerDetalleReceta,
    obtenerFavoritosUsuario,
    obtenerMisRecetas,
    obtenerRecetasMasRelevantes,
    obtenerTodasLasRecetasPublicas,
} from '../config/consultas';
import '../styles/App.css';
import FeaturedRecipes from './FeaturedRecipes';
import MyRecipes from './MyRecipes';
import RecipeDetailModal from './RecipeDetailModal';
import { getRecipeSearchText, translateValue } from '../utils/recipeText';

interface DashBoardProps {
    user: User;
    userId: number;
    token: string;
    onLogout: () => void;
}

type ActiveView = 'all' | 'featured' | 'mine';

const DashBoard = ({ user, userId, token, onLogout }: DashBoardProps) => {
    const [featuredRecipes, setFeaturedRecipes] = useState<Receta[]>([]);
    const [allRecipes, setAllRecipes] = useState<Receta[]>([]);
    const [myRecipes, setMyRecipes] = useState<Receta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState<ActiveView>('all');
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
                const [all, featured, mine, favorites] = await Promise.all([
                    obtenerTodasLasRecetasPublicas(),
                    obtenerRecetasMasRelevantes(),
                    obtenerMisRecetas(userId, token),
                    obtenerFavoritosUsuario(userId, token),
                ]);
                setAllRecipes(all);
                setFeaturedRecipes(featured.data ?? []);
                setMyRecipes(mine.data ?? []);
                setFavoriteRecipeIds(favorites.map((favorite) => favorite.receta_id));
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
        loadData();
    }, [userId, token]);

    const handleCreateRecipe = async (payload: Omit<Receta, 'id'>) => {
        try {
            const newRecipe = await crearReceta(payload, token);
            setMyRecipes((prev) => [newRecipe, ...prev]);
            setAllRecipes((prev) => [newRecipe, ...prev]);
            setActiveView('mine');
        } catch (err) {
            const error = err as Error & { status?: number; response?: unknown };
            const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
            const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
            setError(`${error.message}${statusInfo}${detail}`);
        }
    };

    const currentRecipes = activeView === 'all' ? allRecipes : activeView === 'featured' ? featuredRecipes : myRecipes;
    const filtersAreEmpty = searchTerm.trim() === '' && difficultyFilter === 'all' && countryFilter === 'all';

    const filteredRecipes = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return currentRecipes.filter((recipe) => {
            const matchesSearch = !normalizedSearch || getRecipeSearchText(recipe).includes(normalizedSearch);
            const matchesDifficulty = difficultyFilter === 'all' || recipe.dificultad === difficultyFilter;
            const matchesCountry = countryFilter === 'all' || recipe.pais === countryFilter;

            return matchesSearch && matchesDifficulty && matchesCountry;
        });
    }, [countryFilter, currentRecipes, difficultyFilter, searchTerm]);

    const visibleRecipes = activeView === 'all' && filtersAreEmpty ? filteredRecipes.slice(0, 9) : filteredRecipes;

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
                                    className={activeView === 'all' ? 'active' : ''}
                                    onClick={() => setActiveView('all')}
                                >
                                    Todas
                                </button>
                                <button
                                    type="button"
                                    className={activeView === 'featured' ? 'active' : ''}
                                    onClick={() => setActiveView('featured')}
                                >
                                    Destacadas
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

                        {activeView === 'all' ? (
                            <FeaturedRecipes
                                recipes={visibleRecipes}
                                eyebrow="Todas"
                                title="Todas las recetas"
                                copy={filtersAreEmpty ? 'Una muestra inicial de 9 recetas. Usa el buscador o filtros para explorar toda la base.' : 'Resultados desde la base de datos completa, listos para revisar.'}
                                onSelectRecipe={handleSelectRecipe}
                            />
                        ) : activeView === 'featured' ? (
                            <FeaturedRecipes recipes={visibleRecipes} onSelectRecipe={handleSelectRecipe} />
                        ) : (
                            <MyRecipes recipes={visibleRecipes} onCreate={handleCreateRecipe} onSelectRecipe={handleSelectRecipe} />
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
