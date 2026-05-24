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
    .filter(word => word.length > 2 || word === "dr" || word === "eu" || word === "us" || word === "ip" || word === "ad");
}

const SYNONYM_MAP: Record<string, string[]> = {
  "sso": ["single", "sign", "on", "saml", "okta", "oauth", "azuread", "idp"],
  "single": ["sso"],
  "sign": ["sso"],
  "on": ["sso"],
  "saml": ["sso", "single", "sign", "on"],
  "okta": ["sso", "single", "sign", "on"],
  "azuread": ["sso", "single", "sign", "on"],
  "idp": ["sso", "single", "sign", "on"],
  "backup": ["backups", "restore", "recovery", "disaster", "replication", "dr"],
  "backups": ["backup"],
  "dr": ["backup", "recovery", "disaster", "restore"],
  "recovery": ["backup", "dr", "disaster"],
  "disaster": ["backup", "dr", "recovery"],
  "encryption": ["encrypt", "tls", "ssl", "aes-256", "cryptographic"],
  "encrypt": ["encryption"],
  "compliance": ["soc", "iso", "gdpr", "hipaa", "pci"],
  "retention": ["retain", "purge", "delete", "archival"],
  "hosting": ["datacenter", "aws", "azure", "gcp", "cloud", "server"],
  "location": ["region", "residency", "eu", "us", "europe", "geographic"],
  "residency": ["region", "hosting", "location", "eu", "us"],
  "region": ["residency", "hosting", "location", "eu", "us"],
};

function expandSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  tokens.forEach(token => {
    const syns = SYNONYM_MAP[token.toLowerCase()];
    if (syns) {
      syns.forEach(syn => expanded.add(syn));
    }
  });
  return Array.from(expanded);
}

interface DocVector {
  id: string;
  terms: Record<string, number>;
  length: number;
}

