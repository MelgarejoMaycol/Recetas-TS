import test from 'node:test'
import assert from 'node:assert/strict'
import {
  translateValue, translateText, getRecipeDisplay, getAverageRating,
  getIngredientDisplay, getStepDisplay, getRecipeSearchText
} from '../src/utils/recipeText.ts'
import type { Receta, IngredienteReceta, PreparacionReceta } from '../src/config/consultas.tsx'

const receta: Receta = {
  id: 1, nombre: 'Chicken', descripcion: 'Put the eggs, bacon and ham to fry.',
  pais: 'Mexican', imagen_url: '', tiempo_preparacion: 30,
  porciones: 2, dificultad: 'Easy', categoria_id: 1, nombre_categoria: 'Breakfast',
  calificacion_promedio: '4.6'
}

test('traducciones conocidas y valores de reserva', () => {
  assert.equal(translateValue('  CHICKEN '), 'Pollo')
  assert.equal(translateValue(''), '')
  assert.equal(translateValue(null), '')
  assert.equal(translateValue('ingrediente nuevo'), 'ingrediente nuevo')
  assert.equal(translateText('Put the eggs, bacon and ham to fry.'), 'Fríe los huevos, la tocineta y el jamón.')
})

test('presentación de receta con tipos y valores normalizados', () => {
  assert.deepEqual(getRecipeDisplay(receta), {
    name: 'Pollo', description: 'Fríe los huevos, la tocineta y el jamón.',
    country: 'México', difficulty: 'Fácil', category: 'Desayuno'
  })
  assert.deepEqual(getRecipeDisplay({ ...receta, nombre: '', descripcion: '' }), {
    name: 'Receta sin nombre', description: 'Sin descripcion disponible.',
    country: 'México', difficulty: 'Fácil', category: 'Desayuno'
  })
})

test('calificación numérica y valores no finitos', () => {
  assert.equal(getAverageRating(receta), 4.6)
  assert.equal(getAverageRating({ ...receta, calificacion_promedio: null }), 0)
  assert.equal(getAverageRating({ ...receta, calificacion_promedio: 'texto' }), 0)
  assert.equal(getAverageRating({ ...receta, calificacion_promedio: Infinity }), 0)
})

test('ingredientes y pasos de preparación', () => {
  const ingrediente: IngredienteReceta = {
    id: 1, cantidad: '2', unidad: 'cups', ingrediente_id: 5,
    nombre_ingrediente: 'Eggs', categoria_id: 2, nombre_categoria: 'General',
    receta_id: 1
  }
  assert.deepEqual(getIngredientDisplay(ingrediente), {
    name: 'Huevos', category: 'General', amount: '2 tazas'
  })
  const paso: PreparacionReceta = { id: 1, receta_id: 1, numero_paso: 1, descripcion: 'Put the eggs, bacon and ham to fry.' }
  assert.equal(getStepDisplay(paso), 'Fríe los huevos, la tocineta y el jamón.')
})

test('búsqueda combina el texto original y el traducido', () => {
  const texto = getRecipeSearchText(receta)
  assert.ok(texto.includes('chicken'))
  assert.ok(texto.includes('pollo'))
  assert.ok(texto.includes('mexican'))
  assert.ok(texto.includes('méxico'))
  assert.ok(texto.includes('desayuno'))
})
