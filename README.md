# Dumroo AI Assignment - Stir

This is a MERN stack application (Node.js, Express, React, PostgreSQL) migrated to use **Google Gemini AI** for embeddings and conversational RAG (Retrieval-Augmented Generation).

## Features
- PDF Upload and Processing
- Text Extraction and Chunking
- Gemini Embeddings (`text-embedding-004`)
- Vector Search with pgvector
- Conversational AI using Gemini 2.0 Flash

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with `pgvector`
- **AI**: Google Gemini API

## Setup Instructions

### Backend
1. Go to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file with:
   ```env
   PORT=5000
   DATABASE_URL=your_postgresql_url
   GEMINI_API_KEY=your_google_ai_key
   ```
4. Run migrations: `psql -f gemini_migration.sql`

### Frontend
1. Go to the `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Deployment
This project is configured for easy deployment on platforms like Vercel or Render.
