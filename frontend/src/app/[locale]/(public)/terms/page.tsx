import { Header } from "@/components/layout/header";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using EGAKU AI (&quot;the Service&quot;), you agree to be bound by
          these Terms of Service. If you do not agree, do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          EGAKU AI provides AI-powered image and video generation tools. The Service
          uses machine learning models including Stable Diffusion, SDXL, and Flux to
          generate visual content based on text prompts.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          You must create an account to use the Service. You are responsible for
          maintaining the security of your account credentials and for all activities
          under your account.
        </p>

        <h2>4. Content Policy</h2>
        <ul>
          <li>You must not generate content that depicts minors in sexual or harmful situations.</li>
          <li>You must not generate content for the purpose of harassment, defamation, or fraud.</li>
          <li>NSFW content is available only for verified adult users (18+).</li>
          <li>Public sharing of NSFW content may be restricted by region.</li>
          <li>We reserve the right to remove content that violates these policies.</li>
        </ul>

        <h2>5. Credits and Billing</h2>
        <ul>
          <li>Free accounts receive a limited number of monthly credits.</li>
          <li>Paid subscriptions provide additional credits and features.</li>
          <li>Credits are non-transferable and expire at the end of each billing cycle.</li>
          <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
          <li>Refunds are handled in accordance with applicable law.</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          You retain ownership of content you create using the Service, subject to
          the licenses of the underlying AI models. You grant us a limited license
          to display content you choose to make public on the platform.
        </p>

        <h2>7. Prohibited Uses</h2>
        <ul>
          <li>Attempting to reverse-engineer or exploit the Service.</li>
          <li>Using the Service to generate illegal content.</li>
          <li>Automated scraping or excessive API usage beyond your plan limits.</li>
          <li>Reselling generated content as AI generation services.</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties. We are not liable
          for any indirect, incidental, or consequential damages arising from your
          use of the Service.
        </p>

        <h2>9. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these
          terms. You may cancel your account at any time through the Settings page.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the Service
          after changes constitutes acceptance of the new terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          For questions about these Terms, please contact us at support@egaku-ai.com.
        </p>
      </main>
    </>
  );
}
