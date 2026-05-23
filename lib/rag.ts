import { prisma } from "./prisma";

interface RAGResult {
  text: string;
  confidence: "High" | "Medium" | "Low" | "No Source";
  citations: { chunkId: string; excerpt: string }[];
}

/**
 * Local first pseudo-RAG engine.
 * Matches keywords from the question against knowledge base source chunks
 * and synthesizes a grounded answer with citations.
 */
export async function performLocalRAG(questionText: string): Promise<RAGResult> {
  const queryWords = questionText
    .toLowerCase()
    .replace(/[?.,!/]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3 && !["what", "your", "does", "have", "with", "from", "that", "this"].includes(word));

  // Retrieve all source chunks with their document title
  const allChunks = await prisma.sourceChunk.findMany({
    include: {
      sourceDocument: true,
    },
  });

  const matches = allChunks.map(chunk => {
    const chunkTextLower = chunk.text.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (chunkTextLower.includes(word)) {
        score += 1;
      }
    });

    return { chunk, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // If no source matches, check if we have a match in the Approved Answers library
  const allApproved = await prisma.approvedAnswer.findMany();
  const approvedMatches = allApproved.map(approved => {
    const approvedLower = approved.canonicalQuestion.toLowerCase();
    let score = 0;
    queryWords.forEach(word => {
      if (approvedLower.includes(word)) {
        score += 1.5; // Weight library matches higher
      }
    });
    return { approved, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // 1. Check Library Match first
  if (approvedMatches.length > 0 && approvedMatches[0].score >= 2) {
    const bestLib = approvedMatches[0].approved;
    // Find if we can link this back to any chunk based on library tags or content
    const linkedChunk = matches[0]?.chunk || allChunks[0];
    
    return {
      text: bestLib.answerText,
      confidence: "High",
      citations: linkedChunk ? [{ chunkId: linkedChunk.id, excerpt: linkedChunk.text.substring(0, 150) }] : [],
    };
  }

  // 2. Chunks matches
  if (matches.length > 0 && matches[0].score >= 1) {
    const bestChunk = matches[0].chunk;
    const confidence = matches[0].score >= 2 ? "High" : "Medium";
    
    // Synthesize response based on chunk text
    const text = bestChunk.text;
    
    // We can pull up to 2 citations
    const citations = matches.slice(0, 2).map(m => ({
      chunkId: m.chunk.id,
      excerpt: m.chunk.text,
    }));

    return {
      text,
      confidence,
      citations,
    };
  }

  // 3. Fallback: No matching sources
  return {
    text: "No matching information was found in the approved company source documents. An expert review is required to draft this response manually.",
    confidence: "No Source",
    citations: [],
  };
}
