# Aurora Spa (Together Spa)

App web full stack para un spa de bienestar en compañía: sitio público, catálogo desde base de datos,
formulario de reservas real, panel de administrador con login (JWT) y asistente de IA.

## Correr en local
1. `cd backend && npm install`
2. Copia `.env.example` a `.env` y llena los valores.
3. `npm run seed` (una vez) y luego `npm run dev`.
4. Abre `frontend/index.html` con Live Server (puerto 5500).

## Publicar
- **Base de datos:** MongoDB Atlas (gratis). En *Network Access* permite acceso desde Render.
- **Backend:** Render → New Web Service → repo → *Root Directory* `backend`,
  *Build* `npm install`, *Start* `npm start`. Carga las variables del `.env.example` en *Environment*.
  Ejecuta `npm run seed` una vez desde la pestaña *Shell* (o localmente apuntando a la misma MONGODB_URI).
- **Frontend:** GitHub Pages → Settings → Pages → rama `main`, carpeta `/frontend`
  (si la opción no aparece, usa una rama `gh-pages` con el contenido de `frontend/`).
- Pon la URL de Render en `frontend/js/config.js` y la URL de GitHub Pages en `FRONTEND_ORIGIN` de Render.
