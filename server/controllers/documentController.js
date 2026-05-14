const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { splitTextIntoChunks } = require('../utils/textSplitter');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Controller to handle PDF upload, text extraction, chunking, embedding, and storage.
 */
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase configuration is missing.' });
    }

    const pdfBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    
    // Generate a safe, ASCII-only filename to avoid "Invalid key" errors with Hindi/Sanskrit/Unicode filenames
    const safeFileName = Date.now() + "-" + Math.random().toString(36).slice(2) + ".pdf";

    // 1. Upload PDF to Supabase Storage bucket
    const { error: storageError } = await supabase.storage
      .from("Books")
      .upload(safeFileName, pdfBuffer, {
        contentType: "application/pdf",
      });

    if (storageError) {
      console.error('Supabase storage error:', storageError);
      throw new Error(`Failed to upload PDF to storage: ${storageError.message}`);
    }

    // 2. Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim() === '') {
      return res.status(400).json({ error: 'Could not extract text from the PDF. It might be empty or a scanned image.' });
    }

    // 3. Split text into chunks (Optimized: larger chunks reduce API calls)
    const chunks = splitTextIntoChunks(extractedText, 3000, 500);
    
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No valid text chunks could be generated.' });
    }

    console.log(`PDF extracted successfully. Total chunks to process: ${chunks.length}`);

    // 4. Generate embeddings in batches (Max 100 per request for Gemini)
    const BATCH_SIZE = 30; // Reduced batch size for better stability
    const allRecords = [];
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`);

      let retries = 0;
      const maxRetries = 5;
      let success = false;

      while (retries < maxRetries && !success) {
        try {
          const batchResponse = await embeddingModel.batchEmbedContents({
            requests: batchChunks.map(chunk => ({
              content: { role: 'user', parts: [{ text: chunk }] },
              model: "models/text-embedding-004"
            }))
          });

          const embeddings = batchResponse.embeddings;
          
          batchChunks.forEach((chunk, index) => {
            allRecords.push({
              content: chunk,
              embedding: embeddings[index].values
            });
          });
          
          success = true;
          // Add a small delay after a successful batch to avoid hitting RPM limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (geminiError) {
          if (geminiError.message.includes('429') || geminiError.message.includes('quota')) {
            retries++;
            const waitTime = Math.pow(2, retries) * 2000; // Exponential backoff: 4s, 8s, 16s...
            console.log(`Rate limited on batch ${Math.floor(i / BATCH_SIZE) + 1}. Waiting ${waitTime}ms before retry ${retries}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            console.error(`Unexpected error in batch ${i}:`, geminiError.message);
            break; // Exit retry loop for non-rate-limit errors
          }
        }
      }

      if (!success) {
        console.error(`Failed batch ${Math.floor(i / BATCH_SIZE) + 1} after ${maxRetries} retries.`);
        errorCount += batchChunks.length;
      }
    }

    if (allRecords.length === 0) {
      throw new Error('Failed to generate any embeddings.');
    }

    // 5. Bulk insert into Supabase
    const { error: insertError } = await supabase
      .from('book_chunks')
      .insert(allRecords);

    if (insertError) {
      console.error('Supabase bulk insertion error:', insertError);
      throw new Error(`Failed to store chunks in database: ${insertError.message}`);
    }

    res.status(200).json({ 
      success: true,
      message: errorCount > 0 ? `PDF processed with ${errorCount} errors` : 'PDF fully processed and embedded',
      chunksProcessed: allRecords.length,
      originalName: originalName,
      storageName: safeFileName
    });

  } catch (error) {
    console.error('Error in uploadPDF:', error);
    res.status(500).json({ error: 'An error occurred while processing the PDF.', details: error.message });
  }
};

/**
 * Controller to handle answering user questions based on document context.
 */
const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase configuration is missing.' });
    }

    // 1. Generate embedding for the user's question
    const queryEmbeddingResponse = await embeddingModel.embedContent(question);
    const queryEmbedding = queryEmbeddingResponse.embedding.values;

    // 2. Search for similar vectors in Supabase
    const { data: matchedDocuments, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Adjusted to be more permissive to ensure we find content
      match_count: 5 // Get top 5 most relevant chunks
    });

    if (matchError) {
      console.error('Supabase match error:', matchError);
      throw new Error(`Failed to retrieve relevant documents: ${matchError.message}`);
    }

    // 3. Prepare context for OpenAI
    let contextText = '';
    if (matchedDocuments && matchedDocuments.length > 0) {
      contextText = matchedDocuments.map(doc => doc.content).join('\n\n');
    }

    // 4. Generate Answer using Gemini
    const systemPrompt = `You are an intelligent AI assistant.

Use the uploaded document context as the primary source of truth.

If the retrieved context is incomplete or insufficient, you may supplement the answer using your general AI knowledge.

Clearly distinguish:
- information derived from the uploaded document
- additional AI-generated explanation

Provide detailed, educational, and helpful responses.`;
    
    try {
      // Configure model to use system instruction
      const chatModelWithSystemPrompt = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7
        }
      });

      const prompt = `Context:\n${contextText}\n\nQuestion: ${question}`;
      
      const chatResponse = await chatModelWithSystemPrompt.generateContent(prompt);
      const answer = chatResponse.response.text();

      res.status(200).json({ 
        answer,
        sources: matchedDocuments ? matchedDocuments.map(doc => ({ id: doc.id, similarity: doc.similarity })) : []
      });
    } catch (geminiChatError) {
      console.error("Gemini Generation Error:", geminiChatError.message);
      res.status(500).json({ 
        error: "AI generation failed", 
        details: geminiChatError.message,
        contextFound: matchedDocuments && matchedDocuments.length > 0 
      });
    }

  } catch (error) {
    console.error('Error in askQuestion:', error);
    res.status(500).json({ error: 'An error occurred while generating the answer.', details: error.message });
  }
};

module.exports = {
  uploadPDF,
  askQuestion
};
