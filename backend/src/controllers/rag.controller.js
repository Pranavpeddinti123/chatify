import { HfInference } from "@huggingface/inference";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Status from "../models/Status.js";
import { ENV } from "../lib/env.js";

// Initialize HuggingFace client (may fail if token or providers missing)
const hf = new HfInference(ENV.HUGGINGFACEHUB_API_TOKEN);

// Simple text splitter: split into chunks of ~500 characters with overlap
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

// Cosine similarity helper
function cosineSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// In-memory vector store
class SimpleVectorStore {
  constructor() {
    this.items = []; // { embedding, content, metadata }
  }
  add(embedding, content, metadata) {
    this.items.push({ embedding, content, metadata });
  }
  // Return top k texts
  search(queryEmbedding, k = 3) {
    const scores = this.items.map((item) => ({
      score: cosineSim(queryEmbedding, item.embedding),
      item,
    }));
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k).map((s) => ({ score: s.score, ...s.item }));
  }
}

/**
 * Retrieve user's personal data for RAG context
 */
async function getUserContext(userId) {
  try {
    // Get user profile
    const user = await User.findById(userId);
    
    // Get user's contacts
    const contacts = await User.find({ _id: { $ne: userId } }).select("fullName email profilePic");
    
    // Get user's recent chats (last 20 conversations)
    const recentMessages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "fullName email")
      .populate("receiverId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Get user's statuses
    const userStatuses = await Status.findOne({ userId }).populate("userId", "fullName");
    
    // Get user's chat partners
    const chatPartnerIds = [
      ...new Set(
        recentMessages.map((msg) =>
          msg.senderId._id.toString() === userId.toString()
            ? msg.receiverId._id.toString()
            : msg.senderId._id.toString()
        )
      ),
    ];
    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("fullName email profilePic");

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      },
      contacts: contacts.map((c) => ({ fullName: c.fullName, email: c.email })),
      chatPartners: chatPartners.map((p) => ({ fullName: p.fullName, email: p.email })),
      recentMessages: recentMessages.map((m) => ({
        from: m.senderId.fullName,
        to: m.receiverId.fullName,
        text: m.text,
        createdAt: m.createdAt,
      })),
      hasStatus: !!userStatuses,
    };
  } catch (error) {
    console.error("Error retrieving user context:", error);
    return null;
  }
}

/**
 * Create RAG documents from user context
 */
function createContextDocuments(userContext) {
  if (!userContext) return [];

  const documents = [];

  // User profile document
  documents.push({
    content: `User Profile: My name is ${userContext.user.fullName}, email is ${userContext.user.email}. I am logged into Chatify.`,
    metadata: { type: "profile" },
  });

  // Contacts document
  if (userContext.contacts.length > 0) {
    const contactList = userContext.contacts.map((c) => `${c.fullName} (${c.email})`).join(", ");
    documents.push({
      content: `My contacts in Chatify: ${contactList}`,
      metadata: { type: "contacts" },
    });
  }

  // Chat partners document
  if (userContext.chatPartners.length > 0) {
    const chatPartnerList = userContext.chatPartners.map((p) => p.fullName).join(", ");
    documents.push({
      content: `People I've been chatting with: ${chatPartnerList}`,
      metadata: { type: "chatPartners" },
    });
  }

  // Recent messages document
  if (userContext.recentMessages.length > 0) {
    const recentChat = userContext.recentMessages
      .slice(0, 5)
      .map((m) => `${m.from} to ${m.to}: ${m.text}`)
      .join("\n");
    documents.push({
      content: `Recent chat history: ${recentChat}`,
      metadata: { type: "recentMessages" },
    });
  }

  // Status document
  if (userContext.hasStatus) {
    documents.push({
      content: `I have uploaded a status on Chatify.`,
      metadata: { type: "status" },
    });
  }

  return documents;
}

/**
 * Chat with RAG using HuggingFace Inference
 */
