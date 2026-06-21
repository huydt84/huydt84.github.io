export interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  highlights: string[];
}

export const experiences: Experience[] = [
  {
    company: "avatarin",
    role: "AI Team Lead",
    location: "Tokyo, Japan",
    period: "Oct 2025 - Present",
    highlights: [
      "Lead a team of 4 engineers building production RAG and conversational AI systems.",
      "Designed and implemented a document processing and retrieval pipeline including parsing, chunking, vector database indexing, semantic search, and reranking, reducing search operations by ~25% via caching and query filtering strategies.",
      "Built guided conversational agents for QA and flight-booking use cases using the Parlant framework; reduced LLM calls by 50% via custom optimization.",
      "Developed a two-layer text moderation system and optimized sidecar service with Rust tokenizer, achieving 20× higher throughput than Python Triton server.",
      "Designed request clustering and routing mechanisms to maximize KV-cache reuse in LLM servers, improving inference efficiency.",
    ],
  },
  {
    company: "Brains Technology",
    role: "Software Engineer",
    location: "Tokyo, Japan",
    period: "Nov 2024 - Sep 2025",
    highlights: [
      "Built enterprise RAG-based products including ChatEI, a document QA chatbot, and Intelligent Search, an agent-based search strategy generator.",
      "Improved document indexing and retrieval by supporting multimodal inputs and automated retrieval workflows with agents.",
      "Reduced first-response latency from 3.5s to 2.5s, 30% faster, via search optimization, embedding inference acceleration using llama.cpp, and caching.",
      "Contributed to both backend services and UI development.",
    ],
  },
  {
    company: "llama.cpp",
    role: "Open-Source Collaborator",
    location: "Remote",
    period: "May 2025 - Aug 2025",
    highlights: [
      "Contributed to llama.cpp, a popular open-source C/C++ LLM inference engine with ~100k GitHub stars.",
      "Added support for new embedding and ranking models by converting them to GGUF format and implementing their inference graphs.",
    ],
  },
  {
    company: "Sun Asterisk Vietnam",
    role: "AI Engineer Internship",
    location: "Hanoi, Vietnam",
    period: "May 2022 - Sep 2023",
    highlights: [
      "Built an internal taxpayer verification tool with automated document upload and data extraction.",
      "Trained a deep learning model to bypass CAPTCHA on the official taxpayer portal, achieving 93% accuracy and reducing manual verification time by 83%.",
      "Developed a POC platform generating talking-head videos from text using SadTalker and Tacotron2.",
    ],
  },
];
