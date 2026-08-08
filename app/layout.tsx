import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pranav's AI Assistant | Interactive Recruiter & Portfolio Bot",
  description: "Ask anything about Pranav Kakde — his backend/full-stack projects, AI/ML engineering, Spring Boot, LangChain, skills, and resumes.",
  keywords: ["Pranav Kakde", "AI Assistant", "Software Engineer", "Java Backend Developer", "AI/ML Engineer", "LangChain", "Spring Boot"],
  authors: [{ name: "Pranav Kakde", url: "https://github.com/PRANAVKAKDE613" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#176b63] selection:text-white dark:selection:bg-[#66c6b7] dark:selection:text-black">
        {children}
      </body>
    </html>
  );
}
