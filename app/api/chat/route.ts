import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import knowledgeBase from "@/data/knowledge_base.json";

// Rate limiting in-memory map: IP -> { count: number, lastReset: number }
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 30; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

function getRateLimitInfo(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

const SYSTEM_INSTRUCTION = `
You are "Pranav's AI Assistant", an intelligent agent dedicated exclusively to representing Pranav Kakde to recruiters, hiring managers, and engineering connections.

CRITICAL INSTRUCTIONS & BEHAVIORAL RULES:
1. KNOWLEDGE GROUNDING: Only answer questions using the provided Knowledge Base below. Do NOT invent, fabricate, or assume any experience, employers, metrics, credentials, or skills not explicitly present in the knowledge base.
2. THIRD-PERSON PERSPECTIVE: ALWAYS speak about Pranav in the THIRD PERSON (e.g., "Pranav built...", "He has experience with...", "Pranav's focus areas are..."). Never speak in the first person ("I built...").
3. GREETINGS: If the user's message is a simple generic greeting (e.g., "hi", "hello", "hey", "who are you"), introduce yourself warmly in 2-3 sentences as Pranav's AI Assistant and highlight 3 key areas you can help with (his projects, skills, education, or resumes).
4. OUT-OF-SCOPE REDIRECTION: If asked about topics outside Pranav's profile (e.g., salary expectations, personal/private matters, general homework, weather, unrelated general knowledge), politely decline and redirect the visitor back to what you can help with, or suggest emailing Pranav directly at kakdepranav993@gmail.com.
5. PROACTIVE LINKS & RESUMES: Whenever natural and relevant to the answer:
   - Include direct markdown links to Pranav's GitHub repositories or live demos (e.g., [TechSight](https://github.com/PRANAVKAKDE613/TechSight), [Real-Time Chat](https://github.com/PRANAVKAKDE613/ChatApp)).
   - Offer or include links to his two downloadable resumes:
     - [📄 Java/Backend Resume](/resumes/Pranav_Kakde_Java_Backend_Resume.pdf)
     - [🤖 AI/ML Resume](/resumes/Pranav_Kakde_AIML_GenAI_Resume.pdf)
6. MARKDOWN FORMATTING: Structure your answers cleanly with bullet points, bold key terms, and markdown headers where appropriate so lists and technical skills render beautifully.

==================================================
KNOWLEDGE BASE FOR PRANAV KAKDE:
${JSON.stringify(knowledgeBase, null, 2)}
==================================================
`;

const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimit = getRateLimitInfo(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. You have reached the maximum allowed messages for this hour. Please try again later or contact Pranav directly at kakdepranav993@gmail.com.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request payload. Expected non-empty array of messages." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const formattedHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const latestUserMessage = messages[messages.length - 1].content;

      // Try candidate models in sequence
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_INSTRUCTION,
          });

          const chatSession = model.startChat({
            history: formattedHistory,
          });

          const resultStream = await chatSession.sendMessageStream(latestUserMessage);

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of resultStream.stream) {
                  const text = chunk.text();
                  if (text) {
                    controller.enqueue(encoder.encode(text));
                  }
                }
                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
            },
          });
        } catch (err: any) {
          console.warn(`Model ${modelName} failed, trying next model:`, err?.message);
          continue;
        }
      }
    }

    // Fallback response generator if no API key or model calls failed
    const lastMsg = messages[messages.length - 1].content.toLowerCase();
    let fallbackAnswer = "";

    if (lastMsg.includes("project") || lastMsg.includes("built")) {
      fallbackAnswer = `Pranav has built several high-impact software & AI projects across two main tracks:

### 🚀 Backend & Full-Stack Projects
1. **[Real-Time Chat Application](https://github.com/PRANAVKAKDE613/ChatApp)** (Spring Boot, React.js, MongoDB, WebSockets): Engineered low-latency bidirectional chat streaming supporting 100+ concurrent socket connections. [Live Demo](https://chat-app-frontend-seven-eosin.vercel.app)
2. **[BudgetWise – Smart Personal Finance Manager](https://github.com/PRANAVKAKDE613/Budgetwise)** (Spring Boot, React.js, MySQL, REST API, JWT): RESTful microservices securing 15+ endpoints with RBAC and transaction analytics.
3. **[IRCTC Backend System](https://github.com/PRANAVKAKDE613/IRCTC-backend)** (Java, JDBC, MySQL): Railway reservation backend handling ACID seat reservations, fare calculations, and dynamic waitlists.
4. **[FundChain](https://github.com/PRANAVKAKDE613/fundchain)** (Solidity, Ethereum, React.js): Decentralized crowdfunding platform with smart contracts. [Live Demo](https://fundchain-orcin.vercel.app)

### 🤖 AI/ML & GenAI Projects
1. **[TechSight – Agentic Financial Analyst](https://github.com/PRANAVKAKDE613/TechSight)** (LangChain, LangGraph, AWS S3, ChromaDB, RAGAs): Autonomous multi-agent analyst for SEC 10-K filings reducing analysis time to <30s with 94% retrieval accuracy. [Live App](https://techsight-financial-analyst.streamlit.app)
2. **[Unified LLM Gateway](https://github.com/PRANAVKAKDE613/Unified-LLM-Gateway)** (Python, FastAPI, Redis, PostgreSQL, Docker): Multi-provider AI proxy with 2-layer caching, budget cost metering, and fallback routing.
3. **[MedRAG](https://github.com/PRANAVKAKDE613/MedRag)** (LangChain, OpenAI, AWS Glue, ChromaDB): Clinical document QA system with strict zero-hallucination boundaries.
4. **[FinMCP](https://github.com/PRANAVKAKDE613/FinMCP)** (LangChain, FastAPI, SEC EDGAR, yFinance): Model Context Protocol server for real-time financial market intelligence.
5. **[Violence Detection with Explainable AI](https://github.com/PRANAVKAKDE613/violence-detection-xai)** (Python, CNN-LSTM, Grad-CAM, OpenCV): 92.4% accuracy video surveillance system with Telegram incident alerts.

You can also download his full resumes:
- [📄 Java/Backend Resume](/resumes/Pranav_Kakde_Java_Backend_Resume.pdf)
- [🤖 AI/ML Resume](/resumes/Pranav_Kakde_AIML_GenAI_Resume.pdf)`;
    } else if (lastMsg.includes("spring boot") || lastMsg.includes("java") || lastMsg.includes("backend")) {
      fallbackAnswer = `Yes! Pranav specializes heavily in **Java & Spring Boot Development**. 

### ⚡ Pranav's Backend & Java Expertise:
- **Core Technologies**: Java, Spring Boot, Spring Security, Hibernate/JPA, RESTful Microservices, JDBC, Node.js, Express.js.
- **Architectural Patterns**: Role-Based Access Control (RBAC with JWT), ACID-compliant transactional workflows, WebSocket (STOMP/SockJS) messaging, and Redis caching.
- **Featured Spring Boot Projects**:
  - **[Real-Time Chat Application](https://github.com/PRANAVKAKDE613/ChatApp)**: Multi-user WebSocket application with reactive MongoDB persistence.
  - **[BudgetWise](https://github.com/PRANAVKAKDE613/Budgetwise)**: Secured financial manager microservice powering multi-category transaction analytics.
  - **[IRCTC Railway Reservation Backend](https://github.com/PRANAVKAKDE613/IRCTC-backend)**: Enterprise railway ticketing system with dynamic waitlist priority queues.

Feel free to check out his [📄 Java/Backend Resume](/resumes/Pranav_Kakde_Java_Backend_Resume.pdf) or contact him at **kakdepranav993@gmail.com**.`;
    } else if (lastMsg.includes("resume") || lastMsg.includes("contact") || lastMsg.includes("email") || lastMsg.includes("education")) {
      fallbackAnswer = `Here are Pranav's background, education, and contact details:

### 🎓 Education & Credentials
- **Degree**: B.E. in Information Technology (Final Year, Graduating 2026)
- **College**: Pimpri Chinchwad College of Engineering and Research (PCCOER), Pune
- **Academic Performance**: **CGPA 8.7 / 10**
- **Certifications**: Oracle Cloud Infrastructure (OCI) AI Foundations Associate, Generative AI & LLM Engineering, Java & Python Development.

### 📬 Contact & Links
- **Email**: [kakdepranav993@gmail.com](mailto:kakdepranav993@gmail.com)
- **LinkedIn**: [linkedin.com/in/pranav-kakde-351a26205](https://www.linkedin.com/in/pranav-kakde-351a26205/)
- **GitHub**: [github.com/PRANAVKAKDE613](https://github.com/PRANAVKAKDE613)
- **LeetCode**: [leetcode.com/u/PRANAV_KAKDE/](https://leetcode.com/u/PRANAV_KAKDE/) (200+ Solved)

### 📄 Download Resumes Directly:
- [📄 Download Java / Backend Resume](/resumes/Pranav_Kakde_Java_Backend_Resume.pdf)
- [🤖 Download AI / ML & GenAI Resume](/resumes/Pranav_Kakde_AIML_GenAI_Resume.pdf)`;
    } else {
      fallbackAnswer = `Hello! I am **Pranav's AI Assistant**. I can help you explore Pranav Kakde's engineering qualifications, projects, skills, education, and resumes.

Here are key topics you can ask me about:
1. **Projects**: "What projects has Pranav built?"
2. **Backend & Java**: "Does he know Spring Boot and Microservices?"
3. **AI / ML & GenAI**: "Tell me about his LangChain, RAG, and LLM agent projects."
4. **Education & Resumes**: "Show me his education background and resumes."

You can also download his resumes directly:
- [📄 Java / Backend Resume](/resumes/Pranav_Kakde_Java_Backend_Resume.pdf)
- [🤖 AI / ML Resume](/resumes/Pranav_Kakde_AIML_GenAI_Resume.pdf)

Or reach out to him via email at [kakdepranav993@gmail.com](mailto:kakdepranav993@gmail.com).`;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = fallbackAnswer.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
