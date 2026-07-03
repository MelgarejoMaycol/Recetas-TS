import ApoiLink from './LinkApi';

export interface RegistroData {
    nombre: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    id: number;
    nombre: string;
    email: string;
}

export interface Receta {
    id: number;
    nombre: string;
    descripcion: string;
    pais: string;
    imagen_url: string;
    tiempo_preparacion: number;
    porciones: number;
    dificultad: string;
    categoria_id: number;
    usuario_id?: number;
    fecha_creacion?: string;
    nombre_usuario?: string;
    nombre_categoria?: string;
    calificacion_promedio?: number | string | null;
    total_comentarios?: number;
    total_calificaciones?: number;
}

export interface RecetasResponse {
    data: Receta[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface IngredienteReceta {
    id: number;
    cantidad: string | null;
    unidad: string | null;
    ingrediente_id: number;
    nombre_ingrediente: string;
    categoria_id: number;
    nombre_categoria: string;
    receta_id: number;
}

export interface PreparacionReceta {
    id: number;
    receta_id: number;
    numero_paso: number;
    descripcion: string;
}

export interface ComentarioReceta {
    id: number;
    receta_id: number;
    usuario_id: number;
    comentario: string;
    calificacion: number;
    fecha_creacion: string;
    nombre_usuario?: string;
}

export interface RecipeDetail {
    recipe: Receta;
    ingredients: IngredienteReceta[];
    preparations: PreparacionReceta[];
    comments: ComentarioReceta[];
    favoriteCount: number;
}

export interface FavoritoUsuario {
    id: number;
    usuario_id: number;
    receta_id: number;
    nombre_receta?: string;
}

export interface ComentarioPayload {
    receta_id: number;
    comentario: string;
    calificacion: number;
}

export interface CategoriaReceta {
    id: number;
    nombre: string;
}

export interface IngredienteCatalogo {
    id: number;
    nombre: string;
    categoria_id: number;
    nombre_categoria?: string;
}

export interface RecetaIngredientePayload {
    ingrediente_id: number;
    cantidad: string;
    unidad: string;
}

export interface PreparacionPayload {
    descripcion: string;
}

export interface CrearRecetaCompletaPayload extends Omit<Receta, 'id' | 'imagen_url'> {
    imagen?: File | null;
    ingredientes: RecetaIngredientePayload[];
    preparaciones: PreparacionPayload[];
}

export interface ActualizarRecetaPayload extends Omit<Receta, 'id' | 'imagen_url'> {
    imagen?: File | null;
}

export interface ApiResponse<T = unknown> {
    mensaje?: string;
    usuario?: User;
    token?: string;
    data?: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface ApiError extends Error {
    status?: number;
    response?: unknown;
}

async function parseResponse<T = unknown>(response: Response): Promise<T> {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(json?.mensaje || json?.error || 'Error del servidor') as ApiError;
        error.status = response.status;
        error.response = json;
        throw error;
    }
    return json;
}

export async function registroUsuario(payload: RegistroData): Promise<ApiResponse> {
    const response = await fetch(`${ApoiLink}/api/usuarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return parseResponse<ApiResponse>(response);
}

export async function loginUsuario(payload: LoginData): Promise<ApiResponse> {
    const response = await fetch(`${ApoiLink}/api/usuarios/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return parseResponse<ApiResponse>(response);
}

export async function obtenerUsuarioLogeado(token: string): Promise<User> {
    const response = await fetch(`${ApoiLink}/api/usuarios/me`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const result = await parseResponse<ApiResponse<User> | User>(response);
    if (result && typeof result === 'object' && 'usuario' in result && result.usuario) {
        return result.usuario;
    }

    if (result && typeof result === 'object' && 'id' in result && 'nombre' in result && 'email' in result) {
        return result as User;
    }

    throw new Error('Respuesta de perfil inválida.');
}

export async function obtenerRecetasPublicas(): Promise<RecetasResponse> {
    const response = await fetch(`${ApoiLink}/api/recetas?page=1&limit=9`, {
        method: 'GET',
    });
    return parseResponse<RecetasResponse>(response);
}

async function obtenerListaPaginada<T>(path: string, limit = 100, token?: string): Promise<T[]> {
    let page = 1;
    let totalPages = 1;
    const items: T[] = [];

    do {
        const separator = path.includes('?') ? '&' : '?';
        const response = await fetch(`${ApoiLink}${path}${separator}page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const result = await parseResponse<{ data?: T[]; pagination?: RecetasResponse['pagination'] }>(response);
        items.push(...(result.data ?? []));
        totalPages = result.pagination?.totalPages ?? (result.data?.length === limit ? page + 1 : page);
        page += 1;
    } while (page <= totalPages);

    return items;
}

export async function obtenerTodasLasRecetasPublicas(): Promise<Receta[]> {
    return obtenerListaPaginada<Receta>('/api/recetas');
}

export async function obtenerRecetasMasValoradas(page = 1, limit = 10): Promise<RecetasResponse> {
    const response = await fetch(`${ApoiLink}/api/recetas/mas-valoradas?page=${page}&limit=${limit}`, {
        method: 'GET',
    });
    return parseResponse<RecetasResponse>(response);
}

export async function obtenerRecetasRecientes(page = 1, limit = 10): Promise<RecetasResponse> {
    const response = await fetch(`${ApoiLink}/api/recetas/recientes?page=${page}&limit=${limit}`, {
        method: 'GET',
    });
    return parseResponse<RecetasResponse>(response);
}

export async function obtenerRecetasMasRelevantes(): Promise<RecetasResponse> {
    const response = await fetch(`${ApoiLink}/api/comentarios/mejores-recetas`, {
        method: 'GET',
    });

    const result = await parseResponse<RecetasResponse | Receta[]>(response);
    const recipes = Array.isArray(result) ? result : result.data ?? [];

    if (recipes.length > 0) {
        return { data: recipes, pagination: Array.isArray(result) ? undefined : result.pagination };
    }

    return obtenerRecetasPublicas();
}

export async function obtenerMisRecetas(usuarioId: number, token: string): Promise<RecetasResponse> {
    const response = await fetch(`${ApoiLink}/api/recetas/mis-recetas/${usuarioId}?page=1&limit=10`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return parseResponse<RecetasResponse>(response);
}

function enviarRecetaFormData(
    payload: CrearRecetaCompletaPayload | ActualizarRecetaPayload,
    token: string,
    options: { method: 'POST' | 'PUT'; path: string; onProgress?: (progress: number) => void },
): Promise<Receta> {
    const formData = new FormData();
    formData.append('nombre', payload.nombre);
    formData.append('descripcion', payload.descripcion);
    formData.append('pais', payload.pais);
    formData.append('tiempo_preparacion', String(payload.tiempo_preparacion));
    formData.append('porciones', String(payload.porciones));
    formData.append('dificultad', payload.dificultad);
    formData.append('categoria_id', String(payload.categoria_id));

    if (payload.imagen) {
        formData.append('imagen', payload.imagen);
    }

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(options.method, `${ApoiLink}${options.path}`);
        request.setRequestHeader('Authorization', `Bearer ${token}`);

        request.upload.onprogress = (event) => {
            if (event.lengthComputable && options.onProgress) {
                options.onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        request.onload = () => {
            const json = JSON.parse(request.responseText || '{}');
            if (request.status < 200 || request.status >= 300) {
                reject(new Error(json?.mensaje || json?.detalle || 'Error al guardar receta'));
                return;
            }

            resolve(json.receta ?? json);
        };

        request.onerror = () => reject(new Error('No fue posible subir la receta.'));
        request.send(formData);
    });
}

export async function obtenerCategoriasRecetas(): Promise<CategoriaReceta[]> {
    return obtenerListaPaginada<CategoriaReceta>('/api/categorias-recetas');
}

export async function obtenerIngredientesCatalogo(): Promise<IngredienteCatalogo[]> {
    return obtenerListaPaginada<IngredienteCatalogo>('/api/ingredientes');
}

export async function agregarIngredienteAReceta(recetaId: number, ingrediente: RecetaIngredientePayload, token: string): Promise<void> {
    const response = await fetch(`${ApoiLink}/api/recetas-ingredientes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            receta_id: recetaId,
            ingrediente_id: ingrediente.ingrediente_id,
            cantidad: ingrediente.cantidad,
            unidad: ingrediente.unidad || undefined,
        }),
    });

    await parseResponse(response);
}

export async function agregarPreparacionAReceta(recetaId: number, preparacion: PreparacionPayload, index: number, token: string): Promise<void> {
    const response = await fetch(`${ApoiLink}/api/preparaciones`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            receta_id: recetaId,
            numero_paso: index + 1,
            descripcion: preparacion.descripcion,
        }),
    });

    await parseResponse(response);
}

