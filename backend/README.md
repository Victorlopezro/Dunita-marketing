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