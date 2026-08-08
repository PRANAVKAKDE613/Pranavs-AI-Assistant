"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Trash2,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
  Download,
  FileCode,
  Bot,
  User,
  Github,
  Linkedin,
  Globe,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Code2,
  GraduationCap,
  FileText
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    label: "Featured Projects",
    prompt: "What featured projects has Pranav built?",
  },
  {
    icon: Briefcase,
    label: "Spring Boot & Backend",
    prompt: "Does he know Spring Boot, Microservices & Java?",
  },
  {
    icon: Bot,
    label: "AI/ML & GenAI Track",
    prompt: "Tell me about his AI/ML, LangChain & RAG projects.",
  },
  {
    icon: GraduationCap,
    label: "Resumes & Contact",
    prompt: "Show me his education background, contact info & resumes.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("pranav-ai-theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pranav-ai-theme", "light");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
      localStorage.setItem("pranav-ai-theme", "dark");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const queryText = (customPrompt || input).trim();
    if (!queryText || isLoading) return;

    setErrorMsg(null);
    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const assistantMessageId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    setMessages([...newMessages, initialAssistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        let errText = "Failed to connect to assistant service.";
        try {
          const errJson = await response.json();
          errText = errJson.error || errText;
        } catch (_) {}
        throw new Error(errText);
      }

      if (!response.body) {
        throw new Error("No response stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent, isStreaming: true }
              : msg
          )
        );
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bgLight dark:bg-bgDark text-inkLight dark:text-inkDark transition-colors duration-200">
      {/* PERSISTENT HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3 bg-surfaceLight/80 dark:bg-surfaceDark/80 backdrop-blur-md border-b border-lineLight dark:border-lineDark">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#176b63] to-[#c95f43] dark:from-[#66c6b7] dark:to-[#f09a78] flex items-center justify-center text-white dark:text-black font-extrabold text-sm shadow-md">
            PK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight leading-none">
                Pranav's AI Assistant
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#176b63]/10 dark:bg-[#66c6b7]/10 text-[#176b63] dark:text-[#66c6b7] border border-[#176b63]/20 dark:border-[#66c6b7]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176b63] dark:bg-[#66c6b7] animate-pulse mr-1"></span>
                Grounded AI
              </span>
            </div>
            <p className="text-xs text-mutedLight dark:text-mutedDark hidden sm:block">
              Interactive Recruiter & Engineer Profile Bot
            </p>
          </div>
        </div>

        {/* Header Actions & Resume Downloads */}
        <div className="flex items-center gap-2">
          {/* Quick Links */}
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <a
              href="https://github.com/PRANAVKAKDE613/Portfolio1"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-surfaceSoftLight dark:hover:bg-surfaceSoftDark transition-colors text-mutedLight dark:text-mutedDark hover:text-accentLight dark:hover:text-accentDark text-xs flex items-center gap-1 font-medium"
              title="View Portfolio"
            >
              <Globe className="w-4 h-4" />
              <span>Portfolio</span>
            </a>
            <a
              href="https://github.com/PRANAVKAKDE613"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-surfaceSoftLight dark:hover:bg-surfaceSoftDark transition-colors text-mutedLight dark:text-mutedDark hover:text-accentLight dark:hover:text-accentDark text-xs flex items-center gap-1 font-medium"
              title="GitHub Profile"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/pranav-kakde-351a26205/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-surfaceSoftLight dark:hover:bg-surfaceSoftDark transition-colors text-mutedLight dark:text-mutedDark hover:text-accentLight dark:hover:text-accentDark text-xs flex items-center gap-1 font-medium"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
          </div>

          {/* Resume Download Buttons */}
          <div className="flex items-center gap-1.5">
            <a
              href="/resumes/Pranav_Kakde_Java_Backend_Resume.pdf"
              target="_blank"
              download
              className="px-2.5 py-1.5 rounded-lg bg-surfaceSoftLight dark:bg-surfaceSoftDark hover:bg-[#176b63] hover:text-white dark:hover:bg-[#66c6b7] dark:hover:text-black border border-lineLight dark:border-lineDark text-xs font-semibold transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Java</span> Resume
            </a>
            <a
              href="/resumes/Pranav_Kakde_AIML_GenAI_Resume.pdf"
              target="_blank"
              download
              className="px-2.5 py-1.5 rounded-lg bg-[#176b63] dark:bg-[#66c6b7] text-white dark:text-black hover:opacity-90 text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI/ML</span> Resume
            </a>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-lineLight dark:border-lineDark bg-surfaceLight dark:bg-surfaceDark text-inkLight dark:text-inkDark hover:bg-surfaceSoftLight dark:hover:bg-surfaceSoftDark transition-colors ml-1"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* CHAT MESSAGES AREA */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto flex flex-col">
        {messages.length === 0 ? (
          /* EMPTY STATE / HERO SCREEN */
          <div className="flex-1 flex flex-col items-center justify-center my-auto text-center px-2 py-8 animate-fadeIn">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#176b63] via-[#0f4c46] to-[#c95f43] dark:from-[#66c6b7] dark:via-[#176b63] dark:to-[#f09a78] flex items-center justify-center text-white dark:text-black font-black text-3xl shadow-xl">
                PK
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-surfaceLight dark:bg-surfaceDark rounded-full border border-lineLight dark:border-lineDark shadow-sm">
                <Sparkles className="w-4 h-4 text-[#176b63] dark:text-[#66c6b7]" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Talk to Pranav Kakde's AI Assistant
            </h2>
            <p className="text-sm sm:text-base text-mutedLight dark:text-mutedDark max-w-xl mb-8 leading-relaxed">
              Ask anything about Pranav's experience, Java & Spring Boot backend projects, AI/ML engineering, LangChain agents, or grab his resumes.
            </p>

            {/* STARTER PROMPT CHIPS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
              {STARTER_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="group p-4 rounded-xl border border-lineLight dark:border-lineDark bg-surfaceLight dark:bg-surfaceDark hover:border-[#176b63] dark:hover:border-[#66c6b7] hover:shadow-md transition-all text-left flex items-start gap-3"
                  >
                    <div className="p-2.5 rounded-lg bg-surfaceSoftLight dark:bg-surfaceSoftDark group-hover:bg-[#176b63]/10 dark:group-hover:bg-[#66c6b7]/10 transition-colors">
                      <Icon className="w-5 h-5 text-[#176b63] dark:text-[#66c6b7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-mutedLight dark:text-mutedDark mb-1 group-hover:text-[#176b63] dark:group-hover:text-[#66c6b7] transition-colors">
                        {item.label}
                      </div>
                      <div className="text-sm font-medium text-inkLight dark:text-inkDark line-clamp-2">
                        "{item.prompt}"
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-mutedLight dark:text-mutedDark opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-1" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* MESSAGE STREAM LIST */
          <div className="flex flex-col gap-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#176b63] to-[#0f4c46] dark:from-[#66c6b7] dark:to-[#176b63] flex items-center justify-center text-white dark:text-black font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                    PK
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#176b63] dark:bg-[#66c6b7] text-white dark:text-black rounded-tr-none"
                      : "bg-surfaceLight dark:bg-surfaceDark border border-lineLight dark:border-lineDark text-inkLight dark:text-inkDark rounded-tl-none"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="prose-assistant text-sm sm:text-base">
                      {msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : msg.isStreaming ? (
                        <div className="flex items-center gap-2 text-xs text-mutedLight dark:text-mutedDark">
                          <span className="w-2 h-2 rounded-full bg-[#176b63] dark:bg-[#66c6b7] animate-ping"></span>
                          <span>Thinking & retrieving ground knowledge...</span>
                        </div>
                      ) : null}

                      {msg.isStreaming && msg.content && (
                        <span className="inline-block w-2 h-4 bg-[#176b63] dark:bg-[#66c6b7] animate-pulse ml-1 align-middle"></span>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1.5 font-medium ${
                      msg.role === "user"
                        ? "text-white/70 dark:text-black/70 text-right"
                        : "text-mutedLight dark:text-mutedDark text-left"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-surfaceSoftLight dark:bg-surfaceSoftDark border border-lineLight dark:border-lineDark flex items-center justify-center text-mutedLight dark:text-mutedDark font-bold text-xs shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="max-w-4xl w-full mx-auto px-4 mb-2">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="hover:underline font-semibold ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      <footer className="sticky bottom-0 z-20 bg-surfaceLight/95 dark:bg-surfaceDark/95 backdrop-blur-md border-t border-lineLight dark:border-lineDark px-4 py-3">
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-2">
          <div className="relative flex items-center">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Pranav's projects, skills, or experience..."
              rows={1}
              className="w-full pl-4 pr-24 py-3 rounded-xl bg-bgLight dark:bg-bgDark border border-lineLight dark:border-lineDark focus:border-[#176b63] dark:focus:border-[#66c6b7] focus:outline-none focus:ring-1 focus:ring-[#176b63] dark:focus:ring-[#66c6b7] text-sm resize-none transition-colors"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-mutedLight dark:text-mutedDark hover:text-red-500 dark:hover:text-red-400 hover:bg-surfaceSoftLight dark:hover:bg-surfaceSoftDark transition-colors disabled:opacity-50"
                  title="Clear chat session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-[#176b63] dark:bg-[#66c6b7] text-white dark:text-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-mutedLight dark:text-mutedDark px-1">
            <span>
              Press <kbd className="px-1 py-0.5 bg-surfaceSoftLight dark:bg-surfaceSoftDark rounded border border-lineLight dark:border-lineDark font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-surfaceSoftLight dark:bg-surfaceSoftDark rounded border border-lineLight dark:border-lineDark font-mono text-[10px]">Shift+Enter</kbd> for new line
            </span>
            <div className="hidden sm:flex items-center gap-3">
              <a href="mailto:kakdepranav993@gmail.com" className="hover:text-[#176b63] dark:hover:text-[#66c6b7] transition-colors">
                kakdepranav993@gmail.com
              </a>
              <span>•</span>
              <a href="https://github.com/PRANAVKAKDE613/Portfolio1" target="_blank" rel="noreferrer" className="hover:text-[#176b63] dark:hover:text-[#66c6b7] transition-colors">
                Main Portfolio
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
