# Dunita Backend

Backend API for the Dunita marketing page.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your database URL:
   ```
   DATABASE_URL=your_neon_database_url
   ```

3. Run the server:
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/subscribe` - Subscribe with email
- `GET /api/subscribers` - Get all subscribers (admin)

## Test de funcionamiento

Puedes ejecutar el test de suscripción desde el directorio `backend`:

```bash
npm run test:subscribe
```

También puedes probar con un email personalizado:

```bash
node test-subscribe.js tu-email@ejemplo.com
```
