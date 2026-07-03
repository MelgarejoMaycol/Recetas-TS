import React, { useMemo, useState } from 'react';
import type { ActualizarRecetaPayload, CategoriaReceta, CrearRecetaCompletaPayload, IngredienteCatalogo, Receta } from '../config/consultas';
import { translateValue } from '../utils/recipeText';
import RecipeCard from './RecipeCard';

interface MyRecipesProps {
    recipes: Receta[];
    categories: CategoriaReceta[];
    ingredientsCatalog: IngredienteCatalogo[];
    onCreate: (payload: CrearRecetaCompletaPayload, onProgress?: (progress: number) => void) => Promise<void>;
    onUpdate: (recipeId: number, payload: ActualizarRecetaPayload, onProgress?: (progress: number) => void) => Promise<void>;
    onDelete: (recipeId: number) => Promise<void>;
    onSelectRecipe?: (recipe: Receta) => void;
}

const emptyRecipe = {
    nombre: '',
    descripcion: '',
    pais: '',
    tiempo_preparacion: 0,
    porciones: 1,
    dificultad: 'Facil',
    categoria_id: 0,
};

const MyRecipes = ({ recipes, categories, ingredientsCatalog, onCreate, onUpdate, onDelete, onSelectRecipe }: MyRecipesProps) => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyRecipe);
    const [editingRecipe, setEditingRecipe] = useState<Receta | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ingredients, setIngredients] = useState([{ ingrediente_id: 0, cantidad: '', unidad: '' }]);
    const [steps, setSteps] = useState([{ descripcion: '' }]);

    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        [categories],
    );
    const sortedIngredients = useMemo(
        () => [...ingredientsCatalog].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        [ingredientsCatalog],
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        const numericFields = ['tiempo_preparacion', 'porciones', 'categoria_id'];
        setForm((prev) => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
    };

    const handleFile = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        setImageFile(file);
    };

    const resetForm = () => {
        setForm(emptyRecipe);
        setEditingRecipe(null);
        setImageFile(null);
        setIngredients([{ ingrediente_id: 0, cantidad: '', unidad: '' }]);
        setSteps([{ descripcion: '' }]);
        setUploadProgress(0);
    };

    const validIngredients = ingredients.filter((ingredient) => ingredient.ingrediente_id > 0 && ingredient.cantidad.trim().length > 0);
    const validSteps = steps.filter((step) => step.descripcion.trim().length >= 2);
    const isEditing = Boolean(editingRecipe);
    const canSubmit = Boolean(
        form.nombre.trim().length >= 2 &&
        form.descripcion.trim().length >= 1 &&
        form.pais.trim().length >= 2 &&
        form.tiempo_preparacion > 0 &&
        form.porciones > 0 &&
        form.dificultad.trim().length >= 2 &&
        form.categoria_id > 0 &&
        (isEditing || imageFile) &&
        (isEditing || validIngredients.length > 0) &&
        (isEditing || validSteps.length > 0) &&
        !isSubmitting,
    );

    const startEdit = (recipe: Receta) => {
        setEditingRecipe(recipe);
        setForm({
            nombre: recipe.nombre || '',
            descripcion: recipe.descripcion || '',
            pais: recipe.pais || '',
            tiempo_preparacion: Number(recipe.tiempo_preparacion || 0),
            porciones: Number(recipe.porciones || 1),
            dificultad: recipe.dificultad || 'Facil',
            categoria_id: Number(recipe.categoria_id || 0),
        });
        setImageFile(null);
        setIngredients([{ ingrediente_id: 0, cantidad: '', unidad: '' }]);
        setSteps([{ descripcion: '' }]);
        setUploadProgress(0);
        setShowForm(true);
    };

    const handleDelete = async (recipe: Receta) => {
        const confirmed = window.confirm(`Eliminar la receta "${recipe.nombre}"?`);
        if (!confirmed) return;
        await onDelete(recipe.id);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        setUploadProgress(1);
        try {
            if (editingRecipe) {
                await onUpdate(editingRecipe.id, { ...form, imagen: imageFile }, setUploadProgress);
            } else {
                await onCreate(
                    {
                        ...form,
                        imagen: imageFile,
                        ingredientes: validIngredients,
                        preparaciones: validSteps,
                    },
                    setUploadProgress,
                );
            }
            setShowForm(false);
            resetForm();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="recipes-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Mis recetas</p>
                    <h2>Recetas propias</h2>
                    <p className="section-copy">Crea recetas completas y administra tus publicaciones.</p>
                </div>
                <button className="primary-button" type="button" onClick={() => {
                    if (showForm) {
                        setShowForm(false);
                        resetForm();
                    } else {
                        setShowForm(true);
                    }
                }}>
                    {showForm ? 'Cerrar formulario' : 'Crear receta'}
                </button>
            </div>

            {showForm && (
                <form className="create-form create-form--rich" onSubmit={handleSubmit}>
                    <div
                        className={`image-dropzone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setIsDragging(false);
                            handleFile(event.dataTransfer.files[0]);
                        }}
                    >
                        <input
                            id="recipe-image"
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />
                        <label htmlFor="recipe-image">
                            <strong>{imageFile ? imageFile.name : editingRecipe ? 'Imagen actual o selecciona una nueva' : 'Arrastra una imagen o seleccionala'}</strong>
                            <span>{editingRecipe ? 'Opcional al editar.' : 'PNG, JPG o WEBP desde tu PC.'}</span>
                        </label>
                    </div>

                    {isSubmitting && (
                        <div className="upload-progress" aria-label="Progreso de subida">
                            <span style={{ width: `${uploadProgress}%` }} />
                        </div>
                    )}

                    <div className="grid-two">
                        <label>
                            Nombre
                            <input name="nombre" value={form.nombre} onChange={handleChange} required />
                        </label>
                        <label>
                            Pais
                            <input name="pais" value={form.pais} onChange={handleChange} required />
                        </label>
                    </div>

                    <label>
                        Descripcion
                        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required />
                    </label>

                    <div className="grid-four">
                        <label>
                            Categoria
                            <select name="categoria_id" value={form.categoria_id} onChange={handleChange} required>
                                <option value={0}>Selecciona</option>
                                {sortedCategories.map((category) => (
                                    <option key={category.id} value={category.id}>{translateValue(category.nombre)}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Dificultad
                            <select name="dificultad" value={form.dificultad} onChange={handleChange} required>
                                <option value="Facil">Facil</option>
                                <option value="Media">Media</option>
                                <option value="Dificil">Dificil</option>
                            </select>
                        </label>
                        <label>
                            Tiempo
                            <input name="tiempo_preparacion" type="number" min={1} value={form.tiempo_preparacion} onChange={handleChange} required />
                        </label>
                        <label>
                            Porciones
                            <input name="porciones" type="number" min={1} value={form.porciones} onChange={handleChange} required />
                        </label>
                    </div>

                    {!editingRecipe && (
                    <div className="form-subsection">
                        <div className="subsection-title">
                            <h3>Ingredientes</h3>
                            <button
                                type="button"
                                className="secondary-inline-button"
                                onClick={() => setIngredients((prev) => [...prev, { ingrediente_id: 0, cantidad: '', unidad: '' }])}
                            >
                                Agregar
                            </button>
                        </div>
                        {ingredients.map((ingredient, index) => (
                            <div className="ingredient-row" key={`ingredient-${index}`}>
                                <select
                                    value={ingredient.ingrediente_id}
                                    onChange={(event) => setIngredients((prev) => prev.map((item, itemIndex) => (
                                        itemIndex === index ? { ...item, ingrediente_id: Number(event.target.value) } : item
                                    )))}
                                >
                                    <option value={0}>Ingrediente</option>
                                    {sortedIngredients.map((item) => (
                                        <option key={item.id} value={item.id}>{translateValue(item.nombre)}</option>
                                    ))}
                                </select>
                                <input
                                    value={ingredient.cantidad}
                                    onChange={(event) => setIngredients((prev) => prev.map((item, itemIndex) => (
                                        itemIndex === index ? { ...item, cantidad: event.target.value } : item
                                    )))}
                                    placeholder="Cantidad"
                                />
                                <input
                                    value={ingredient.unidad}
                                    onChange={(event) => setIngredients((prev) => prev.map((item, itemIndex) => (
                                        itemIndex === index ? { ...item, unidad: event.target.value } : item
                                    )))}
                                    placeholder="Unidad"
                                />
                                <button
                                    type="button"
                                    className="icon-text-button"
                                    onClick={() => setIngredients((prev) => prev.length > 1 ? prev.filter((_, itemIndex) => itemIndex !== index) : prev)}
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>
                    )}

                    {!editingRecipe && (
                    <div className="form-subsection">
                        <div className="subsection-title">
                            <h3>Elaboracion</h3>
                            <button
                                type="button"
                                className="secondary-inline-button"
                                onClick={() => setSteps((prev) => [...prev, { descripcion: '' }])}
                            >
                                Agregar paso
                            </button>
                        </div>
                        {steps.map((step, index) => (
                            <div className="step-row" key={`step-${index}`}>
                                <span>{index + 1}</span>
                                <textarea
                                    value={step.descripcion}
                                    onChange={(event) => setSteps((prev) => prev.map((item, itemIndex) => (
                                        itemIndex === index ? { descripcion: event.target.value } : item
                                    )))}
                                    placeholder="Describe este paso"
                                />
                                <button
                                    type="button"
                                    className="icon-text-button"
                                    onClick={() => setSteps((prev) => prev.length > 1 ? prev.filter((_, itemIndex) => itemIndex !== index) : prev)}
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>
                    )}

                    <button className="primary-button" type="submit" disabled={!canSubmit}>
                        {isSubmitting ? 'Guardando receta...' : editingRecipe ? 'Actualizar receta' : 'Guardar receta'}
                    </button>
                </form>
            )}

            <div className="recipe-grid">
                {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <div key={recipe.id} className="owned-recipe-item">
                            <RecipeCard recipe={recipe} variant="owned" onSelect={onSelectRecipe} />
                            <div className="owned-recipe-actions">
                                <button type="button" className="secondary-inline-button" onClick={() => startEdit(recipe)}>
                                    Editar
                                </button>
                                <button type="button" className="icon-text-button" onClick={() => handleDelete(recipe)}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">Aun no hay recetas propias que coincidan con los filtros.</div>
                )}
            </div>
        </section>
    );
};

export default MyRecipes;