export async function crearReceta(
    payload: CrearRecetaCompletaPayload,
    token: string,
    onProgress?: (progress: number) => void,
): Promise<Receta> {
    const recipe = await enviarRecetaFormData(payload, token, { method: 'POST', path: '/api/recetas', onProgress });

    await Promise.all([
        ...payload.ingredientes.map((ingredient) => agregarIngredienteAReceta(recipe.id, ingredient, token)),
        ...payload.preparaciones.map((preparation, index) => agregarPreparacionAReceta(recipe.id, preparation, index, token)),
    ]);

    onProgress?.(100);
    return recipe;
}

export async function actualizarReceta(
    recipeId: number,
    payload: ActualizarRecetaPayload,
    token: string,
    onProgress?: (progress: number) => void,
): Promise<Receta> {
    const recipe = await enviarRecetaFormData(payload, token, { method: 'PUT', path: `/api/recetas/${recipeId}`, onProgress });
    onProgress?.(100);
    return recipe;
}

export async function eliminarReceta(recipeId: number, token: string): Promise<void> {
    const response = await fetch(`${ApoiLink}/api/recetas/${recipeId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    await parseResponse(response);
}

export async function obtenerFavoritosUsuario(usuarioId: number, token: string): Promise<FavoritoUsuario[]> {
    return obtenerListaPaginada<FavoritoUsuario>(`/api/favoritos/usuario/${usuarioId}`, 100, token);
}

export async function crearFavorito(recetaId: number, token: string): Promise<FavoritoUsuario> {
    const response = await fetch(`${ApoiLink}/api/favoritos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receta_id: recetaId }),
    });

    const result = await parseResponse<{ favorito: FavoritoUsuario }>(response);
    return result.favorito;
}

