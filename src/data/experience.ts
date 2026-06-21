export interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  highlights: string[];
}

export const experiences: Experience[] = [
  {
    company: "Brains Technology",
    role: "Software Engineer",
    location: "Tokyo, Japan",
    period: "Nov 2024 - Present",
    highlights: [
      "Developed ChatEI, a chatbot for querying in-house documents.",
      "Boosted first response time by 30% (3.5s to 2.5s) through search optimization, faster embedding model inference (with llama.cpp), and caching.",
      "Optimized document indexing and retrieval by supporting non-text data and automating retrieval with agents.",
    ],
  },
  {
    company: "llama.cpp",
    role: "Open-Source Collaborator",
    location: "Remote",
    period: "May 2025 - Present",
    highlights: [
      "Contribute to a leading open-source library (~82k GitHub stars) for C/C++ model inference.",
      "Focus on adding support for new text embedding and ranking models by converting them to GGUF format and writing inference graphs.",
    ],
  },
  {
    company: "Sun Asterisk Vietnam",
    role: "AI Engineer Internship",
    location: "Hanoi, Vietnam",
    period: "May 2022 - Sep 2023",
    highlights: [
      "Developed an internal tool to automate taxpayer information retrieval from documents, reducing manual verification time by 83%.",
      "Trained a deep learning model to bypass website Captcha with 93% accuracy.",
      "Created a Talking Avatar POC generating human-like talking head videos from text.",
    ],
  },
];
