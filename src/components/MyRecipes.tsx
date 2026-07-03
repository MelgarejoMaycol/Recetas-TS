import React, { useState } from 'react';
import type { Receta } from '../config/consultas';
import RecipeCard from './RecipeCard';

interface MyRecipesProps {
    recipes: Receta[];
    onCreate: (payload: Omit<Receta, 'id'>) => Promise<void>;
    onSelectRecipe?: (recipe: Receta) => void;
}

const emptyRecipe: Omit<Receta, 'id'> = {
    nombre: '',
    descripcion: '',
    pais: '',
    imagen_url: '',
    tiempo_preparacion: 0,
    porciones: 1,
    dificultad: 'Facil',
    categoria_id: 1,
};

const MyRecipes = ({ recipes, onCreate, onSelectRecipe }: MyRecipesProps) => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Omit<Receta, 'id'>>(emptyRecipe);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        const numericFields = ['tiempo_preparacion', 'porciones', 'categoria_id'];
        setForm((prev) => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreate(form);
        setShowForm(false);
        setForm(emptyRecipe);
    };

    return (
        <section className="recipes-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Mis recetas</p>
                    <h2>Recetas propias</h2>
                    <p className="section-copy">Tu lista personal ahora vive en una pestana separada, mas limpia y facil de revisar.</p>
                </div>
                <button className="primary-button" type="button" onClick={() => setShowForm((prev) => !prev)}>
                    {showForm ? 'Cerrar formulario' : 'Crear receta'}
                </button>
            </div>

            {showForm && (
                <form className="create-form" onSubmit={handleSubmit}>
                    <label>
                        Nombre
                        <input name="nombre" value={form.nombre} onChange={handleChange} required />
                    </label>
                    <label>
                        Descripcion
                        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required />
                    </label>
                    <div className="grid-two">
                        <label>
                            Pais
                            <input name="pais" value={form.pais} onChange={handleChange} required />
                        </label>
                        <label>
                            Imagen URL
                            <input name="imagen_url" value={form.imagen_url} onChange={handleChange} />
                        </label>
                    </div>
                    <div className="grid-three">
                        <label>
                            Tiempo
                            <input name="tiempo_preparacion" type="number" min={1} value={form.tiempo_preparacion} onChange={handleChange} required />
                        </label>
                        <label>
                            Porciones
                            <input name="porciones" type="number" min={1} value={form.porciones} onChange={handleChange} required />
                        </label>
                        <label>
                            Categoria ID
                            <input name="categoria_id" type="number" min={1} value={form.categoria_id} onChange={handleChange} required />
                        </label>
                    </div>
                    <label>
                        Dificultad
                        <select name="dificultad" value={form.dificultad} onChange={handleChange} required>
                            <option value="Facil">Facil</option>
                            <option value="Media">Media</option>
                            <option value="Dificil">Dificil</option>
                        </select>
                    </label>
                    <button className="primary-button" type="submit">Guardar receta</button>
                </form>
            )}

            <div className="recipe-grid">
                {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} variant="owned" onSelect={onSelectRecipe} />
                    ))
                ) : (
                    <div className="empty-state">Aun no hay recetas propias que coincidan con los filtros.</div>
                )}
            </div>
        </section>
    );
};

export default MyRecipes;