export async function eliminarFavorito(usuarioId: number, recetaId: number, token: string): Promise<void> {
    const response = await fetch(`${ApoiLink}/api/favoritos/usuario/${usuarioId}/receta/${recetaId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    await parseResponse(response);
}

export async function crearComentario(payload: ComentarioPayload, token: string): Promise<ComentarioReceta> {
    const response = await fetch(`${ApoiLink}/api/comentarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const result = await parseResponse<{ comentario: ComentarioReceta }>(response);
    return result.comentario;
}

export async function obtenerComentariosReceta(recetaId: number): Promise<ComentarioReceta[]> {
    return obtenerListaPaginada<ComentarioReceta>(`/api/comentarios/receta/${recetaId}`, 100);
}

export async function enriquecerRecetasConValoraciones(recipes: Receta[]): Promise<Receta[]> {
    const enriched = await Promise.all(recipes.map(async (recipe) => {
        const backendAverage = Number(recipe.calificacion_promedio);
        if (Number.isFinite(backendAverage) && backendAverage > 0) {
            return {
                ...recipe,
                calificacion_promedio: backendAverage,
                total_comentarios: recipe.total_comentarios ?? recipe.total_calificaciones,
            };
        }

        const comments = await obtenerComentariosReceta(recipe.id).catch(() => []);
        const validRatings = comments
            .map((comment) => Number(comment.calificacion))
            .filter((rating) => Number.isFinite(rating) && rating > 0);
        const average = validRatings.length > 0
            ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
            : 0;

        return {
            ...recipe,
            calificacion_promedio: average,
            total_comentarios: comments.length,
        };
    }));

    return enriched.sort((a, b) => Number(b.calificacion_promedio || 0) - Number(a.calificacion_promedio || 0));
}

export async function obtenerDetalleReceta(recetaId: number): Promise<RecipeDetail> {
    const [recipe, ingredients, preparations, comments, favorites] = await Promise.all([
        fetch(`${ApoiLink}/api/recetas/${recetaId}`, { method: 'GET' }).then((response) => parseResponse<Receta>(response)),
        obtenerListaPaginada<IngredienteReceta>(`/api/recetas-ingredientes/receta/${recetaId}`, 100),
        obtenerListaPaginada<PreparacionReceta>(`/api/preparaciones/receta/${recetaId}`, 100),
        obtenerComentariosReceta(recetaId),
        fetch(`${ApoiLink}/api/favoritos/receta/${recetaId}/count`, { method: 'GET' })
            .then((response) => parseResponse<{ total_favoritos?: number }>(response))
            .catch(() => ({ total_favoritos: 0 })),
    ]);

    return {
        recipe,
        ingredients,
        preparations: preparations.sort((a, b) => a.numero_paso - b.numero_paso),
        comments,
        favoriteCount: favorites.total_favoritos ?? 0,
    };
}

