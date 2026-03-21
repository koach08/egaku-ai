import { Header } from "@/components/layout/header";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>

        <h2>1. Information We Collect</h2>
        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your email address and account
          credentials. If you sign in via third-party providers (Google, Discord),
          we receive your profile information from those services.
        </p>
        <h3>Usage Data</h3>
        <p>
          We collect information about your use of the Service, including prompts
          submitted, generation parameters, and credit usage.
        </p>
        <h3>Payment Information</h3>
        <p>
          Payment processing is handled by Stripe. We do not store your credit card
          details directly. Stripe&apos;s privacy policy applies to payment data.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the Service.</li>
          <li>To process payments and manage subscriptions.</li>
          <li>To enforce content policies and prevent abuse.</li>
          <li>To improve the Service and develop new features.</li>
          <li>To communicate service updates and important notices.</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share data with:
        </p>
        <ul>
          <li><strong>Service providers:</strong> Stripe (payments), Supabase (database), Cloudflare (CDN).</li>
          <li><strong>Legal requirements:</strong> When required by law or to protect our rights.</li>
          <li><strong>Public content:</strong> Content you choose to publish publicly is visible to all users.</li>
        </ul>

        <h2>4. Generated Content</h2>
        <p>
          Prompts and generated images/videos are stored on our servers to enable
          your gallery and generation history. Content marked as private is only
          accessible to you. Content you publish publicly is visible to all users.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. You can delete
          individual generations from your gallery at any time. Upon account deletion,
          we will remove your data within 30 days.
        </p>

        <h2>6. Data Security</h2>
        <p>
          We use industry-standard security measures including encrypted connections
          (TLS), secure authentication, and access controls. However, no system is
          100% secure.
        </p>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data.</li>
          <li>Correct inaccurate data.</li>
          <li>Delete your account and associated data.</li>
          <li>Export your data.</li>
          <li>Object to processing of your data.</li>
        </ul>

        <h2>8. Cookies &amp; Analytics</h2>
        <p>
          We use essential cookies for authentication and session management.
          These are always active and necessary for the Service to function.
        </p>
        <p>
          With your consent, we also use Google Analytics 4 to understand how
          the Service is used and to improve it. Analytics cookies are only
          loaded after you accept cookies via the consent banner. You can
          change your preference at any time by clearing your browser storage
          and revisiting the site.
        </p>
        <p>
          We do not use advertising cookies for behavioral targeting.
          IP addresses collected by Google Analytics are anonymized.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Service is not intended for users under 13 years of age. NSFW features
          require age verification (18+).
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of
          significant changes via email or through the Service.
        </p>

        <h2>11. Contact</h2>
        <p>
          For privacy-related questions, contact us at privacy@egaku-ai.com.
        </p>
      </main>
    </>
  );
}
