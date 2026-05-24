import { prisma } from "./prisma";

interface RAGResult {
  text: string;
  confidence: "High" | "Medium" | "Low" | "No Source";
  citations: { chunkId: string; excerpt: string }[];
}

const STOP_WORDS = new Set([
  "what", "your", "does", "have", "with", "from", "that", "this",
  "the", "and", "are", "for", "you", "but", "not", "they", "our",
  "their", "who", "whom", "which", "whose", "how", "why", "when",
  "where", "can", "could", "will", "would", "shall", "should", "may",
  "might", "must", "been", "were", "was", "has", "had", "did", "does"
]);

function stem(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/ies$/, "y")
    .replace(/sses$/, "ss")
    .replace(/s$/, "")
    .replace(/ed$/, "")
    .replace(/ing$/, "")
    .replace(/ly$/, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[?.,!/():;'"\-\[\]]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Helper to format the retrieved answer text based on the requested tone/mode.
 */
function formatAnswerByTone(rawText: string, tone: string, questionText: string): string {
  const cleaned = rawText.trim();
  if (cleaned.startsWith("No matching information was found")) {
    return cleaned;
  }

  switch (tone) {
    case "Concise": {
      const sentences = cleaned.split(/(?<=[.!?])\s+/);
      if (sentences.length > 1) {
        return `${sentences[0]} ${sentences[1]}`.trim();
      }
      return sentences[0];
    }
    
    case "Detailed": {
      const sentences = cleaned.split(/(?<=[.!?])\s+/);
      if (sentences.length > 2) {
        const intro = sentences.slice(0, 2).join(" ");
        const bullets = sentences.slice(2).map(s => `• ${s}`).join("\n");
        return `${intro}\n\nKey Details:\n${bullets}`;
      }
      return `Our platform handles this as follows:\n\n• ${cleaned}`;
    }
    
    case "YesNo": {
      const lowerQ = questionText.toLowerCase();
      const isYesNoQuestion = /^(does|do|is|are|can|has|have|will|should|could|was|were)\b/.test(lowerQ);
      
      if (isYesNoQuestion) {
        const hasNegative = /\b(not|never|no|none|neither|unsupported|unable|fail|cannot)\b/i.test(cleaned);
        const prefix = hasNegative ? "No. " : "Yes. ";
        return `${prefix}${cleaned}`;
      }
      return cleaned;
    }
    
    case "Formal": {
      return `AnswerFlow AI is pleased to confirm that ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)} Please let us know if you require further details or supporting documentation regarding this capability.`;
    }
    
    case "Security": {
      return `Security Policy Verification: ${cleaned} All controls are continuously active and validated in accordance with our organizational standards.`;
    }
    
    case "Plain": {
      return cleaned
        .replace(/\b(subsequently|furthermore|consequently)\b/gi, "so")
        .replace(/\b(demonstrates|exhibits)\b/gi, "shows")
        .replace(/\b(utilizes|employs)\b/gi, "uses")
        .replace(/\b(prior to)\b/gi, "before");
    }
    
    default:
      return cleaned;
  }
}

/**
 * Local first RAG engine using state-of-the-art BM25 and stemming.
 * Matches keywords and stems from the question against knowledge base source chunks
 * and synthesizes a grounded answer with citations.
 */
export async function performLocalRAG(questionText: string, tone?: string): Promise<RAGResult> {
  const queryTerms = tokenize(questionText).filter(w => !STOP_WORDS.has(w));
  
  if (queryTerms.length === 0) {
    return {
      text: "No matching information was found in the approved company source documents. An expert review is required to draft this response manually.",
      confidence: "No Source",
      citations: [],
    };
  }

  // 1. Load data from the database
  const allChunks = await prisma.sourceChunk.findMany({
    include: {
      sourceDocument: true,
    },
  });

  const allApproved = await prisma.approvedAnswer.findMany();

  // 2. Score source chunks using BM25
  const N = allChunks.length;
  const chunkDocs = allChunks.map(chunk => {
    const tokens = tokenize(chunk.text);
    return {
      chunk,
      tokens,
      stems: tokens.map(t => stem(t)),
      length: tokens.length || 1,
    };
  });

  const totalLength = chunkDocs.reduce((sum, d) => sum + d.length, 0);
  const avgdl = N > 0 ? totalLength / N : 1;

  const df: Record<string, number> = {};
  queryTerms.forEach(term => {
    const termStem = stem(term);
    let count = 0;
    chunkDocs.forEach(doc => {
      const hasTerm = doc.stems.some(s => s === termStem || s.includes(termStem) || termStem.includes(s));
      if (hasTerm) count++;
    });
    df[term] = count;
  });

  const idfs: Record<string, number> = {};
  queryTerms.forEach(term => {
    const n = df[term] || 0;
    idfs[term] = Math.max(0.0001, Math.log((N - n + 0.5) / (n + 0.5) + 1));
  });

  const k1 = 1.2;
  const b = 0.75;

  const matches = chunkDocs.map(doc => {
    let score = 0;
    queryTerms.forEach(term => {
      const termStem = stem(term);
      let f = 0;
      doc.stems.forEach(s => {
        if (s === termStem || s.includes(termStem) || termStem.includes(s)) {
          f += 1;
        }
      });

      if (f > 0) {
        const idf = idfs[term] || 0;
        const numerator = f * (k1 + 1);
        const denominator = f + k1 * (1 - b + b * (doc.length / avgdl));
        score += idf * (numerator / denominator);
      }
    });

    return { chunk: doc.chunk, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // 3. Score approved answers library using BM25
  const N_lib = allApproved.length;
  const approvedDocs = allApproved.map(approved => {
    const combinedText = `${approved.canonicalQuestion} ${approved.answerText}`;
    const tokens = tokenize(combinedText);
    return {
      approved,
      tokens,
      stems: tokens.map(t => stem(t)),
      length: tokens.length || 1,
    };
  });

  const totalLength_lib = approvedDocs.reduce((sum, d) => sum + d.length, 0);
  const avgdl_lib = N_lib > 0 ? totalLength_lib / N_lib : 1;

  const df_lib: Record<string, number> = {};
  queryTerms.forEach(term => {
    const termStem = stem(term);
    let count = 0;
    approvedDocs.forEach(doc => {
      const hasTerm = doc.stems.some(s => s === termStem || s.includes(termStem) || termStem.includes(s));
      if (hasTerm) count++;
    });
    df_lib[term] = count;
  });

  const idfs_lib: Record<string, number> = {};
  queryTerms.forEach(term => {
    const n = df_lib[term] || 0;
    idfs_lib[term] = Math.max(0.0001, Math.log((N_lib - n + 0.5) / (n + 0.5) + 1));
  });

  const approvedMatches = approvedDocs.map(doc => {
    let score = 0;
    queryTerms.forEach(term => {
      const termStem = stem(term);
      let f = 0;
      doc.stems.forEach(s => {
        if (s === termStem || s.includes(termStem) || termStem.includes(s)) {
          f += 1;
        }
      });

      if (f > 0) {
        const idf = idfs_lib[term] || 0;
        const numerator = f * (k1 + 1);
        const denominator = f + k1 * (1 - b + b * (doc.length / avgdl_lib));
        score += idf * (numerator / denominator);
      }
    });

    return { approved: doc.approved, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // Debug logs for calibration
  console.log(`[RAG DEBUG] Question: "${questionText}"`);
  if (approvedMatches.length > 0) {
    console.log(`[RAG DEBUG] Top Library Match Score: ${approvedMatches[0].score} for "${approvedMatches[0].approved.canonicalQuestion}"`);
  }
  if (matches.length > 0) {
    console.log(`[RAG DEBUG] Top Chunk Match Score: ${matches[0].score} for "${matches[0].chunk.sectionTitle || 'Chunk'}"`);
  }

  // 4. Decision logic: Check Library Match first
  // Library matches are highly robust, so score >= 0.5 is sufficient under BM25 normalization
  if (approvedMatches.length > 0 && approvedMatches[0].score >= 0.5) {
    const bestLib = approvedMatches[0].approved;
    const linkedChunk = matches[0]?.chunk || allChunks[0];
    const answerText = tone ? formatAnswerByTone(bestLib.answerText, tone, questionText) : bestLib.answerText;
    
    return {
      text: answerText,
      confidence: "High",
      citations: linkedChunk ? [{ chunkId: linkedChunk.id, excerpt: linkedChunk.text.substring(0, 150) }] : [],
    };
  }

  // 5. Check Chunks matches
  if (matches.length > 0 && matches[0].score >= 0.25) {
    const bestChunk = matches[0].chunk;
    const confidence = matches[0].score >= 0.75 ? "High" : "Medium";
    const rawText = bestChunk.text;
    const answerText = tone ? formatAnswerByTone(rawText, tone, questionText) : rawText;
    
    const citations = matches.slice(0, 2).map(m => ({
      chunkId: m.chunk.id,
      excerpt: m.chunk.text,
    }));

    return {
      text: answerText,
      confidence,
      citations,
    };
  }

  // 6. Fallback
  return {
    text: "No matching information was found in the approved company source documents. An expert review is required to draft this response manually.",
    confidence: "No Source",
    citations: [],
  };
}