function calculateCosineSimilarity(
  queryTerms: string[],
  docs: DocVector[],
  allTerms: Set<string>
): { id: string; score: number }[] {
  const df: Record<string, number> = {};
  const N = docs.length;

  allTerms.forEach(term => {
    let count = 0;
    docs.forEach(doc => {
      if (doc.terms[term] > 0) count++;
    });
    df[term] = count;
  });

  const idf: Record<string, number> = {};
  allTerms.forEach(term => {
    const n = df[term] || 0;
    idf[term] = Math.log((N - n + 0.5) / (n + 0.5) + 1);
  });

  const queryTfs: Record<string, number> = {};
  queryTerms.forEach(term => {
    if (allTerms.has(term)) {
      queryTfs[term] = (queryTfs[term] || 0) + 1;
    }
  });

  const queryVector: Record<string, number> = {};
  let queryNormSq = 0;
  Object.keys(queryTfs).forEach(term => {
    const tf = queryTfs[term];
    const w = tf * (idf[term] || 0);
    queryVector[term] = w;
    queryNormSq += w * w;
  });
  const queryNorm = Math.sqrt(queryNormSq);

  return docs.map(doc => {
    let dotProduct = 0;
    let docNormSq = 0;

    Object.keys(doc.terms).forEach(term => {
      const tf = doc.terms[term];
      const w = tf * (idf[term] || 0);
      docNormSq += w * w;

      if (queryVector[term] !== undefined) {
        dotProduct += queryVector[term] * w;
      }
    });

    const docNorm = Math.sqrt(docNormSq);
    const score = (queryNorm > 0 && docNorm > 0) ? (dotProduct / (queryNorm * docNorm)) : 0;

    return { id: doc.id, score };
  });
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
      return `Security Policy Verification: ${cleaned}`;
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
  const rawQueryTerms = tokenize(questionText).filter(w => !STOP_WORDS.has(w));
  const queryTerms = expandSynonyms(rawQueryTerms);
  
  if (queryTerms.length === 0) {
    return {
      text: "No matching information was found in the approved company source documents. An expert review is required to draft this response manually.",
      confidence: "No Source",
      citations: [],
    };
  }

  // 1. Load data from the database
  const allChunks = await prisma.sourceChunk.findMany({
    where: {
      sourceDocument: {
        processingStatus: "Success",
        approvalStatus: "Approved",
      },
    },
    include: {
      sourceDocument: true,
    },
  });

  const allApproved = await prisma.approvedAnswer.findMany();

  // 2. Score source chunks using BM25 and TF-IDF Cosine Similarity
  const N = allChunks.length;
  const allTerms = new Set<string>();

  const chunkDocs = allChunks.map(chunk => {
    const tokens = tokenize(chunk.text);
    const stems = tokens.map(t => stem(t));
    const terms: Record<string, number> = {};
    stems.forEach(s => {
      terms[s] = (terms[s] || 0) + 1;
      allTerms.add(s);
    });
    return {
      id: chunk.id,
      chunk,
      tokens,
      stems,
      terms,
      length: tokens.length || 1,
    };
  });

  const queryStems = queryTerms.map(t => stem(t));
  queryStems.forEach(s => allTerms.add(s));

  const cosineMatches = calculateCosineSimilarity(queryStems, chunkDocs, allTerms);
  const cosineScoresMap = new Map(cosineMatches.map(m => [m.id, m.score]));

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

    const cosineScore = cosineScoresMap.get(doc.id) || 0;
    const combinedScore = score + 1.5 * cosineScore;

    return { chunk: doc.chunk, score: combinedScore, bm25Score: score, cosineScore };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // 3. Score approved answers library using BM25 and TF-IDF Cosine Similarity
  const N_lib = allApproved.length;
  const allTerms_lib = new Set<string>();

  const approvedDocs = allApproved.map(approved => {
    const combinedText = `${approved.canonicalQuestion} ${approved.answerText}`;
    const tokens = tokenize(combinedText);
    const stems = tokens.map(t => stem(t));
    const terms: Record<string, number> = {};
    stems.forEach(s => {
      terms[s] = (terms[s] || 0) + 1;
      allTerms_lib.add(s);
    });
    return {
      id: approved.id,
      approved,
      tokens,
      stems,
      terms,
      length: tokens.length || 1,
    };
  });

  queryStems.forEach(s => allTerms_lib.add(s));

  const cosineMatches_lib = calculateCosineSimilarity(queryStems, approvedDocs, allTerms_lib);
  const cosineScoresMap_lib = new Map(cosineMatches_lib.map(m => [m.id, m.score]));

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

    const cosineScore = cosineScoresMap_lib.get(doc.id) || 0;
    const combinedScore = score + 1.5 * cosineScore;

    return { approved: doc.approved, score: combinedScore, bm25Score: score, cosineScore };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  // Debug logs for calibration
  console.log(`[RAG DEBUG] Question: "${questionText}"`);
  if (approvedMatches.length > 0) {
    console.log(`[RAG DEBUG] Top Library Match Score: ${approvedMatches[0].score} (BM25: ${approvedMatches[0].bm25Score}, Cosine: ${approvedMatches[0].cosineScore}) for "${approvedMatches[0].approved.canonicalQuestion}"`);
  }
  if (matches.length > 0) {
    console.log(`[RAG DEBUG] Top Chunk Match Score: ${matches[0].score} (BM25: ${matches[0].bm25Score}, Cosine: ${matches[0].cosineScore}) for "${matches[0].chunk.sectionTitle || 'Chunk'}"`);
  }

  // 4. Decision logic: Check Library Match first
  // Library matches are highly robust, so score >= 0.5 is sufficient under BM25 normalization
  if (approvedMatches.length > 0 && approvedMatches[0].score >= 0.5) {
    const bestLib = approvedMatches[0].approved;
    const linkedChunk = matches[0]?.chunk || allChunks[0];
    const answerText = tone ? formatAnswerByTone(bestLib.answerText, tone, questionText) : bestLib.answerText;
    
    await prisma.approvedAnswer.update({
      where: { id: bestLib.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      }
    });

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
