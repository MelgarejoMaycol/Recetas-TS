# Recetas-TS

Aplicación de recetas construida con React + TypeScript + Vite.

Demo desplegada: https://recetas-ts.vercel.app/

Autor:
- Maycol Melgarejo — mfmelgarejo04@gmail.com

Resumen:
- Frontend con Vite, React 19 y TypeScript
- Rutas con `react-router-dom`
- ESLint + Type-aware rules (typescript-eslint)
- Traducción de textos a español en tiempo de ejecución (`src/utils/recipeText.ts`)

Scripts importantes:
- `npm run dev` — arranca el servidor de desarrollo
- `npm run lint` — ejecuta ESLint
- `npm run build` — compila para producción (TypeScript + Vite build)
- `npm run check` — `lint` + `build`

Archivos importantes:
- `src/` — código fuente React/TSX
- `src/config/consultas.tsx` — cliente API y utilidades de red
- `src/utils/recipeText.ts` — utilidades de traducción e interfaz de presentación
- `src/styles/App.css` — estilos principales
- `.github/workflows/ci.yml` — workflow CI para lint y build

Notas de despliegue:
- La CI en GitHub Actions usa Node.js 20 para compatibilidad con Vite y dependencias.
- Si usas Vercel, la app ya está desplegada en la URL indicada.

Contactar:
- Maycol Melgarejo — mfmelgarejo04@gmail.com

