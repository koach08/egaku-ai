// Blog article data — multi-language, SEO-optimized
// Add new articles here. They auto-generate pages at /blog/{slug}

export type ArticleSection = {
  heading: string;
  content: string; // HTML allowed
};

export type Article = {
  slug: string;
  category: "how-to" | "news" | "guide" | "tips";
  tags: string[];
  publishedAt: string; // ISO date
  updatedAt?: string;
  readingTime: number; // minutes
  premium?: boolean; // true = paid article (free for Lite+ users)
  previewSections?: number; // how many sections to show for free (default: 2)
  translations: {
    [locale: string]: {
      title: string;
      description: string; // SEO meta description
      sections: ArticleSection[];
    };
  };
};

export const ARTICLES: Article[] = [
  // ── How-to: Prompt Writing ──
  {
    slug: "how-to-write-ai-image-prompts",
    category: "how-to",
    tags: ["prompts", "beginner", "tips", "flux", "sdxl"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "How to Write AI Image Prompts: A Complete Guide",
        description: "Learn how to write effective prompts for AI image generation. Tips for Flux, SDXL, and other models. From beginner to advanced techniques.",
        sections: [
          {
            heading: "What is a Prompt?",
            content: `<p>A prompt is the text description you give to an AI model to generate an image. The quality of your prompt directly affects the quality of your output. Think of it as giving instructions to a very talented but literal-minded artist.</p>`,
          },
          {
            heading: "Basic Prompt Structure",
            content: `<p>A good prompt follows this pattern:</p>
<p><strong>[Subject] + [Description] + [Style] + [Quality] + [Technical]</strong></p>
<p>Example: <code>a Japanese woman in traditional kimono, standing in a bamboo forest, soft natural lighting, photorealistic, 8K, shot on Sony A7R IV</code></p>
<p>Each part adds specificity:</p>
<ul>
<li><strong>Subject:</strong> What is in the image (person, animal, landscape, object)</li>
<li><strong>Description:</strong> Details about the subject (clothing, pose, expression, colors)</li>
<li><strong>Style:</strong> Artistic style (photorealistic, anime, oil painting, cyberpunk)</li>
<li><strong>Quality:</strong> Quality modifiers (masterpiece, best quality, highly detailed, 8K)</li>
<li><strong>Technical:</strong> Camera/lighting details (shallow depth of field, golden hour, studio lighting)</li>
</ul>`,
          },
          {
            heading: "Negative Prompts",
            content: `<p>Negative prompts tell the AI what to <em>avoid</em>. Common negative prompts:</p>
<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, watermark, text</code></p>
<p>This is especially important for photorealistic images where anatomical accuracy matters.</p>`,
          },
          {
            heading: "Model-Specific Tips",
            content: `<p><strong>Flux Dev/Pro:</strong> Responds well to natural language descriptions. No need for booru-style tags. Use complete sentences.</p>
<p><strong>SDXL/CivitAI models:</strong> Works well with comma-separated tags. Weight syntax like <code>(keyword:1.3)</code> to emphasize elements.</p>
<p><strong>Video models (Kling, Wan):</strong> Describe motion explicitly. "Camera slowly pans left" or "the woman turns her head and smiles."</p>`,
          },
          {
            heading: "10 Example Prompts to Try",
            content: `<ol>
<li><code>cinematic portrait of an elderly fisherman at dawn, weathered face, warm golden light, shallow depth of field, 8K</code></li>
<li><code>anime girl with silver hair and blue eyes, cherry blossom background, detailed illustration, masterpiece</code></li>
<li><code>futuristic Tokyo at night, neon holographic billboards, rain-soaked streets, cyberpunk, Blade Runner aesthetic</code></li>
<li><code>macro photograph of a dewdrop on a rose petal, reflections of sunrise, photorealistic</code></li>
<li><code>Studio Ghibli style landscape, rolling green hills, fluffy clouds, whimsical cottage, hand-painted animation</code></li>
<li><code>product photography of a luxury watch on marble surface, soft studio lighting, commercial quality</code></li>
<li><code>oil painting of a stormy sea with a lighthouse, thick brushstrokes, dramatic lighting, Turner style</code></li>
<li><code>3D render of a cute robot character, Pixar quality, subsurface scattering, octane render</code></li>
<li><code>minimalist logo design for "CAFE LUNA", crescent moon, clean typography, white background</code></li>
<li><code>fantasy dragon made of aurora borealis light, flying over snow mountains, 4K wallpaper</code></li>
</ol>`,
          },
        ],
      },
      ja: {
        title: "AI画像プロンプトの書き方：完全ガイド",
        description: "AI画像生成のためのプロンプトの書き方を解説。Flux、SDXL対応。初心者から上級者まで。",
        sections: [
          {
            heading: "プロンプトとは？",
            content: `<p>プロンプトは、AIモデルに画像を生成させるためのテキスト指示です。プロンプトの質が出力の質を直接左右します。非常に才能はあるが、言葉通りに受け取るアーティストに指示を出すイメージです。</p>`,
          },
          {
            heading: "基本的なプロンプト構造",
            content: `<p>良いプロンプトの基本パターン：</p>
<p><strong>[被写体] + [詳細] + [スタイル] + [品質] + [技術的指定]</strong></p>
<p>例：<code>着物を着た日本人女性、竹林に立っている、自然光、フォトリアル、8K、Sony A7R IV撮影</code></p>
<ul>
<li><strong>被写体：</strong> 何を描くか（人物、動物、風景、物体）</li>
<li><strong>詳細：</strong> 服装、ポーズ、表情、色</li>
<li><strong>スタイル：</strong> 写実的、アニメ、油絵、サイバーパンク</li>
<li><strong>品質：</strong> masterpiece, best quality, highly detailed, 8K</li>
<li><strong>技術的：</strong> ボケ、ゴールデンアワー、スタジオ照明</li>
</ul>`,
          },
          {
            heading: "ネガティブプロンプト",
            content: `<p>避けたい要素を指定します：</p>
<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers</code></p>`,
          },
          {
            heading: "モデル別のコツ",
            content: `<p><strong>Flux Dev/Pro：</strong> 自然な文章で記述。タグ形式不要。</p>
<p><strong>SDXL/CivitAI：</strong> カンマ区切りのタグが有効。<code>(keyword:1.3)</code>で強調。</p>
<p><strong>動画モデル（Kling、Wan）：</strong> 動きを明示的に記述。「カメラがゆっくり左にパン」「女性が振り向いて微笑む」</p>`,
          },
          {
            heading: "試してみたい10のプロンプト",
            content: `<ol>
<li><code>夜明けの老漁師のシネマティックポートレート、しわのある顔、暖かい光、浅い被写界深度、8K</code></li>
<li><code>銀髪と青い瞳のアニメ少女、桜の背景、精密なイラスト、最高品質</code></li>
<li><code>夜の未来的東京、ネオンのホログラム看板、雨に濡れた道路、サイバーパンク</code></li>
<li><code>バラの花弁の朝露のマクロ写真、朝日の反射、フォトリアル</code></li>
<li><code>ジブリスタイルの風景、なだらかな緑の丘、ふわふわの雲、かわいいコテージ</code></li>
<li><code>大理石の上の高級時計の商品撮影、ソフトなスタジオ照明、広告品質</code></li>
<li><code>嵐の海と灯台の油絵、厚い筆触、ドラマチックな照明、ターナー風</code></li>
<li><code>かわいいロボットキャラクターの3Dレンダリング、ピクサー品質、オクタンレンダー</code></li>
<li><code>「CAFE LUNA」のミニマリストロゴ、三日月、クリーンなタイポグラフィ</code></li>
<li><code>オーロラの光でできたファンタジードラゴン、雪山の上空を飛行、4K壁紙</code></li>
</ol>`,
          },
        ],
      },
      es: {
        title: "Cómo Escribir Prompts para Imágenes IA: Guía Completa",
        description: "Aprende a escribir prompts efectivos para generación de imágenes IA. Consejos para Flux, SDXL y más.",
        sections: [
          { heading: "¿Qué es un Prompt?", content: `<p>Un prompt es la descripción de texto que le das a un modelo IA para generar una imagen. La calidad del prompt afecta directamente la calidad del resultado.</p>` },
          { heading: "Estructura Básica", content: `<p><strong>[Sujeto] + [Descripción] + [Estilo] + [Calidad] + [Técnico]</strong></p><p>Ejemplo: <code>una mujer japonesa en kimono, bosque de bambú, luz natural, fotorrealista, 8K</code></p>` },
          { heading: "Prompts Negativos", content: `<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers</code></p>` },
          { heading: "Consejos por Modelo", content: `<p><strong>Flux:</strong> Lenguaje natural. <strong>SDXL/CivitAI:</strong> Tags separados por comas. <strong>Video:</strong> Describe el movimiento explícitamente.</p>` },
        ],
      },
      zh: {
        title: "AI图像提示词写作完全指南",
        description: "学习如何为AI图像生成写出有效的提示词。适用于Flux、SDXL等模型的技巧。",
        sections: [
          { heading: "什么是提示词？", content: `<p>提示词是你给AI模型的文字描述，用于生成图像。提示词的质量直接影响输出质量。</p>` },
          { heading: "基本结构", content: `<p><strong>[主体] + [描述] + [风格] + [质量] + [技术]</strong></p><p>例：<code>穿和服的日本女性，竹林中，自然光，照片级真实，8K</code></p>` },
          { heading: "各模型技巧", content: `<p><strong>Flux：</strong>自然语言。<strong>SDXL/CivitAI：</strong>逗号分隔标签。<strong>视频：</strong>明确描述运动。</p>` },
        ],
      },
      pt: {
        title: "Como Escrever Prompts para Imagens IA: Guia Completo",
        description: "Aprenda a escrever prompts eficazes para geração de imagens IA. Dicas para Flux, SDXL e mais.",
        sections: [
          { heading: "O Que é um Prompt?", content: `<p>Um prompt é a descrição de texto que você dá ao modelo IA para gerar uma imagem. A qualidade do prompt afeta diretamente a qualidade do resultado.</p>` },
          { heading: "Estrutura Básica", content: `<p><strong>[Sujeito] + [Descrição] + [Estilo] + [Qualidade] + [Técnico]</strong></p>` },
          { heading: "Dicas por Modelo", content: `<p><strong>Flux:</strong> Linguagem natural. <strong>SDXL/CivitAI:</strong> Tags separadas por vírgulas. <strong>Vídeo:</strong> Descreva o movimento explicitamente.</p>` },
        ],
      },
    },
  },

  // ── How-to: CFG Scale ──
  {
    slug: "what-is-cfg-scale-guide",
    category: "how-to",
    tags: ["cfg", "settings", "beginner", "technical"],
    publishedAt: "2026-04-27",
    readingTime: 3,
    translations: {
      en: {
        title: "What is CFG Scale? How to Adjust It for Better AI Images",
        description: "CFG Scale controls how closely AI follows your prompt. Learn what values to use for different styles and models.",
        sections: [
          {
            heading: "CFG Scale Explained",
            content: `<p><strong>CFG (Classifier-Free Guidance) Scale</strong> controls how strictly the AI follows your prompt vs. being creative on its own.</p>
<ul>
<li><strong>Low CFG (1-4):</strong> More creative, dreamy, abstract. AI takes liberties.</li>
<li><strong>Medium CFG (5-8):</strong> Balanced. Good for most use cases.</li>
<li><strong>High CFG (9-15):</strong> Strictly follows prompt. Can look oversaturated or artificial.</li>
<li><strong>Very High CFG (15+):</strong> Often produces artifacts. Not recommended.</li>
</ul>`,
          },
          {
            heading: "Recommended Values by Model",
            content: `<table>
<tr><th>Model</th><th>Recommended CFG</th></tr>
<tr><td>Flux Dev/Pro</td><td>3.0 - 4.0</td></tr>
<tr><td>SDXL</td><td>6.0 - 8.0</td></tr>
<tr><td>SD 1.5 / CivitAI</td><td>7.0 - 9.0</td></tr>
<tr><td>Anime models</td><td>7.0 - 11.0</td></tr>
</table>
<p><strong>Tip:</strong> Flux models use a different guidance mechanism, so they work best at low CFG (3-4). Using CFG 7+ with Flux often produces worse results.</p>`,
          },
          {
            heading: "When to Adjust CFG",
            content: `<ul>
<li>Image looks <strong>too random/blurry</strong> → Increase CFG</li>
<li>Image looks <strong>oversaturated/artificial</strong> → Decrease CFG</li>
<li>Want <strong>artistic freedom</strong> → CFG 3-5</li>
<li>Want <strong>exact prompt match</strong> → CFG 8-12</li>
</ul>`,
          },
        ],
      },
      ja: {
        title: "CFGスケールとは？AI画像を改善する調整方法",
        description: "CFGスケールはプロンプトへの忠実度を制御します。モデル別の推奨値と調整のコツ。",
        sections: [
          {
            heading: "CFGスケールとは",
            content: `<p><strong>CFG（Classifier-Free Guidance）スケール</strong>は、AIがプロンプトにどれだけ忠実に従うかを制御します。</p>
<ul>
<li><strong>低CFG（1-4）：</strong> より創造的、夢のような、抽象的。</li>
<li><strong>中CFG（5-8）：</strong> バランス良好。ほとんどの用途に最適。</li>
<li><strong>高CFG（9-15）：</strong> プロンプトに忠実。過彩度になることも。</li>
<li><strong>超高CFG（15+）：</strong> アーティファクト発生。非推奨。</li>
</ul>`,
          },
          {
            heading: "モデル別の推奨値",
            content: `<p>Flux Dev/Pro: 3.0-4.0 / SDXL: 6.0-8.0 / SD1.5: 7.0-9.0 / アニメモデル: 7.0-11.0</p>
<p><strong>ポイント：</strong> FluxモデルはCFG 3-4が最適。7以上にすると逆に品質が下がります。</p>`,
          },
          {
            heading: "調整のタイミング",
            content: `<ul>
<li>画像が<strong>ぼやける/ランダムすぎる</strong> → CFGを上げる</li>
<li>画像が<strong>過彩度/不自然</strong> → CFGを下げる</li>
<li><strong>芸術的な自由度</strong>が欲しい → CFG 3-5</li>
<li><strong>プロンプト通り</strong>に作りたい → CFG 8-12</li>
</ul>`,
          },
        ],
      },
      es: {
        title: "¿Qué es CFG Scale? Cómo Ajustarlo para Mejores Imágenes",
        description: "CFG Scale controla cuánto sigue la IA tu prompt. Aprende qué valores usar.",
        sections: [
          { heading: "CFG Scale Explicado", content: `<p><strong>CFG Scale</strong> controla cuánto sigue la IA tu prompt. Bajo (1-4): más creativo. Medio (5-8): equilibrado. Alto (9-15): sigue estrictamente el prompt.</p>` },
          { heading: "Valores Recomendados", content: `<p>Flux: 3.0-4.0 / SDXL: 6.0-8.0 / SD1.5: 7.0-9.0 / Anime: 7.0-11.0</p>` },
        ],
      },
      zh: {
        title: "什么是CFG Scale？如何调整以获得更好的AI图像",
        description: "CFG Scale控制AI对提示词的遵循程度。了解不同模型的推荐值。",
        sections: [
          { heading: "CFG Scale说明", content: `<p>低(1-4)：更有创意。中(5-8)：平衡。高(9-15)：严格遵循提示词。</p>` },
          { heading: "推荐值", content: `<p>Flux: 3.0-4.0 / SDXL: 6.0-8.0 / SD1.5: 7.0-9.0</p>` },
        ],
      },
      pt: {
        title: "O Que é CFG Scale? Como Ajustar para Melhores Imagens IA",
        description: "CFG Scale controla quanto a IA segue seu prompt. Aprenda os valores ideais.",
        sections: [
          { heading: "CFG Scale Explicado", content: `<p>Baixo (1-4): mais criativo. Médio (5-8): equilibrado. Alto (9-15): segue estritamente o prompt.</p>` },
          { heading: "Valores Recomendados", content: `<p>Flux: 3.0-4.0 / SDXL: 6.0-8.0 / SD1.5: 7.0-9.0</p>` },
        ],
      },
    },
  },

  // ── How-to: ControlNet ──
  {
    slug: "controlnet-guide-beginners",
    category: "guide",
    tags: ["controlnet", "advanced", "pose", "depth", "canny"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "ControlNet Guide: Control AI Image Generation with Precision",
        description: "Learn how to use ControlNet for precise control over AI-generated images. Canny, Depth, OpenPose, and Scribble modes explained.",
        sections: [
          {
            heading: "What is ControlNet?",
            content: `<p>ControlNet lets you guide AI image generation using a reference image. Instead of just describing what you want in text, you provide a structural guide — like a pose, edges, or depth map.</p>
<p>This gives you precise control over composition while letting the AI handle style and details.</p>`,
          },
          {
            heading: "4 ControlNet Modes",
            content: `<p><strong>1. Canny Edge</strong> — Detects edges in your image. Best for: architecture, objects, logos. The AI preserves the outline but changes everything else.</p>
<p><strong>2. Depth</strong> — Creates a 3D depth map. Best for: scenes with foreground/background separation. Maintains spatial relationships.</p>
<p><strong>3. OpenPose</strong> — Detects human body poses. Best for: character art, fashion, portraits. Upload a photo of someone posing, and the AI generates a new character in the same pose.</p>
<p><strong>4. Scribble</strong> — Uses rough sketches as guides. Best for: quick concepts. Draw a rough sketch and let AI fill in the details.</p>`,
          },
          {
            heading: "Control Strength",
            content: `<p>The <strong>Control Strength</strong> slider (0.0 - 2.0) determines how strictly the AI follows your reference:</p>
<ul>
<li><strong>0.3 - 0.5:</strong> Loose guidance. AI takes creative liberty.</li>
<li><strong>0.7 - 1.0:</strong> Balanced. Recommended starting point.</li>
<li><strong>1.2 - 1.5:</strong> Strong adherence to the reference.</li>
</ul>`,
          },
          {
            heading: "How to Use in EGAKU AI",
            content: `<ol>
<li>Go to <a href="/generate">Generate</a> → ControlNet tab</li>
<li>Upload a reference image</li>
<li>Choose a mode (Canny, Depth, OpenPose, or Scribble)</li>
<li>Write a prompt describing the style you want</li>
<li>Adjust control strength (start at 0.8)</li>
<li>Generate!</li>
</ol>`,
          },
        ],
      },
      ja: {
        title: "ControlNetガイド：AI画像生成を精密にコントロール",
        description: "ControlNetの使い方を初心者向けに解説。Canny、Depth、OpenPose、Scribbleの4モード。",
        sections: [
          {
            heading: "ControlNetとは？",
            content: `<p>ControlNetは参照画像を使ってAI画像生成をガイドする技術です。テキストだけでなく、構造的なガイド（ポーズ、エッジ、深度マップ）を提供できます。</p>`,
          },
          {
            heading: "4つのモード",
            content: `<p><strong>1. Canny Edge：</strong> エッジ検出。建築、物体、ロゴに最適。</p>
<p><strong>2. Depth：</strong> 3D深度マップ。前景/背景の分離シーンに。</p>
<p><strong>3. OpenPose：</strong> 人体ポーズ検出。キャラクターアート、ファッションに。</p>
<p><strong>4. Scribble：</strong> ラフスケッチをガイドに。コンセプトスケッチから生成。</p>`,
          },
          {
            heading: "EGAKU AIでの使い方",
            content: `<ol>
<li><a href="/generate">Generate</a> → ControlNetタブ</li>
<li>参照画像をアップロード</li>
<li>モードを選択</li>
<li>スタイルを記述するプロンプトを入力</li>
<li>Control Strengthを調整（0.8から開始推奨）</li>
<li>生成！</li>
</ol>`,
          },
        ],
      },
      es: {
        title: "Guía ControlNet: Controla la Generación de Imágenes IA con Precisión",
        description: "Aprende a usar ControlNet para control preciso. Modos Canny, Depth, OpenPose y Scribble.",
        sections: [
          { heading: "¿Qué es ControlNet?", content: `<p>ControlNet te permite guiar la generación usando una imagen de referencia — pose, bordes o mapa de profundidad.</p>` },
          { heading: "4 Modos", content: `<p><strong>Canny Edge:</strong> Arquitectura, objetos. <strong>Depth:</strong> Escenas 3D. <strong>OpenPose:</strong> Poses de personajes. <strong>Scribble:</strong> Bocetos rápidos.</p>` },
        ],
      },
      zh: {
        title: "ControlNet指南：精确控制AI图像生成",
        description: "学习使用ControlNet精确控制AI图像。Canny、Depth、OpenPose、Scribble四种模式详解。",
        sections: [
          { heading: "什么是ControlNet？", content: `<p>ControlNet让你用参考图像引导AI生成——姿势、边缘或深度图。</p>` },
          { heading: "4种模式", content: `<p><strong>Canny Edge：</strong>建筑、物体。<strong>Depth：</strong>3D场景。<strong>OpenPose：</strong>人物姿势。<strong>Scribble：</strong>速写草稿。</p>` },
        ],
      },
      pt: {
        title: "Guia ControlNet: Controle Preciso na Geração de Imagens IA",
        description: "Aprenda a usar ControlNet para controle preciso. Modos Canny, Depth, OpenPose e Scribble.",
        sections: [
          { heading: "O Que é ControlNet?", content: `<p>ControlNet permite guiar a geração usando uma imagem de referência — pose, bordas ou mapa de profundidade.</p>` },
          { heading: "4 Modos", content: `<p><strong>Canny:</strong> Arquitetura. <strong>Depth:</strong> Cenas 3D. <strong>OpenPose:</strong> Poses. <strong>Scribble:</strong> Esboços.</p>` },
        ],
      },
    },
  },

  // ── News: Kling 3.0 ──
  {
    slug: "kling-3-native-4k-video-generation",
    category: "news",
    tags: ["kling", "video", "4k", "new-model"],
    publishedAt: "2026-04-26",
    readingTime: 3,
    translations: {
      en: {
        title: "Kling 3.0 is Here: Native 4K AI Video Generation",
        description: "Kling 3.0 brings native 4K resolution, cinematic quality, and fluid motion to AI video generation. Available now on EGAKU AI.",
        sections: [
          {
            heading: "What's New in Kling 3.0",
            content: `<p>Kling 3.0 represents a major leap in AI video generation. Key improvements:</p>
<ul>
<li><strong>Native 4K output</strong> — No upscaling needed. True 4K resolution from generation.</li>
<li><strong>Cinematic quality</strong> — Film-grade visuals with natural motion and lighting.</li>
<li><strong>Fluid motion</strong> — Dramatically improved temporal consistency. No more morphing artifacts.</li>
<li><strong>Audio support</strong> — Kling O3 variant includes native audio generation.</li>
</ul>`,
          },
          {
            heading: "Kling 3.0 vs Competitors",
            content: `<p>How Kling 3.0 compares:</p>
<ul>
<li>vs <strong>Kling 2.5</strong>: 4K native (was 1080p max), better temporal consistency</li>
<li>vs <strong>Runway Gen-3</strong>: Comparable quality, more accessible pricing</li>
<li>vs <strong>Sora</strong>: Available now via API (Sora has limited access)</li>
</ul>`,
          },
          {
            heading: "Try It on EGAKU AI",
            content: `<p>Kling 3.0 4K is available now for Pro plan users (¥980/mo). Generate cinematic 4K videos from text prompts or animate still images.</p>
<p><a href="/generate">Try Kling 3.0 →</a></p>`,
          },
        ],
      },
      ja: {
        title: "Kling 3.0登場：ネイティブ4K AI動画生成",
        description: "Kling 3.0がネイティブ4K解像度、映画品質、滑らかな動きをAI動画生成にもたらす。EGAKU AIで利用可能。",
        sections: [
          {
            heading: "Kling 3.0の新機能",
            content: `<ul>
<li><strong>ネイティブ4K出力</strong> — アップスケール不要の真の4K</li>
<li><strong>映画品質</strong> — 自然な動きと照明のフィルムグレード</li>
<li><strong>滑らかな動き</strong> — モーフィングアーティファクトの大幅削減</li>
<li><strong>音声対応</strong> — Kling O3でネイティブ音声生成</li>
</ul>`,
          },
          {
            heading: "EGAKU AIで試す",
            content: `<p>Kling 3.0 4KはProプラン（¥980/月）で利用可能。テキストから映画的4K動画を生成、または静止画をアニメーション化。</p>
<p><a href="/generate">Kling 3.0を試す →</a></p>`,
          },
        ],
      },
      es: {
        title: "Kling 3.0: Generación de Video IA en 4K Nativo",
        description: "Kling 3.0 trae resolución 4K nativa y calidad cinematográfica a la generación de video IA.",
        sections: [
          { heading: "Novedades de Kling 3.0", content: `<ul><li><strong>4K nativo</strong> — Sin necesidad de upscaling</li><li><strong>Calidad cinematográfica</strong> — Movimiento fluido y natural</li><li><strong>Audio nativo</strong> — Kling O3 genera audio</li></ul>` },
          { heading: "Pruébalo", content: `<p>Disponible para usuarios Pro (¥980/mes). <a href="/generate">Probar Kling 3.0 →</a></p>` },
        ],
      },
      zh: {
        title: "Kling 3.0来了：原生4K AI视频生成",
        description: "Kling 3.0带来原生4K分辨率、电影级画质和流畅动态。",
        sections: [
          { heading: "Kling 3.0新功能", content: `<ul><li><strong>原生4K</strong>——无需放大</li><li><strong>电影画质</strong>——自然流畅的运动</li><li><strong>音频支持</strong>——Kling O3原生音频</li></ul>` },
          { heading: "立即体验", content: `<p>Pro计划用户可用（¥980/月）。<a href="/generate">试用Kling 3.0 →</a></p>` },
        ],
      },
      pt: {
        title: "Kling 3.0: Geração de Vídeo IA em 4K Nativo",
        description: "Kling 3.0 traz resolução 4K nativa e qualidade cinematográfica para geração de vídeo IA.",
        sections: [
          { heading: "Novidades", content: `<ul><li><strong>4K nativo</strong></li><li><strong>Qualidade cinematográfica</strong></li><li><strong>Áudio nativo</strong> com Kling O3</li></ul>` },
          { heading: "Experimente", content: `<p>Disponível para Pro (¥980/mês). <a href="/generate">Testar Kling 3.0 →</a></p>` },
        ],
      },
    },
  },

  // ── Essay: Creative Freedom in AI ──
  {
    slug: "creative-freedom-ai-generation-where-do-we-draw-the-line",
    category: "news",
    tags: ["opinion", "ethics", "censorship", "freedom", "ai-policy"],
    publishedAt: "2026-04-27",
    readingTime: 6,
    translations: {
      en: {
        title: "Creative Freedom in AI Generation: Where Do We Draw the Line?",
        description: "As AI image generation becomes mainstream, the tension between creative freedom and content safety grows. Who decides what's harmful? An exploration of the challenges facing AI platforms.",
        sections: [
          {
            heading: "The Promise of Unrestricted Creativity",
            content: `<p>When Stable Diffusion was released as open-source in 2022, it represented something radical: the democratization of image creation. Anyone with a computer could generate anything they imagined. No gatekeepers, no approval process, no censorship.</p>
<p>Communities like Unstable Diffusion embraced this ethos fully — building platforms around the idea that AI creativity should have no limits. At their peak, they had 350,000 daily active users generating half a million images per day.</p>
<p>But the story didn't end with triumph. It ended with payment processors refusing service, platforms shutting down campaigns, and the fundamental question left unanswered: <strong>can absolute creative freedom sustain itself?</strong></p>`,
          },
          {
            heading: "The Cost of Freedom",
            content: `<p>Running an AI generation platform costs real money. GPUs don't run on ideology. A platform generating 500,000 images per day faces infrastructure costs that dwarf what community donations can cover.</p>
<p>Unstable Diffusion earned roughly $2,500 per month from crowdfunding — while serving 350,000 daily users. The math simply didn't work.</p>
<p>This reveals an uncomfortable truth: <strong>systems need sustainability to survive, and sustainability requires revenue, and revenue requires payment processors who have their own content policies.</strong></p>
<p>The moment you depend on Stripe, PayPal, Visa, or Mastercard, you operate within their rules — not yours.</p>`,
          },
          {
            heading: "Who Decides What's Harmful?",
            content: `<p>This is perhaps the most difficult question in AI content policy. Consider:</p>
<ul>
<li>A nude figure study — art or pornography?</li>
<li>A violent battle scene — creative expression or harmful content?</li>
<li>An AI-generated face — creative freedom or potential deepfake?</li>
<li>NSFW anime illustration — fiction or problematic content?</li>
</ul>
<p>Different cultures answer these questions differently. Japanese obscenity law (Article 175) requires mosaic censorship on genitalia, while the same content is perfectly legal in many other countries. Korean law prohibits creation and possession of obscene material entirely.</p>
<p>There is no universal answer. What exists is a patchwork of regional laws, platform policies, and payment processor rules — none of which fully align with each other.</p>`,
          },
          {
            heading: "The Line That Everyone Agrees On",
            content: `<p>Despite the debate, there are absolutes that virtually every platform, law, and ethical framework agrees on:</p>
<ul>
<li><strong>Child Sexual Abuse Material (CSAM)</strong> — universally prohibited, AI-generated or not</li>
<li><strong>Non-consensual intimate imagery</strong> — using real people's faces in sexual content without consent</li>
<li><strong>Content promoting terrorism or extreme violence targeting real people</strong></li>
</ul>
<p>These aren't matters of cultural perspective. They're fundamental protections.</p>
<p>Everything else — from artistic nudity to fictional adult content to violent fantasy art — exists on a spectrum where reasonable people disagree.</p>`,
          },
          {
            heading: "A Sustainable Middle Path",
            content: `<p>At EGAKU AI, we believe in creative freedom — but we also believe in sustainability and responsibility. Our approach:</p>
<ul>
<li><strong>Absolute prohibitions are non-negotiable.</strong> CSAM, non-consensual deepfakes, and content targeting real people are permanently banned.</li>
<li><strong>Adult content is available with proper safeguards.</strong> Age verification, regional compliance (JP mosaic, KR restrictions), and user responsibility.</li>
<li><strong>The platform must sustain itself.</strong> Creative freedom means nothing if the platform shuts down. Revenue, cost control, and legal compliance keep the lights on.</li>
<li><strong>Users bear responsibility for their creations.</strong> We provide the tools; users decide how to use them within our guidelines.</li>
</ul>
<p>This isn't the radical position of "no limits." It's the pragmatic position of "maximum freedom within sustainable boundaries."</p>`,
          },
          {
            heading: "The Future Is Still Being Written",
            content: `<p>AI content regulation is evolving rapidly. Laws change, technology advances, and social norms shift. What's considered acceptable today may not be tomorrow — and vice versa.</p>
<p>The platforms that survive won't be the ones with the most radical positions or the strictest censorship. They'll be the ones that can <strong>adapt</strong> — balancing creative freedom with legal compliance, user safety with artistic expression, and sustainability with accessibility.</p>
<p>The conversation about where to draw the line isn't over. It's just beginning.</p>`,
          },
        ],
      },
      ja: {
        title: "AI生成における表現の自由：どこに線を引くか",
        description: "AI画像生成が主流になるにつれ、表現の自由とコンテンツの安全性の間の緊張が高まっている。何が有害かは誰が決めるのか。",
        sections: [
          {
            heading: "無制限の創造性という約束",
            content: `<p>2022年にStable Diffusionがオープンソースとして公開された時、それは画像制作の民主化を意味していた。誰でもコンピュータさえあれば、想像するものを何でも生成できる。ゲートキーパーなし、承認プロセスなし、検閲なし。</p>
<p>Unstable Diffusionのようなコミュニティはこの精神を全面的に受け入れ、AIの創造性に制限があるべきではないという理念のもとにプラットフォームを構築した。ピーク時には35万人のDAU、1日50万枚の画像を生成していた。</p>
<p>しかし結末は勝利ではなかった。決済プロセッサーがサービスを拒否し、プラットフォームがキャンペーンを停止し、根本的な問いだけが残った：<strong>絶対的な表現の自由は、自らを維持できるのか？</strong></p>`,
          },
          {
            heading: "自由のコスト",
            content: `<p>AI生成プラットフォームの運営にはお金がかかる。GPUは理念では動かない。1日50万枚を生成するプラットフォームのインフラコストは、コミュニティの寄付で賄える範囲をはるかに超える。</p>
<p>Unstable Diffusionのクラウドファンディング収入は月約$2,500 — 35万人のDAUを抱えながら。計算が合わなかった。</p>
<p>不都合な真実がここにある：<strong>システムが存続するには持続可能性が必要で、持続可能性には収益が必要で、収益には独自のコンテンツポリシーを持つ決済プロセッサーが必要。</strong></p>`,
          },
          {
            heading: "何が「害」かは誰が決めるのか",
            content: `<p>これはAIコンテンツポリシーにおいて最も難しい問いかもしれない：</p>
<ul>
<li>裸体のデッサン — 芸術か、ポルノか？</li>
<li>激しい戦闘シーン — 創造的表現か、有害コンテンツか？</li>
<li>AI生成の顔 — 表現の自由か、Deepfakeの可能性か？</li>
<li>NSFWアニメイラスト — フィクションか、問題のあるコンテンツか？</li>
</ul>
<p>文化によって答えは異なる。日本のわいせつ物頒布罪（刑法175条）は性器にモザイクを要求するが、多くの国では同じコンテンツが完全に合法。韓国法はわいせつ物の作成と所持自体を禁止している。</p>
<p>普遍的な答えは存在しない。存在するのは、地域の法律、プラットフォームポリシー、決済プロセッサーのルールのパッチワーク — そのどれもが完全には一致しない。</p>`,
          },
          {
            heading: "誰もが同意する一線",
            content: `<p>議論はあれど、事実上すべてのプラットフォーム、法律、倫理的枠組みが同意する絶対的な一線がある：</p>
<ul>
<li><strong>児童性的虐待素材（CSAM）</strong> — AI生成であろうと普遍的に禁止</li>
<li><strong>同意のない親密な画像</strong> — 実在の人物の顔を同意なく性的コンテンツに使用すること</li>
<li><strong>テロや実在の人物に対する極端な暴力を助長するコンテンツ</strong></li>
</ul>
<p>これらは文化的視点の問題ではない。根本的な保護だ。</p>
<p>それ以外のすべて — 芸術的なヌードからフィクションのアダルトコンテンツ、暴力的なファンタジーアートまで — は、合理的な人々が意見を異にするスペクトラム上に存在する。</p>`,
          },
          {
            heading: "持続可能な中道",
            content: `<p>EGAKU AIでは、表現の自由を信じている — と同時に、持続可能性と責任も信じている：</p>
<ul>
<li><strong>絶対的な禁止事項は交渉の余地がない。</strong> CSAM、同意のないDeepfake、実在の人物を標的にしたコンテンツは永久に禁止。</li>
<li><strong>アダルトコンテンツは適切な保護措置とともに利用可能。</strong> 年齢確認、地域コンプライアンス（日本のモザイク、韓国の制限）、ユーザーの自己責任。</li>
<li><strong>プラットフォームは自らを維持しなければならない。</strong> プラットフォームが閉鎖されたら表現の自由は意味がない。収益、コスト管理、法的コンプライアンスが存続を支える。</li>
<li><strong>ユーザーは自分の作品に責任を持つ。</strong> ツールを提供する。ガイドラインの範囲内でどう使うかはユーザーが決める。</li>
</ul>
<p>これは「制限なし」という過激な立場ではない。「持続可能な境界の中での最大限の自由」という現実的な立場だ。</p>`,
          },
          {
            heading: "未来はまだ書かれていない",
            content: `<p>AIコンテンツ規制は急速に進化している。法律は変わり、技術は進歩し、社会規範は移り変わる。今日受け入れられていることが明日も同じとは限らない — その逆もまた然り。</p>
<p>生き残るプラットフォームは、最も過激な立場のものでも、最も厳しい検閲のものでもない。<strong>適応</strong>できるものだ — 表現の自由と法的コンプライアンス、ユーザーの安全と芸術的表現、持続可能性とアクセシビリティのバランスを取れるもの。</p>
<p>どこに線を引くかの議論は終わっていない。始まったばかりだ。</p>`,
          },
        ],
      },
      es: {
        title: "Libertad Creativa en la Generación IA: ¿Dónde Trazamos la Línea?",
        description: "La tensión entre libertad creativa y seguridad de contenido crece. ¿Quién decide qué es dañino?",
        sections: [
          { heading: "La Promesa de la Creatividad Sin Restricciones", content: `<p>Cuando Stable Diffusion se lanzó como código abierto en 2022, democratizó la creación de imágenes. Comunidades como Unstable Diffusion abrazaron esta filosofía — 350,000 usuarios diarios, 500,000 imágenes por día. Pero no sobrevivió.</p>` },
          { heading: "El Costo de la Libertad", content: `<p>Las GPUs no funcionan con ideología. Unstable Diffusion ganaba $2,500/mes sirviendo a 350,000 usuarios. Las matemáticas no funcionaban.</p>` },
          { heading: "Un Camino Sostenible", content: `<p>En EGAKU AI creemos en la libertad creativa — pero también en la sostenibilidad. Prohibiciones absolutas (CSAM, deepfakes) + contenido adulto con salvaguardas + plataforma que se mantenga a sí misma.</p>` },
        ],
      },
      zh: {
        title: "AI生成中的创作自由：界限在哪里？",
        description: "随着AI图像生成成为主流，创作自由与内容安全之间的张力日益增长。",
        sections: [
          { heading: "无限创意的承诺", content: `<p>2022年Stable Diffusion开源发布，实现了图像创作的民主化。Unstable Diffusion拥抱这一理念——35万日活，每天50万张图像。但最终没能持续。</p>` },
          { heading: "自由的代价", content: `<p>GPU不靠理想运转。Unstable Diffusion每月收入$2,500，却服务35万用户。</p>` },
          { heading: "可持续的中间路线", content: `<p>EGAKU AI相信创作自由，同时相信可持续性。绝对禁止事项不可协商（CSAM、深度伪造）。成人内容在合规框架内提供。</p>` },
        ],
      },
      pt: {
        title: "Liberdade Criativa na Geração IA: Onde Traçar a Linha?",
        description: "A tensão entre liberdade criativa e segurança de conteúdo cresce. Quem decide o que é prejudicial?",
        sections: [
          { heading: "A Promessa da Criatividade Irrestrita", content: `<p>Quando o Stable Diffusion foi lançado como código aberto, democratizou a criação de imagens. Mas comunidades como Unstable Diffusion não sobreviveram — processadores de pagamento recusaram serviço.</p>` },
          { heading: "Um Caminho Sustentável", content: `<p>No EGAKU AI acreditamos em liberdade criativa com sustentabilidade. Proibições absolutas (CSAM, deepfakes) + conteúdo adulto com salvaguardas.</p>` },
        ],
      },
    },
  },

  // ── How-to: Samplers Explained ──
  {
    slug: "ai-image-samplers-explained",
    category: "how-to",
    tags: ["samplers", "settings", "technical", "euler", "dpm"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "AI Image Samplers Explained: Euler vs DPM++ vs DDIM",
        description: "What are samplers in AI image generation? Learn the differences between Euler, DPM++ 2M Karras, DDIM, and when to use each one.",
        sections: [
          { heading: "What is a Sampler?", content: `<p>A sampler is the algorithm that removes noise from a random field step-by-step until it becomes your image. Different samplers take different paths through "noise space," producing subtly different results even with the same prompt and seed.</p><p>Think of it like different routes to the same destination — some are faster, some are more scenic, some are more reliable.</p>` },
          { heading: "The Main Samplers", content: `<p><strong>Euler / Euler Ancestral</strong> — The classic. Fast, simple, good baseline. Euler Ancestral adds randomness at each step (more creative, less consistent). Good for: quick iterations, exploring ideas.</p><p><strong>DPM++ 2M Karras</strong> — The current gold standard for quality. Produces clean, detailed images with good color accuracy. "Karras" uses a noise schedule that front-loads detail work. Good for: final renders, photorealistic content.</p><p><strong>DDIM</strong> — Deterministic (same seed = exact same result every time). Faster than many samplers but sometimes softer output. Good for: reproducibility, animations where frame consistency matters.</p><p><strong>UniPC</strong> — Unified predictor-corrector. Excellent quality in fewer steps (10-15 steps often enough). Good for: speed without sacrificing quality.</p>` },
          { heading: "Quick Reference", content: `<table><tr><th>Sampler</th><th>Quality</th><th>Speed</th><th>Best For</th></tr><tr><td>DPM++ 2M Karras</td><td>Excellent</td><td>Medium</td><td>Final renders</td></tr><tr><td>Euler</td><td>Good</td><td>Fast</td><td>Quick tests</td></tr><tr><td>Euler Ancestral</td><td>Good (varied)</td><td>Fast</td><td>Creative exploration</td></tr><tr><td>DDIM</td><td>Good</td><td>Fast</td><td>Consistency</td></tr><tr><td>UniPC</td><td>Very Good</td><td>Fast</td><td>Low-step generation</td></tr></table>` },
          { heading: "Our Recommendation", content: `<p>Start with <strong>DPM++ 2M Karras at 25 steps</strong>. This is the default on EGAKU AI and produces consistently excellent results across all model types. Only switch if you have a specific reason to.</p>` },
        ],
      },
      ja: {
        title: "AIサンプラー解説：Euler vs DPM++ vs DDIM",
        description: "AI画像生成のサンプラーとは？Euler、DPM++ 2M Karras、DDIMの違いと使い分け。",
        sections: [
          { heading: "サンプラーとは？", content: `<p>サンプラーはランダムなノイズから画像を段階的に生成するアルゴリズムです。同じプロンプトとシードでも、サンプラーが違えば微妙に異なる結果が出ます。</p>` },
          { heading: "主要サンプラー", content: `<p><strong>Euler / Euler Ancestral：</strong> 定番。高速。Ancestralはステップごとにランダム性を追加（創造的だが一貫性低め）。</p><p><strong>DPM++ 2M Karras：</strong> 現在の品質基準。クリーンで詳細な画像。フォトリアルに最適。</p><p><strong>DDIM：</strong> 決定的（同じシード=完全同一結果）。再現性とアニメーションに。</p><p><strong>UniPC：</strong> 少ないステップ（10-15）で高品質。速度重視に。</p>` },
          { heading: "推奨設定", content: `<p><strong>DPM++ 2M Karras、25ステップ</strong>がEGAKU AIのデフォルト。全モデルで安定して高品質。特別な理由がない限りこれで十分。</p>` },
        ],
      },
      es: {
        title: "Samplers de Imágenes IA: Euler vs DPM++ vs DDIM",
        description: "¿Qué son los samplers? Diferencias entre Euler, DPM++ 2M Karras y DDIM.",
        sections: [
          { heading: "¿Qué es un Sampler?", content: `<p>Un sampler es el algoritmo que elimina ruido paso a paso hasta formar tu imagen. Diferentes samplers producen resultados sutilmente diferentes.</p>` },
          { heading: "Recomendación", content: `<p>Empieza con <strong>DPM++ 2M Karras a 25 pasos</strong>. Es el estándar de calidad actual.</p>` },
        ],
      },
      zh: {
        title: "AI图像采样器详解：Euler vs DPM++ vs DDIM",
        description: "什么是采样器？了解Euler、DPM++ 2M Karras、DDIM的区别和使用场景。",
        sections: [
          { heading: "什么是采样器？", content: `<p>采样器是逐步从随机噪声生成图像的算法。不同采样器产生略有不同的结果。</p>` },
          { heading: "推荐", content: `<p>默认使用<strong>DPM++ 2M Karras，25步</strong>。所有模型类型都能稳定产出高质量结果。</p>` },
        ],
      },
      pt: {
        title: "Samplers de Imagens IA: Euler vs DPM++ vs DDIM",
        description: "O que são samplers? Diferenças entre Euler, DPM++ 2M Karras e DDIM.",
        sections: [
          { heading: "O Que é um Sampler?", content: `<p>Um sampler é o algoritmo que remove ruído passo a passo até formar sua imagem.</p>` },
          { heading: "Recomendação", content: `<p>Comece com <strong>DPM++ 2M Karras a 25 passos</strong>.</p>` },
        ],
      },
    },
  },

  // ── Guide: LoRA Models ──
  {
    slug: "what-are-lora-models-how-to-use",
    category: "guide",
    tags: ["lora", "civitai", "models", "customization"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "What Are LoRA Models? How to Use CivitAI's 100K+ Models",
        description: "LoRA models let you customize AI image generation with specific styles, characters, or concepts. Learn how to find and use them on EGAKU AI.",
        sections: [
          { heading: "LoRA in Simple Terms", content: `<p><strong>LoRA (Low-Rank Adaptation)</strong> is a small add-on file that modifies how a base AI model generates images. Think of the base model (like Flux or SDXL) as a generalist painter, and a LoRA as specialized training — "now paint in this specific anime style" or "generate this particular character consistently."</p><p>LoRAs are typically 10-300MB (vs 2-7GB for full models), making them lightweight and stackable.</p>` },
          { heading: "What Can LoRAs Do?", content: `<ul><li><strong>Style LoRAs:</strong> Apply specific art styles (e.g., "90s anime melancholy", "Art Nouveau", "GTA 6 photography")</li><li><strong>Character LoRAs:</strong> Generate a consistent character across different scenes</li><li><strong>Concept LoRAs:</strong> Add specific concepts ("transparent clothing", "retro 60s aesthetic")</li><li><strong>Detail LoRAs:</strong> Enhance specific aspects ("detailed hands", "skin texture")</li></ul>` },
          { heading: "Finding LoRAs on CivitAI", content: `<p>CivitAI hosts over 100,000 community-created models. On EGAKU AI:</p><ol><li>Go to <a href="/generate">Generate</a> or <a href="/adult">Adult</a> page</li><li>Click the <strong>CivitAI Models</strong> browser button</li><li>Search by keyword (e.g., "anime style", "photorealistic")</li><li>Click <strong>Use Now</strong> to generate immediately, or <strong>Save</strong> for later</li></ol><p>No download needed — EGAKU AI handles everything in the cloud.</p>` },
          { heading: "LoRA Strength", content: `<p>LoRA strength (0.0-2.0) controls how much the LoRA affects the output:</p><ul><li><strong>0.3-0.5:</strong> Subtle influence</li><li><strong>0.7-0.8:</strong> Balanced (recommended starting point)</li><li><strong>1.0+:</strong> Strong effect (may override other prompt elements)</li></ul>` },
        ],
      },
      ja: {
        title: "LoRAモデルとは？CivitAIの10万+モデルの使い方",
        description: "LoRAモデルでAI画像生成をカスタマイズ。スタイル、キャラクター、コンセプトの適用方法。",
        sections: [
          { heading: "LoRAとは", content: `<p><strong>LoRA（Low-Rank Adaptation）</strong>はベースAIモデルの出力を修正する小さなアドオンファイルです。ベースモデル（FluxやSDXL）が万能画家だとすると、LoRAは専門トレーニング — 「このアニメスタイルで描いて」「このキャラクターを一貫して生成して」といった指示です。</p><p>サイズは10-300MB（フルモデルの2-7GBに比べて軽量）。複数重ね掛け可能。</p>` },
          { heading: "LoRAの種類", content: `<ul><li><strong>スタイルLoRA：</strong> 特定の画風（90年代アニメ、アールヌーヴォー、GTA風等）</li><li><strong>キャラクターLoRA：</strong> 一貫したキャラクターを異なるシーンで生成</li><li><strong>コンセプトLoRA：</strong> 特定の概念を追加（透け素材、レトロ60年代等）</li><li><strong>ディテールLoRA：</strong> 特定要素を強化（手の詳細、肌のテクスチャ等）</li></ul>` },
          { heading: "EGAKU AIでの使い方", content: `<ol><li><a href="/generate">Generate</a>ページへ</li><li><strong>CivitAI Models</strong>ブラウザボタンをクリック</li><li>キーワードで検索</li><li><strong>Use Now</strong>で即生成、<strong>Save</strong>で保存</li></ol><p>ダウンロード不要 — クラウドで全て処理。</p>` },
        ],
      },
      es: {
        title: "¿Qué Son los Modelos LoRA? Cómo Usar 100K+ Modelos de CivitAI",
        description: "Los modelos LoRA personalizan la generación de imágenes IA. Aprende a encontrarlos y usarlos.",
        sections: [
          { heading: "LoRA en Términos Simples", content: `<p><strong>LoRA</strong> es un archivo pequeño que modifica cómo genera imágenes un modelo base. Como entrenamiento especializado para un pintor generalista.</p>` },
          { heading: "Cómo Usarlos en EGAKU AI", content: `<ol><li>Ve a Generate → botón CivitAI Models</li><li>Busca por palabra clave</li><li>Haz clic en Use Now para generar al instante</li></ol>` },
        ],
      },
      zh: {
        title: "什么是LoRA模型？如何使用CivitAI的10万+模型",
        description: "LoRA模型让你用特定风格、角色或概念自定义AI图像生成。",
        sections: [
          { heading: "简单说明", content: `<p><strong>LoRA</strong>是修改基础AI模型输出的小型附加文件。大小仅10-300MB，可叠加使用。</p>` },
          { heading: "在EGAKU AI中使用", content: `<ol><li>前往Generate → CivitAI Models按钮</li><li>搜索关键词</li><li>点击Use Now即时生成</li></ol>` },
        ],
      },
      pt: {
        title: "O Que São Modelos LoRA? Como Usar 100K+ Modelos do CivitAI",
        description: "Modelos LoRA personalizam a geração de imagens IA. Aprenda a encontrá-los e usá-los.",
        sections: [
          { heading: "LoRA em Termos Simples", content: `<p><strong>LoRA</strong> é um arquivo pequeno que modifica como o modelo base gera imagens.</p>` },
          { heading: "Como Usar no EGAKU AI", content: `<ol><li>Vá para Generate → botão CivitAI Models</li><li>Pesquise por palavra-chave</li><li>Clique em Use Now</li></ol>` },
        ],
      },
    },
  },

  // ── News: AI Video Generation Comparison ──
  {
    slug: "ai-video-generation-comparison-2026",
    category: "news",
    tags: ["video", "kling", "veo", "wan", "comparison"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "AI Video Generation in 2026: Kling 3.0 vs Veo 3 vs Wan 2.6",
        description: "A practical comparison of the top AI video generation models available in 2026. Quality, speed, cost, and which to choose for your project.",
        sections: [
          { heading: "The State of AI Video in 2026", content: `<p>AI video generation has made remarkable progress. We now have models that produce 4K cinematic quality, native audio, and consistent motion — unthinkable just two years ago. But with so many options, which model should you use?</p>` },
          { heading: "Model Comparison", content: `<table><tr><th>Model</th><th>Resolution</th><th>Duration</th><th>Quality</th><th>Speed</th><th>Best For</th></tr><tr><td><strong>Kling 3.0</strong></td><td>Native 4K</td><td>5-10s</td><td>Cinematic</td><td>2-5 min</td><td>Professional, ads</td></tr><tr><td><strong>Kling O3</strong></td><td>Native 4K</td><td>5-10s</td><td>Cinematic + Audio</td><td>3-6 min</td><td>Films, audio needed</td></tr><tr><td><strong>Veo 3</strong></td><td>1080p</td><td>4-8s</td><td>Excellent</td><td>2-4 min</td><td>Creative, diverse styles</td></tr><tr><td><strong>Wan 2.6</strong></td><td>720p-1080p</td><td>5-15s</td><td>Good</td><td>1-3 min</td><td>Free tier, longer videos</td></tr><tr><td><strong>LTX 2.3</strong></td><td>720p</td><td>3-5s</td><td>Good</td><td>30s-1 min</td><td>Quick drafts</td></tr></table>` },
          { heading: "Which Model to Choose", content: `<ul><li><strong>Need 4K quality?</strong> → Kling 3.0</li><li><strong>Need video with audio?</strong> → Kling O3</li><li><strong>Budget-conscious?</strong> → Wan 2.6 (free tier) or LTX 2.3</li><li><strong>Longest duration?</strong> → Wan 2.6 (up to 15 seconds)</li><li><strong>Fastest results?</strong> → LTX 2.3 (under 1 minute)</li></ul><p>On EGAKU AI, all these models are available from a single interface. Free users can access Wan 2.6 and LTX. Pro users unlock Kling 3.0, Veo 3, and more.</p>` },
          { heading: "Image-to-Video vs Text-to-Video", content: `<p><strong>Text-to-Video (T2V):</strong> Describe a scene in text. The AI creates everything from scratch. Best for: concepts, creative exploration.</p><p><strong>Image-to-Video (I2V):</strong> Upload a still image and the AI animates it. Best for: animating photos, product demos, bringing artwork to life. Generally produces more consistent results because the AI has a visual reference.</p><p><strong>Pro tip:</strong> Generate a high-quality image first with Flux Pro, then animate it with Kling 3.0 I2V for the best results.</p>` },
        ],
      },
      ja: {
        title: "2026年 AI動画生成比較：Kling 3.0 vs Veo 3 vs Wan 2.6",
        description: "2026年のトップAI動画生成モデルを実用的に比較。品質、速度、コスト、プロジェクト別の選び方。",
        sections: [
          { heading: "2026年のAI動画生成", content: `<p>AI動画生成は驚異的な進歩を遂げた。4Kシネマ品質、ネイティブ音声、一貫した動きが可能に。しかし選択肢が多すぎて、どのモデルを使うべきか迷う。</p>` },
          { heading: "モデル比較", content: `<p><strong>Kling 3.0：</strong> ネイティブ4K、映画品質。プロ向け。</p><p><strong>Kling O3：</strong> 4K + 音声。映像作品に。</p><p><strong>Veo 3：</strong> 1080p、多様なスタイル。クリエイティブに。</p><p><strong>Wan 2.6：</strong> 無料枠あり、最長15秒。コスト重視に。</p><p><strong>LTX 2.3：</strong> 最速（1分以内）。ドラフトに。</p>` },
          { heading: "選び方", content: `<ul><li><strong>4K品質が必要</strong> → Kling 3.0</li><li><strong>音声付き</strong> → Kling O3</li><li><strong>予算重視</strong> → Wan 2.6（無料）/ LTX 2.3</li><li><strong>長尺</strong> → Wan 2.6（最長15秒）</li></ul><p>EGAKU AIでは全モデルが1つのインターフェースから利用可能。</p>` },
          { heading: "プロのコ��", content: `<p>最高品質の動画を作るなら：Flux Proで高品質画像を生成 → Kling 3.0 I2Vでアニメーション化。</p>` },
        ],
      },
      es: {
        title: "Generación de Video IA en 2026: Kling 3.0 vs Veo 3 vs Wan 2.6",
        description: "Comparación práctica de los principales modelos de generación de video IA en 2026.",
        sections: [
          { heading: "Comparación", content: `<p><strong>Kling 3.0:</strong> 4K nativo, cinematográfico. <strong>Veo 3:</strong> 1080p, diverso. <strong>Wan 2.6:</strong> Gratis, hasta 15s. <strong>LTX:</strong> Rápido, borradores.</p>` },
          { heading: "Consejo Pro", content: `<p>Genera una imagen con Flux Pro, luego anímala con Kling 3.0 I2V.</p>` },
        ],
      },
      zh: {
        title: "2026年AI视频生成比较：Kling 3.0 vs Veo 3 vs Wan 2.6",
        description: "2026年顶级AI视频生成模型实用比较。质量、速度、成本和选择指南。",
        sections: [
          { heading: "模型对比", content: `<p><strong>Kling 3.0：</strong>原生4K，电影级。<strong>Veo 3：</strong>1080p，多样风格。<strong>Wan 2.6：</strong>免费，最长15秒。<strong>LTX：</strong>最快。</p>` },
          { heading: "专业技巧", content: `<p>先用Flux Pro生成高质量图片，再用Kling 3.0 I2V制作动画。</p>` },
        ],
      },
      pt: {
        title: "Geração de Vídeo IA em 2026: Kling 3.0 vs Veo 3 vs Wan 2.6",
        description: "Comparação prática dos melhores modelos de geração de vídeo IA em 2026.",
        sections: [
          { heading: "Comparação", content: `<p><strong>Kling 3.0:</strong> 4K nativo. <strong>Veo 3:</strong> 1080p. <strong>Wan 2.6:</strong> Grátis, até 15s. <strong>LTX:</strong> Mais rápido.</p>` },
          { heading: "Dica Pro", content: `<p>Gere imagem com Flux Pro, depois anime com Kling 3.0 I2V.</p>` },
        ],
      },
    },
  },

  // ── How-to: Negative Prompts ──
  {
    slug: "negative-prompts-complete-guide",
    category: "how-to",
    tags: ["negative-prompts", "beginner", "quality", "tips"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "Negative Prompts: The Complete List for Better AI Images",
        description: "Master negative prompts to dramatically improve your AI-generated images. Copy-paste ready lists for photorealistic, anime, and artistic styles.",
        sections: [
          { heading: "Why Negative Prompts Matter", content: `<p>Negative prompts tell the AI what to <em>avoid</em>. Without them, you'll often get: extra fingers, distorted faces, blurry backgrounds, and unwanted text. A good negative prompt is as important as the main prompt.</p>` },
          { heading: "Universal Negative Prompt (Copy This)", content: `<p>Works with almost any model:</p><p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, disfigured, poorly drawn face, mutated, bad proportions, gross proportions, text, watermark, signature, username</code></p>` },
          { heading: "For Photorealistic Images", content: `<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, cartoon, anime, illustration, painting, drawing, CGI, 3D render, overexposed, underexposed, oversaturated, grainy noise, cropped, out of frame, text, watermark</code></p>` },
          { heading: "For Anime / Illustration", content: `<p><code>worst quality, low quality, blurry, bad anatomy, extra fingers, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, photorealistic, 3D, CGI, sketch, rough, monochrome, text, watermark, signature</code></p>` },
          { heading: "For Product Photography", content: `<p><code>worst quality, low quality, blurry, distorted product, wrong colors, shadows on product, busy background, text overlay, watermark, people, hands, multiple products, cluttered, low resolution</code></p>` },
          { heading: "Pro Tips", content: `<ul><li>Use <code>(keyword:1.3)</code> to emphasize avoidance of specific problems (SDXL/CivitAI models)</li><li>Flux models respond less to negative prompts — focus on the positive prompt instead</li><li>Don't make negative prompts too long — 30-50 words is optimal</li><li>If faces look wrong, add <code>bad face, asymmetric eyes, cross-eyed</code></li></ul>` },
        ],
      },
      ja: {
        title: "ネガティブプロンプト完全ガイド：AI画像を劇的に改善",
        description: "ネガティブプロンプトでAI生成画像を改善。フォトリアル、アニメ、商品撮影向けのコピペ用リスト。",
        sections: [
          { heading: "なぜネガティブプロンプトが重要か", content: `<p>ネガティブプロンプトはAIに「避けるべきこと」を指示します。指定しないと、余分な指、歪んだ顔、ぼやけた背景、不要なテキストが出やすくなります。</p>` },
          { heading: "万能ネガティブプロンプト（コピペ用）", content: `<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, disfigured, poorly drawn face, mutated, text, watermark</code></p>` },
          { heading: "フォトリアル用", content: `<p><code>worst quality, low quality, blurry, deformed, cartoon, anime, illustration, painting, CGI, 3D render, overexposed, undersaturated, grainy, cropped, text, watermark</code></p>` },
          { heading: "アニメ・イラスト用", content: `<p><code>worst quality, low quality, blurry, bad anatomy, extra fingers, poorly drawn hands, photorealistic, 3D, CGI, sketch, monochrome, text, watermark</code></p>` },
          { heading: "コツ", content: `<ul><li>SDXL/CivitAIモデルでは<code>(keyword:1.3)</code>で強調可能</li><li>Fluxモデルはネガティブプロンプトの影響が小さい — ポジティブプロンプトに集中</li><li>長すぎない方が良い（30-50語が最適）</li></ul>` },
        ],
      },
      es: {
        title: "Prompts Negativos: Guía Completa para Mejores Imágenes IA",
        description: "Domina los prompts negativos para mejorar tus imágenes de IA. Listas listas para copiar y pegar.",
        sections: [
          { heading: "Por Qué Importan los Prompts Negativos", content: `<p>Los prompts negativos le dicen a la IA qué <em>evitar</em>. Sin ellos, a menudo obtendrás: dedos extra, caras distorsionadas, fondos borrosos y texto no deseado.</p>` },
          { heading: "Prompt Negativo Universal (Copia Esto)", content: `<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, text, watermark</code></p>` },
          { heading: "Consejos", content: `<ul><li>Usa <code>(keyword:1.3)</code> para enfatizar en modelos SDXL/CivitAI</li><li>Los modelos Flux responden menos a prompts negativos</li><li>No hagas prompts negativos demasiado largos (30-50 palabras)</li></ul>` },
        ],
      },
      zh: {
        title: "负面提示词完全指南：大幅提升AI图像质量",
        description: "掌握负面提示词，显著改善AI生成图像。提供可直接复制的列表。",
        sections: [
          { heading: "为什么负面提示词很重要", content: `<p>负面提示词告诉AI要<em>避免</em>什么。没有它们，你经常会得到：多余的手指、扭曲的面部、模糊的背景和不需要的文字。</p>` },
          { heading: "通用负面提示词（直接复制）", content: `<p><code>worst quality, low quality, blurry, deformed, ugly, bad anatomy, bad hands, extra fingers, missing fingers, text, watermark</code></p>` },
          { heading: "技巧", content: `<ul><li>SDXL/CivitAI模型中使用<code>(keyword:1.3)</code>加强效果</li><li>Flux模型对负面提示词反应较小——专注于正面提示词</li></ul>` },
        ],
      },
    },
  },

  // ── Guide: Image-to-Video ──
  {
    slug: "image-to-video-guide-animate-photos",
    category: "guide",
    tags: ["img2vid", "video", "animation", "kling", "wan"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "Image-to-Video Guide: Animate Any Photo with AI",
        description: "Turn still photos into videos with AI. Complete guide to image-to-video generation using Kling 3.0, Wan 2.6, and more.",
        sections: [
          { heading: "What is Image-to-Video?", content: `<p>Image-to-Video (I2V) takes a still image and brings it to life — adding motion, camera movement, and animation while keeping the original image's composition. It's like giving a photograph the ability to move.</p><p>Use cases: animate product photos, bring artwork to life, create social media content, turn portraits into dynamic videos.</p>` },
          { heading: "Two Modes: Animate vs Reimagine", content: `<p><strong>Animate mode:</strong> Keeps the image mostly intact and adds subtle motion. Good for: product demos, portrait animations, nature scenes. The AI respects the original composition.</p><p><strong>Reimagine mode:</strong> Uses the image as a starting point but takes more creative liberty. Good for: artistic transformations, dramatic effects, style changes.</p>` },
          { heading: "Best Models for I2V", content: `<table><tr><th>Model</th><th>Quality</th><th>Duration</th><th>Free?</th></tr><tr><td><strong>Kling 3.0</strong></td><td>4K Cinematic</td><td>5-10s</td><td>Pro</td></tr><tr><td><strong>Kling 2.5</strong></td><td>HD</td><td>5-10s</td><td>Basic+</td></tr><tr><td><strong>Wan 2.6</strong></td><td>720-1080p</td><td>5-15s</td><td>Free</td></tr><tr><td><strong>Wan 2.1</strong></td><td>720p</td><td>~5s</td><td>Free</td></tr></table>` },
          { heading: "Tips for Best Results", content: `<ul><li><strong>Start with a high-quality image.</strong> Generate with Flux Pro first, then animate with Kling 3.0.</li><li><strong>Add a motion prompt.</strong> Describe what should move: "camera slowly pans right", "hair blowing in wind", "water ripples".</li><li><strong>Keep it simple.</strong> One main motion works better than complex multi-action scenes.</li><li><strong>Match the model to the content.</strong> Kling for cinematic, Wan for longer/free videos.</li></ul>` },
          { heading: "How to Do It on EGAKU AI", content: `<ol><li>Go to <a href="/generate">Generate</a> → <strong>Img2Vid</strong> tab</li><li>Upload your image</li><li>Choose a model (Wan 2.6 is free)</li><li>Add a motion prompt (optional but recommended)</li><li>Select Animate or Reimagine mode</li><li>Generate!</li></ol><p>You can also use the <strong>Gallery Remix</strong> feature — click any image in the Explore gallery and select "Img2Vid" to animate it.</p>` },
        ],
      },
      ja: {
        title: "Image-to-Videoガイド：写真をAIで動画にする方法",
        description: "静止画をAIで動画に変換。Kling 3.0、Wan 2.6を使った完全ガイド。",
        sections: [
          { heading: "Image-to-Videoとは？", content: `<p>Image-to-Video（I2V）は静止画に動きを加えて動画にする技術です。写真が動き出すイメージ。商品写真のアニメーション、アートワークの動画化、SNSコンテンツ作成に。</p>` },
          { heading: "2つのモード", content: `<p><strong>Animate：</strong> 元画像を維持しつつ微妙な動きを追加。商品デモ、ポートレートに。</p><p><strong>Reimagine：</strong> 画像を出発点にしつつ創造的な変換。芸術的エフェクト、スタイル変更に。</p>` },
          { heading: "モデル選び", content: `<p>Kling 3.0: 4K映画品質（Pro）/ Wan 2.6: 最長15秒（無料）/ Wan 2.1: ~5秒（無料）</p>` },
          { heading: "コツ", content: `<ul><li>高品質な画像から始める（Flux Proで生成→Kling 3.0でアニメーション化）</li><li>動きのプロンプトを追加（「カメラがゆっくり右にパン」「髪が風に揺れる」）</li><li>シンプルに。1つの主要な動きが最も効果的</li></ul>` },
          { heading: "EGAKU AIでの使い方", content: `<ol><li><a href="/generate">Generate</a> → Img2Vidタブ</li><li>画像アップロード</li><li>モデル選択（Wan 2.6は無料）</li><li>動きのプロンプト入力</li><li>生成！</li></ol><p>Exploreギャラリーの画像から「Img2Vid」ボタンで直接アニメーション化も可能。</p>` },
        ],
      },
      es: {
        title: "Guía Image-to-Video: Anima Cualquier Foto con IA",
        description: "Convierte fotos en videos con IA. Guía completa usando Kling 3.0, Wan 2.6 y más.",
        sections: [
          { heading: "¿Qué es Image-to-Video?", content: `<p>Image-to-Video (I2V) toma una imagen fija y le da vida — añadiendo movimiento y animación manteniendo la composición original.</p>` },
          { heading: "Mejores Modelos", content: `<p>Kling 3.0: Calidad 4K (Pro) / Wan 2.6: Hasta 15s (Gratis) / Wan 2.1: ~5s (Gratis)</p>` },
          { heading: "Consejos", content: `<ul><li>Empieza con una imagen de alta calidad</li><li>Añade un prompt de movimiento: "la cámara se mueve lentamente a la derecha"</li><li>Mantenlo simple — un movimiento principal funciona mejor</li></ul>` },
        ],
      },
    },
  },

  // ── Guide: Product Photography with AI ──
  {
    slug: "ai-product-photography-guide",
    category: "guide",
    tags: ["product", "ecommerce", "photography", "marketing", "instagram"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "AI Product Photography: Professional Ad Images Without a Studio",
        description: "Create professional product photos with AI. No studio, no photographer needed. Perfect for Amazon, Shopify, Instagram sellers.",
        sections: [
          { heading: "Why AI Product Photography?", content: `<p>Professional product photography typically costs $50-500 per product. Studio rental, photographer, lighting equipment, post-production — it adds up fast. AI product photography gives you the same results in seconds for a fraction of the cost.</p><p>Perfect for: Amazon sellers, Shopify stores, Instagram marketers, small businesses, dropshippers.</p>` },
          { heading: "How It Works on EGAKU AI", content: `<ol><li>Go to <a href="/product-studio">Product Studio</a></li><li><strong>Upload</strong> your product photo (even a smartphone photo works)</li><li><strong>Remove background</strong> — AI cleanly extracts just the product</li><li><strong>Choose a scene</strong> — Clean White, Marble Surface, Lifestyle, Nature, Neon Glow, Gradient, Holiday</li><li><strong>Generate</strong> — AI creates 3 professional variations</li><li><strong>Download</strong> and use anywhere</li></ol>` },
          { heading: "Scene Presets Explained", content: `<ul><li><strong>Clean White:</strong> The Amazon/eBay standard. Pure white background, studio lighting.</li><li><strong>Marble Surface:</strong> Luxury aesthetic. Great for cosmetics, jewelry, premium products.</li><li><strong>Lifestyle:</strong> Cozy setting with natural light. Perfect for Instagram, Etsy.</li><li><strong>Nature:</strong> Organic, outdoor feel. Great for eco-friendly products, food.</li><li><strong>Neon Glow:</strong> Futuristic tech aesthetic. Great for electronics, gadgets.</li><li><strong>Gradient:</strong> Modern, clean. Great for cosmetics, fashion accessories.</li><li><strong>Holiday:</strong> Seasonal marketing. Festive decorations, warm golden bokeh.</li></ul>` },
          { heading: "Tips for Best Results", content: `<ul><li><strong>Start with a clear photo.</strong> Good lighting and a simple background help the AI extract your product cleanly.</li><li><strong>Try multiple scenes.</strong> You get 3 variations per generation — compare and pick the best.</li><li><strong>Add a product name.</strong> Telling the AI "ceramic coffee mug" or "leather handbag" helps it create more appropriate backgrounds.</li><li><strong>Use for A/B testing.</strong> Generate different scenes and test which converts better on your store.</li></ul>` },
          { heading: "Cost Comparison", content: `<table><tr><th>Method</th><th>Cost per Product</th><th>Time</th></tr><tr><td>Traditional Studio</td><td>$50-500</td><td>1-5 days</td></tr><tr><td>Freelance Photographer</td><td>$20-100</td><td>2-7 days</td></tr><tr><td><strong>EGAKU AI Product Studio</strong></td><td><strong>3 credits (~¥60)</strong></td><td><strong>30 seconds</strong></td></tr></table>` },
        ],
      },
      ja: {
        title: "AI商品撮影ガイド：スタジオなしでプロの広告画像を作る",
        description: "AIで商品写真をプロ品質に。スタジオ不要、カメラマン不要。Amazon、Shopify、Instagram出品者に最適。",
        sections: [
          { heading: "なぜAI商品撮影？", content: `<p>プロの商品撮影は通常1商品あたり5,000-50,000円。スタジオ代、カメラマン、照明機材、後処理。AIなら数秒で同等の結果。</p><p>最適な用途：Amazon出品者、Shopifyストア、Instagramマーケター、中小企業。</p>` },
          { heading: "EGAKU AIでの使い方", content: `<ol><li><a href="/product-studio">Product Studio</a>にアクセス</li><li>商品写真をアップロード（スマホ写真でOK）</li><li>背景自動除去</li><li>シーン選択（白背景、大理石、ライフスタイル、自然、ネオン等）</li><li>3パターン自動生成</li><li>ダウンロードして使用</li></ol>` },
          { heading: "コスト比較", content: `<p>従来のスタジオ: ¥5,000-50,000/商品 / フリーランス: ¥2,000-10,000 / <strong>EGAKU AI: 3クレジット（約¥60）</strong></p>` },
        ],
      },
      es: {
        title: "Fotografía de Productos con IA: Imágenes Profesionales Sin Estudio",
        description: "Crea fotos profesionales de productos con IA. Sin estudio ni fotógrafo. Perfecto para Amazon, Shopify, Instagram.",
        sections: [
          { heading: "¿Por Qué Fotografía de Productos con IA?", content: `<p>La fotografía profesional de productos cuesta $50-500 por producto. Con IA obtienes los mismos resultados en segundos.</p>` },
          { heading: "Cómo Funciona", content: `<ol><li>Sube tu foto del producto</li><li>Elimina el fondo automáticamente</li><li>Elige una escena (blanco, mármol, lifestyle, naturaleza, neón)</li><li>Genera 3 variaciones profesionales</li></ol>` },
        ],
      },
      zh: {
        title: "AI产品摄影指南：无需摄影棚的专业广告图片",
        description: "用AI创建专业产品照片。无需摄影棚和摄影师。适合亚马逊、Shopify、Instagram卖家。",
        sections: [
          { heading: "为什么选择AI产品摄影？", content: `<p>专业产品摄影通常每件产品需要50-500美元。AI可以在几秒钟内以极低成本获得同等效果。</p>` },
          { heading: "使用方法", content: `<ol><li>上传产品照片</li><li>AI自动去除背景</li><li>选择场景（纯白、大理石、生活方式、自然等）</li><li>生成3种专业变体</li></ol>` },
        ],
      },
    },
  },

  // ── Guide: AI Art for Instagram/TikTok ──
  {
    slug: "how-to-make-ai-art-instagram-tiktok",
    category: "guide",
    tags: ["instagram", "tiktok", "social-media", "content-creation", "reels"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "How to Make AI Art for Instagram & TikTok: Creator's Guide",
        description: "Create scroll-stopping AI art for Instagram and TikTok. Best sizes, models, styles, and tips for growing your audience with AI-generated content.",
        sections: [
          { heading: "Why AI Art Works on Social Media", content: `<p>AI-generated art is exploding on social media. Accounts posting AI art regularly gain thousands of followers because:</p><ul><li>Visually striking — stops the scroll</li><li>Unique — no one else has the exact same image</li><li>Fast to produce — post daily without burnout</li><li>Trendy — "Made with AI" is a conversation starter</li></ul>` },
          { heading: "Best Sizes for Each Platform", content: `<table><tr><th>Platform</th><th>Format</th><th>Size</th><th>EGAKU AI Setting</th></tr><tr><td>Instagram Post</td><td>Square</td><td>1080x1080</td><td>1024x1024</td></tr><tr><td>Instagram Story/Reel</td><td>Vertical</td><td>1080x1920</td><td>576x1024</td></tr><tr><td>TikTok</td><td>Vertical</td><td>1080x1920</td><td>576x1024</td></tr><tr><td>X (Twitter)</td><td>Landscape</td><td>1200x675</td><td>1024x576</td></tr><tr><td>YouTube Thumbnail</td><td>Landscape</td><td>1280x720</td><td>1024x576</td></tr></table>` },
          { heading: "Best Models for Social Content", content: `<ul><li><strong>Flux Pro:</strong> Photorealistic content that looks like real photography</li><li><strong>Flux Dev:</strong> High quality, slightly more artistic. Free tier available</li><li><strong>GPT Image 2:</strong> Excellent for text-heavy designs, infographics</li><li><strong>Ideogram v3:</strong> Best for logos, text in images, typography-heavy designs</li><li><strong>CivitAI anime models:</strong> Anime/illustration content has huge audiences</li></ul>` },
          { heading: "Content Ideas That Go Viral", content: `<ol><li><strong>"Same prompt, different style"</strong> — Generate the same scene in 6 different art styles. Carousel post.</li><li><strong>AI vs Reality</strong> — Put AI image next to a real photo. People love guessing.</li><li><strong>Character series</strong> — Create an AI character and post their "daily life" as a series.</li><li><strong>Style transformations</strong> — Take a famous landmark and render it in Ghibli/Cyberpunk/Ukiyo-e style.</li><li><strong>Before/After</strong> — Show the prompt and the result. Educational + engaging.</li></ol>` },
          { heading: "Workflow: Prompt to Post", content: `<ol><li><strong>Generate</strong> on EGAKU AI — use templates for consistent quality</li><li><strong>Upscale</strong> if needed (4x upscaler built in)</li><li><strong>Add text/branding</strong> in Canva or directly in Instagram</li><li><strong>Post with hashtags:</strong> #AIart #AIgenerated #FluxAI #AIillustration #digitalart</li><li><strong>Engage</strong> — reply to comments, share your prompt in caption</li></ol>` },
          { heading: "Making Videos for TikTok/Reels", content: `<p>EGAKU AI can generate videos directly:</p><ul><li>Use <strong>Short Story Generator</strong> — story idea → visual scenes → ready for TikTok</li><li>Use <strong>Image-to-Video</strong> — generate a stunning image, then animate it</li><li>Use <strong>Vid2Vid</strong> — take existing footage and restyle it (anime, cyberpunk, etc.)</li></ul><p>Free models (Wan 2.6, LTX) can generate up to 15 seconds — perfect for Reels/TikTok.</p>` },
        ],
      },
      ja: {
        title: "Instagram・TikTok向けAIアート作成ガイド",
        description: "SNS映えするAIアートの作り方。最適サイズ、モデル選び、バズるコンテンツのコツ。",
        sections: [
          { heading: "なぜAIアートがSNSで伸びるか", content: `<p>AIアートはSNSで爆発的に伸びている。理由：視覚的に目を引く、ユニークで他と被らない、毎日投稿できる制作速度、「AI製」が話題になる。</p>` },
          { heading: "プラットフォーム別推奨サイズ", content: `<p>Instagram投稿: 1024x1024 / Story・Reel: 576x1024 / TikTok: 576x1024 / X: 1024x576</p>` },
          { heading: "バズるコンテンツアイデア", content: `<ol><li>同じプロンプト×6スタイル（カルーセル投稿）</li><li>AI vs 現実（どっちがAI？クイズ形式）</li><li>AIキャラの日常シリーズ</li><li>名所のスタイル変換（渋谷をジブリ風に等）</li><li>プロンプト公開（教育系+エンゲージメント）</li></ol>` },
          { heading: "動画作成", content: `<p>Short Story Generator: ストーリー→ビジュアルシーン→TikTok用 / Img2Vid: 画像をアニメーション化 / Vid2Vid: 既存動画をスタイル変換</p>` },
        ],
      },
      es: {
        title: "Cómo Crear Arte IA para Instagram y TikTok",
        description: "Crea arte IA viral para Instagram y TikTok. Tamaños, modelos, estilos y consejos para crecer tu audiencia.",
        sections: [
          { heading: "Por Qué el Arte IA Funciona en Redes Sociales", content: `<p>El arte generado por IA está explotando en redes sociales. Es visualmente impactante, único, rápido de producir y tendencia.</p>` },
          { heading: "Ideas de Contenido Viral", content: `<ol><li>Mismo prompt, 6 estilos diferentes (carrusel)</li><li>IA vs Realidad (¿cuál es cuál?)</li><li>Serie de personajes IA</li><li>Transformaciones de estilo</li></ol>` },
        ],
      },
    },
  },

  // ── Guide: Flux vs SDXL vs SD1.5 ──
  {
    slug: "flux-vs-sdxl-vs-sd15-which-model",
    category: "guide",
    tags: ["flux", "sdxl", "sd15", "comparison", "models", "technical"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "Flux vs SDXL vs SD 1.5: Which AI Model Should You Choose?",
        description: "Detailed comparison of Flux, SDXL, and Stable Diffusion 1.5. Quality, speed, NSFW support, CivitAI compatibility, and best use cases.",
        sections: [
          { heading: "The Three Generations", content: `<p>AI image generation has gone through three major generations:</p><ul><li><strong>SD 1.5 (2022)</strong> — The original that started it all. 512x512 native resolution.</li><li><strong>SDXL (2023)</strong> — Double the resolution (1024x1024), much better quality.</li><li><strong>Flux (2024-2025)</strong> — New architecture from Black Forest Labs. Best overall quality.</li></ul>` },
          { heading: "Head-to-Head Comparison", content: `<table><tr><th>Feature</th><th>SD 1.5</th><th>SDXL</th><th>Flux Dev</th></tr><tr><td>Native Resolution</td><td>512x512</td><td>1024x1024</td><td>Up to 2048</td></tr><tr><td>Image Quality</td><td>Good</td><td>Very Good</td><td>Excellent</td></tr><tr><td>Text in Images</td><td>Poor</td><td>Decent</td><td>Good</td></tr><tr><td>Speed</td><td>Fast</td><td>Medium</td><td>Medium</td></tr><tr><td>CivitAI Models</td><td>50,000+</td><td>30,000+</td><td>Growing</td></tr><tr><td>NSFW Support</td><td>CivitAI models</td><td>CivitAI models</td><td>Flux Dev only</td></tr><tr><td>Prompt Style</td><td>Tags (booru)</td><td>Tags or natural</td><td>Natural language</td></tr><tr><td>Cost</td><td>Cheapest</td><td>Medium</td><td>Higher</td></tr></table>` },
          { heading: "When to Use Each", content: `<p><strong>Use Flux Dev when:</strong></p><ul><li>You want the best possible image quality</li><li>You're doing photorealistic or artistic content</li><li>You want to write prompts in natural language</li><li>You don't need specific CivitAI models</li></ul><p><strong>Use SDXL when:</strong></p><ul><li>You want high quality + CivitAI model compatibility</li><li>You need specific styles from CivitAI checkpoints</li><li>You want a balance of quality and cost</li></ul><p><strong>Use SD 1.5 when:</strong></p><ul><li>You need specific CivitAI models only available for SD 1.5</li><li>You want the fastest, cheapest generation</li><li>You're using specialized NSFW models</li></ul>` },
          { heading: "On EGAKU AI", content: `<p>You don't have to choose — EGAKU AI offers all three. Start with Flux Dev for best quality, switch to SDXL/CivitAI models when you need specific styles.</p><p>Free tier includes Flux Schnell (fast) and SDXL. Flux Dev and Pro require Basic plan or above.</p><p><a href="/generate">Try all models →</a></p>` },
        ],
      },
      ja: {
        title: "Flux vs SDXL vs SD 1.5：どのAIモデルを選ぶべきか",
        description: "Flux、SDXL、SD 1.5を詳細比較。品質、速度、NSFW対応、CivitAI互換性。",
        sections: [
          { heading: "3つの世代", content: `<p><strong>SD 1.5（2022年）：</strong> 元祖。512x512。<strong>SDXL（2023年）：</strong> 解像度2倍（1024x1024）。<strong>Flux（2024-2025年）：</strong> 新アーキテクチャ。最高品質。</p>` },
          { heading: "使い分け", content: `<p><strong>Flux Dev：</strong> 最高品質、自然言語プロンプト、フォトリアル</p><p><strong>SDXL：</strong> 高品質+CivitAIモデル互換、特定スタイル</p><p><strong>SD 1.5：</strong> 最速・最安、特定のCivitAI NSFWモデル用</p>` },
          { heading: "EGAKU AIでは", content: `<p>全モデル利用可能。Flux Schnell（高速）とSDXLは無料。Flux Dev/ProはBasicプラン以上。</p>` },
        ],
      },
      es: {
        title: "Flux vs SDXL vs SD 1.5: ¿Qué Modelo IA Elegir?",
        description: "Comparación detallada de Flux, SDXL y SD 1.5. Calidad, velocidad, soporte NSFW y compatibilidad CivitAI.",
        sections: [
          { heading: "Tres Generaciones", content: `<p><strong>SD 1.5:</strong> El original. 512x512. <strong>SDXL:</strong> Doble resolución. <strong>Flux:</strong> Nueva arquitectura, mejor calidad.</p>` },
          { heading: "Cuándo Usar Cada Uno", content: `<p>Flux: mejor calidad. SDXL: calidad + CivitAI. SD 1.5: más rápido y barato, modelos NSFW específicos.</p>` },
        ],
      },
    },
  },

  // ── How-to: Steps Optimization ──
  {
    slug: "how-many-steps-ai-image-generation",
    category: "how-to",
    tags: ["steps", "settings", "optimization", "speed", "quality"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "How Many Steps Do You Need? Optimizing AI Image Generation Speed",
        description: "Find the sweet spot between quality and speed. Step count guide for Flux, SDXL, and SD 1.5 models.",
        sections: [
          { heading: "What Are Steps?", content: `<p>Each "step" is one pass of the AI refining your image from noise. More steps = more refinement, but diminishing returns after a point. The goal is finding the minimum steps for maximum quality.</p>` },
          { heading: "The Diminishing Returns Problem", content: `<p>Going from 5 to 15 steps produces a massive quality jump. Going from 25 to 50 steps? Often no visible difference — just 2x the wait time and cost.</p><p>This is why step optimization matters. You want to avoid paying (in time and credits) for invisible improvements.</p>` },
          { heading: "Optimal Steps by Model", content: `<table><tr><th>Model</th><th>Minimum</th><th>Recommended</th><th>Maximum Useful</th></tr><tr><td>Flux Schnell</td><td>1</td><td>4</td><td>4 (designed for 4 steps)</td></tr><tr><td>Flux Dev</td><td>15</td><td>25-28</td><td>50</td></tr><tr><td>SDXL</td><td>15</td><td>25-30</td><td>40</td></tr><tr><td>SD 1.5 / CivitAI</td><td>15</td><td>25-30</td><td>50</td></tr><tr><td>Lightning/Turbo models</td><td>4</td><td>6-8</td><td>10</td></tr></table>` },
          { heading: "When to Use More Steps", content: `<ul><li><strong>Complex scenes</strong> with many elements — 30-40 steps</li><li><strong>Fine detail</strong> (jewelry, architecture, text) — 30+ steps</li><li><strong>Photorealistic faces</strong> — 25-35 steps for fewer artifacts</li></ul><p>For everything else, 25 steps is the sweet spot.</p>` },
          { heading: "Speed vs Quality Workflow", content: `<ol><li><strong>Explore phase:</strong> Use Flux Schnell (4 steps) or low steps (15) to test ideas quickly</li><li><strong>Refine phase:</strong> Increase to 25-30 steps on your best compositions</li><li><strong>Final render:</strong> 30-40 steps with your chosen model for the finished piece</li></ol>` },
        ],
      },
      ja: {
        title: "ステップ数の最適化：AI画像生成の速度と品質のバランス",
        description: "品質と速度の最適バランスを見つける。Flux、SDXL、SD 1.5のステップ数ガイド。",
        sections: [
          { heading: "ステップとは？", content: `<p>各「ステップ」はAIがノイズから画像を精製する1回のパス。多いほど精密だが、一定以上は効果が激減する。</p>` },
          { heading: "モデル別最適ステップ数", content: `<p>Flux Schnell: 4ステップ / Flux Dev: 25-28 / SDXL: 25-30 / SD 1.5: 25-30 / Lightning系: 6-8</p>` },
          { heading: "ワークフロー", content: `<ol><li><strong>探索フェーズ：</strong> Flux Schnell（4ステップ）でアイデアテスト</li><li><strong>精製フェーズ：</strong> 25-30ステップに増加</li><li><strong>最終出力：</strong> 30-40ステップで完成版</li></ol>` },
        ],
      },
      es: {
        title: "¿Cuántos Steps Necesitas? Optimizando la Generación de Imágenes IA",
        description: "Encuentra el equilibrio entre calidad y velocidad. Guía de steps para Flux, SDXL y SD 1.5.",
        sections: [
          { heading: "¿Qué Son los Steps?", content: `<p>Cada step es una pasada del AI refinando tu imagen. Más steps = más refinamiento, pero con rendimientos decrecientes.</p>` },
          { heading: "Steps Óptimos por Modelo", content: `<p>Flux Schnell: 4 / Flux Dev: 25-28 / SDXL: 25-30 / Lightning: 6-8</p>` },
        ],
      },
      zh: {
        title: "需要多少步？优化AI图像生成速度",
        description: "找到质量与速度的最佳平衡。各模型的步数指南。",
        sections: [
          { heading: "什么是步数？", content: `<p>每一步是AI从噪声中精炼图像的一次处理。步数越多越精细，但超过一定值后效果递减。</p>` },
          { heading: "各模型最优步数", content: `<p>Flux Schnell: 4 / Flux Dev: 25-28 / SDXL: 25-30 / Lightning: 6-8</p>` },
        ],
      },
      pt: {
        title: "Quantos Steps Você Precisa? Otimizando a Geração de Imagens IA",
        description: "Encontre o equilíbrio entre qualidade e velocidade.",
        sections: [
          { heading: "O Que São Steps?", content: `<p>Cada step é uma passagem do AI refinando sua imagem. Mais steps = mais refinamento, mas com retornos decrescentes.</p>` },
          { heading: "Steps por Modelo", content: `<p>Flux Schnell: 4 / Flux Dev: 25-28 / SDXL: 25-30 / Lightning: 6-8</p>` },
        ],
      },
    },
  },

  // ── Guide: Resolution & Aspect Ratio ──
  {
    slug: "ai-image-resolution-aspect-ratio-guide",
    category: "guide",
    tags: ["resolution", "aspect-ratio", "size", "4k", "quality"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "AI Image Resolution & Aspect Ratio: Complete Guide",
        description: "Choose the right resolution and aspect ratio for AI-generated images. Platform-specific sizes, upscaling tips, and common pitfalls.",
        sections: [
          { heading: "Why Resolution Matters", content: `<p>Resolution determines the level of detail in your image. Higher resolution = more detail, but also more generation time and cost. The key is matching resolution to your use case.</p>` },
          { heading: "Standard Resolutions by Model", content: `<table><tr><th>Model</th><th>Native</th><th>Best Range</th></tr><tr><td>Flux Dev/Pro</td><td>1024x1024</td><td>768-2048 per side</td></tr><tr><td>SDXL</td><td>1024x1024</td><td>768-1536 per side</td></tr><tr><td>SD 1.5</td><td>512x512</td><td>384-768 per side</td></tr></table><p><strong>Important:</strong> Going below native resolution produces blurry results. Going far above wastes time without quality gain (use upscaling instead).</p>` },
          { heading: "Common Aspect Ratios", content: `<ul><li><strong>1:1 (Square)</strong> — Instagram posts, profile pictures. 1024x1024.</li><li><strong>3:4 (Portrait)</strong> — Pinterest, portraits, character art. 768x1024.</li><li><strong>4:3 (Landscape)</strong> — Desktop wallpaper, presentations. 1024x768.</li><li><strong>16:9 (Widescreen)</strong> — YouTube thumbnails, cinematic. 1216x684.</li><li><strong>9:16 (Vertical)</strong> — TikTok, Instagram Stories/Reels. 576x1024.</li></ul>` },
          { heading: "The Upscaling Trick", content: `<p>Instead of generating at 2048x2048 (slow, expensive, often worse quality), generate at 1024x1024 and then <strong>upscale 2x or 4x</strong>. This is faster, cheaper, and often produces better results because the AI works best at its native resolution.</p><p>EGAKU AI has a built-in 4x upscaler (RealESRGAN) — one click to go from 1024px to 4096px.</p>` },
          { heading: "Common Pitfalls", content: `<ul><li><strong>Don't use odd numbers.</strong> Stick to multiples of 64 (e.g., 768, 832, 1024, 1216).</li><li><strong>Don't mix up width/height.</strong> 768x1024 is portrait, 1024x768 is landscape.</li><li><strong>Non-square ratios need model support.</strong> Flux handles any ratio well. Some SDXL/SD1.5 models are trained on specific ratios.</li></ul>` },
        ],
      },
      ja: {
        title: "AI画像の解像度とアスペクト比：完全ガイド",
        description: "AI生成画像に最適な解像度とアスペクト比の選び方。用途別サイズ、アップスケールのコツ。",
        sections: [
          { heading: "解像度が重要な理由", content: `<p>解像度は画像の詳細度を決定する。高解像度=より精細だが、生成時間とコストも増加。用途に合わせるのが鍵。</p>` },
          { heading: "モデル別標準解像度", content: `<p>Flux: 1024x1024（768-2048） / SDXL: 1024x1024（768-1536） / SD 1.5: 512x512（384-768）</p>` },
          { heading: "主なアスペクト比", content: `<ul><li><strong>1:1（正方形）:</strong> Instagram投稿。1024x1024</li><li><strong>3:4（縦長）:</strong> Pinterest、ポートレート。768x1024</li><li><strong>16:9（横長）:</strong> YouTube、シネマ。1216x684</li><li><strong>9:16（縦長）:</strong> TikTok、Stories。576x1024</li></ul>` },
          { heading: "アップスケールのコツ", content: `<p>2048x2048で生成するより、1024x1024で生成→4xアップスケールの方が速く、安く、高品質。EGAKU AIには4xアップスケーラー内蔵。</p>` },
        ],
      },
      es: {
        title: "Resolución y Relación de Aspecto en Imágenes IA: Guía Completa",
        description: "Elige la resolución y relación de aspecto correctas. Tamaños por plataforma y trucos de upscaling.",
        sections: [
          { heading: "Por Qué Importa la Resolución", content: `<p>La resolución determina el nivel de detalle. Mayor resolución = más detalle, pero más tiempo y costo.</p>` },
          { heading: "Relaciones de Aspecto Comunes", content: `<ul><li>1:1: Instagram (1024x1024)</li><li>9:16: TikTok (576x1024)</li><li>16:9: YouTube (1216x684)</li></ul>` },
          { heading: "Truco de Upscaling", content: `<p>Genera a 1024x1024, luego usa upscale 4x. Más rápido y mejor calidad que generar directamente a alta resolución.</p>` },
        ],
      },
      zh: {
        title: "AI图像分辨率与宽高比完全指南",
        description: "选择正确的分辨率和宽高比。各平台尺寸和放大技巧。",
        sections: [
          { heading: "为什么分辨率重要", content: `<p>分辨率决定图像细节程度。更高=更精细，但也更慢更贵。</p>` },
          { heading: "常见宽高比", content: `<ul><li>1:1: Instagram (1024x1024)</li><li>9:16: TikTok (576x1024)</li><li>16:9: YouTube (1216x684)</li></ul>` },
          { heading: "放大技巧", content: `<p>先生成1024x1024，再4倍放大。比直接生成高分辨率更快更好。</p>` },
        ],
      },
      pt: {
        title: "Resolução e Proporção em Imagens IA: Guia Completo",
        description: "Escolha a resolução e proporção certas. Tamanhos por plataforma e dicas de upscaling.",
        sections: [
          { heading: "Por Que a Resolução Importa", content: `<p>Resolução determina o nível de detalhe. Maior = mais detalhado, mas mais lento e caro.</p>` },
          { heading: "Proporções Comuns", content: `<ul><li>1:1: Instagram (1024x1024)</li><li>9:16: TikTok (576x1024)</li><li>16:9: YouTube (1216x684)</li></ul>` },
        ],
      },
    },
  },

  // ── Guide: Img2Img Practical ──
  {
    slug: "image-to-image-transform-photos-ai",
    category: "guide",
    tags: ["img2img", "transform", "photos", "denoise", "practical"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "Image-to-Image: Transform Any Photo with AI",
        description: "Master img2img to transform photos into art, fix compositions, and create variations. Denoise strength, best practices, and creative techniques.",
        sections: [
          { heading: "What is Image-to-Image?", content: `<p>Image-to-Image (img2img) takes an existing image and transforms it based on your prompt. Unlike text-to-image which creates from scratch, img2img uses your photo as a structural guide — preserving composition while changing style, details, or content.</p>` },
          { heading: "The Denoise Strength Secret", content: `<p>Denoise strength (0.0-1.0) is the most important setting in img2img. It controls how much the AI changes your image:</p><ul><li><strong>0.2-0.4:</strong> Subtle changes. Enhances details, adjusts colors. Good for: photo enhancement, minor fixes.</li><li><strong>0.5-0.6:</strong> Moderate transformation. Keeps structure, changes style. Good for: artistic filters, style transfer.</li><li><strong>0.7-0.8:</strong> Major transformation. Loosely follows the original. Good for: complete restyling, artistic reinterpretation.</li><li><strong>0.9-1.0:</strong> Almost a new image. Only vague composition preserved. Rarely useful.</li></ul><p><strong>Start at 0.5 and adjust.</strong> This is the most reliable starting point.</p>` },
          { heading: "5 Practical Use Cases", content: `<ol><li><strong>Photo → Painting:</strong> Upload a photo, set denoise 0.6, prompt "oil painting, thick brushstrokes, warm colors". Instant art.</li><li><strong>Sketch → Finished Art:</strong> Draw a rough sketch, set denoise 0.7, prompt your desired style. The AI fills in the details.</li><li><strong>Fix Bad Composition:</strong> Take a decent photo that needs tweaking. Low denoise (0.3) + specific prompt to fix issues.</li><li><strong>Seasonal Variants:</strong> Product photo → transform to winter/summer/holiday scene. Denoise 0.5-0.6.</li><li><strong>Style Consistency:</strong> Transform multiple photos with the same prompt to create a consistent series.</li></ol>` },
          { heading: "Common Mistakes", content: `<ul><li><strong>Denoise too high:</strong> The AI ignores your image entirely. Start low, increase gradually.</li><li><strong>Wrong resolution:</strong> Use the same aspect ratio as your input image.</li><li><strong>Vague prompts:</strong> Be specific about what you want to change, not just "make it better".</li></ul>` },
        ],
      },
      ja: {
        title: "Image-to-Image：写真をAIで自在に変換する方法",
        description: "img2imgで写真をアートに変換。Denoise強度の使い分け、実用テクニック。",
        sections: [
          { heading: "Image-to-Imageとは？", content: `<p>img2imgは既存画像をプロンプトに基づいて変換する技術。構図を保ちながらスタイルを変更できる。</p>` },
          { heading: "Denoise強度の秘訣", content: `<p>0.2-0.4: 微妙な変更（写真補正）/ 0.5-0.6: 中程度（スタイル変換）/ 0.7-0.8: 大幅変換（リスタイル）</p><p><strong>0.5から始めて調整</strong>が最も確実。</p>` },
          { heading: "5つの実用例", content: `<ol><li>写真→油絵（denoise 0.6）</li><li>スケッチ→完成イラスト（denoise 0.7）</li><li>構図修正（denoise 0.3）</li><li>季節バリエーション（denoise 0.5）</li><li>シリーズの統一感（同じプロンプトで複数変換）</li></ol>` },
        ],
      },
      es: {
        title: "Image-to-Image: Transforma Cualquier Foto con IA",
        description: "Domina img2img para transformar fotos en arte. Fuerza de denoise y técnicas creativas.",
        sections: [
          { heading: "¿Qué es Image-to-Image?", content: `<p>Img2img toma una imagen existente y la transforma según tu prompt, preservando la composición mientras cambia el estilo.</p>` },
          { heading: "El Secreto del Denoise", content: `<p>0.2-0.4: Cambios sutiles / 0.5-0.6: Transformación moderada / 0.7-0.8: Transformación mayor. <strong>Empieza en 0.5.</strong></p>` },
        ],
      },
      zh: {
        title: "图生图：用AI变换任何照片",
        description: "掌握img2img将照片变为艺术品。去噪强度使用技巧和创意方法。",
        sections: [
          { heading: "什么是图生图？", content: `<p>图生图将现有图像根据提示词进行变换，保留构图同时改变风格。</p>` },
          { heading: "去噪强度秘诀", content: `<p>0.2-0.4: 微调 / 0.5-0.6: 中度变换 / 0.7-0.8: 大幅变换。<strong>从0.5开始调整。</strong></p>` },
        ],
      },
      pt: {
        title: "Image-to-Image: Transforme Qualquer Foto com IA",
        description: "Domine img2img para transformar fotos em arte.",
        sections: [
          { heading: "O Que é Image-to-Image?", content: `<p>Img2img transforma uma imagem existente baseado no seu prompt, preservando composição enquanto muda o estilo.</p>` },
          { heading: "O Segredo do Denoise", content: `<p>0.2-0.4: Sutil / 0.5-0.6: Moderado / 0.7-0.8: Major. <strong>Comece em 0.5.</strong></p>` },
        ],
      },
    },
  },

  // ── News: AI Image Ethics & Privacy ──
  {
    slug: "ai-generated-images-ethics-privacy-2026",
    category: "news",
    tags: ["ethics", "privacy", "deepfake", "responsible-ai", "policy"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "AI-Generated Images: Ethics, Privacy & Responsible Use in 2026",
        description: "Navigate the ethical landscape of AI image generation. Deepfakes, consent, copyright, and how platforms are addressing these challenges.",
        sections: [
          { heading: "The Power and Responsibility", content: `<p>AI image generation is incredibly powerful. You can create photorealistic images of anything imaginable in seconds. But with this power comes serious ethical questions that every user and platform must address.</p>` },
          { heading: "The Clear Red Lines", content: `<p>Some uses of AI image generation are universally condemned and illegal:</p><ul><li><strong>Child Sexual Abuse Material (CSAM):</strong> AI-generated or not, creating sexual content involving minors is illegal everywhere. Period.</li><li><strong>Non-consensual intimate imagery:</strong> Using real people's faces to create sexual content without their explicit consent. This is a growing legal issue with deepfake technology.</li><li><strong>Fraud and impersonation:</strong> Using AI-generated images to impersonate someone for financial or reputational harm.</li></ul>` },
          { heading: "The Gray Areas", content: `<p>Many ethical questions don't have clear answers:</p><ul><li><strong>Artistic nudity:</strong> Where does art end and exploitation begin? Different cultures draw the line differently.</li><li><strong>Fan art of real people:</strong> Generating non-sexual images of celebrities or public figures. Legal in most places, but ethically complex.</li><li><strong>Style mimicry:</strong> Generating images "in the style of" a living artist. Copyright law is still catching up.</li><li><strong>Training data consent:</strong> Were the images used to train AI models uploaded with consent for this purpose?</li></ul>` },
          { heading: "What Responsible Platforms Do", content: `<ul><li><strong>Clear content policies</strong> that users agree to</li><li><strong>Age verification</strong> for adult content</li><li><strong>Report mechanisms</strong> for policy violations</li><li><strong>Regional compliance</strong> (different laws in different countries)</li><li><strong>CSAM detection</strong> and law enforcement cooperation</li><li><strong>Transparency</strong> about what's allowed and what isn't</li></ul>` },
          { heading: "Your Responsibility as a User", content: `<p>As an AI image generator user, you should:</p><ul><li>Never create content depicting real people in compromising situations without their consent</li><li>Respect copyright and intellectual property</li><li>Be aware of the laws in your jurisdiction</li><li>Consider the potential impact of the content you create</li><li>Use the tools creatively and constructively</li></ul><p>AI image generation is a tool. Like any tool, its value depends on how it's used.</p>` },
        ],
      },
      ja: {
        title: "AI生成画像の倫理とプライバシー：2026年の責任ある利用",
        description: "AI画像生成の倫理的課題。Deepfake、同意、著作権、プラットフォームの対応。",
        sections: [
          { heading: "力と責任", content: `<p>AI画像生成は極めて強力。数秒で想像するものを生成できる。しかし、全てのユーザーとプラットフォームが向き合うべき倫理的問いがある。</p>` },
          { heading: "明確な一線", content: `<ul><li><strong>CSAM：</strong> AI生成でも児童の性的コンテンツは世界中で違法</li><li><strong>非同意の親密画像：</strong> 実在人物の顔を同意なく使用</li><li><strong>詐欺・なりすまし：</strong> AI画像を悪用した金銭的・名誉的被害</li></ul>` },
          { heading: "グレーゾーン", content: `<p>芸術的ヌード、有名人のファンアート、スタイルの模倣、学習データの同意問題。文化や法律によって判断が分かれる。</p>` },
          { heading: "ユーザーの責任", content: `<ul><li>実在の人物を同意なく不利な状況に描かない</li><li>著作権と知的財産を尊重</li><li>自国の法律を認識</li><li>コンテンツの影響を考慮</li></ul>` },
        ],
      },
      es: {
        title: "Imágenes Generadas por IA: Ética, Privacidad y Uso Responsable en 2026",
        description: "Navega el panorama ético de la generación de imágenes IA. Deepfakes, consentimiento y derechos de autor.",
        sections: [
          { heading: "Las Líneas Rojas Claras", content: `<ul><li><strong>CSAM:</strong> Ilegal en todas partes</li><li><strong>Imágenes íntimas sin consentimiento</strong></li><li><strong>Fraude e suplantación</strong></li></ul>` },
          { heading: "Tu Responsabilidad", content: `<p>Nunca crees contenido de personas reales sin su consentimiento. Respeta los derechos de autor. Conoce las leyes de tu jurisdicción.</p>` },
        ],
      },
      zh: {
        title: "AI生成图像：2026年的伦理、隐私与负责任使用",
        description: "AI图像生成的伦理挑战。深度伪造、同意权、版权及平台应对措施。",
        sections: [
          { heading: "明确的红线", content: `<ul><li><strong>CSAM：</strong>全球违法</li><li><strong>未经同意的亲密图像</strong></li><li><strong>欺诈和冒充</strong></li></ul>` },
          { heading: "用户责任", content: `<p>不要未经同意创建真人的敏感内容。尊重版权。了解当地法律。</p>` },
        ],
      },
      pt: {
        title: "Imagens Geradas por IA: Ética, Privacidade e Uso Responsável em 2026",
        description: "Navegue o panorama ético da geração de imagens IA.",
        sections: [
          { heading: "As Linhas Vermelhas", content: `<ul><li><strong>CSAM:</strong> Ilegal em todo lugar</li><li><strong>Imagens íntimas sem consentimento</strong></li></ul>` },
          { heading: "Sua Responsabilidade", content: `<p>Nunca crie conteúdo de pessoas reais sem consentimento. Respeite direitos autorais.</p>` },
        ],
      },
    },
  },

  // ── Guide: Text in AI Images ──
  {
    slug: "how-to-generate-text-in-ai-images",
    category: "how-to",
    tags: ["text", "typography", "logos", "ideogram", "flux"],
    publishedAt: "2026-04-27",
    readingTime: 3,
    translations: {
      en: {
        title: "How to Generate Text in AI Images: Logos, Signs & Typography",
        description: "AI models often struggle with text. Learn which models handle text best and techniques for clean typography in AI-generated images.",
        sections: [
          { heading: "The Text Problem in AI", content: `<p>Most AI image generators struggle with text. You ask for "a coffee shop sign saying LUNA CAFE" and get something like "LUMA CAEF." This is because diffusion models don't understand language — they learn visual patterns, and text requires precise character-level understanding.</p>` },
          { heading: "Best Models for Text", content: `<ul><li><strong>Ideogram v3:</strong> Purpose-built for text rendering. The most reliable for clean, readable text in images. Best for: logos, signs, posters, business cards.</li><li><strong>GPT Image 2:</strong> OpenAI's model handles text reasonably well thanks to its multimodal training.</li><li><strong>Flux Pro:</strong> Better than SDXL at text but still not perfect. Works for short words (1-3 words).</li><li><strong>SDXL / SD 1.5:</strong> Poor text rendering. Avoid if text is important.</li></ul>` },
          { heading: "Tips for Better Text", content: `<ul><li><strong>Use quotes:</strong> Put the text in quotes in your prompt: <code>a neon sign saying "OPEN 24/7"</code></li><li><strong>Keep it short:</strong> 1-3 words work best. Longer text = more errors.</li><li><strong>Specify the font style:</strong> "bold sans-serif", "elegant script", "hand-lettered"</li><li><strong>Use Ideogram v3 for anything text-heavy</strong></li><li><strong>Post-process:</strong> Generate the image without text, then add text in Canva/Photoshop for perfect results.</li></ul>` },
        ],
      },
      ja: {
        title: "AI画像にテキストを入れる方法：ロゴ、看板、タイポグラフィ",
        description: "AIモデルはテキストが苦手。どのモデルが最適か、きれいな文字を出すテクニック。",
        sections: [
          { heading: "AIとテキストの問題", content: `<p>ほとんどのAI画像生成はテキストが苦手。「LUNA CAFE」と指定しても「LUMA CAEF」になりがち。拡散モデルは言語を理解せず、視覚パターンを学習するため。</p>` },
          { heading: "テキストに強いモデル", content: `<ul><li><strong>Ideogram v3：</strong> テキスト描画専用。最も信頼性高い</li><li><strong>GPT Image 2：</strong> マルチモーダル学習により文字が比較的正確</li><li><strong>Flux Pro：</strong> SDXLより良いが完璧ではない。1-3語程度</li></ul>` },
          { heading: "コツ", content: `<ul><li>テキストをクォートで囲む：<code>"OPEN 24/7"</code></li><li>短く（1-3語）</li><li>フォントスタイルを指定</li><li>テキスト重視ならIdeogram v3を使う</li><li>または画像生成後にCanvaでテキスト追加</li></ul>` },
        ],
      },
      es: {
        title: "Cómo Generar Texto en Imágenes IA: Logos, Letreros y Tipografía",
        description: "Los modelos IA luchan con el texto. Aprende cuáles lo manejan mejor y técnicas para tipografía limpia.",
        sections: [
          { heading: "Mejores Modelos para Texto", content: `<p><strong>Ideogram v3:</strong> El más fiable. <strong>GPT Image 2:</strong> Razonablemente bueno. <strong>Flux Pro:</strong> OK para 1-3 palabras.</p>` },
          { heading: "Consejos", content: `<ul><li>Usa comillas en el prompt</li><li>Mantén el texto corto (1-3 palabras)</li><li>Para texto perfecto: genera imagen sin texto, añade en Canva</li></ul>` },
        ],
      },
      zh: {
        title: "如何在AI图像中生成文字：Logo、标牌和排版",
        description: "AI模型通常难以处理文字。了解哪些模型最适合以及获得清晰排版的技巧。",
        sections: [
          { heading: "最佳文字模型", content: `<p><strong>Ideogram v3：</strong>最可靠。<strong>GPT Image 2：</strong>较好。<strong>Flux Pro：</strong>短文字可以。</p>` },
          { heading: "技巧", content: `<ul><li>提示词中用引号包裹文字</li><li>保持简短（1-3个词）</li><li>完美文字：先生成图像，再用Canva添加文字</li></ul>` },
        ],
      },
      pt: {
        title: "Como Gerar Texto em Imagens IA: Logos, Placas e Tipografia",
        description: "Modelos IA lutam com texto. Aprenda quais são melhores e técnicas para tipografia limpa.",
        sections: [
          { heading: "Melhores Modelos para Texto", content: `<p><strong>Ideogram v3:</strong> Mais confiável. <strong>GPT Image 2:</strong> Razoável. <strong>Flux Pro:</strong> OK para 1-3 palavras.</p>` },
          { heading: "Dicas", content: `<ul><li>Use aspas no prompt</li><li>Mantenha curto (1-3 palavras)</li></ul>` },
        ],
      },
    },
  },

  // ── Guide: AI Video for Business ──
  {
    slug: "ai-video-generation-business-use-cases",
    category: "guide",
    tags: ["video", "business", "marketing", "ecommerce", "ads"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "AI Video for Business: Practical Use Cases & ROI",
        description: "How businesses are using AI video generation for marketing, e-commerce, and content creation. Real use cases with practical advice.",
        sections: [
          { heading: "Why AI Video Matters for Business", content: `<p>Video content gets 2x more engagement than static images on social media. But producing video traditionally is expensive ($1,000-$10,000+ per minute of finished content). AI video generation changes the economics entirely — producing quality video content for cents instead of thousands.</p>` },
          { heading: "5 High-ROI Business Use Cases", content: `<ol><li><strong>Product Demos:</strong> Turn product photos into dynamic videos. A spinning shoe, a pouring coffee, a dress flowing in wind. Use Image-to-Video with Kling 3.0 for cinematic quality.</li><li><strong>Social Media Ads:</strong> Generate 10 ad variations in minutes instead of days. Test different styles, angles, and moods. A/B test at scale.</li><li><strong>Email Marketing:</strong> Static emails get 20% open rates. Add a short AI-generated video preview and watch engagement spike.</li><li><strong>Website Hero Videos:</strong> That auto-playing background video on your landing page? Generate it in seconds instead of hiring a videographer.</li><li><strong>Training & Education:</strong> Visualize concepts that are hard to film. Medical procedures, architectural walkthroughs, historical recreations.</li></ol>` },
          { heading: "Cost Comparison", content: `<table><tr><th>Method</th><th>Cost per Video</th><th>Time</th></tr><tr><td>Traditional Production</td><td>$1,000-10,000</td><td>1-4 weeks</td></tr><tr><td>Freelance Editor</td><td>$200-1,000</td><td>3-7 days</td></tr><tr><td>AI Generation</td><td>$0.30-1.00</td><td>2-5 minutes</td></tr></table>` },
          { heading: "Getting Started", content: `<ol><li>Start with <strong>Image-to-Video</strong> — it's the most reliable. Upload a product photo, add a motion prompt.</li><li>Use <strong>free models first</strong> (Wan 2.6, LTX) to prototype, then upgrade to Kling 3.0 for final versions.</li><li>Keep videos <strong>5-10 seconds</strong> — this is the sweet spot for social media and ads.</li><li>Add text and branding in a video editor (CapCut is free) after generating.</li></ol>` },
        ],
      },
      ja: {
        title: "ビジネスのためのAI動画：実用的な活用法とROI",
        description: "企業がマーケティング、EC、コンテンツ制作にAI動画生成をどう活用しているか。",
        sections: [
          { heading: "なぜAI動画がビジネスに重要か", content: `<p>動画コンテンツは静止画の2倍のエンゲージメント。従来の動画制作は1分あたり10万-100万円以上。AI動画なら数十円で同等品質。</p>` },
          { heading: "5つの高ROI活用法", content: `<ol><li><strong>商品デモ：</strong> 商品写真→動画化（回転、注ぐ、風になびく等）</li><li><strong>SNS広告：</strong> 数分で10バリエーション。A/Bテストが容易に</li><li><strong>メールマーケティング：</strong> 動画プレビュー追加でエンゲージメント向上</li><li><strong>Webサイト背景動画：</strong> ランディングページの自動再生動画を数秒で</li><li><strong>教育・研修：</strong> 撮影困難なコンセプトを視覚化</li></ol>` },
          { heading: "始め方", content: `<ol><li>Image-to-Videoから始める（最も安定）</li><li>無料モデル（Wan 2.6）でプロトタイプ→Kling 3.0で仕上げ</li><li>5-10秒が最適（SNS・広告向け）</li></ol>` },
        ],
      },
      es: {
        title: "Video IA para Negocios: Casos de Uso Prácticos y ROI",
        description: "Cómo las empresas usan la generación de video IA para marketing y e-commerce.",
        sections: [
          { heading: "5 Casos de Uso de Alto ROI", content: `<ol><li>Demos de producto</li><li>Anuncios en redes sociales</li><li>Email marketing</li><li>Videos hero para web</li><li>Capacitación</li></ol>` },
          { heading: "Cómo Empezar", content: `<p>Empieza con Image-to-Video. Usa modelos gratis para prototipar, Kling 3.0 para versiones finales. Mantén 5-10 segundos.</p>` },
        ],
      },
      zh: {
        title: "商业AI视频：实用案例与投资回报",
        description: "企业如何将AI视频生成用于营销、电商和内容创作。",
        sections: [
          { heading: "5个高回报应用场景", content: `<ol><li>产品演示视频</li><li>社交媒体广告（分钟级制作10个变体）</li><li>邮件营销视频预览</li><li>网站首页背景视频</li><li>培训教育可视化</li></ol>` },
          { heading: "开始使用", content: `<p>从图生视频开始。免费模型原型制作，Kling 3.0做最终版本。5-10秒最佳。</p>` },
        ],
      },
      pt: {
        title: "Vídeo IA para Negócios: Casos de Uso Práticos e ROI",
        description: "Como empresas usam geração de vídeo IA para marketing e e-commerce.",
        sections: [
          { heading: "5 Casos de Alto ROI", content: `<ol><li>Demos de produto</li><li>Anúncios sociais</li><li>Email marketing</li><li>Vídeos hero para web</li><li>Treinamento</li></ol>` },
          { heading: "Como Começar", content: `<p>Comece com Image-to-Video. Use modelos grátis para prototipar. Mantenha 5-10 segundos.</p>` },
        ],
      },
    },
  },

  // ── Guide: CivitAI Ecosystem ──
  {
    slug: "civitai-ecosystem-explained",
    category: "guide",
    tags: ["civitai", "community", "models", "ecosystem", "lora", "checkpoint"],
    publishedAt: "2026-04-27",
    readingTime: 5,
    translations: {
      en: {
        title: "The CivitAI Ecosystem: 100,000+ AI Models Explained",
        description: "Understanding CivitAI's community of AI models. Checkpoints, LoRAs, embeddings — what they are, how to find good ones, and how to use them.",
        sections: [
          { heading: "What is CivitAI?", content: `<p>CivitAI is the world's largest open-source AI model community. Think of it as the "GitHub for AI art models." Over 100,000 models are shared by creators worldwide — each trained for specific styles, characters, or capabilities.</p><p>These models work with Stable Diffusion, SDXL, and increasingly with Flux — the engines that power most AI image generation.</p>` },
          { heading: "Types of Models", content: `<ul><li><strong>Checkpoints (2-7 GB):</strong> Complete base models. Replace the entire AI engine. Examples: RealVisXL (photorealistic), Pony Diffusion (anime), DreamShaper (versatile). Use when: you want a fundamentally different style.</li><li><strong>LoRAs (10-300 MB):</strong> Small add-ons that modify a base model. Like adding a specialty lens to a camera. Examples: specific art styles, character consistency, detail enhancement. Use when: you want to fine-tune an existing model.</li><li><strong>Embeddings (10-100 KB):</strong> Tiny files that teach the AI new concepts via a trigger word. Use when: you want to add a specific concept without changing the model.</li><li><strong>VAEs:</strong> Affect color processing. Most users never need to touch these.</li></ul>` },
          { heading: "How to Find Good Models", content: `<ul><li><strong>Sort by downloads:</strong> Popular models are popular for a reason.</li><li><strong>Check the preview images:</strong> They show what the model actually produces.</li><li><strong>Read the description:</strong> Good model pages explain recommended settings (steps, CFG, sampler).</li><li><strong>Check the base model:</strong> Make sure it's compatible (SD 1.5, SDXL, or Flux).</li><li><strong>Look at community reviews:</strong> Comments and ratings from other users.</li></ul>` },
          { heading: "Using CivitAI Models on EGAKU AI", content: `<p>You don't need to download anything. EGAKU AI integrates CivitAI directly:</p><ol><li>Open the <strong>CivitAI Browser</strong> on the Generate or Adult page</li><li>Search by keyword, filter by type (Checkpoint/LoRA)</li><li>Click <strong>Use Now</strong> to generate instantly</li><li>Or <strong>Save</strong> to your model library for future use</li></ol><p>Over 100,000 models are available — from photorealistic to anime, from landscapes to portraits.</p>` },
          { heading: "The Community Effect", content: `<p>CivitAI's real power is its community. Model creators constantly improve and release new models. When a new technique is discovered, the community adapts within days. This means EGAKU AI users always have access to the cutting edge — without waiting for corporate AI labs to release updates.</p>` },
        ],
      },
      ja: {
        title: "CivitAIエコシステム解説：10万+AIモデルの世界",
        description: "CivitAIのAIモデルコミュニティを理解する。チェックポイント、LoRA、エンベディングの使い分け。",
        sections: [
          { heading: "CivitAIとは？", content: `<p>CivitAIは世界最大のオープンソースAIモデルコミュニティ。「AIアートモデルのGitHub」。10万以上のモデルがクリエイターによって共有されている。</p>` },
          { heading: "モデルの種類", content: `<ul><li><strong>Checkpoint（2-7GB）：</strong> 完全なベースモデル。根本的にスタイルを変えたい時に</li><li><strong>LoRA（10-300MB）：</strong> ベースモデルの微調整用アドオン。特定スタイルやキャラクター用</li><li><strong>Embedding（10-100KB）：</strong> 特定の概念をトリガーワードで追加</li></ul>` },
          { heading: "良いモデルの見つけ方", content: `<ul><li>ダウンロード数でソート</li><li>プレビュー画像を確認</li><li>説明文を読む（推奨設定）</li><li>ベースモデルの互換性を確認</li><li>コミュニティレビューを参照</li></ul>` },
          { heading: "EGAKU AIでの使い方", content: `<p>ダウンロード不要。CivitAIブラウザで検索→Use Nowで即生成。10万+モデルが利用可能。</p>` },
        ],
      },
      es: {
        title: "El Ecosistema CivitAI: 100,000+ Modelos IA Explicados",
        description: "Entendiendo la comunidad de modelos IA de CivitAI. Checkpoints, LoRAs y cómo encontrar buenos modelos.",
        sections: [
          { heading: "¿Qué es CivitAI?", content: `<p>La comunidad más grande de modelos IA de código abierto. Como "GitHub para modelos de arte IA". Más de 100,000 modelos compartidos.</p>` },
          { heading: "Tipos de Modelos", content: `<ul><li><strong>Checkpoints:</strong> Modelos base completos (2-7GB)</li><li><strong>LoRAs:</strong> Add-ons pequeños para estilos específicos (10-300MB)</li><li><strong>Embeddings:</strong> Conceptos en trigger words (10-100KB)</li></ul>` },
          { heading: "En EGAKU AI", content: `<p>Sin descarga. Busca en el navegador CivitAI → Use Now para generar al instante.</p>` },
        ],
      },
      zh: {
        title: "CivitAI生态系统：10万+AI模型详解",
        description: "了解CivitAI的AI模型社区。检查点、LoRA、嵌入——它们是什么以及如何使用。",
        sections: [
          { heading: "什么是CivitAI？", content: `<p>世界最大的开源AI模型社区，超过10万个模型由创作者共享。</p>` },
          { heading: "模型类型", content: `<ul><li><strong>Checkpoint（2-7GB）：</strong>完整基础模型</li><li><strong>LoRA（10-300MB）：</strong>小型微调附加文件</li><li><strong>Embedding（10-100KB）：</strong>触发词概念</li></ul>` },
          { heading: "在EGAKU AI中使用", content: `<p>无需下载。在CivitAI浏览器中搜索→点击Use Now即时生成。</p>` },
        ],
      },
      pt: {
        title: "O Ecossistema CivitAI: 100,000+ Modelos IA Explicados",
        description: "Entendendo a comunidade de modelos IA do CivitAI.",
        sections: [
          { heading: "O Que é CivitAI?", content: `<p>A maior comunidade de modelos IA de código aberto do mundo. Mais de 100,000 modelos compartilhados.</p>` },
          { heading: "Tipos de Modelos", content: `<ul><li><strong>Checkpoints:</strong> Modelos base (2-7GB)</li><li><strong>LoRAs:</strong> Add-ons de estilo (10-300MB)</li></ul>` },
          { heading: "No EGAKU AI", content: `<p>Sem download. Navegador CivitAI → Use Now para gerar instantaneamente.</p>` },
        ],
      },
    },
  },

  // ── Guide: Inpainting ──
  {
    slug: "inpainting-guide-edit-parts-of-ai-images",
    category: "how-to",
    tags: ["inpainting", "editing", "mask", "fix", "repair"],
    publishedAt: "2026-04-27",
    readingTime: 4,
    translations: {
      en: {
        title: "Inpainting Guide: Edit Specific Parts of AI Images",
        description: "Learn to use inpainting to fix hands, change faces, replace objects, and edit specific regions of AI-generated images.",
        sections: [
          { heading: "What is Inpainting?", content: `<p>Inpainting lets you select a specific area of an image and regenerate just that part. The rest of the image stays untouched. It's like using an eraser and then having the AI fill in what you erased.</p><p>This is the most powerful editing tool in AI image generation — and the one most people overlook.</p>` },
          { heading: "Common Use Cases", content: `<ul><li><strong>Fix bad hands:</strong> The #1 problem in AI images. Mask the hands, prompt "detailed realistic hands, correct anatomy".</li><li><strong>Change facial expression:</strong> Mask the face, prompt "smiling face" or "serious expression".</li><li><strong>Replace objects:</strong> Mask an object, prompt what you want instead. "Replace the cat with a dog."</li><li><strong>Fix artifacts:</strong> Any weird distortion or anomaly — mask it, describe what should be there.</li><li><strong>Add elements:</strong> Mask an empty area, prompt what you want to add. "A butterfly on the flower."</li></ul>` },
          { heading: "How to Inpaint Well", content: `<ul><li><strong>Mask slightly larger than the problem area.</strong> Give the AI context around the edges for seamless blending.</li><li><strong>Be specific in your prompt.</strong> Don't just prompt "fix this." Describe exactly what should appear in the masked area.</li><li><strong>Use appropriate denoise.</strong> 0.6-0.8 works best for most inpainting. Lower = keeps more of the original, higher = more freedom for the AI.</li><li><strong>Match the style.</strong> If the image is anime, prompt in anime style. If photorealistic, use photorealistic language.</li></ul>` },
          { heading: "Step by Step", content: `<ol><li>Go to the <strong>Inpaint</strong> tab on the Generate page</li><li>Upload your image</li><li>Paint a mask over the area you want to change (white = change, black = keep)</li><li>Write a prompt describing what should appear in the masked area</li><li>Set denoise to 0.7 (adjust as needed)</li><li>Generate!</li></ol>` },
        ],
      },
      ja: {
        title: "Inpaintingガイド：AI画像の特定部分を編集する",
        description: "Inpaintingで手の修正、顔の変更、オブジェクト置換。AI画像の部分編集テクニック。",
        sections: [
          { heading: "Inpaintingとは？", content: `<p>画像の特定領域を選択して、その部分だけを再生成する技術。残りはそのまま。消しゴムで消して、AIが埋めるイメージ。</p>` },
          { heading: "主な用途", content: `<ul><li><strong>手の修正：</strong> AI画像の最大の問題。手をマスク→「正確な解剖学の手」</li><li><strong>表情変更：</strong> 顔をマスク→「笑顔」「真剣な表情」</li><li><strong>オブジェクト置換：</strong> 物体をマスク→別のものに</li><li><strong>アーティファクト修正：</strong> 歪みをマスク→正しい描写に</li></ul>` },
          { heading: "コツ", content: `<ul><li>問題領域より少し大きめにマスク</li><li>プロンプトは具体的に</li><li>denoise 0.6-0.8が最適</li><li>元画像のスタイルに合わせる</li></ul>` },
        ],
      },
      es: {
        title: "Guía de Inpainting: Edita Partes Específicas de Imágenes IA",
        description: "Aprende a usar inpainting para arreglar manos, cambiar caras y reemplazar objetos.",
        sections: [
          { heading: "¿Qué es Inpainting?", content: `<p>Selecciona un área específica y regenera solo esa parte. El resto queda intacto.</p>` },
          { heading: "Usos Comunes", content: `<ul><li>Arreglar manos (problema #1)</li><li>Cambiar expresiones faciales</li><li>Reemplazar objetos</li><li>Corregir artefactos</li></ul>` },
          { heading: "Consejos", content: `<p>Máscara ligeramente más grande que el área. Prompt específico. Denoise 0.6-0.8.</p>` },
        ],
      },
      zh: {
        title: "Inpainting指南：编辑AI图像的特定部分",
        description: "学习使用inpainting修复手部、改变面部、替换物体等。",
        sections: [
          { heading: "什么是Inpainting？", content: `<p>选择图像的特定区域，只重新生成该部分。其余保持不变。</p>` },
          { heading: "常见用途", content: `<ul><li>修复手部（AI图像最大问题）</li><li>改变面部表情</li><li>替换物体</li><li>修复伪影</li></ul>` },
          { heading: "技巧", content: `<p>遮罩比问题区域稍大。提示词要具体。去噪0.6-0.8最佳。</p>` },
        ],
      },
      pt: {
        title: "Guia de Inpainting: Edite Partes Específicas de Imagens IA",
        description: "Aprenda a usar inpainting para corrigir mãos, mudar rostos e substituir objetos.",
        sections: [
          { heading: "O Que é Inpainting?", content: `<p>Selecione uma área específica e regenere apenas essa parte.</p>` },
          { heading: "Usos Comuns", content: `<ul><li>Corrigir mãos</li><li>Mudar expressões</li><li>Substituir objetos</li></ul>` },
        ],
      },
    },
  },

  // ── How-to: Veo 3 Video with Audio ──
  {
    slug: "veo-3-video-with-audio-guide",
    category: "how-to",
    tags: ["veo3", "video", "audio", "google", "beginner"],
    publishedAt: "2026-04-28",
    readingTime: 4,
    translations: {
      en: {
        title: "How to Create Videos with Audio Using Veo 3",
        description: "Step-by-step guide to generating videos with native audio using Google's Veo 3 on EGAKU AI. No editing software needed.",
        sections: [
          { heading: "What is Veo 3?", content: `<p>Veo 3 is Google's latest video generation model. What sets it apart: it generates <strong>native audio</strong> alongside video. Rain sounds with rain scenes, music with dance scenes, dialogue with character scenes. No post-production audio editing needed.</p>` },
          { heading: "Getting Started", content: `<p>On EGAKU AI:</p><ol><li>Go to <strong>Generate</strong> page</li><li>Switch to <strong>Text-to-Video</strong> tab</li><li>Select <strong>Veo 3 (Google)</strong> from the model dropdown</li><li>Write your prompt describing both visuals and sounds</li><li>Click Generate (costs 40 credits)</li></ol><p>Generation takes 1-3 minutes. The result includes both video and audio.</p>` },
          { heading: "Prompt Tips for Audio", content: `<p>Veo 3 responds to audio cues in your prompt:</p><ul><li><code>rain falling on cobblestones, sound of distant thunder</code></li><li><code>musician playing acoustic guitar, warm cafe ambience</code></li><li><code>waves crashing on beach, seagulls calling</code></li><li><code>busy Tokyo street, car horns and chatter</code></li></ul><p>Be specific about the sounds you want. The model understands audio descriptions naturally.</p>` },
          { heading: "Best Use Cases", content: `<ul><li><strong>Ambient scenes:</strong> Nature, weather, cityscapes with matching soundscapes</li><li><strong>Music videos:</strong> Describe instruments and genres</li><li><strong>Social media content:</strong> Short clips with built-in audio for TikTok/Reels</li><li><strong>Presentations:</strong> Background videos with ambient sound</li></ul>` },
          { heading: "Veo 3 vs Other Video Models", content: `<table style="width:100%;border-collapse:collapse;"><tr style="border-bottom:1px solid #333;"><th style="text-align:left;padding:8px;">Feature</th><th>Veo 3</th><th>Kling 3.0</th><th>Sora 2</th></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Audio</td><td>Native</td><td>No</td><td>No</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Max Resolution</td><td>720p</td><td>4K</td><td>1080p</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Duration</td><td>4-8s</td><td>5-10s</td><td>4-20s</td></tr><tr><td style="padding:8px;">Credits</td><td>40</td><td>40</td><td>50</td></tr></table>` },
        ],
      },
      ja: {
        title: "Veo 3で音声付き動画を作る方法",
        description: "GoogleのVeo 3を使って音声付き動画を生成するガイド。EGAKU AIで編集ソフト不要で動画制作。",
        sections: [
          { heading: "Veo 3とは？", content: `<p>Veo 3はGoogleの最新動画生成モデルです。最大の特徴は<strong>ネイティブ音声生成</strong>。雨のシーンには雨音、カフェのシーンにはBGM、街のシーンには環境音が自動で付きます。後から音声を編集する必要がありません。</p>` },
          { heading: "使い方", content: `<ol><li><strong>Generate</strong>ページへ</li><li><strong>Text-to-Video</strong>タブに切り替え</li><li>モデルで<strong>Veo 3 (Google)</strong>を選択</li><li>映像と音声の両方をプロンプトで記述</li><li>生成（40クレジット）</li></ol><p>1〜3分で音声付き動画が完成します。</p>` },
          { heading: "音声を意識したプロンプト", content: `<p>音の描写をプロンプトに含めると効果的：</p><ul><li><code>雨が石畳に降り注ぐ、遠くの雷鳴</code></li><li><code>ギタリストがカフェで演奏、暖かい雰囲気</code></li><li><code>波が砂浜に打ち寄せる、カモメの鳴き声</code></li></ul>` },
          { heading: "活用シーン", content: `<ul><li><strong>環境映像：</strong>自然、天候、都市の風景+サウンドスケープ</li><li><strong>SNSコンテンツ：</strong>TikTok/Reels用の音声付きショートクリップ</li><li><strong>プレゼン素材：</strong>BGM付き背景動画</li></ul>` },
        ],
      },
      es: {
        title: "Como crear videos con audio usando Veo 3",
        description: "Guia paso a paso para generar videos con audio nativo usando Veo 3 de Google en EGAKU AI.",
        sections: [
          { heading: "Que es Veo 3?", content: `<p>Veo 3 es el modelo de video mas reciente de Google. Genera <strong>audio nativo</strong> junto con el video automaticamente.</p>` },
          { heading: "Como empezar", content: `<ol><li>Ve a la pagina <strong>Generate</strong></li><li>Cambia a <strong>Text-to-Video</strong></li><li>Selecciona <strong>Veo 3 (Google)</strong></li><li>Escribe tu prompt describiendo tanto visuales como sonidos</li></ol>` },
        ],
      },
      zh: {
        title: "如何使用Veo 3创建带音频的视频",
        description: "使用Google Veo 3在EGAKU AI上生成带原生音频的视频的完整指南。",
        sections: [
          { heading: "什么是Veo 3?", content: `<p>Veo 3是Google最新的视频生成模型，最大特点是<strong>原生音频生成</strong>。无需后期编辑音频。</p>` },
          { heading: "如何开始", content: `<ol><li>进入<strong>Generate</strong>页面</li><li>切换到<strong>Text-to-Video</strong></li><li>选择<strong>Veo 3 (Google)</strong></li><li>在提示词中描述画面和声音</li></ol>` },
        ],
      },
      pt: {
        title: "Como criar videos com audio usando Veo 3",
        description: "Guia passo a passo para gerar videos com audio nativo usando Veo 3 do Google no EGAKU AI.",
        sections: [
          { heading: "O que e Veo 3?", content: `<p>Veo 3 e o modelo de video mais recente do Google. Gera <strong>audio nativo</strong> junto com o video automaticamente.</p>` },
          { heading: "Como comecar", content: `<ol><li>Va para a pagina <strong>Generate</strong></li><li>Mude para <strong>Text-to-Video</strong></li><li>Selecione <strong>Veo 3 (Google)</strong></li><li>Escreva seu prompt descrevendo tanto visuais quanto sons</li></ol>` },
        ],
      },
    },
  },

  // ── How-to: Grok Imagine ──
  {
    slug: "grok-imagine-xai-image-video-guide",
    category: "how-to",
    tags: ["grok", "xai", "image", "video", "beginner"],
    publishedAt: "2026-04-28",
    readingTime: 4,
    translations: {
      en: {
        title: "Grok Imagine: xAI's Image and Video Model on EGAKU AI",
        description: "How to use Grok Imagine for photorealistic images and videos with audio. xAI's Aurora model guide.",
        sections: [
          { heading: "What is Grok Imagine?", content: `<p>Grok Imagine is xAI's (Elon Musk's AI company) image and video generation model. It uses the Aurora architecture and excels at photorealistic images, precise text rendering, and logo generation. The video model also generates native audio.</p>` },
          { heading: "Image Generation", content: `<p>Select <strong>Grok Imagine (xAI)</strong> in the model dropdown on the Generate page.</p><p>Strengths:</p><ul><li>Photorealistic portraits and scenes</li><li>Accurate text in images (signs, logos, labels)</li><li>Clean composition and lighting</li><li>8 credits per image (Lite plan+)</li></ul>` },
          { heading: "Video Generation", content: `<p>Select <strong>Grok Imagine Video</strong> in Text-to-Video mode.</p><p>Features:</p><ul><li>720p output with native audio</li><li>Natural motion and physics</li><li>30 credits per video (Basic plan+)</li><li>Fast generation (under 30 seconds)</li></ul>` },
          { heading: "Best Prompts for Grok", content: `<p>Grok responds well to descriptive, natural language:</p><ul><li><code>A professional headshot of a confident woman in a modern office, natural lighting, sharp focus</code></li><li><code>Neon sign reading "OPEN 24H" on a rainy Tokyo street at night</code></li><li><code>Product photography of a luxury perfume bottle on black marble</code></li></ul>` },
        ],
      },
      ja: {
        title: "Grok Imagine: xAIの画像・動画モデルガイド",
        description: "Grok Imagineでフォトリアルな画像と音声付き動画を生成する方法。xAI Auroraモデルの使い方。",
        sections: [
          { heading: "Grok Imagineとは？", content: `<p>Grok ImagineはxAI（イーロン・マスクのAI企業）の画像・動画生成モデルです。Auroraアーキテクチャを採用し、フォトリアルな画像、正確なテキスト描画、ロゴ生成に強みがあります。</p>` },
          { heading: "画像生成", content: `<p>Generateページで<strong>Grok Imagine (xAI)</strong>を選択。</p><ul><li>フォトリアルなポートレートや風景が得意</li><li>画像内テキストが正確（看板、ロゴ、ラベル）</li><li>8クレジット/枚（Liteプラン以上）</li></ul>` },
          { heading: "動画生成", content: `<p>Text-to-Videoで<strong>Grok Imagine Video</strong>を選択。</p><ul><li>720p + ネイティブ音声付き</li><li>30クレジット/本（Basicプラン以上）</li><li>高速生成（30秒以内）</li></ul>` },
        ],
      },
      es: {
        title: "Grok Imagine: Modelo de imagen y video de xAI",
        description: "Como usar Grok Imagine para imagenes fotorrealistas y videos con audio en EGAKU AI.",
        sections: [
          { heading: "Que es Grok Imagine?", content: `<p>Grok Imagine es el modelo de generacion de imagenes y video de xAI. Destaca en imagenes fotorrealistas y renderizado preciso de texto.</p>` },
          { heading: "Generacion de imagenes", content: `<p>Selecciona <strong>Grok Imagine (xAI)</strong> en la pagina Generate. 8 creditos por imagen.</p>` },
        ],
      },
      zh: {
        title: "Grok Imagine: xAI图像和视频模型指南",
        description: "如何使用Grok Imagine生成照片级图像和带音频的视频。",
        sections: [
          { heading: "什么是Grok Imagine?", content: `<p>Grok Imagine是xAI的图像和视频生成模型，擅长照片级图像、精确文本渲染和标志生成。</p>` },
          { heading: "图像生成", content: `<p>在Generate页面选择<strong>Grok Imagine (xAI)</strong>。每张8积分。</p>` },
        ],
      },
      pt: {
        title: "Grok Imagine: Modelo de imagem e video da xAI",
        description: "Como usar Grok Imagine para imagens fotorrealistas e videos com audio no EGAKU AI.",
        sections: [
          { heading: "O que e Grok Imagine?", content: `<p>Grok Imagine e o modelo de geracao de imagens e video da xAI. Destaca-se em imagens fotorrealistas e renderizacao precisa de texto.</p>` },
          { heading: "Geracao de imagens", content: `<p>Selecione <strong>Grok Imagine (xAI)</strong> na pagina Generate. 8 creditos por imagem.</p>` },
        ],
      },
    },
  },

  // ── How-to: Face Swap ──
  {
    slug: "face-swap-guide-swap-faces-ai",
    category: "how-to",
    tags: ["face-swap", "portrait", "fun", "beginner"],
    publishedAt: "2026-04-28",
    readingTime: 3,
    translations: {
      en: {
        title: "How to Use AI Face Swap: Put Your Face on Any Image",
        description: "Step-by-step guide to swapping faces in AI-generated images. Fun, creative, and ethical face swap with EGAKU AI.",
        sections: [
          { heading: "What is Face Swap?", content: `<p>Face Swap lets you take a face from one image and place it onto another. Generate a stunning AI portrait, then swap in your own face (or a friend's) to create personalized artwork. EGAKU AI uses advanced face detection to ensure natural-looking results.</p><p><strong>Note:</strong> Real-person deepfakes and non-consensual content are strictly prohibited.</p>` },
          { heading: "How to Use It", content: `<ol><li>Go to the <strong>Generate</strong> page</li><li>Create a base image with the pose/scene you want</li><li>Click <strong>Face Swap</strong> in the tools</li><li>Upload the source face photo</li><li>Select the target image</li><li>Click Swap (3 credits)</li></ol>` },
          { heading: "Tips for Best Results", content: `<ul><li>Use a clear, front-facing photo for the source face</li><li>Good lighting on the source face helps a lot</li><li>The face angle in the target should roughly match the source</li><li>Works best with photorealistic base images</li></ul>` },
          { heading: "Creative Ideas", content: `<ul><li>Put yourself in a movie poster or album cover</li><li>Create personalized birthday cards</li><li>Try different hairstyles or looks before committing</li><li>Make fun profile pictures with AI backgrounds</li></ul>` },
        ],
      },
      ja: {
        title: "AI Face Swapの使い方：顔を入れ替えてオリジナル画像を作る",
        description: "AI生成画像で顔を入れ替える方法。EGAKU AIで楽しく創造的なFace Swap。",
        sections: [
          { heading: "Face Swapとは？", content: `<p>Face Swapは、ある画像の顔を別の画像に合成する機能です。AIで生成したポートレートに自分の顔を入れて、パーソナライズされたアート作品を作れます。</p><p><strong>注意：</strong>実在人物のディープフェイクや同意のないコンテンツは厳禁です。</p>` },
          { heading: "使い方", content: `<ol><li><strong>Generate</strong>ページでベース画像を作成</li><li><strong>Face Swap</strong>ツールをクリック</li><li>顔写真をアップロード</li><li>ターゲット画像を選択</li><li>Swap実行（3クレジット）</li></ol>` },
          { heading: "活用アイデア", content: `<ul><li>映画ポスター風の自分</li><li>パーソナライズされた誕生日カード</li><li>髪型やルックスのシミュレーション</li><li>AIバックグラウンドでプロフィール写真</li></ul>` },
        ],
      },
      es: {
        title: "Como usar AI Face Swap: Pon tu cara en cualquier imagen",
        description: "Guia paso a paso para intercambiar caras en imagenes generadas por IA con EGAKU AI.",
        sections: [
          { heading: "Que es Face Swap?", content: `<p>Face Swap te permite tomar una cara de una imagen y colocarla en otra. Crea retratos personalizados con IA.</p>` },
          { heading: "Como usarlo", content: `<ol><li>Crea una imagen base</li><li>Haz clic en <strong>Face Swap</strong></li><li>Sube la foto de la cara</li><li>Selecciona la imagen objetivo</li></ol>` },
        ],
      },
      zh: {
        title: "如何使用AI换脸：将你的脸放在任何图像上",
        description: "使用EGAKU AI在AI生成的图像中换脸的分步指南。",
        sections: [
          { heading: "什么是Face Swap?", content: `<p>Face Swap可以将一张图片中的脸部替换到另一张图片上，创建个性化的AI肖像。</p>` },
          { heading: "如何使用", content: `<ol><li>创建基础图像</li><li>点击<strong>Face Swap</strong></li><li>上传脸部照片</li><li>选择目标图像</li></ol>` },
        ],
      },
      pt: {
        title: "Como usar AI Face Swap: Coloque seu rosto em qualquer imagem",
        description: "Guia passo a passo para trocar rostos em imagens geradas por IA com EGAKU AI.",
        sections: [
          { heading: "O que e Face Swap?", content: `<p>Face Swap permite pegar um rosto de uma imagem e coloca-lo em outra. Crie retratos personalizados com IA.</p>` },
          { heading: "Como usar", content: `<ol><li>Crie uma imagem base</li><li>Clique em <strong>Face Swap</strong></li><li>Envie a foto do rosto</li><li>Selecione a imagem alvo</li></ol>` },
        ],
      },
    },
  },

  // ── How-to: AI Upscaling ──
  {
    slug: "ai-upscale-enhance-image-quality",
    category: "how-to",
    tags: ["upscale", "enhance", "quality", "beginner"],
    publishedAt: "2026-04-28",
    readingTime: 3,
    translations: {
      en: {
        title: "How to Upscale AI Images to 4x Resolution",
        description: "Enhance low-resolution AI images to crisp, detailed 4K using AI upscaling on EGAKU AI.",
        sections: [
          { heading: "Why Upscale?", content: `<p>AI models typically generate images at 1024x1024 or smaller. If you need images for printing, wallpapers, or professional use, upscaling can increase resolution by 2x or 4x while adding realistic detail. A 1024px image becomes a sharp 4096px image.</p>` },
          { heading: "How to Upscale", content: `<ol><li>Generate or upload any image</li><li>Click the <strong>Upscale</strong> button (magnifying glass icon)</li><li>Choose scale: 2x or 4x</li><li>Wait 10-30 seconds</li><li>Download the enhanced image</li></ol><p>Cost: 2 credits per upscale. Available on all plans.</p>` },
          { heading: "When to Use", content: `<ul><li><strong>Print:</strong> Upscale to 4K+ for posters, canvas prints</li><li><strong>Wallpapers:</strong> Make any AI art fit your 4K monitor</li><li><strong>Social media:</strong> Sharpen images for Instagram/X posts</li><li><strong>Detail recovery:</strong> Enhance faces and textures in complex scenes</li></ul>` },
          { heading: "Tips", content: `<ul><li>Upscale after you're happy with the composition (it's wasteful to upscale and then regenerate)</li><li>4x is best for printing, 2x is enough for screens</li><li>Works on uploaded photos too, not just AI-generated images</li></ul>` },
        ],
      },
      ja: {
        title: "AI画像を4倍にアップスケールする方法",
        description: "低解像度のAI画像をAIアップスケーリングで鮮明な4Kに拡大する方法。",
        sections: [
          { heading: "なぜアップスケール？", content: `<p>AIモデルは通常1024x1024以下で生成します。印刷用、壁紙用、プロ用途には解像度が足りません。アップスケールで2倍〜4倍に拡大し、ディテールを追加できます。</p>` },
          { heading: "使い方", content: `<ol><li>画像を生成またはアップロード</li><li><strong>Upscale</strong>ボタンをクリック</li><li>倍率を選択（2x or 4x）</li><li>10〜30秒待つ</li><li>ダウンロード</li></ol><p>2クレジット/回。全プラン利用可。</p>` },
          { heading: "活用シーン", content: `<ul><li><strong>印刷：</strong>ポスター、キャンバスプリント</li><li><strong>壁紙：</strong>4Kモニター用</li><li><strong>SNS：</strong>高画質投稿</li></ul>` },
        ],
      },
      es: {
        title: "Como escalar imagenes AI a resolucion 4x",
        description: "Mejora imagenes AI de baja resolucion a 4K nitido usando el escalado AI de EGAKU AI.",
        sections: [
          { heading: "Por que escalar?", content: `<p>Los modelos AI generan imagenes a 1024x1024 o menos. El escalado puede aumentar la resolucion 2x o 4x anadiendo detalle realista.</p>` },
          { heading: "Como escalar", content: `<ol><li>Genera o sube una imagen</li><li>Haz clic en <strong>Upscale</strong></li><li>Elige la escala: 2x o 4x</li></ol>` },
        ],
      },
      zh: {
        title: "如何将AI图像放大到4倍分辨率",
        description: "使用EGAKU AI的AI放大功能将低分辨率图像增强为清晰的4K。",
        sections: [
          { heading: "为什么要放大?", content: `<p>AI模型通常生成1024x1024或更小的图像。放大可以将分辨率提高2倍或4倍，同时添加逼真的细节。</p>` },
          { heading: "如何放大", content: `<ol><li>生成或上传图像</li><li>点击<strong>Upscale</strong>按钮</li><li>选择倍率：2x或4x</li></ol>` },
        ],
      },
      pt: {
        title: "Como aumentar imagens AI para resolucao 4x",
        description: "Melhore imagens AI de baixa resolucao para 4K nitido usando o upscale AI do EGAKU AI.",
        sections: [
          { heading: "Por que aumentar?", content: `<p>Modelos AI geram imagens em 1024x1024 ou menor. O upscale pode aumentar a resolucao 2x ou 4x adicionando detalhes realistas.</p>` },
          { heading: "Como aumentar", content: `<ol><li>Gere ou envie uma imagem</li><li>Clique em <strong>Upscale</strong></li><li>Escolha a escala: 2x ou 4x</li></ol>` },
        ],
      },
    },
  },

  // ── How-to: Short Video for Social Media ──
  {
    slug: "create-short-video-social-media-ai",
    category: "how-to",
    tags: ["video", "social-media", "tiktok", "reels", "shorts"],
    publishedAt: "2026-04-28",
    readingTime: 5,
    translations: {
      en: {
        title: "Create Short Videos for TikTok, Reels, and Shorts with AI",
        description: "How to generate eye-catching short videos for social media using AI. No filming or editing required.",
        sections: [
          { heading: "Why AI Video for Social Media?", content: `<p>Short-form video dominates social media. But not everyone has a camera, editing skills, or time to produce content. AI video generation lets you create professional-looking clips in minutes with just a text prompt.</p>` },
          { heading: "Choose Your Model", content: `<p>For social media videos, these models work best:</p><ul><li><strong>Kling 3.0:</strong> Highest visual quality, 4K, 5-10 seconds. Best for eye-catching visuals.</li><li><strong>Veo 3:</strong> Includes audio. Perfect for atmospheric content.</li><li><strong>Grok Video:</strong> Fast generation, includes audio. Good for quick content.</li><li><strong>Wan 2.6:</strong> Free tier available. 15 second max. Great for starting out.</li></ul>` },
          { heading: "Vertical Video (9:16)", content: `<p>Social media videos need to be vertical. On EGAKU AI:</p><ol><li>Select your video model</li><li>Set aspect ratio to <strong>9:16</strong> (if available) or generate at default and crop</li><li>Keep prompts focused on a single subject with clear motion</li></ol>` },
          { heading: "Prompt Formula for Viral Content", content: `<p>Structure: <strong>[Hook visual] + [Motion] + [Style] + [Mood]</strong></p><p>Examples:</p><ul><li><code>Macro shot of coffee being poured in slow motion, cream swirling, morning light, cozy aesthetic</code></li><li><code>Dramatic drone shot ascending through clouds to reveal mountain peak, epic cinematic</code></li><li><code>Cute cat pouncing on a butterfly in a sunlit garden, slow motion, adorable</code></li></ul>` },
          { heading: "Post-Production Tips", content: `<ul><li>Add text overlays using your phone's editor or CapCut</li><li>Loop-friendly content performs better (make start and end match)</li><li>Trending audio can be added in TikTok/Reels editor</li><li>Post consistently: AI lets you produce 5-10 videos per day easily</li></ul>` },
        ],
      },
      ja: {
        title: "AIでTikTok・Reels・Shorts用ショート動画を作る方法",
        description: "AIで目を引くSNS向けショート動画を生成する方法。撮影も編集も不要。",
        sections: [
          { heading: "なぜAI動画？", content: `<p>ショート動画はSNSの主流。でもカメラも編集スキルも時間もない人が多い。AI動画生成なら、テキストプロンプトだけで数分でプロ品質のクリップが作れます。</p>` },
          { heading: "モデルの選び方", content: `<ul><li><strong>Kling 3.0：</strong>最高画質、4K、5-10秒</li><li><strong>Veo 3：</strong>音声付き。雰囲気コンテンツに最適</li><li><strong>Grok Video：</strong>高速生成、音声付き</li><li><strong>Wan 2.6：</strong>無料枠あり。15秒まで</li></ul>` },
          { heading: "バズるプロンプト", content: `<p>構造：<strong>[目を引くビジュアル] + [動き] + [スタイル] + [ムード]</strong></p><ul><li><code>コーヒーを注ぐスローモーション、クリームが渦巻く、朝の光</code></li><li><code>ドローン上昇、雲を突き抜けて山頂、壮大なシネマティック</code></li></ul>` },
        ],
      },
      es: {
        title: "Crea videos cortos para TikTok, Reels y Shorts con IA",
        description: "Como generar videos cortos llamativos para redes sociales usando IA. Sin filmar ni editar.",
        sections: [
          { heading: "Por que video AI para redes?", content: `<p>El video corto domina las redes. La generacion de video AI te permite crear clips profesionales en minutos con solo un prompt de texto.</p>` },
          { heading: "Elige tu modelo", content: `<ul><li><strong>Kling 3.0:</strong> Mejor calidad visual, 4K</li><li><strong>Veo 3:</strong> Incluye audio</li><li><strong>Wan 2.6:</strong> Tier gratuito disponible</li></ul>` },
        ],
      },
      zh: {
        title: "用AI创建TikTok、Reels和Shorts短视频",
        description: "如何使用AI生成吸引眼球的社交媒体短视频。无需拍摄或编辑。",
        sections: [
          { heading: "为什么用AI做短视频?", content: `<p>短视频主导社交媒体。AI视频生成让你只需文字提示就能在几分钟内创建专业级剪辑。</p>` },
          { heading: "选择模型", content: `<ul><li><strong>Kling 3.0:</strong>最高画质，4K</li><li><strong>Veo 3:</strong>带音频</li><li><strong>Wan 2.6:</strong>免费可用</li></ul>` },
        ],
      },
      pt: {
        title: "Crie videos curtos para TikTok, Reels e Shorts com IA",
        description: "Como gerar videos curtos atraentes para redes sociais usando IA. Sem filmar ou editar.",
        sections: [
          { heading: "Por que video AI para redes?", content: `<p>Video curto domina as redes sociais. A geracao de video AI permite criar clipes profissionais em minutos com apenas um prompt de texto.</p>` },
          { heading: "Escolha seu modelo", content: `<ul><li><strong>Kling 3.0:</strong> Melhor qualidade visual, 4K</li><li><strong>Veo 3:</strong> Inclui audio</li><li><strong>Wan 2.6:</strong> Gratuito disponivel</li></ul>` },
        ],
      },
    },
  },

  // ── How-to: Background Removal + Replace ──
  {
    slug: "remove-background-replace-ai-guide",
    category: "how-to",
    tags: ["background", "remove-bg", "product", "beginner"],
    publishedAt: "2026-04-28",
    readingTime: 3,
    translations: {
      en: {
        title: "Remove and Replace Backgrounds with AI",
        description: "How to remove backgrounds from photos and replace them with AI-generated scenes. Perfect for product photos and portraits.",
        sections: [
          { heading: "Background Removal", content: `<p>EGAKU AI uses BiRefNet for precise background removal. Upload any photo and get a clean cutout in seconds.</p><ol><li>Go to <strong>Generate</strong> page</li><li>Select <strong>Remove Background</strong> tool</li><li>Upload your image</li><li>Download the transparent PNG</li></ol><p>Cost: 1 credit. Works on all plans.</p>` },
          { heading: "Background Replacement", content: `<p>Want to change the background entirely? Use the <strong>Background Change</strong> tool:</p><ol><li>Upload your image</li><li>Describe the new background: <code>tropical beach at sunset</code> or <code>modern office interior</code></li><li>AI removes the old background and generates a new one that matches lighting and perspective</li></ol>` },
          { heading: "Use Cases", content: `<ul><li><strong>Product photography:</strong> Place products on clean white or styled backgrounds</li><li><strong>Portraits:</strong> Move yourself to any location</li><li><strong>E-commerce:</strong> Consistent product backgrounds for your store</li><li><strong>Social media:</strong> Creative profile photos</li></ul>` },
        ],
      },
      ja: {
        title: "AIで背景を削除・置換する方法",
        description: "写真の背景をAIで削除し、新しいシーンに置き換える方法。商品写真やポートレートに最適。",
        sections: [
          { heading: "背景削除", content: `<p>EGAKU AIはBiRefNetを使用して正確な背景削除を行います。写真をアップロードするだけで数秒で切り抜き。</p><ol><li><strong>Generate</strong>ページへ</li><li><strong>Remove Background</strong>ツールを選択</li><li>画像をアップロード</li><li>透過PNGをダウンロード</li></ol><p>1クレジット。全プラン利用可。</p>` },
          { heading: "背景置換", content: `<p><strong>Background Change</strong>ツールで背景を丸ごと変更：</p><ol><li>画像をアップロード</li><li>新しい背景を記述：<code>夕暮れのビーチ</code>や<code>モダンなオフィス</code></li><li>AIが自動で背景を生成</li></ol>` },
        ],
      },
      es: {
        title: "Eliminar y reemplazar fondos con IA",
        description: "Como eliminar fondos de fotos y reemplazarlos con escenas generadas por IA.",
        sections: [
          { heading: "Eliminacion de fondo", content: `<p>Sube cualquier foto y obtendras un recorte limpio en segundos. 1 credito.</p>` },
          { heading: "Reemplazo de fondo", content: `<p>Describe el nuevo fondo y la IA lo generara automaticamente.</p>` },
        ],
      },
      zh: {
        title: "用AI移除和替换背景",
        description: "如何从照片中移除背景并用AI生成的场景替换。",
        sections: [
          { heading: "背景移除", content: `<p>上传任何照片，几秒内获得干净的抠图。1积分。</p>` },
          { heading: "背景替换", content: `<p>描述新背景，AI会自动生成匹配光线和透视的新背景。</p>` },
        ],
      },
      pt: {
        title: "Remover e substituir fundos com IA",
        description: "Como remover fundos de fotos e substitui-los por cenas geradas por IA.",
        sections: [
          { heading: "Remocao de fundo", content: `<p>Envie qualquer foto e obtenha um recorte limpo em segundos. 1 credito.</p>` },
          { heading: "Substituicao de fundo", content: `<p>Descreva o novo fundo e a IA o gerara automaticamente.</p>` },
        ],
      },
    },
  },

  // ── How-to: Lip Sync + Talking Avatar ──
  {
    slug: "lip-sync-talking-avatar-guide",
    category: "how-to",
    tags: ["lip-sync", "talking-avatar", "video", "audio", "creative"],
    publishedAt: "2026-04-28",
    readingTime: 4,
    translations: {
      en: {
        title: "How to Make Talking Avatars with AI Lip Sync",
        description: "Create talking characters from a single photo using AI lip sync and voice cloning on EGAKU AI.",
        sections: [
          { heading: "What is Lip Sync?", content: `<p>AI Lip Sync takes a still image of a face and an audio track, then generates a video where the face moves naturally to match the speech. The result looks like the person in the photo is actually talking.</p><p>Combined with Voice Clone (text-to-speech with any voice), you can create a full talking avatar from scratch: generate a face with AI, clone a voice, and produce a speaking video.</p>` },
          { heading: "Step-by-Step", content: `<ol><li><strong>Create a character image</strong> — Generate a portrait on the Generate page. Front-facing, clear face, good lighting works best.</li><li><strong>Prepare audio</strong> — Either upload your own audio file, or use <strong>Voice Clone</strong> to generate speech from text.</li><li><strong>Go to Lip Sync</strong> — Upload the portrait + audio.</li><li><strong>Generate</strong> — Wait 2-5 minutes. The AI produces a video with natural lip movements.</li></ol>` },
          { heading: "Use Cases", content: `<ul><li><strong>Social media characters:</strong> Create a virtual influencer or mascot</li><li><strong>Presentations:</strong> AI narrator with a face</li><li><strong>Language learning:</strong> Characters speaking different languages</li><li><strong>Music videos:</strong> Characters lip-syncing to songs</li></ul>` },
          { heading: "Tips for Quality", content: `<ul><li>High-resolution face images produce better results</li><li>Front-facing portraits work much better than side profiles</li><li>Clear audio without background noise syncs more accurately</li><li>Keep videos under 30 seconds for best quality</li></ul>` },
        ],
      },
      ja: {
        title: "AI Lip Syncでトーキングアバターを作る方法",
        description: "1枚の写真からAIリップシンクと音声クローンで喋るキャラクターを作成する方法。",
        sections: [
          { heading: "Lip Syncとは？", content: `<p>AI Lip Syncは、静止画の顔と音声を組み合わせて、顔が自然に動く動画を生成します。写真の人物が実際に喋っているように見えます。</p><p>Voice Clone（テキストから音声生成）と組み合わせれば、AIで顔を生成→声をクローン→喋る動画、という流れで完全なトーキングアバターが作れます。</p>` },
          { heading: "手順", content: `<ol><li><strong>キャラ画像を作成</strong> — Generateページでポートレートを生成。正面向き、鮮明な顔がベスト。</li><li><strong>音声を準備</strong> — 自分の音声をアップロード、またはVoice Cloneでテキストから生成。</li><li><strong>Lip Sync</strong> — ポートレート+音声をアップロード。</li><li><strong>生成</strong> — 2〜5分で自然なリップシンク動画が完成。</li></ol>` },
          { heading: "活用例", content: `<ul><li>バーチャルインフルエンサー/マスコット</li><li>プレゼンのAIナレーター</li><li>語学学習（多言語キャラ）</li><li>ミュージックビデオ</li></ul>` },
        ],
      },
      es: {
        title: "Como crear avatares parlantes con AI Lip Sync",
        description: "Crea personajes que hablan a partir de una sola foto usando lip sync y clonacion de voz con IA.",
        sections: [
          { heading: "Que es Lip Sync?", content: `<p>AI Lip Sync toma una imagen fija de un rostro y una pista de audio, y genera un video donde el rostro se mueve naturalmente para coincidir con el habla.</p>` },
          { heading: "Paso a paso", content: `<ol><li>Crea una imagen de retrato</li><li>Prepara el audio o usa Voice Clone</li><li>Sube ambos a Lip Sync</li><li>Genera el video (2-5 minutos)</li></ol>` },
        ],
      },
      zh: {
        title: "如何用AI唇形同步制作会说话的头像",
        description: "使用AI唇形同步和语音克隆，从一张照片创建会说话的角色。",
        sections: [
          { heading: "什么是Lip Sync?", content: `<p>AI Lip Sync将一张静态人脸图片和一段音频结合，生成面部自然移动匹配语音的视频。</p>` },
          { heading: "步骤", content: `<ol><li>创建肖像图像</li><li>准备音频或使用Voice Clone</li><li>上传到Lip Sync</li><li>生成视频（2-5分钟）</li></ol>` },
        ],
      },
      pt: {
        title: "Como criar avatares falantes com AI Lip Sync",
        description: "Crie personagens que falam a partir de uma unica foto usando lip sync e clonagem de voz com IA.",
        sections: [
          { heading: "O que e Lip Sync?", content: `<p>AI Lip Sync pega uma imagem estatica de um rosto e uma faixa de audio, e gera um video onde o rosto se move naturalmente para corresponder a fala.</p>` },
          { heading: "Passo a passo", content: `<ol><li>Crie uma imagem de retrato</li><li>Prepare o audio ou use Voice Clone</li><li>Envie ambos para Lip Sync</li><li>Gere o video (2-5 minutos)</li></ol>` },
        ],
      },
    },
  },

  // ── How-to: Style Transfer ──
  {
    slug: "style-transfer-transform-photos-art",
    category: "how-to",
    tags: ["style-transfer", "art", "creative", "beginner"],
    publishedAt: "2026-04-28",
    readingTime: 3,
    translations: {
      en: {
        title: "Turn Any Photo into Art with AI Style Transfer",
        description: "Transform ordinary photos into stunning artworks using 8 AI style presets. Oil painting, anime, watercolor, and more.",
        sections: [
          { heading: "What is Style Transfer?", content: `<p>Style transfer takes your photo and redraws it in a completely different artistic style while preserving the composition and subjects. Turn a selfie into an oil painting, a landscape into anime, or a pet photo into a watercolor.</p>` },
          { heading: "Available Styles", content: `<ul><li><strong>Oil Painting:</strong> Classic fine art look with visible brushstrokes</li><li><strong>Watercolor:</strong> Soft, flowing colors with paper texture</li><li><strong>Anime:</strong> Japanese animation style with bold lines and vibrant colors</li><li><strong>Pencil Sketch:</strong> Black and white hand-drawn look</li><li><strong>Pop Art:</strong> Bold, Warhol-inspired colors</li><li><strong>Cyberpunk:</strong> Neon-lit futuristic aesthetic</li><li><strong>Ghibli:</strong> Studio Ghibli animation style</li><li><strong>Pixel Art:</strong> Retro 8-bit/16-bit game style</li></ul>` },
          { heading: "How to Use", content: `<ol><li>Go to <strong>Generate</strong> page → <strong>Style Transfer</strong> tab</li><li>Upload any photo</li><li>Choose a style from the presets</li><li>Adjust strength (0.3 = subtle, 0.9 = full transformation)</li><li>Generate (2 credits)</li></ol>` },
          { heading: "Strength Guide", content: `<ul><li><strong>0.3-0.4:</strong> Photo still recognizable, subtle artistic touch</li><li><strong>0.5-0.6:</strong> Balanced — clearly stylized but composition intact</li><li><strong>0.7-0.9:</strong> Heavy transformation, almost entirely redrawn</li></ul><p>Start at 0.5 and adjust from there.</p>` },
        ],
      },
      ja: {
        title: "AIスタイル変換で写真をアートに変える方法",
        description: "普通の写真を8つのAIスタイルで美しいアートに変換。油絵、アニメ、水彩画など。",
        sections: [
          { heading: "スタイル変換とは？", content: `<p>スタイル変換は、写真の構図と被写体を保ちながら、まったく異なるアートスタイルで描き直します。自撮りを油絵に、風景をアニメに、ペット写真を水彩画に。</p>` },
          { heading: "利用可能なスタイル", content: `<ul><li><strong>油絵：</strong>筆のタッチが見えるクラシックな画風</li><li><strong>水彩：</strong>柔らかく流れる色彩</li><li><strong>アニメ：</strong>日本アニメ風</li><li><strong>鉛筆スケッチ：</strong>白黒の手描き風</li><li><strong>ポップアート：</strong>ウォーホル風の大胆な色</li><li><strong>サイバーパンク：</strong>ネオンの未来的な雰囲気</li><li><strong>ジブリ：</strong>スタジオジブリ風</li><li><strong>ピクセルアート：</strong>レトロゲーム風</li></ul>` },
          { heading: "使い方", content: `<ol><li><strong>Generate</strong>ページ → <strong>Style Transfer</strong>タブ</li><li>写真をアップロード</li><li>スタイルを選択</li><li>強度を調整（0.3=控えめ、0.9=完全変換）</li><li>生成（2クレジット）</li></ol>` },
        ],
      },
      es: {
        title: "Convierte cualquier foto en arte con Style Transfer",
        description: "Transforma fotos ordinarias en obras de arte usando 8 estilos de IA. Oleo, anime, acuarela y mas.",
        sections: [
          { heading: "Que es Style Transfer?", content: `<p>Style transfer toma tu foto y la redibuja en un estilo artistico completamente diferente, preservando la composicion.</p>` },
          { heading: "Como usar", content: `<ol><li>Ve a Generate → Style Transfer</li><li>Sube una foto</li><li>Elige un estilo</li><li>Ajusta la intensidad</li><li>Genera (2 creditos)</li></ol>` },
        ],
      },
      zh: {
        title: "用AI风格转换将照片变成艺术品",
        description: "使用8种AI风格预设将普通照片转换为令人惊叹的艺术品。",
        sections: [
          { heading: "什么是风格转换?", content: `<p>风格转换将您的照片以完全不同的艺术风格重新绘制，同时保留构图和主体。</p>` },
          { heading: "如何使用", content: `<ol><li>进入Generate → Style Transfer</li><li>上传照片</li><li>选择风格</li><li>调整强度</li><li>生成（2积分）</li></ol>` },
        ],
      },
      pt: {
        title: "Transforme qualquer foto em arte com Style Transfer",
        description: "Transforme fotos comuns em obras de arte usando 8 estilos de IA.",
        sections: [
          { heading: "O que e Style Transfer?", content: `<p>Style transfer pega sua foto e a redesenha em um estilo artistico completamente diferente, preservando a composicao.</p>` },
          { heading: "Como usar", content: `<ol><li>Va para Generate → Style Transfer</li><li>Envie uma foto</li><li>Escolha um estilo</li><li>Ajuste a intensidade</li><li>Gere (2 creditos)</li></ol>` },
        ],
      },
    },
  },

  // ── Guide: Choosing the Right Video Model ──
  {
    slug: "which-ai-video-model-to-use-2026",
    category: "guide",
    tags: ["video", "models", "comparison", "kling", "veo3", "sora2"],
    publishedAt: "2026-04-28",
    readingTime: 5,
    translations: {
      en: {
        title: "Which AI Video Model Should You Use? (2026 Guide)",
        description: "Compare Veo 3, Kling 3.0, Sora 2, Grok Video, Wan 2.6 and more. Find the right video model for your project.",
        sections: [
          { heading: "Quick Decision Chart", content: `<table style="width:100%;border-collapse:collapse;font-size:13px;"><tr style="border-bottom:1px solid #333;"><th style="text-align:left;padding:8px;">I want...</th><th>Use this</th><th>Credits</th></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Video with audio (no editing)</td><td><strong>Veo 3</strong></td><td>40</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Highest visual quality (4K)</td><td><strong>Kling 3.0</strong></td><td>40</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Longest duration (up to 20s)</td><td><strong>Sora 2</strong></td><td>50</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Fast + audio</td><td><strong>Grok Video</strong></td><td>30</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Free video generation</td><td><strong>Wan 2.6</strong> or <strong>LTX 2.3</strong></td><td>5-10</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">Animate a still image</td><td><strong>Kling 3.0 I2V</strong> or <strong>Wan 2.6 I2V</strong></td><td>10-40</td></tr><tr><td style="padding:8px;">Edit/restyle existing video</td><td><strong>WAN 2.7 V2V</strong></td><td>40</td></tr></table>` },
          { heading: "Detailed Comparison", content: `<h4>Veo 3 (Google)</h4><p>The only model that generates native audio. Perfect for atmospheric content, social media clips, and presentations. 720p, 4-8 seconds. Prompt tip: describe sounds explicitly.</p><h4>Kling 3.0 (Kuaishou)</h4><p>Best raw visual quality. Native 4K output with cinematic motion. Great for professional-looking content. 5-10 seconds. No audio.</p><h4>Sora 2 (OpenAI)</h4><p>Longest clips (up to 20 seconds) with consistent quality. Cinematic style. Expensive but worth it for longer narratives.</p><h4>Grok Video (xAI)</h4><p>Fast generation (under 30 seconds) with native audio. 720p. Great for quick content creation and iteration.</p><h4>Wan 2.6 (Free)</h4><p>Best free option. Up to 15 seconds, 720p. NSFW-friendly. Image-to-video mode available. Quality is good for the price (free).</p>` },
          { heading: "Tips for All Models", content: `<ul><li>Describe motion explicitly: "camera slowly pans left" or "she turns and smiles"</li><li>Keep prompts focused on one clear action per clip</li><li>Shorter is better for quality (5s > 15s for most models)</li><li>Use Image-to-Video for more control over the starting frame</li></ul>` },
        ],
      },
      ja: {
        title: "どのAI動画モデルを使うべき？（2026年ガイド）",
        description: "Veo 3、Kling 3.0、Sora 2、Grok Video、Wan 2.6を比較。用途別のモデル選び方。",
        sections: [
          { heading: "早見表", content: `<table style="width:100%;border-collapse:collapse;font-size:13px;"><tr style="border-bottom:1px solid #333;"><th style="text-align:left;padding:8px;">目的</th><th>モデル</th><th>クレジット</th></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">音声付き動画</td><td><strong>Veo 3</strong></td><td>40</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">最高画質（4K）</td><td><strong>Kling 3.0</strong></td><td>40</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">最長動画（20秒）</td><td><strong>Sora 2</strong></td><td>50</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">高速+音声</td><td><strong>Grok Video</strong></td><td>30</td></tr><tr style="border-bottom:1px solid #222;"><td style="padding:8px;">無料動画</td><td><strong>Wan 2.6</strong> / <strong>LTX</strong></td><td>5-10</td></tr><tr><td style="padding:8px;">画像→動画</td><td><strong>Kling 3.0 I2V</strong></td><td>40</td></tr></table>` },
          { heading: "モデル詳細", content: `<p><strong>Veo 3:</strong> ネイティブ音声生成が唯一の強み。SNSクリップに最適。</p><p><strong>Kling 3.0:</strong> 4K映像の最高品質。プロ仕様。</p><p><strong>Sora 2:</strong> 最長20秒。ストーリー性のある映像に。</p><p><strong>Grok Video:</strong> 30秒以内で生成完了。音声付き。高速。</p><p><strong>Wan 2.6:</strong> 無料で15秒まで。NSFW対応。</p>` },
          { heading: "共通のコツ", content: `<ul><li>動きを明示的に記述：「カメラがゆっくり左にパン」「彼女が振り返って微笑む」</li><li>1クリップに1アクション</li><li>短い方が品質高い（5秒 > 15秒）</li></ul>` },
        ],
      },
      es: {
        title: "Que modelo de video AI deberias usar? (Guia 2026)",
        description: "Compara Veo 3, Kling 3.0, Sora 2, Grok Video y Wan 2.6. Encuentra el modelo de video adecuado.",
        sections: [
          { heading: "Tabla rapida", content: `<ul><li><strong>Video con audio:</strong> Veo 3</li><li><strong>Mejor calidad visual:</strong> Kling 3.0</li><li><strong>Mas duracion:</strong> Sora 2</li><li><strong>Rapido + audio:</strong> Grok Video</li><li><strong>Gratis:</strong> Wan 2.6</li></ul>` },
          { heading: "Consejos", content: `<ul><li>Describe el movimiento explicitamente</li><li>Un clip = una accion clara</li><li>Mas corto = mejor calidad</li></ul>` },
        ],
      },
      zh: {
        title: "该使用哪个AI视频模型？（2026指南）",
        description: "比较Veo 3、Kling 3.0、Sora 2、Grok Video和Wan 2.6。找到适合您项目的视频模型。",
        sections: [
          { heading: "快速选择", content: `<ul><li><strong>带音频的视频：</strong>Veo 3</li><li><strong>最高画质：</strong>Kling 3.0</li><li><strong>最长时长：</strong>Sora 2</li><li><strong>快速+音频：</strong>Grok Video</li><li><strong>免费：</strong>Wan 2.6</li></ul>` },
          { heading: "提示", content: `<ul><li>明确描述动作</li><li>每个片段一个动作</li><li>越短质量越好</li></ul>` },
        ],
      },
      pt: {
        title: "Qual modelo de video AI voce deve usar? (Guia 2026)",
        description: "Compare Veo 3, Kling 3.0, Sora 2, Grok Video e Wan 2.6. Encontre o modelo certo.",
        sections: [
          { heading: "Tabela rapida", content: `<ul><li><strong>Video com audio:</strong> Veo 3</li><li><strong>Melhor qualidade:</strong> Kling 3.0</li><li><strong>Maior duracao:</strong> Sora 2</li><li><strong>Rapido + audio:</strong> Grok Video</li><li><strong>Gratuito:</strong> Wan 2.6</li></ul>` },
          { heading: "Dicas", content: `<ul><li>Descreva o movimento explicitamente</li><li>Um clipe = uma acao clara</li><li>Mais curto = melhor qualidade</li></ul>` },
        ],
      },
    },
  },
];
