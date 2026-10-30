import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CategoriaReceta, IngredienteCatalogo, Receta, RecipeDetail } from '../config/consultas';
import {
    obtenerCategoriasRecetas,
    obtenerDetalleReceta,
    obtenerIngredientesCatalogo,
    obtenerRecetasMasValoradas,
    obtenerRecetasRecientes,
    obtenerTodasLasRecetasPublicas,
} from '../config/consultas';
import { getServerStatusMessage, useServerStatus } from '../hooks/useServerStatus';
import { getRecipeSearchText, translateValue } from '../utils/recipeText';
import FeaturedRecipes from './FeaturedRecipes';
import MyRecipes from './MyRecipes';
import RecipeDetailModal from './RecipeDetailModal';

type DemoView = 'featured' | 'recent' | 'favorites' | 'mine';

const Demo = () => {
    const navigate = useNavigate();
    const { status: serverStatus, retry } = useServerStatus();
    const [allRecipes, setAllRecipes] = useState<Receta[]>([]);
    const [featuredRecipes, setFeaturedRecipes] = useState<Receta[]>([]);
    const [recentRecipes, setRecentRecipes] = useState<Receta[]>([]);
    const [categories, setCategories] = useState<CategoriaReceta[]>([]);
    const [ingredientsCatalog, setIngredientsCatalog] = useState<IngredienteCatalogo[]>([]);
    const [authAction, setAuthAction] = useState<string | null>(null);
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
        // Solo se consultan catálogos públicos: nunca se solicitan datos privados en el demo.
        void Promise.allSettled([obtenerCategoriasRecetas(), obtenerIngredientesCatalogo()])
            .then(([categoryResult, ingredientResult]) => {
                if (cancelled) return;
                if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
                if (ingredientResult.status === 'fulfilled') setIngredientsCatalog(ingredientResult.value);
            });
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

    useEffect(() => {
        if (!authAction) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setAuthAction(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [authAction]);

    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="brand-panel">
                    <div className="brand-mark">R</div>
                    <div>
                        <p className="brand-name">Recetas</p>
                        <p className="brand-tag">Demostración interactiva</p>
                    </div>
                </div>

                <div className="user-card demo-user-card">
                    <p className="user-greeting">Modo exploracion</p>
                    <p className="user-email">
                        Conoce cómo funciona Recetas sin crear una cuenta.
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
                        <h1>Explora Recetas antes de registrarte</h1>
                        <p className="dashboard-intro">
                            Descubre recetas, prueba los filtros, abre los detalles y explora cómo crear tus propios platos.
                            Para guardar, publicar o comentar necesitarás una cuenta.
                        </p>
                    </div>
                    <span className="demo-badge">Vista demo</span>
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


                <section className="recipe-toolbar" aria-label="Funciones disponibles en la demostración">
                    <div className="view-tabs demo-tabs">
                        <button type="button" className={activeView === 'featured' ? 'active' : ''} onClick={() => setActiveView('featured')}>
                            Destacadas
                        </button>
                        <button type="button" className={activeView === 'recent' ? 'active' : ''} onClick={() => setActiveView('recent')}>
                            Recientes
                        </button>
                        <button type="button" className={activeView === 'favorites' ? 'active' : ''} onClick={() => setActiveView('favorites')}>
                            Favoritas
                        </button>
                        <button type="button" className={activeView === 'mine' ? 'active' : ''} onClick={() => setActiveView('mine')}>
                            Mis recetas
                        </button>
                    </div>

                    {(activeView === 'featured' || activeView === 'recent') && (
                        <div className="filters-row">
                            <label className="search-field">
                                Buscar receta
                                <input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Nombre, país o dificultad"
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
                                País
                                <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
                                    <option value="all">Todos</option>
                                    {countries.map((country) => (
                                        <option key={country} value={country}>{translateValue(country)}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </section>

                {activeView === 'mine' ? (
                    <MyRecipes
                        recipes={[]}
                        categories={categories}
                        ingredientsCatalog={ingredientsCatalog}
                        demoMode
                        onAuthRequired={setAuthAction}
                        onCreate={async () => { setAuthAction('publicar tu receta'); }}
                        onUpdate={async () => { setAuthAction('editar tus recetas'); }}
                        onDelete={async () => { setAuthAction('eliminar tus recetas'); }}
                    />
                ) : activeView === 'favorites' ? (
                    <section className="recipes-section">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">Favoritas</p>
                                <h2>Tus recetas guardadas, siempre a mano</h2>
                                <p className="section-copy">
                                    Al crear una cuenta podrás guardar las recetas que más te gusten y encontrarlas aquí.
                                </p>
                            </div>
                        </div>
                        <div className="empty-state demo-empty-state">
                            <strong>Esta sección es personal.</strong>
                            <p>Explora una receta destacada y prueba el botón «Agregar a favoritas» para descubrir cómo funciona.</p>
                            <div className="demo-empty-actions">
                                <button type="button" className="secondary-inline-button" onClick={() => setActiveView('featured')}>
                                    Explorar recetas
                                </button>
                                <button type="button" className="primary-button" onClick={() => setAuthAction('guardar tus recetas favoritas')}>
                                    Guardar mis favoritas
                                </button>
                            </div>
                        </div>
                    </section>
                ) : serverStatus !== 'ready' ? (
                    <div className="loading-state">Las recetas públicas aparecerán cuando el servidor esté disponible. Puedes explorar «Mis recetas» mientras tanto.</div>
                ) : loading ? (
                    <div className="loading-state">Cargando recetas...</div>
                ) : (
                    <FeaturedRecipes
                        recipes={filteredRecipes}
                        eyebrow={activeView === 'featured' ? 'Destacadas' : 'Recientes'}
                        title={filtersAreEmpty
                            ? activeView === 'featured' ? 'Recetas destacadas' : 'Recetas recientes'
                            : 'Resultados de búsqueda'}
                        copy={filtersAreEmpty
                            ? 'Selecciona una receta para revisar sus detalles y conocer las funciones disponibles.'
                            : 'Resultados encontrados entre las recetas públicas disponibles.'}
                        onSelectRecipe={(recipe) => void handleSelectRecipe(recipe)}
                    />
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
                onAuthRequired={setAuthAction}
                onClose={closeDetail}
            />
            {authAction && (
                <div className="modal-backdrop demo-auth-backdrop" role="presentation" onMouseDown={() => setAuthAction(null)}>
                    <section
                        className="demo-auth-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="demo-auth-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <button type="button" className="demo-auth-close" aria-label="Cerrar" onClick={() => setAuthAction(null)}>
                            ×
                        </button>
                        <p className="eyebrow">Función para usuarios registrados</p>
                        <h2 id="demo-auth-title">Crea una cuenta para continuar</h2>
                        <p>Para {authAction} debes registrarte o iniciar sesión. En el modo demo no se guardan cambios.</p>
                        <div className="demo-auth-actions">
                            <button type="button" className="primary-button" onClick={() => void navigate('/register')}>
                                Crear cuenta gratis
                            </button>
                            <button type="button" className="secondary-inline-button" onClick={() => void navigate('/login')}>
                                Ya tengo cuenta
                            </button>
                        </div>
                        <button type="button" className="demo-auth-dismiss" onClick={() => setAuthAction(null)}>
                            Seguir explorando
                        </button>
                    </section>
                </div>
            )}
        </div>
    );
};

export default Demo;
