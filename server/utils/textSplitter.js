/**
 * Splits a given text into chunks of maximum length, with a specified overlap.
 * This is useful for processing large texts for vector embeddings while maintaining context.
 *
 * @param {string} text - The input text to be split.
 * @param {number} chunkSize - The maximum length of each chunk (in characters).
 * @param {number} overlap - The number of overlapping characters between consecutive chunks.
 * @returns {string[]} An array of text chunks.
 */
function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text) return [];
  
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // If we're not at the end of the text, try to find a good breaking point
    if (endIndex < text.length) {
      // Look for a newline character within the last 100 characters of the chunk
      let breakPoint = text.lastIndexOf('\n', endIndex);
      
      // If no newline, try looking for a period (sentence boundary)
      if (breakPoint === -1 || breakPoint < startIndex + chunkSize - 100) {
        breakPoint = text.lastIndexOf('. ', endIndex);
      }
      
      // If no period, try a space (word boundary)
      if (breakPoint === -1 || breakPoint < startIndex + chunkSize - 100) {
        breakPoint = text.lastIndexOf(' ', endIndex);
      }

      // If we found a valid break point that is after our start index, use it
      if (breakPoint !== -1 && breakPoint > startIndex) {
        endIndex = breakPoint + 1; // Include the space/period/newline in the chunk
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    // Move start index for the next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    
    // Ensure we always move forward to prevent infinite loops if overlap >= chunkSize
    if (startIndex <= text.length - text.length + startIndex + overlap - chunkSize) {
       // if we are not moving forward
       startIndex += 1;
    }
  }

  return chunks;
}

module.exports = { splitTextIntoChunks };
