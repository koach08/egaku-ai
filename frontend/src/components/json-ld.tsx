export function WebsiteJsonLd() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EGAKU AI",
    url: "https://egaku-ai.com",
    logo: "https://egaku-ai.com/og-image.png",
    description:
      "AI-powered creative platform for image and video generation with 15+ models.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@egaku-ai.com",
      contactType: "customer support",
      availableLanguage: ["English", "Japanese"],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://egaku-ai.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Generate",
        item: "https://egaku-ai.com/generate",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Explore",
        item: "https://egaku-ai.com/explore",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Gallery",
        item: "https://egaku-ai.com/gallery",
      },
    ],
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "EGAKU AI",
    url: "https://egaku-ai.com",
    description:
      "AI-powered image and video generator with 15+ models including Flux, SDXL, Stable Diffusion 3.5, and custom CivitAI LoRA models. Create stunning AI art for free.",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    inLanguage: ["en", "ja"],
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
        name: "Free",
        description: "50 credits/month, text-to-image, upscale, background removal",
      },
      {
        "@type": "Offer",
        price: "480",
        priceCurrency: "JPY",
        name: "Lite",
        description: "115 credits/month, all image features, no watermark",
      },
      {
        "@type": "Offer",
        price: "980",
        priceCurrency: "JPY",
        name: "Basic",
        description: "500 credits/month, video generation, inpainting, ControlNet, 1 CivitAI custom LoRA model",
      },
      {
        "@type": "Offer",
        price: "2980",
        priceCurrency: "JPY",
        name: "Pro",
        description: "2000 credits/month, all features, 3 CivitAI custom LoRA models, priority queue",
      },
      {
        "@type": "Offer",
        price: "5980",
        priceCurrency: "JPY",
        name: "Unlimited",
        description: "Unlimited generations, 5 CivitAI custom models, batch processing",
      },
    ],
    creator: {
      "@type": "Organization",
      name: "EGAKU AI",
      url: "https://egaku-ai.com",
    },
    featureList: [
      "Text-to-Image with 25+ AI models (Flux, Sora 2, Veo 3, Kling, SDXL, Nano Banana 2, Grok Imagine)",
      "Image-to-Image transformation",
      "Text-to-Video generation (Sora 2, Veo 3, Kling 2.5, LTX, Wan, Minimax)",
      "Image-to-Video animation",
      "AI Face Swap — swap faces between images",
      "Character Lock (PuLID) — consistent character across multiple scenes",
      "AI Photo Booth — selfie to professional portrait (8 presets)",
      "AI Video Shorts — generate TikTok/Reels/Shorts vertical videos",
      "Storyboard Studio — multi-scene video production with BGM",
      "Style Transfer (Ghibli, Anime, Oil Painting, Watercolor, Cyberpunk, Pixel Art, Comic, Ukiyo-e)",
      "AI Upscaling up to 4x with Real-ESRGAN",
      "Inpainting with mask editing",
      "Background Removal",
      "ControlNet (Canny, Depth, OpenPose, Scribble)",
      "Multi-language prompt support (auto-translate from any language)",
      "Batch generation (up to 4x variations)",
      "Cinema camera presets (13 film looks)",
      "Color grading presets (14 post-processing filters)",
      "Project folders for organizing generations",
      "REST API access for developers",
      "CivitAI LoRA model browser with 1000+ models",
      "Daily free credits bonus",
      "Regional pricing (up to 80% discount)",
      "Full creative freedom for verified adults (18+)",
    ],
    screenshot: "https://egaku-ai.com/og-image.png",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is EGAKU AI free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, EGAKU AI offers a free plan with 50 credits per month. You can generate images using text-to-image, upscale images, and remove backgrounds for free. Paid plans start at ¥480/month for more credits and features.",
        },
      },
      {
        "@type": "Question",
        name: "What AI models does EGAKU AI support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "EGAKU AI supports 15+ models including Flux Dev, Flux Schnell, Stable Diffusion XL, SD 3.5, RealVisXL, Realistic Vision, Playground, Recraft V3, AuraFlow, and Proteus. You can also use custom models from CivitAI.",
        },
      },
      {
        "@type": "Question",
        name: "Does EGAKU AI offer unrestricted creative freedom?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, EGAKU AI offers full creative freedom for age-verified users (18+) on all plans. Content must comply with our content policy. Regional restrictions apply in some countries.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use CivitAI models on EGAKU AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! EGAKU AI has a built-in CivitAI model browser. Search thousands of LoRA models, preview them, and add them to your account. Use custom LoRAs with Flux or SDXL base models for unique AI art. Model slots by plan: Basic (1), Pro (3), Unlimited (5), Studio (unlimited).",
        },
      },
      {
        "@type": "Question",
        name: "What features does EGAKU AI offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "EGAKU AI offers 25+ AI models, text-to-image, image-to-image, text-to-video (Sora 2, Veo 3, Kling 2.5), image-to-video, Face Swap, Character Lock (PuLID), AI Photo Booth, Video Shorts generator, Storyboard Studio with BGM, style transfer (8 styles), upscaling (4x), inpainting, background removal, ControlNet, batch generation, multi-language prompts, and CivitAI model support.",
        },
      },
      {
        "@type": "Question",
        name: "Can I write prompts in my own language?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! EGAKU AI supports prompts in any language. Write in Japanese, Chinese, Korean, Spanish, or any other language — our AI automatically translates your prompt to get the best results from the image generation models.",
        },
      },
      {
        "@type": "Question",
        name: "What is AI Photo Booth?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AI Photo Booth lets you upload a selfie and instantly generate professional portraits. Choose from 8 presets: Business, Casual, Creative, Academic, Dating App, Influencer, Graduation, and Fitness. Perfect for LinkedIn, resumes, and social media profiles.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
