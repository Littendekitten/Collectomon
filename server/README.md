# Collectomon Render API

See the project-root `RENDER-SETUP.md` for deployment instructions.

Local run:

1. `npm install`
2. Create a Firebase service-account JSON file outside version control.
3. Set `FIREBASE_PROJECT_ID=kitacat-collectomon` and `FIREBASE_SERVICE_ACCOUNT_FILE=/absolute/path/to/service-account.json`.
4. Set `ALLOWED_ORIGINS` to the local website origin and the GitHub Pages origin.
5. `npm start`

Health check: `GET /health`.
