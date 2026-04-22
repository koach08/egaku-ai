import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — EGAKU AI",
  description: "Privacy Policy for EGAKU AI platform.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Title Block */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-widest text-purple-400 uppercase mb-3">Legal</p>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Effective: April 2026 &middot; Last updated: April 17, 2026
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mt-6" />
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <p className="text-foreground">
              EGAKU AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform at egaku-ai.com (the &quot;Service&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">1.1 Account Information</h3>
            <p>When you create an account, we collect your email address. If you authenticate via third-party providers (Google, Discord, GitHub, X/Twitter), we receive basic profile information (name, email, avatar) as authorized by you through those services.</p>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">1.2 Usage Data</h3>
            <p>We collect information about your interactions with the Service, including: text prompts submitted for generation, generation parameters (model, resolution, seed), credit usage and transaction history, and pages visited.</p>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">1.3 Payment Information</h3>
            <p>Payment processing is handled by <strong>Stripe, Inc.</strong> and <strong>NOWPayments</strong> (cryptocurrency). We do not store credit card numbers or bank account details on our servers. Please refer to their respective privacy policies for information on how they handle your payment data.</p>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">1.4 Device &amp; Network Information</h3>
            <p>We may collect your IP address (for region detection and rate limiting), browser type, operating system, and device identifiers. IP-based geolocation is used to apply regional pricing and content compliance rules.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="py-2 pr-4 text-foreground font-semibold">Purpose</th>
                    <th className="py-2 text-foreground font-semibold">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/50">
                  <tr><td className="py-2 pr-4">Provide and operate the Service</td><td className="py-2">Contract performance</td></tr>
                  <tr><td className="py-2 pr-4">Process payments and manage subscriptions</td><td className="py-2">Contract performance</td></tr>
                  <tr><td className="py-2 pr-4">Enforce content policies and prevent abuse</td><td className="py-2">Legitimate interest</td></tr>
                  <tr><td className="py-2 pr-4">Apply regional pricing and legal compliance</td><td className="py-2">Legal obligation</td></tr>
                  <tr><td className="py-2 pr-4">Send service updates and security notices</td><td className="py-2">Legitimate interest</td></tr>
                  <tr><td className="py-2 pr-4">Improve the Service and develop features</td><td className="py-2">Legitimate interest</td></tr>
                  <tr><td className="py-2 pr-4">Analytics (with consent)</td><td className="py-2">Consent</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Data Sharing &amp; Third Parties</h2>
            <p className="mb-3">We do not sell your personal data. We share data only with the following categories of service providers:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "Supabase", role: "Database & authentication" },
                { name: "Stripe", role: "Payment processing" },
                { name: "NOWPayments", role: "Cryptocurrency payments" },
                { name: "Cloudflare", role: "CDN & DDoS protection" },
                { name: "Vercel", role: "Frontend hosting" },
                { name: "Railway", role: "Backend hosting" },
                { name: "fal.ai / Novita.ai", role: "AI model inference" },
                { name: "Google Analytics", role: "Usage analytics (with consent)" },
              ].map((p) => (
                <div key={p.name} className="rounded-lg border border-muted bg-card/50 p-3">
                  <p className="text-foreground font-medium text-xs">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Generated Content</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Prompts and generated images/videos are stored on our servers to provide your gallery and generation history.</li>
              <li>Content marked as private is accessible only to you.</li>
              <li>Content you publish to the public gallery is visible to all users and may be indexed by search engines.</li>
              <li>NSFW content published from Japan is automatically censored (mosaic) for public display in compliance with Japanese law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Retention &amp; Deletion</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>We retain your data for as long as your account remains active.</li>
              <li>You can delete individual generations from your gallery at any time.</li>
              <li>Upon account deletion, we will remove your personal data within 30 days. Backup copies may persist for up to 90 days.</li>
              <li>Anonymized, aggregated data (e.g., total generation counts) may be retained indefinitely.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>TLS encryption for all data in transit</li>
              <li>Encrypted database connections (Supabase)</li>
              <li>Row-Level Security (RLS) policies isolating user data</li>
              <li>API key hashing (SHA-256) for developer tokens</li>
              <li>Rate limiting and IP-based abuse prevention</li>
            </ul>
            <p className="mt-3">While we take reasonable precautions, no system is completely secure. We cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the following rights:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Access your personal data",
                "Correct inaccurate information",
                "Delete your account and data",
                "Export your data (data portability)",
                "Object to data processing",
                "Withdraw consent (analytics)",
              ].map((right) => (
                <div key={right} className="flex items-center gap-2 rounded-lg border border-muted bg-card/50 p-2.5">
                  <span className="text-green-400 text-xs">✓</span>
                  <span className="text-xs text-foreground">{right}</span>
                </div>
              ))}
            </div>
            <p className="mt-3">To exercise these rights, contact us at privacy@egaku-ai.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Cookies &amp; Analytics</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Essential cookies:</strong> Required for authentication and session management. Always active.</li>
              <li><strong>Analytics cookies:</strong> Google Analytics 4 is loaded only after explicit consent via the cookie banner. IP addresses are anonymized.</li>
              <li>We do not use advertising cookies or behavioral targeting.</li>
              <li>You can change your cookie preference at any time by clearing browser storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. NSFW features are restricted to users who have completed age verification (18+).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. International Data Transfers</h2>
            <p>
              Your data may be processed in countries other than your country of residence, including the United States and the European Union, where our hosting and infrastructure providers operate. We ensure appropriate safeguards are in place for cross-border data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. The &quot;Last updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact</h2>
            <div className="rounded-lg border border-muted bg-card p-4">
              <p className="text-foreground font-medium">EGAKU AI — Data Protection</p>
              <p>Contact: <a href="/contact" className="text-purple-400 hover:underline">Contact Form</a></p>
              <p>Website: https://egaku-ai.com</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
