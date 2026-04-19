import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — EGAKU AI",
  description: "Terms of Service for EGAKU AI platform.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Title Block */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-widest text-purple-400 uppercase mb-3">Legal</p>
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Effective: April 2026 &middot; Last updated: April 17, 2026
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mt-6" />
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using EGAKU AI (the &quot;Service&quot;), operated by EGAKU AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you and EGAKU AI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              EGAKU AI provides cloud-based AI-powered tools for generating images and videos from text prompts, image inputs, and other creative parameters. The Service utilizes various machine learning models, including but not limited to Flux, SDXL, Stable Diffusion, Sora 2, Veo 3, Kling, and models accessible through CivitAI, fal.ai, and Novita.ai platforms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Eligibility &amp; Account Registration</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You must be at least 13 years of age to create an account.</li>
              <li>You must be at least 18 years of age to access adult (NSFW) features.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You agree to provide accurate and complete registration information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Prohibited Content &amp; Conduct</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Generate, upload, or distribute child sexual abuse material (CSAM) or any depiction of minors in sexual situations — whether real, AI-generated, illustrated, or fictional.</li>
              <li>Generate non-consensual intimate imagery (deepfakes) of real, identifiable persons.</li>
              <li>Produce content promoting terrorism, extreme violence, or hatred toward protected groups.</li>
              <li>Engage in fraud, impersonation, or harassment.</li>
              <li>Attempt to reverse-engineer, exploit, or circumvent security measures of the Service.</li>
              <li>Resell access to the Service or rebrand generated content as a competing AI generation service.</li>
              <li>Conduct automated scraping or exceed API usage limits beyond your plan tier.</li>
            </ul>
            <p className="mt-3">
              Violations may result in immediate account termination and may be reported to law enforcement authorities where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Credits, Billing &amp; Subscriptions</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Free accounts receive 50 credits per month, plus 1 daily login bonus credit.</li>
              <li>Paid subscriptions provide additional credits and access to premium features and models.</li>
              <li>Credits are non-transferable and unused credits expire at the end of each monthly billing cycle.</li>
              <li>Subscriptions auto-renew unless cancelled before the next billing date.</li>
              <li>Pricing is displayed in Japanese Yen (¥). Regional pricing discounts may apply based on your location and are applied automatically.</li>
              <li>Refund requests are evaluated on a case-by-case basis. Credits already consumed cannot be refunded.</li>
              <li>Payment processing is handled by Stripe, Inc. and NOWPayments (for cryptocurrency). Their respective terms of service apply.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Intellectual Property &amp; Content Ownership</h2>
            <p className="mb-3">
              You retain ownership of content you create using the Service, subject to the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Generated content is subject to the license terms of the underlying AI models used in generation.</li>
              <li>By publishing content to the public gallery, you grant EGAKU AI a non-exclusive, worldwide, royalty-free license to display, promote, and distribute that content within the Service.</li>
              <li>You may use generated content for personal and commercial purposes, including print, digital media, and merchandise, on all paid plans.</li>
              <li>The EGAKU AI name, logo, and platform design are our intellectual property and may not be reproduced without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Regional Compliance</h2>
            <p>
              The Service complies with applicable laws in each operating region. Specific provisions include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li><strong>Japan (JP):</strong> Public NSFW content is subject to automatic mosaic processing in compliance with Article 175 of the Japanese Penal Code.</li>
              <li><strong>South Korea (KR):</strong> NSFW generation is not available in compliance with Korean Criminal Code Articles 243-244.</li>
              <li><strong>United States:</strong> Compliance with 18 U.S.C. § 2256 (PROTECT Act).</li>
              <li><strong>European Union:</strong> GDPR-compliant data handling practices.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, EGAKU AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, REVENUE, OR PROFITS, WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users or third parties. You may cancel your account at any time through the Settings page or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of Japan. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Sapporo, Hokkaido, Japan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Modifications</h2>
            <p>
              We may revise these Terms at any time by updating this page. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Your continued use of the Service after changes become effective constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact</h2>
            <div className="rounded-lg border border-muted bg-card p-4">
              <p className="text-foreground font-medium">EGAKU AI</p>
              <p>Email: support@egaku-ai.com</p>
              <p>Website: https://egaku-ai.com</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