export const chat = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    // Retrieve user context
    const userContext = await getUserContext(userId);
    if (!userContext) {
      return res.status(500).json({ message: "Failed to retrieve user context" });
    }

    // Create context documents
    const contextDocs = createContextDocuments(userContext);

    // Build a comprehensive system prompt
    const systemPrompt = `You are a helpful AI assistant integrated into Chatify, a WhatsApp-style messaging application.

### ABOUT THE CURRENT USER ###
${contextDocs.map((doc) => `- ${doc.content}`).join("\n")}

### YOUR GUIDELINES ###
1. Always identify the current logged-in user as "${userContext.user.fullName}"
2. When asked "Who am I?" or similar, answer with the user's profile data
3. When asked about contacts, reference the user's contact list
4. When asked about chat partners, reference people they've chatted with
5. Keep responses short and friendly, like a WhatsApp chatbot
6. If you don't have information about something, say you don't have it and suggest what they can do in the app
7. Never make up fictional contacts, messages, or statuses
8. Maintain a conversational and helpful tone

### USER'S QUERY ###
"${query}"

Please provide a helpful response based on the user's context and the query.`;

    // Build a single text from context docs to index
    const fullContextText = contextDocs.map((d) => d.content).join("\n\n");

    // Split into chunks
    const chunks = chunkText(fullContextText, 500, 100);

    // Try to compute embeddings using HuggingFace (preferred) or fallback to OpenAI embeddings if configured
    const vectorStore = new SimpleVectorStore();

    // helper to compute embeddings via HuggingFace Inference REST API with model fallbacks
    const computeHfEmbedding = async (text, model = null) => {
      if (!ENV.HUGGINGFACEHUB_API_TOKEN) throw new Error("No HUGGINGFACEHUB_API_TOKEN");
      
      // List of HF embedding models to try (ordered by reliability)
      const models = [
        model || ENV.HF_EMBEDDING_MODEL,
        "sentence-transformers/all-MiniLM-L6-v2",
        "sentence-transformers/paraphrase-MiniLM-L6-v2",
        "sentence-transformers/all-mpnet-base-v2",
      ].filter(Boolean);
      
      for (const modelName of models) {
        try {
          const url = `https://api-inference.huggingface.co/embeddings/${modelName}`;
          const r = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ENV.HUGGINGFACEHUB_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ input: text }),
          });
          
          if (!r.ok) {
            console.warn(`HF model '${modelName}' failed (${r.status})`);
            continue;
          }
          
          const data = await r.json();
          
          // Try multiple known HF response shapes
          // Shape 1: Array of embeddings
          if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
            console.log(`✓ HF embeddings using model: ${modelName}`);
            return data;
          }
          // Shape 2: { embedding: [...] }
          if (data?.embedding && Array.isArray(data.embedding)) {
            console.log(`✓ HF embeddings using model: ${modelName}`);
            return data.embedding;
          }
          // Shape 3: { data: [{ embedding: [...] }] }
          if (data?.data && Array.isArray(data.data) && data.data[0]?.embedding) {
            console.log(`✓ HF embeddings using model: ${modelName}`);
            return data.data[0].embedding;
          }
          // Shape 4: Direct array of objects with embedding
          if (Array.isArray(data) && data[0]?.embedding) {
            console.log(`✓ HF embeddings using model: ${modelName}`);
            return data[0].embedding;
          }
          // Shape 5: { result: [{ embedding: [...] }] }
          if (data?.result && Array.isArray(data.result) && data.result[0]?.embedding) {
            console.log(`✓ HF embeddings using model: ${modelName}`);
            return data.result[0].embedding;
          }
          
          console.warn(`HF model '${modelName}' returned unexpected shape`);
        } catch (err) {
          console.warn(`HF model '${modelName}' error:`, err?.message || err);
        }
      }
      
      throw new Error("All HF embedding models failed");
    };

    // Try to create embeddings for each chunk
    let usedEmbeddings = false;
    
    // 1) Try OpenRouter embeddings first (most reliable, free tier available)
    if (ENV.OPENROUTER_API_KEY && !ENV.OPENROUTER_API_KEY.includes("YOUR_")) {
      try {
        for (const chunk of chunks) {
          const r = await fetch("https://openrouter.ai/api/v1/embeddings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({ model: "openai/text-embedding-3-small", input: chunk }),
          });
          const data = await r.json();
          const emb = data?.data?.[0]?.embedding;
          if (!emb) throw new Error("OpenRouter embeddings failed");
          vectorStore.add(emb, chunk, { source: "user_context" });
        }
        usedEmbeddings = true;
        console.log("✓ Using OpenRouter embeddings");
      } catch (orEmbErr) {
        console.warn("OpenRouter embeddings failed:", orEmbErr?.message || orEmbErr);
        usedEmbeddings = false;
      }
    }
    
    // 2) If OpenRouter failed, fallback to HuggingFace embeddings
    if (!usedEmbeddings) {
      try {
        for (const chunk of chunks) {
          const emb = await computeHfEmbedding(chunk);
          if (!emb || !Array.isArray(emb) || emb.length === 0) throw new Error("HF embeddings returned unexpected shape");
          vectorStore.add(emb, chunk, { source: "user_context" });
        }
        usedEmbeddings = true;
        console.log("✓ Using HuggingFace embeddings");
      } catch (hfEmbErr) {
        console.warn("HuggingFace embeddings failed:", hfEmbErr?.message || hfEmbErr);
        usedEmbeddings = false;
      }
    }

    if (!usedEmbeddings) {
      console.error("❌ No embeddings backend available. Add OPENROUTER_API_KEY to .env or enable HuggingFace embedding models.");
      return res.status(500).json({ message: "No embeddings backend available. Configure OPENROUTER_API_KEY in .env (get free key at openrouter.ai) or enable HuggingFace embedding models." });
    }

    // Compute query embedding (prefer OpenRouter, fallback to HF)
    let queryEmbedding = null;
    
    // Try OpenRouter first
    if (ENV.OPENROUTER_API_KEY && !ENV.OPENROUTER_API_KEY.includes("YOUR_")) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({ model: "openai/text-embedding-3-small", input: query }),
        });
        const data = await r.json();
        queryEmbedding = data?.data?.[0]?.embedding;
      } catch (err) {
        console.warn("OpenRouter query embedding failed:", err?.message || err);
        queryEmbedding = null;
      }
    }
    
    // Fallback to HF
    if (!queryEmbedding) {
      try {
        queryEmbedding = await computeHfEmbedding(query);
      } catch (err) {
        console.warn("HF query embedding failed:", err?.message || err);
        queryEmbedding = null;
      }
    }

    if (!queryEmbedding) {
      console.error("Failed to compute query embedding");
      return res.status(500).json({ message: "Failed to compute query embedding" });
    }

    // Retrieve relevant chunks
    const top = vectorStore.search(queryEmbedding, 4);
    const retrievedText = top.map((t) => t.content).join("\n\n");

    // Compose final prompt with retrieved context
    const finalPrompt = `${systemPrompt}\n\n### Retrieved Context ###\n${retrievedText}\n\n### Answer:`;

    // Generation: prefer Google Gemini (Generative Language API) if available, then OpenRouter, then HF
    let generation = null;

    // 1) Gemini (Google) via Generative Language REST API
    if (ENV.GOOGLE_API_KEY && !ENV.GOOGLE_API_KEY.includes("YOUR_")) {
      try {
        const gModel = ENV.GOOGLE_MODEL || "text-bison@001"; // default model alias
        const url = `https://generativelanguage.googleapis.com/v1beta2/models/${gModel}:generate?key=${ENV.GOOGLE_API_KEY}`;
        const body = {
          prompt: { text: finalPrompt },
          max_output_tokens: ENV.GOOGLE_MAX_OUTPUT_TOKENS ? Number(ENV.GOOGLE_MAX_OUTPUT_TOKENS) : 400,
          temperature: ENV.GOOGLE_TEMPERATURE ? Number(ENV.GOOGLE_TEMPERATURE) : 0.7,
        };
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        // Parse possible response shapes
        generation = d?.candidates?.[0]?.content || d?.candidates?.[0]?.output || d?.outputText || d?.result || null;
        if (!generation && d?.candidates && Array.isArray(d.candidates)) {
          // some variants use 'candidates' with 'content'
          generation = d.candidates.map((c) => c.content || c.output).filter(Boolean).join('\n');
        }
        if (!generation) {
          console.warn('Gemini response had no content:', d);
          generation = null;
        }
      } catch (gemErr) {
        console.warn("Gemini generation failed:", gemErr?.message || gemErr);
        generation = null;
      }
    }

    // 2) OpenRouter (free tier available, gpt-3.5-turbo)
    if (!generation && ENV.OPENROUTER_API_KEY && !ENV.OPENROUTER_API_KEY.includes("YOUR_")) {
      try {
        const model = ENV.OPENROUTER_MODEL || "gpt-3.5-turbo";
        const chatBody = {
          model: model,
          messages: [
            { role: "system", content: "You are a helpful assistant that answers concisely." },
            { role: "user", content: finalPrompt },
          ],
          max_tokens: 400,
          temperature: 0.7,
        };
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify(chatBody),
        });
        const d = await r.json();
        generation = d?.choices?.[0]?.message?.content;
      } catch (orGenErr) {
        console.warn("OpenRouter generation failed:", orGenErr?.message || orGenErr);
        generation = null;
      }
    }

    // 3) HuggingFace fallback
    if (!generation) {
      const hfModels = [ENV.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.1", "google/flan-t5-large"];
      let hfResp = null;
      let hfLastErr = null;
      for (const m of hfModels) {
        try {
          hfResp = await hf.textGeneration({ model: m, inputs: finalPrompt, parameters: { max_new_tokens: 300, temperature: 0.7 } });
          break;
        } catch (e) {
          hfLastErr = e;
          console.warn(`Model ${m} failed:`, e?.message || e);
        }
      }
      if (hfResp) {
        // extract generated text
        if (hfResp.generated_text) generation = hfResp.generated_text;
        else if (Array.isArray(hfResp) && hfResp[0]?.generated_text) generation = hfResp[0].generated_text;
        else if (hfResp.results && Array.isArray(hfResp.results) && hfResp.results[0]?.generated_text) generation = hfResp.results[0].generated_text;
      } else {
        console.error("HF generation failed:", hfLastErr);
      }
    }

    if (!generation) {
      console.error("No model produced a generation. Ensure GOOGLE_API_KEY, OPENROUTER_API_KEY or HF inference provider is configured.");
      return res.status(500).json({ message: "No generation available. Configure GOOGLE_API_KEY, OPENROUTER_API_KEY (free at openrouter.ai) or HuggingFace inference provider." });
    }

    const aiResponse = typeof generation === 'string' && generation.startsWith(finalPrompt) ? generation.substring(finalPrompt.length).trim() : String(generation).trim();

    res.status(200).json({
      response: aiResponse,
      userId: userId,
    });
  } catch (error) {
    console.error("Error in RAG chat:", error);
    res.status(500).json({ message: "Failed to process your query", error: error.message });
  }
};

