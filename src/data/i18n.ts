import type { Locale } from "@/lib/locale";

export interface ProjectItem {
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

export interface LocaleContent {
  meta: {
    siteTitle: string;
    siteDescription: string;
  };
  ui: {
    home: string;
    blog: string;
    about: string;
    experience: string;
    projects: string;
    skills: string;
    language: string;
    theme: string;
    openMenu: string;
    closeMenu: string;
    viewProjects: string;
    readBlog: string;
    featuredProjects: string;
    latestBlogPosts: string;
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
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  skills: string[];
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
      experience: "Experience",
      projects: "Projects",
      skills: "Skills",
      language: "Language",
      theme: "Theme",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      viewProjects: "View Projects",
      readBlog: "Read Blog",
      featuredProjects: "Featured Projects",
      latestBlogPosts: "Latest Blog Posts",
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
      headline: "AI Engineer building production RAG and conversational AI systems.",
      tagline:
        "Focused on LLM serving, retrieval systems, RAG pipelines, and production AI infrastructure.",
      location: "Japan",
    },
    about: [
      "I am a passionate and results-oriented AI Engineer with a Bachelor's degree in Information Technology from Hanoi University of Science and Technology (GPA 3.5). I have a strong interest in AI and machine learning, with hands-on experience building chatbots, optimizing model inference, and contributing to open-source projects such as llama.cpp.",
      "I enjoy solving complex problems and building end-to-end systems, from data crawling and model training to deployment and UI development. My goal is to use technology to create efficient, practical, and impactful solutions.",
    ],
    projects: [
      {
        name: "ChatEI Chatbot",
        description:
          "Built a chatbot for answering questions from internal documents, improving indexing, retrieval, and response time by 30%.",
        tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
      },
      {
        name: "End-to-End Vietnamese Text-to-Speech System",
        description:
          "Built datasets and trained dialect-specific TTS models for five voices, then optimized inference through ONNX deployment and containerization. Delivered an end-to-end pipeline for crawling news, processing data, and generating audio with Vietnamese TTS models.",
        tags: ["Python", "ONNX", "Docker", "TTS"],
      },
      {
        name: "Hanoi House Price Prediction",
        description:
          "Created a web app to predict rent prices with a pipeline for daily data crawling, model evaluation, and automatic retraining when data drift was detected.",
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
          "Created a proof-of-concept web platform that generates human-like talking-head videos from text using pre-trained models.",
        tags: ["SadTalker", "Tacotron2", "Web App"],
      },
    ],
    experiences: [
      {
        company: "avatarin",
        role: "AI Engineer",
        location: "Tokyo, Japan",
        period: "Oct 2025 - Present",
        highlights: [
          "Lead a team of four engineers building production RAG and conversational AI systems.",
          "Designed and implemented a document processing and retrieval pipeline with parsing, chunking, vector database indexing, semantic search, and reranking, reducing search operations by about 25% through caching and query filtering.",
          "Built guided conversational agents for QA and flight-booking use cases with the Parlant framework and reduced LLM calls by 50% through custom optimization.",
          "Developed a two-layer text moderation system and optimized a sidecar service with a Rust tokenizer, reaching 20x higher throughput than a Python Triton server.",
          "Designed request clustering and routing mechanisms to maximize KV-cache reuse in LLM servers and improve inference efficiency.",
        ],
      },
      {
        company: "Brains Technology",
        role: "Software Engineer",
        location: "Tokyo, Japan",
        period: "Nov 2024 - Sep 2025",
        highlights: [
          "Built enterprise RAG products including ChatEI, a document QA chatbot, and Intelligent Search, an agent-based search strategy generator.",
          "Improved document indexing and retrieval by supporting multimodal inputs and automated retrieval workflows with agents.",
          "Reduced first-response latency from 3.5s to 2.5s, a 30% improvement, through search optimization, embedding inference acceleration with llama.cpp, and caching.",
          "Contributed to both backend services and UI development.",
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
      "Python",
      "PyTorch",
      "TensorFlow",
      "FastAPI",
      "Django",
      "Flask",
      "Node.js",
      "Flutter",
      "Docker",
      "Vector Databases",
      "MongoDB",
      "Git",
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
        "Kỹ sư AI tập trung vào suy luận LLM, serving, batching, truy xuất thông tin và hạ tầng AI sản xuất.",
    },
    ui: {
      home: "Trang chủ",
      blog: "Blog",
      about: "Giới thiệu",
      experience: "Kinh nghiệm",
      projects: "Dự án",
      skills: "Kỹ năng",
      language: "Ngôn ngữ",
      theme: "Giao diện",
      openMenu: "Mở menu",
      closeMenu: "Đóng menu",
      viewProjects: "Xem dự án",
      readBlog: "Đọc blog",
      featuredProjects: "Dự án nổi bật",
      latestBlogPosts: "Bài viết mới nhất",
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
      headline: "Kỹ sư AI xây dựng hệ thống RAG và hội thoại AI cho môi trường sản xuất.",
      tagline:
        "Tập trung vào LLM serving, hệ thống truy xuất, pipeline RAG và hạ tầng AI sản xuất.",
      location: "Nhật Bản",
    },
    about: [
      "Tôi là một kỹ sư AI yêu thích giải quyết vấn đề và hướng đến kết quả, tốt nghiệp Cử nhân Công nghệ Thông tin tại Đại học Bách khoa Hà Nội (GPA 3.5). Tôi có niềm đam mê lớn với AI và machine learning, cùng kinh nghiệm thực tế trong xây dựng chatbot, tối ưu suy luận mô hình và đóng góp cho các dự án mã nguồn mở như llama.cpp.",
      "Tôi thích giải các bài toán phức tạp và xây dựng hệ thống end-to-end, từ thu thập dữ liệu, huấn luyện mô hình đến triển khai và phát triển giao diện. Mục tiêu của tôi là dùng công nghệ để tạo ra những giải pháp hiệu quả, thiết thực và có tác động rõ ràng.",
    ],
    projects: [
      {
        name: "ChatEI Chatbot",
        description:
          "Xây dựng chatbot trả lời câu hỏi từ tài liệu nội bộ, giúp cải thiện indexing, retrieval và thời gian phản hồi nhanh hơn 30%.",
        tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
      },
      {
        name: "Hệ thống TTS tiếng Việt end-to-end",
        description:
          "Xây dựng bộ dữ liệu và huấn luyện các mô hình TTS theo vùng miền cho 5 giọng đọc, đồng thời tối ưu suy luận bằng triển khai ONNX và containerization. Hoàn thiện pipeline end-to-end để crawl tin tức, xử lý dữ liệu và tạo audio bằng mô hình TTS tiếng Việt.",
        tags: ["Python", "ONNX", "Docker", "TTS"],
      },
      {
        name: "Dự đoán giá nhà Hà Nội",
        description:
          "Tạo web app dự đoán giá thuê với pipeline crawl dữ liệu hằng ngày, đánh giá mô hình và tự động retrain khi phát hiện data drift.",
        tags: ["Python", "Data Science", "MLOps", "Web App"],
      },
      {
        name: "Công cụ xác minh người nộp thuế",
        description:
          "Xây dựng công cụ đạt độ chính xác 93% trong nhận dạng CAPTCHA và giảm 83% thời gian xác minh thủ công.",
        tags: ["Deep Learning", "CNN", "Web App"],
      },
      {
        name: "POC Avatar nói chuyện",
        description:
          "Tạo một nền tảng web proof-of-concept để sinh video talking-head giống người thật từ văn bản bằng các mô hình tiền huấn luyện.",
        tags: ["SadTalker", "Tacotron2", "Web App"],
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
          "Thiết kế và triển khai pipeline xử lý tài liệu và truy xuất gồm parsing, chunking, indexing vector database, semantic search và reranking, giúp giảm khoảng 25% số thao tác tìm kiếm nhờ caching và query filtering.",
          "Xây dựng conversational agent có hướng dẫn cho các use case QA và đặt vé máy bay bằng Parlant framework; giảm 50% số lần gọi LLM nhờ tối ưu riêng.",
          "Phát triển hệ thống moderation văn bản hai lớp và tối ưu sidecar service với Rust tokenizer, đạt throughput cao hơn 20 lần so với Python Triton server.",
          "Thiết kế cơ chế clustering và routing request để tăng khả năng tái sử dụng KV-cache trong LLM server và cải thiện hiệu năng suy luận.",
        ],
      },
      {
        company: "Brains Technology",
        role: "Software Engineer",
        location: "Tokyo, Japan",
        period: "Nov 2024 - Sep 2025",
        highlights: [
          "Xây dựng các sản phẩm RAG cho doanh nghiệp gồm ChatEI, chatbot hỏi đáp tài liệu, và Intelligent Search, công cụ tạo chiến lược tìm kiếm dựa trên agent.",
          "Cải thiện indexing và retrieval tài liệu bằng cách hỗ trợ đầu vào đa phương thức và tự động hóa workflow truy xuất với agent.",
          "Giảm độ trễ phản hồi đầu tiên từ 3.5s xuống 2.5s, tức cải thiện 30%, thông qua tối ưu search, tăng tốc embedding inference bằng llama.cpp và caching.",
          "Tham gia cả backend services lẫn phát triển giao diện.",
        ],
      },
      {
        company: "llama.cpp",
        role: "Open-Source Collaborator",
        location: "Remote",
        period: "May 2025 - Aug 2025",
        highlights: [
          "Đóng góp cho llama.cpp, một C/C++ LLM inference engine mã nguồn mở phổ biến với khoảng 100k GitHub stars.",
          "Thêm hỗ trợ cho các mô hình embedding và ranking mới bằng cách chuyển chúng sang định dạng GGUF và triển khai các đồ thị suy luận.",
        ],
      },
      {
        company: "Sun Asterisk Vietnam",
        role: "AI Engineer Internship",
        location: "Hanoi, Vietnam",
        period: "May 2022 - Sep 2023",
        highlights: [
          "Xây dựng công cụ xác minh người nộp thuế nội bộ với upload tài liệu và trích xuất dữ liệu tự động.",
          "Huấn luyện mô hình deep learning để vượt CAPTCHA trên cổng thuế chính thức, đạt độ chính xác 93% và giảm 83% thời gian xác minh thủ công.",
          "Phát triển proof-of-concept platform tạo video talking-head từ văn bản bằng SadTalker và Tacotron2.",
        ],
      },
    ],
    skills: [
      "Python",
      "PyTorch",
      "TensorFlow",
      "FastAPI",
      "Django",
      "Flask",
      "Node.js",
      "Flutter",
      "Docker",
      "Vector Databases",
      "MongoDB",
      "Git",
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
        "LLM推論、サービング、バッチ処理、検索、プロダクション向けAI基盤に取り組むAIエンジニア。",
    },
    ui: {
      home: "ホーム",
      blog: "ブログ",
      about: "概要",
      experience: "経歴",
      projects: "プロジェクト",
      skills: "スキル",
      language: "言語",
      theme: "テーマ",
      openMenu: "メニューを開く",
      closeMenu: "メニューを閉じる",
      viewProjects: "プロジェクトを見る",
      readBlog: "ブログを読む",
      featuredProjects: "注目プロジェクト",
      latestBlogPosts: "最新ブログ",
      blogComingSoon: "ブログ記事は近日公開予定です。",
      viewAllPosts: "すべての記事を見る",
      noPosts: "ブログ記事はまだありません。",
      aboutSection: "概要",
      comments: "コメント",
      backToBlog: "ブログへ戻る",
      backHome: "ホームに戻る",
      blogIndexDescription: "AI、ソフトウェア工学、テクノロジーに関する記事。",
      blogIndexTitle: "ブログ",
      blogLead: "AI、ソフトウェア工学、テクノロジーについての考え。",
      notFoundTitle: "404 - ページが見つかりません",
      notFoundLead: "ページが見つかりません",
      notFoundBody: "お探しのページは存在しないか、移動しました。",
      commentsNotConfigured: "コメントはまだ設定されていません。",
      copyright: "無断転載を禁じます。",
    },
    hero: {
      headline: "プロダクション向けのRAGと会話AIシステムを構築するAIエンジニア。",
      tagline:
        "LLMサービング、検索システム、RAGパイプライン、プロダクションAI基盤に注力しています。",
      location: "日本",
    },
    about: [
      "私は問題解決を楽しむ結果志向のAIエンジニアです。ハノイ工科大学で情報技術の学士号を取得し、GPAは3.5でした。AIと機械学習に強い関心があり、チャットボットの構築、モデル推論の最適化、llama.cppのようなオープンソースプロジェクトへの貢献を実践してきました。",
      "データ収集やモデル学習から、デプロイやUI開発まで、エンドツーエンドのシステムを作ることが好きです。技術を通じて、効率的で実用的、そして価値のある解決策を生み出すことが私の目標です。",
    ],
    projects: [
      {
        name: "ChatEI チャットボット",
        description:
          "社内文書から質問に答えるチャットボットを構築し、インデックス作成、検索、応答時間を30%改善しました。",
        tags: ["AI", "Chatbot", "llama.cpp", "RAG"],
      },
      {
        name: "ベトナム語音声合成システム",
        description:
          "5つの音声に対して方言別TTSモデルのデータセット作成と学習を行い、ONNXデプロイとコンテナ化で推論を最適化しました。ニュース収集、データ処理、ベトナム語TTSによる音声生成までのエンドツーエンドパイプラインも構築しました。",
        tags: ["Python", "ONNX", "Docker", "TTS"],
      },
      {
        name: "ハノイの住宅価格予測",
        description:
          "日次データ収集、モデル評価、データドリフト時の自動再学習を備えたパイプラインで、賃貸価格を予測するWebアプリを作成しました。",
        tags: ["Python", "Data Science", "MLOps", "Web App"],
      },
      {
        name: "納税者確認ツール",
        description:
          "CAPTCHA認識で93%の精度を達成し、手作業の確認時間を83%削減するツールを開発しました。",
        tags: ["Deep Learning", "CNN", "Web App"],
      },
      {
        name: "トーキングアバターPOC",
        description:
          "事前学習済みモデルを使って、テキストから人間らしいトーキングヘッド動画を生成するWebプラットフォームのPoCを作成しました。",
        tags: ["SadTalker", "Tacotron2", "Web App"],
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
          "パース、チャンク分割、ベクターデータベースのインデックス作成、セマンティック検索、再ランキングを含む文書処理・検索パイプラインを設計・実装し、キャッシュとクエリフィルタリングにより検索操作を約25%削減しました。",
          "Parlantフレームワークを用いたQAおよび航空券予約向けのガイド付き会話エージェントを構築し、独自最適化でLLM呼び出しを50%削減しました。",
          "二層のテキストモデレーションシステムを開発し、Rust tokenizerを使ったサイドカーサービスを最適化して、Python Triton serverの20倍のスループットを達成しました。",
          "LLMサーバーでKV-cacheの再利用を最大化するためのリクエストクラスタリングとルーティング機構を設計し、推論効率を改善しました。",
        ],
      },
      {
        company: "Brains Technology",
        role: "Software Engineer",
        location: "Tokyo, Japan",
        period: "Nov 2024 - Sep 2025",
        highlights: [
          "ChatEIや Intelligent Search など、企業向けRAG製品を開発しました。",
          "マルチモーダル入力対応とエージェントによる自動検索ワークフローで、文書のインデックス作成と検索を改善しました。",
          "検索最適化、llama.cppによる埋め込み推論の高速化、キャッシュの導入により、初回応答レイテンシを3.5秒から2.5秒へ、30%改善しました。",
          "バックエンドサービスとUI開発の両方に貢献しました。",
        ],
      },
      {
        company: "llama.cpp",
        role: "Open-Source Collaborator",
        location: "Remote",
        period: "May 2025 - Aug 2025",
        highlights: [
          "約10万のGitHubスターを持つ人気のC/C++ LLM推論エンジン llama.cpp に貢献しました。",
          "新しいembeddingおよびrankingモデルをGGUF形式に変換し、推論グラフを実装して対応を追加しました。",
        ],
      },
      {
        company: "Sun Asterisk Vietnam",
        role: "AI Engineer Internship",
        location: "Hanoi, Vietnam",
        period: "May 2022 - Sep 2023",
        highlights: [
          "文書アップロードとデータ抽出を自動化した内部の納税者確認ツールを構築しました。",
          "公式納税ポータルのCAPTCHAを突破する深層学習モデルを学習し、93%の精度と83%の手作業削減を達成しました。",
          "SadTalker と Tacotron2 を使って、テキストからトーキングヘッド動画を生成するPoCプラットフォームを開発しました。",
        ],
      },
    ],
    skills: [
      "Python",
      "PyTorch",
      "TensorFlow",
      "FastAPI",
      "Django",
      "Flask",
      "Node.js",
      "Flutter",
      "Docker",
      "Vector Databases",
      "MongoDB",
      "Git",
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
