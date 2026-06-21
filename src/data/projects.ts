export interface Project {
  name: string;
  description: string;
  tags: string[];
}

export const projects: Project[] = [
  {
    name: "ChatEI Chatbot",
    description:
      "Developed a chatbot to answer questions about in-house documents, optimizing indexing, retrieval, and response time (30% faster).",
    tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
  },
  {
    name: "End-to-End Vietnamese Text-to-Speech System",
    description:
      "Developed a complete system to crawl news, process text, and deploy TTS models with five regional Vietnamese voices.",
    tags: ["Python", "ONNX", "Docker", "Web App"],
  },
  {
    name: "Hanoi House Price Prediction",
    description:
      "Created a web app to predict rent prices. Built a pipeline for daily data crawling, model evaluation, and automatic retraining on data drift.",
    tags: ["Python", "Data Science", "MLOps", "Web App"],
  },
  {
    name: "Taxpayer Verification Tool",
    description:
      "Built a tool that achieved 93% accuracy in CAPTCHA recognition and reduced manual verification time by 83%.",
    tags: ["Deep Learning", "CNN", "Web App"],
  },
  {
    name: "Talking Avatar POC",
    description:
      "Created a proof-of-concept web platform to generate human-like talking head videos from text using pre-trained models.",
    tags: ["SadTalker", "Tacotron2", "Web App"],
  },
];