/**
 * Alternative: Chat using OpenAI (if API key is available)
 */
export const chatWithOpenAI = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    if (!ENV.OPENAI_API_KEY || ENV.OPENAI_API_KEY.includes("YOUR_")) {
      return res.status(400).json({ message: "OpenAI API key not configured" });
    }

    // Retrieve user context
    const userContext = await getUserContext(userId);
    if (!userContext) {
      return res.status(500).json({ message: "Failed to retrieve user context" });
    }

    // Create context documents
    const contextDocs = createContextDocuments(userContext);

    // Build comprehensive prompt for OpenAI
    const userPrompt = `
You are a helpful AI assistant in Chatify, a WhatsApp-style messaging app.

User Profile:
- Name: ${userContext.user.fullName}
- Email: ${userContext.user.email}

User's Contacts: ${userContext.contacts.map((c) => c.fullName).join(", ") || "No contacts yet"}

Recent Chat Partners: ${userContext.chatPartners.map((p) => p.fullName).join(", ") || "No chats yet"}

Rules:
1. When asked "Who am I?", answer with the user's profile
2. When asked about contacts, use their contact list
3. When asked about messages, reference recent chats
4. Keep answers short and friendly
5. Never make up fake data
6. If you don't know something, say so and suggest app features

User's Question: ${query}

Respond helpfully and concisely.`;

    // Note: This requires @langchain/openai package
    // For now, we'll use the HuggingFace approach as fallback
    res.status(200).json({
      response: "Please configure OpenAI API key to use this feature.",
      userId: userId,
    });
  } catch (error) {
    console.error("Error in OpenAI chat:", error);
    res.status(500).json({ message: "Failed to process your query" });
  }
};
