import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Receta, RecipeDetail } from '../config/consultas';
import {
    obtenerDetalleReceta,
    obtenerRecetasMasValoradas,
    obtenerRecetasRecientes,
    obtenerTodasLasRecetasPublicas,
} from '../config/consultas';
import { getServerStatusMessage, useServerStatus } from '../hooks/useServerStatus';
import { getRecipeSearchText, translateValue } from '../utils/recipeText';
import FeaturedRecipes from './FeaturedRecipes';
import RecipeDetailModal from './RecipeDetailModal';

type DemoView = 'featured' | 'recent';

const Demo = () => {
    const navigate = useNavigate();
    const { status: serverStatus, retry } = useServerStatus();
    const [allRecipes, setAllRecipes] = useState<Receta[]>([]);
    const [featuredRecipes, setFeaturedRecipes] = useState<Receta[]>([]);
    const [recentRecipes, setRecentRecipes] = useState<Receta[]>([]);
    const [activeView, setActiveView] = useState<DemoView>('featured');
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Receta | null>(null);
    const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    useEffect(() => {
        if (serverStatus !== 'ready') return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const [all, featured, recent] = await Promise.all([
                    obtenerTodasLasRecetasPublicas(),
                    obtenerRecetasMasValoradas(1, 9),
                    obtenerRecetasRecientes(1, 9),
                ]);

                if (cancelled) return;
                setAllRecipes(all);
                setFeaturedRecipes(featured.data ?? []);
                setRecentRecipes(recent.data ?? []);
            } catch (err) {
                if (!cancelled) setError((err as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [serverStatus]);

    const currentRecipes = activeView === 'featured' ? featuredRecipes : recentRecipes;
    const filtersAreEmpty = searchTerm.trim() === '' && difficultyFilter === 'all' && countryFilter === 'all';

    const filteredRecipes = useMemo(() => {
        const source = filtersAreEmpty ? currentRecipes : allRecipes;
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return source.filter((recipe) => {
            const matchesSearch = !normalizedSearch || getRecipeSearchText(recipe).includes(normalizedSearch);
            const matchesDifficulty = difficultyFilter === 'all' || recipe.dificultad === difficultyFilter;
            const matchesCountry = countryFilter === 'all' || recipe.pais === countryFilter;
            return matchesSearch && matchesDifficulty && matchesCountry;
        });
    }, [allRecipes, countryFilter, currentRecipes, difficultyFilter, filtersAreEmpty, searchTerm]);

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
        setDetailLoading(true);

        try {
            setRecipeDetail(await obtenerDetalleReceta(recipe.id));
        } catch (err) {
            setDetailError((err as Error).message);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedRecipe(null);
        setRecipeDetail(null);
        setDetailError('');
    };

    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="brand-panel">
                    <div className="brand-mark">R</div>
                    <div>
                        <p className="brand-name">Recetas</p>
                        <p className="brand-tag">Exploracion publica</p>
                    </div>
                </div>

                <div className="user-card demo-user-card">
                    <p className="user-greeting">Modo exploracion</p>
                    <p className="user-email">
                        Revisa recetas y sus detalles sin crear una cuenta.
                    </p>
                </div>

                <div className="demo-sidebar-actions">
                    <button type="button" className="primary-button" onClick={() => void navigate('/login')}>
                        Iniciar sesion
                    </button>
                    <button type="button" className="secondary-inline-button" onClick={() => void navigate('/register')}>
                        Crear cuenta
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header demo-header">
                    <div>
                        <p className="eyebrow">Vista para visitantes</p>
                        <h1>Explora Recetas sin registrarte</h1>
                        <p className="dashboard-intro">
                            Consulta recetas, busca por pais o dificultad y abre cada receta para ver ingredientes,
                            preparacion y comentarios. Las acciones personales requieren iniciar sesion.
                        </p>
                    </div>
                    <span className="demo-badge">Solo lectura</span>
                </header>

                {serverStatus !== 'ready' && (
                    <div className={`server-status server-status--${serverStatus}`}>
                        <div>
                            <strong>{serverStatus === 'starting' ? 'Encendiendo servidor' : 'Comprobando servidor'}</strong>
                            <p>{getServerStatusMessage(serverStatus)}</p>
                        </div>
                        {serverStatus === 'unavailable' && (
                            <button type="button" className="secondary-inline-button" onClick={retry}>
                                Reintentar
                            </button>
                        )}
                    </div>
                )}

                {error && <div className="auth-message error">{error}</div>}

                {serverStatus === 'ready' && (
                    loading ? (
                        <div className="loading-state">Cargando recetas...</div>
                    ) : (
                        <>
                            <section className="recipe-toolbar" aria-label="Filtros de recetas">
                                <div className="view-tabs demo-tabs">
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

                            <FeaturedRecipes
                                recipes={filteredRecipes}
                                eyebrow={activeView === 'featured' ? 'Destacadas' : 'Recientes'}
                                title={filtersAreEmpty
                                    ? activeView === 'featured' ? 'Recetas destacadas' : 'Recetas recientes'
                                    : 'Resultados de busqueda'}
                                copy={filtersAreEmpty
                                    ? 'Selecciona una receta para revisar todos sus detalles.'
                                    : 'Resultados encontrados entre las recetas publicas disponibles.'}
                                onSelectRecipe={(recipe) => void handleSelectRecipe(recipe)}
                            />
                        </>
                    )
                )}
            </main>

            <RecipeDetailModal
                recipe={selectedRecipe}
                detail={recipeDetail}
                loading={detailLoading}
                error={detailError}
                actionMessage=""
                isFavorite={false}
                readOnly
                onClose={closeDetail}
            />
        </div>
    );
};

export default Demo;
