import type { Locale } from "@/lib/locale";

export interface WorkItem {
  name: string;
  description: string;
  tags: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface SocialItem {
  label: string;
  url: string;
  icon: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface LocaleContent {
  meta: {
    siteTitle: string;
    siteDescription: string;
  };
  ui: {
    home: string;
    blog: string;
    about: string;
    work: string;
    experience: string;
    skills: string;
    writing: string;
    language: string;
    theme: string;
    openMenu: string;
    closeMenu: string;
    viewWork: string;
    readBlog: string;
    selectedTechnicalWork: string;
    technicalWriting: string;
    blogComingSoon: string;
    viewAllPosts: string;
    noPosts: string;
    aboutSection: string;
    comments: string;
    backToBlog: string;
    backHome: string;
    blogIndexDescription: string;
    blogIndexTitle: string;
    blogLead: string;
    notFoundTitle: string;
    notFoundLead: string;
    notFoundBody: string;
    commentsNotConfigured: string;
    copyright: string;
  };
  hero: {
    headline: string;
    tagline: string;
    location: string;
  };
  about: string[];
  selectedWork: WorkItem[];
  experiences: ExperienceItem[];
  skills: SkillGroup[];
  socials: SocialItem[];
}

export const localeContent: Record<Locale, LocaleContent> = {
  en: {
    meta: {
      siteTitle: "Dinh Trong Huy - AI Engineer",
      siteDescription:
        "AI Engineer focused on LLM inference, serving, batching, retrieval systems, and production AI infrastructure.",
    },
    ui: {
      home: "Home",
      blog: "Blog",
      about: "About",
      work: "Work",
      experience: "Experience",
      skills: "Skills",
      writing: "Writing",
      language: "Language",
      theme: "Theme",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      viewWork: "View Work",
      readBlog: "Read Blog",
      selectedTechnicalWork: "Selected Technical Work",
      technicalWriting: "Technical Writing",
      blogComingSoon: "Blog posts coming soon.",
      viewAllPosts: "View all posts",
      noPosts: "No blog posts yet.",
      aboutSection: "About",
      comments: "Comments",
      backToBlog: "Back to Blog",
      backHome: "Back to Home",
      blogIndexDescription: "Blog posts about AI, software engineering, and technology.",
      blogIndexTitle: "Blog",
      blogLead: "Thoughts on AI, software engineering, and technology.",
      notFoundTitle: "404 - Page Not Found",
      notFoundLead: "Page not found",
      notFoundBody: "The page you are looking for does not exist or has been moved.",
      commentsNotConfigured: "Comments are not yet configured.",
      copyright: "All rights reserved.",
    },
    hero: {
      headline: "AI Engineer building LLM inference and production AI systems.",
      tagline:
        "Focused on LLM serving, batching, retrieval systems, KV-cache optimization, and performance-oriented backend infrastructure.",
      location: "Japan",
    },
    about: [
      "I am a passionate and results-oriented AI Engineer with a Bachelor's degree in Information Technology from Hanoi University of Science and Technology (GPA 3.5). I have a strong interest in AI and machine learning, with hands-on experience building chatbots, optimizing model inference, and contributing to open-source repos such as llama.cpp.",
      "I enjoy solving complex problems and building end-to-end systems, from data crawling and model training to deployment and UI development. My goal is to use technology to create efficient, practical, and impactful solutions.",
    ],
    selectedWork: [
      {
        name: "MLX Server Runtime",
        description:
          "LLM inference server runtime on Apple Silicon with a Rust control plane and Python MLX worker, supporting batching, streaming, cancellation, and benchmark validation.",
        tags: ["MLX", "Rust", "Python", "LLM Serving"],
      },
      {
        name: "LLM Request Clustering / KV Cache Reuse",
        description:
          "Routing and clustering mechanism to maximize KV-cache reuse and improve serving efficiency in LLM servers.",
        tags: ["KV cache", "batching", "LLM Serving", "Rust"],
      },
      {
        name: "Rust Tokenizer Sidecar",
        description:
          "Optimized moderation and tokenization sidecar reaching approximately 20x throughput over a Python Triton baseline.",
        tags: ["Rust", "tokenizer", "performance", "moderation"],
      },
      {
        name: "RAG / Document QA Pipeline",
        description:
          "Document processing, indexing, semantic search, reranking, caching, and query filtering pipeline that reduced search operations by about 25%.",
        tags: ["RAG", "Vector Databases", "semantic search", "reranking"],
      },
      {
        name: "ChatEI Chatbot",
        description:
          "Enterprise chatbot for internal documents with improved indexing, retrieval, and response time by 30%.",
        tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
      },
    ],
    experiences: [
      {
        company: "avatarin",
        role: "AI Engineer",
        location: "Tokyo, Japan",
        period: "Oct 2025 - Present",
        highlights: [
          "Led a team of four engineers building production RAG and conversational AI systems.",
          "Built document processing and retrieval pipelines with parsing, chunking, vector indexing, semantic search, reranking, caching, and query filtering.",
          "Optimized LLM-serving components including request clustering, KV-cache reuse, moderation, and a Rust tokenizer sidecar reaching 20x throughput over a Python baseline.",
        ],
      },
      {
        company: "Brains Technology",
        role: "Software Engineer",
        location: "Tokyo, Japan",
        period: "Nov 2024 - Sep 2025",
        highlights: [
          "Built enterprise RAG products including ChatEI, document QA, and agent-based search workflows.",
          "Reduced first-response latency from 3.5s to 2.5s through search optimization, embedding inference acceleration with llama.cpp, and caching.",
          "Contributed to backend services and UI development where needed.",
        ],
      },
      {
        company: "llama.cpp",
        role: "Open-Source Collaborator",
        location: "Remote",
        period: "May 2025 - Aug 2025",
        highlights: [
          "Contributed to llama.cpp, a popular open-source C/C++ LLM inference engine with around 100k GitHub stars.",
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
          "Developed a proof-of-concept platform for generating talking-head videos from text using SadTalker and Tacotron2.",
        ],
      },
    ],
    skills: [
      {
        category: "LLM Serving",
        items: ["MLX", "llama.cpp", "KV cache", "batching"],
      },
      {
        category: "Retrieval",
        items: ["RAG", "Vector Databases", "semantic search", "reranking", "embedding models", "ranking models"],
      },
      {
        category: "Backend",
        items: ["Python", "FastAPI", "Rust", "Node.js"],
      },
      {
        category: "Infra",
        items: ["Docker", "MongoDB", "Git"],
      },
      {
        category: "ML",
        items: ["PyTorch", "ONNX", "TensorFlow"],
      },
    ],
    socials: [
      {
        label: "Email",
        url: "mailto:viethuy061002@gmail.com",
        icon: "envelope",
      },
      {
        label: "GitHub",
        url: "https://github.com/huydt84",
        icon: "github",
      },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/huydt84",
        icon: "linkedin",
      },
      {
        label: "CV",
        url: "/CV_06032026.pdf",
        icon: "file-pdf",
      },
    ],
  },
  vi: {
    meta: {
      siteTitle: "Dinh Trong Huy - Kỹ sư AI",
      siteDescription:
        "Kỹ sư AI tập trung vào suy luận LLM, LLM serving, batching, hệ thống truy xuất và hạ tầng AI trong môi trường production.",
    },
    ui: {
      home: "Trang chủ",
      blog: "Blog",
      about: "Giới thiệu",
      work: "Dự án",
      experience: "Kinh nghiệm",
      skills: "Kỹ năng",
      writing: "Bài viết",
      language: "Ngôn ngữ",
      theme: "Giao diện",
      openMenu: "Mở menu",
      closeMenu: "Đóng menu",
      viewWork: "Xem nội dung",
      readBlog: "Đọc blog",
      selectedTechnicalWork: "Dự án chuyên môn",
      technicalWriting: "Bài viết kỹ thuật",
      blogComingSoon: "Bài viết sẽ sớm ra mắt.",
      viewAllPosts: "Xem tất cả bài viết",
      noPosts: "Chưa có bài viết nào.",
      aboutSection: "Giới thiệu",
      comments: "Bình luận",
      backToBlog: "Quay lại blog",
      backHome: "Quay về trang chủ",
      blogIndexDescription: "Các bài viết về AI, kỹ thuật phần mềm và công nghệ.",
      blogIndexTitle: "Blog",
      blogLead: "Những chia sẻ về AI, kỹ thuật phần mềm và công nghệ.",
      notFoundTitle: "404 - Không tìm thấy trang",
      notFoundLead: "Không tìm thấy trang",
      notFoundBody: "Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đi.",
      commentsNotConfigured: "Phần bình luận chưa được cấu hình.",
      copyright: "Mọi quyền được bảo lưu.",
    },
    hero: {
      headline: "Kỹ sư AI xây dựng hệ thống suy luận LLM và hệ thống AI cho môi trường production.",
      tagline:
        "Tập trung vào LLM serving, batching, hệ thống truy xuất, tối ưu KV-cache và hạ tầng backend hiệu năng cao.",
      location: "Nhật Bản",
    },
    about: [
      "Tôi là một kỹ sư AI đam mê công nghệ và định hướng kết quả, có bằng Cử nhân Công nghệ Thông tin tại Đại học Bách khoa Hà Nội (GPA 3.5). Tôi đặc biệt quan tâm đến AI và machine learning, với kinh nghiệm thực tế trong việc xây dựng chatbot, tối ưu suy luận mô hình và đóng góp cho các dự án mã nguồn mở như llama.cpp.",
      "Tôi thích giải các bài toán phức tạp và xây dựng hệ thống end-to-end, từ thu thập dữ liệu, huấn luyện mô hình đến triển khai và phát triển giao diện. Mục tiêu của tôi là dùng công nghệ để tạo ra những giải pháp hiệu quả, thiết thực và có tác động rõ ràng.",
    ],
    selectedWork: [
      {
        name: "MLX Server Runtime",
        description:
          "Runtime máy chủ suy luận LLM trên Apple Silicon với control plane viết bằng Rust và MLX worker viết bằng Python, hỗ trợ batching, streaming, hủy yêu cầu và xác thực bằng benchmark.",
        tags: ["MLX", "Rust", "Python", "LLM Serving"],
      },
      {
        name: "Phân cụm yêu cầu / Tái sử dụng KV Cache",
        description:
          "Cơ chế định tuyến và phân cụm nhằm tối đa hóa khả năng tái sử dụng KV cache và cải thiện hiệu quả serving của máy chủ LLM.",
        tags: ["KV cache", "batching", "LLM Serving", "Rust"],
      },
      {
        name: "Rust Tokenizer Sidecar",
        description:
          "Sidecar được tối ưu cho moderation và tokenization, đạt throughput cao gấp khoảng 20 lần baseline sử dụng Python Triton.",
        tags: ["Rust", "tokenizer", "performance", "moderation"],
      },
      {
        name: "Pipeline RAG / Hỏi đáp tài liệu",
        description:
          "Pipeline xử lý tài liệu, đánh chỉ mục, tìm kiếm ngữ nghĩa, reranking, caching và lọc truy vấn, giúp giảm khoảng 25% số thao tác tìm kiếm.",
        tags: ["RAG", "Vector Databases", "semantic search", "reranking"],
      },
      {
        name: "ChatEI Chatbot",
        description:
          "Chatbot doanh nghiệp dành cho tài liệu nội bộ, với quy trình indexing và retrieval được cải thiện, giúp giảm 30% thời gian phản hồi.",
        tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
      },
    ],
    experiences: [
      {
        company: "avatarin",
        role: "AI Engineer",
        location: "Tokyo, Japan",
        period: "Oct 2025 - Present",
        highlights: [
          "Dẫn dắt nhóm 4 kỹ sư xây dựng hệ thống RAG và hội thoại AI cho môi trường sản xuất.",
          "Xây dựng pipeline xử lý và truy xuất tài liệu gồm parsing, chunking, vector indexing, semantic search, reranking, caching và query filtering.",
          "Tối ưu các thành phần LLM-serving gồm request clustering, tái sử dụng KV-cache, moderation và Rust tokenizer sidecar đạt throughput cao gấp 20 lần so với baseline Python.",
        ],
      },
      {
        company: "Brains Technology",
        role: "Software Engineer",
        location: "Tokyo, Japan",
        period: "Nov 2024 - Sep 2025",
        highlights: [
          "Xây dựng các sản phẩm RAG cho doanh nghiệp, bao gồm ChatEI, hệ thống hỏi đáp tài liệu và quy trình tìm kiếm dựa trên agent.",
          "Giảm độ trễ phản hồi đầu tiên từ 3.5s xuống 2.5s thông qua tối ưu search, tăng tốc embedding inference bằng llama.cpp và caching.",
          "Đóng góp vào các dịch vụ backend và phát triển giao diện khi cần thiết.",
        ],
      },
      {
        company: "llama.cpp",
        role: "Open-Source Collaborator",
        location: "Remote",
        period: "May 2025 - Aug 2025",
        highlights: [
          "Đóng góp cho llama.cpp, một LLM inference engine C/C++ mã nguồn mở phổ biến với khoảng 100 nghìn GitHub stars.",
          "Thêm hỗ trợ cho các mô hình embedding và ranking mới bằng cách chuyển chúng sang định dạng GGUF và triển khai các đồ thị suy luận.",
        ],
      },
      {
        company: "Sun Asterisk Vietnam",
        role: "AI Engineer Internship",
        location: "Hanoi, Vietnam",
        period: "May 2022 - Sep 2023",
        highlights: [
          "Xây dựng công cụ xác minh người nộp thuế nội bộ với tính năng tự động tải lên tài liệu và trích xuất dữ liệu.",
          "Huấn luyện mô hình deep learning để vượt CAPTCHA trên cổng thuế chính thức, đạt độ chính xác 93% và giảm 83% thời gian xác minh thủ công.",
          "Phát triển nền tảng proof-of-concept tạo video talking-head từ văn bản bằng SadTalker và Tacotron2.",
        ],
      },
    ],
    skills: [
      {
        category: "LLM Serving",
        items: ["MLX", "llama.cpp", "KV cache", "batching"],
      },
      {
        category: "Retrieval",
        items: ["RAG", "Vector Databases", "semantic search", "reranking", "embedding models", "ranking models"],
      },
      {
        category: "Backend",
        items: ["Python", "FastAPI", "Rust", "Node.js"],
      },
      {
        category: "Infra",
        items: ["Docker", "MongoDB", "Git"],
      },
      {
        category: "ML",
        items: ["PyTorch", "ONNX", "TensorFlow"],
      },
    ],
    socials: [
      {
        label: "Email",
        url: "mailto:viethuy061002@gmail.com",
        icon: "envelope",
      },
      {
        label: "GitHub",
        url: "https://github.com/huydt84",
        icon: "github",
      },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/huydt84",
        icon: "linkedin",
      },
      {
        label: "CV",
        url: "/CV_06032026.pdf",
        icon: "file-pdf",
      },
    ],
  },
  ja: {
    meta: {
      siteTitle: "Dinh Trong Huy - AIエンジニア",
      siteDescription:
        "LLM推論、サービング、バッチ処理、検索システム、プロダクションAI基盤に取り組むAIエンジニア。",
    },
    ui: {
      home: "ホーム",
      blog: "ブログ",
      about: "概要",
      work: "作品",
      experience: "経歴",
      skills: "スキル",
      writing: "執筆",
      language: "言語",
      theme: "テーマ",
      openMenu: "メニューを開く",
      closeMenu: "メニューを閉じる",
      viewWork: "作品を見る",
      readBlog: "ブログを読む",
      selectedTechnicalWork: "主な技術プロジェクト",
      technicalWriting: "技術記事",
      blogComingSoon: "ブログ記事は近日公開予定です。",
      viewAllPosts: "すべての記事を見る",
      noPosts: "ブログ記事はまだありません。",
      aboutSection: "概要",
      comments: "コメント",
      backToBlog: "ブログへ戻る",
      backHome: "ホームに戻る",
      blogIndexDescription: "AI、ソフトウェア工学、テクノロジーに関する記事。",
      blogIndexTitle: "ブログ",
      blogLead: "AI、ソフトウェアエンジニアリング、テクノロジーについての考察。",
      notFoundTitle: "404 - ページが見つかりません",
      notFoundLead: "ページが見つかりません",
      notFoundBody: "お探しのページは存在しないか、移動しました。",
      commentsNotConfigured: "コメントはまだ設定されていません。",
      copyright: "無断転載を禁じます。",
    },
    hero: {
      headline: "LLM推論とプロダクションAIシステムを構築するAIエンジニア。",
      tagline:
        "LLMサービング、バッチ処理、検索システム、KVキャッシュ最適化、パフォーマンス重視のバックエンド基盤に注力しています。",
      location: "日本",
    },
    about: [
      "私は情熱と成果志向を持つAIエンジニアです。ハノイ工科大学で情報技術の学士号を取得し、GPAは3.5でした。AIと機械学習に強い関心があり、チャットボットの構築、モデル推論の最適化、llama.cppなどのオープンソースプロジェクトへの貢献に取り組んできました。",
      "データ収集やモデル学習から、デプロイやUI開発まで、エンドツーエンドのシステムを作ることが好きです。技術を通じて、効率的で実用的、そして価値のある解決策を生み出すことが私の目標です。",
    ],
    selectedWork: [
      {
        name: "MLX Server Runtime",
        description:
          "RustコントロールプレーンとPython MLXワーカーを備えたApple Silicon向けLLM推論サーバーランタイム。バッチ処理、ストリーミング、キャンセル、ベンチマーク検証をサポート。",
        tags: ["MLX", "Rust", "Python", "LLM Serving"],
      },
      {
        name: "LLMリクエストクラスタリング / KVキャッシュ再利用",
        description:
          "LLMサーバーでのKVキャッシュ再利用を最大化し、推論効率を改善するルーティングおよびクラスタリング機構。",
        tags: ["KV cache", "batching", "LLM Serving", "Rust"],
      },
      {
        name: "Rust Tokenizer Sidecar",
        description:
          "最適化されたモデレーションおよびトークナイゼーションサイドカー。Python Tritonベースラインの約20倍のスループットを達成。",
        tags: ["Rust", "tokenizer", "performance", "moderation"],
      },
      {
        name: "RAG / 文書QAパイプライン",
        description:
          "文書処理、インデックス作成、セマンティック検索、再ランキング、キャッシュ、クエリフィルタリングを備えたパイプライン。検索操作を約25%削減。",
        tags: ["RAG", "Vector Databases", "semantic search", "reranking"],
      },
      {
        name: "ChatEI チャットボット",
        description:
          "社内文書向けのエンタープライズチャットボット。インデックス作成と検索を改善し、応答時間を30%短縮しました。",
        tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
      },
    ],
    experiences: [
      {
        company: "avatarin",
        role: "AI Engineer",
        location: "Tokyo, Japan",
        period: "Oct 2025 - Present",
        highlights: [
          "本番環境向けのRAGと会話AIシステムを開発する4人チームをリードしています。",
          "パース、チャンク分割、ベクターインデックス、セマンティック検索、再ランキング、キャッシュ、クエリフィルタリングを含む文書処理および検索パイプラインを構築しました。",
          "LLMサービングコンポーネント（リクエストクラスタリング、KVキャッシュ再利用、モデレーション、Rust tokenizerサイドカー）を最適化し、Pythonベースライン比20倍のスループットを達成しました。",
        ],
      },
      {
        company: "Brains Technology",
        role: "Software Engineer",
        location: "Tokyo, Japan",
        period: "Nov 2024 - Sep 2025",
        highlights: [
          "ChatEI、文書QA、エージェントベースの検索ワークフローを含むエンタープライズRAG製品を構築しました。",
          "検索最適化、llama.cppによる埋め込み推論の高速化、キャッシュにより、初回応答レイテンシを3.5秒から2.5秒に短縮しました。",
          "バックエンドサービスとUI開発の両方に必要な範囲で貢献しました。",
        ],
      },
      {
        company: "llama.cpp",
        role: "Open-Source Collaborator",
        location: "Remote",
        period: "May 2025 - Aug 2025",
        highlights: [
          "約10万のGitHubスターを持つ人気のC/C++ LLM推論エンジン llama.cpp に貢献しました。",
          "新しい埋め込みモデルとランキングモデルをGGUF形式に変換し、推論グラフを実装することでサポートを追加しました。",
        ],
      },
      {
        company: "Sun Asterisk Vietnam",
        role: "AI Engineer Internship",
        location: "Hanoi, Vietnam",
        period: "May 2022 - Sep 2023",
        highlights: [
          "文書アップロードとデータ抽出を自動化した内部の納税者確認ツールを構築しました。",
          "公式納税ポータルのCAPTCHAを突破する深層学習モデルを学習し、93%の精度を達成するとともに、手作業による確認時間を83%削減しました。",
          "SadTalker と Tacotron2 を使って、テキストからトーキングヘッド動画を生成するPoCプラットフォームを開発しました。",
        ],
      },
    ],
    skills: [
      {
        category: "LLM Serving",
        items: ["MLX", "llama.cpp", "KV cache", "batching"],
      },
      {
        category: "Retrieval",
        items: ["RAG", "Vector Databases", "semantic search", "reranking", "embedding models", "ranking models"],
      },
      {
        category: "Backend",
        items: ["Python", "FastAPI", "Rust", "Node.js"],
      },
      {
        category: "Infra",
        items: ["Docker", "MongoDB", "Git"],
      },
      {
        category: "ML",
        items: ["PyTorch", "ONNX", "TensorFlow"],
      },
    ],
    socials: [
      {
        label: "Email",
        url: "mailto:viethuy061002@gmail.com",
        icon: "envelope",
      },
      {
        label: "GitHub",
        url: "https://github.com/huydt84",
        icon: "github",
      },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/huydt84",
        icon: "linkedin",
      },
      {
        label: "CV",
        url: "/CV_06032026.pdf",
        icon: "file-pdf",
      },
    ],
  },
};

export function getLocaleContent(locale: Locale): LocaleContent {
  return localeContent[locale];
}
