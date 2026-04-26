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
    },
  },
];
