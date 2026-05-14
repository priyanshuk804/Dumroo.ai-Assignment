-- 1. Drop the old function and table
DROP FUNCTION IF EXISTS match_documents;
DROP TABLE IF EXISTS book_chunks;

-- 2. Re-create the table with 3072 dimensions for Gemini
CREATE TABLE book_chunks (
  id uuid primary key default gen_random_uuid(),
  content text,
  embedding vector(3072)
);

-- 3. Re-create the matching function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    book_chunks.id,
    book_chunks.content,
    1 - (book_chunks.embedding <=> query_embedding) AS similarity
  FROM book_chunks
  WHERE 1 - (book_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY book_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;
