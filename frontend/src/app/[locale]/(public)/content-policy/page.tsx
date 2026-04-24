import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Policy — EGAKU AI",
  description: "Content Policy and NSFW guidelines for EGAKU AI platform.",
};

export default function ContentPolicyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Title Block */}
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-widest text-purple-400 uppercase mb-3">Legal</p>
          <h1 className="text-4xl font-bold">Content Policy &amp; NSFW Guidelines</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Effective: April 2026 &middot; Last updated: April 17, 2026
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mt-6" />
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

        <section>
        <p>
          EGAKU AI is committed to providing a creative platform that respects both
          artistic freedom and legal compliance across jurisdictions. This Content
          Policy outlines what is permitted, restricted, and absolutely prohibited
          on our platform.
        </p>

        <h2>1. Absolutely Prohibited Content (Zero Tolerance)</h2>
        <p>
          The following content is <strong>permanently and unconditionally banned</strong> on
          EGAKU AI. Any attempt to generate, upload, or distribute such content will
          result in immediate account termination and may be reported to law enforcement.
        </p>
        <ul>
          <li>
            <strong>Child Sexual Abuse Material (CSAM):</strong> Any depiction of
            minors (under 18) in sexual, nude, or exploitative situations &mdash;
            whether real, AI-generated, illustrated, or fictional. This includes but
            is not limited to content described using terms such as &quot;loli,&quot;
            &quot;shota,&quot; or similar.
          </li>
          <li>
            <strong>Non-consensual intimate imagery:</strong> Deepfakes or AI-generated
            images depicting real, identifiable persons in sexual situations without
            their explicit consent.
          </li>
          <li>
            <strong>Content promoting terrorism, extreme violence, or hate speech</strong> targeting
            protected groups.
          </li>
        </ul>
        <p>
          These prohibitions are enforced automatically through prompt filtering and
          are not subject to override by any user, plan tier, or region setting.
        </p>

        <h2>2. NSFW (Adult) Content</h2>
        <p>
          EGAKU AI permits the generation of adult (NSFW) content for users who meet
          the following conditions:
        </p>
        <ul>
          <li>You must be 18 years of age or older.</li>
          <li>You must complete age verification on your account.</li>
        </ul>
        <p>
          NSFW generation uses advanced AI models with safety parameters configured to
          allow artistic and adult content. All generated content is subject to the
          absolute prohibitions listed in Section 1 above.
        </p>

        <h2>3. Public Gallery vs. Private Use</h2>
        <h3>3.1 Public Gallery (Explore)</h3>
        <p>
          When you publish a generation to the public Explore gallery, it becomes
          visible to other users. Public NSFW content is subject to regional legal
          requirements:
        </p>
        <ul>
          <li>
            <strong>Most regions (US, EU, etc.):</strong> NSFW content may be published
            publicly with an R18/NSFW tag. Content is blurred by default and requires
            the viewer to opt in.
          </li>
          <li>
            <strong>Japan (JP):</strong> Nude content may be published with an R18 tag.
            Depiction of uncensored genitalia in publicly shared content requires
            obscuration (mosaic) in compliance with Japanese obscenity laws (Article 175
            of the Penal Code). <strong>EGAKU AI applies automatic mosaic processing
            to NSFW content when published publicly from Japan.</strong> The original
            uncensored version remains accessible only to you (the creator) for private
            use. The public gallery only displays the censored version.
          </li>
          <li>
            <strong>South Korea (KR):</strong> Korean Criminal Code Articles 243-244
            prohibit creation, possession, and distribution of obscene material. NSFW
            generation is not available for users in South Korea. NSFW content is also
            hidden from KR viewers in the public gallery.
          </li>
        </ul>
        <p>
          You are responsible for correctly tagging your content as NSFW when
          publishing. Failure to tag explicit content may result in content removal
          or account restrictions.
        </p>

        <h3>3.2 Private Use &amp; Personal Downloads</h3>
        <p>
          Content that you generate and keep private (not published to the public
          gallery) or download to your personal device is <strong>your sole
          responsibility</strong>. EGAKU AI does not apply regional content
          restrictions (such as mosaic processing) to privately generated or
          downloaded content.
        </p>
        <p>
          <strong>Japanese users:</strong> Even when public versions are auto-mosaiced,
          you can still access the original uncensored version of your own generations
          for private use. Personal possession is at your own discretion under Japanese
          law (which generally permits private possession of obscene material — only
          public distribution is prohibited under Article 175).
        </p>
        <p>
          <strong>Korean users:</strong> NSFW generation is blocked entirely. Korean
          Criminal Code prohibits both creation and possession of obscene material.
          We cannot offer NSFW generation to KR users as a result.
        </p>
        <p>
          By downloading or saving generated content for personal use, you
          acknowledge and agree that:
        </p>
        <ul>
          <li>
            You are solely responsible for compliance with the laws of your
            jurisdiction regarding possession, storage, and use of such content.
          </li>
          <li>
            EGAKU AI bears no liability for how you use, store, distribute, or
            display privately downloaded content.
          </li>
          <li>
            Redistribution of downloaded content remains subject to the absolute
            prohibitions in Section 1 and the intellectual property terms in our
            Terms of Service.
          </li>
        </ul>

        <h2>4. Regional Compliance</h2>
        <p>
          EGAKU AI operates in compliance with applicable international laws and
          regional regulations, including but not limited to:
        </p>
        <ul>
          <li>
            <strong>United States:</strong> 18 U.S.C. &sect; 2256 (PROTECT Act) &mdash;
            prohibition on virtual child pornography.
          </li>
          <li>
            <strong>European Union:</strong> Directive 2011/93/EU &mdash; combating
            sexual abuse of children. GDPR for data protection.
          </li>
          <li>
            <strong>Japan:</strong> Article 175 of the Penal Code (obscenity);
            Act on Regulation of Child Prostitution and Child Pornography.
          </li>
          <li>
            <strong>International:</strong> Optional Protocol to the Convention on
            the Rights of the Child (OPSC); IWF (Internet Watch Foundation)
            standards.
          </li>
        </ul>

        <h2>5. Age Verification</h2>
        <p>
          Access to NSFW features requires age verification. By verifying your age,
          you confirm under penalty of perjury that you are 18 years of age or older.
          We reserve the right to request additional verification at any time.
        </p>

        <h2>6. Content Moderation &amp; Reporting</h2>
        <p>
          We employ automated keyword filtering and model-level safety mechanisms to
          prevent the generation of prohibited content. If you encounter content on
          the public gallery that violates this policy, please report it using the
          report button on the content page or via our <a href="/contact" className="text-purple-400 hover:underline">Contact Form</a>.
        </p>
        <p>
          Reports of CSAM or non-consensual intimate imagery are treated with the
          highest priority and may be forwarded to NCMEC (National Center for
          Missing &amp; Exploited Children) or equivalent national authorities.
        </p>

        <h2>7. Enforcement</h2>
        <p>Violations of this policy may result in:</p>
        <ul>
          <li>Removal of offending content without notice.</li>
          <li>Temporary or permanent account suspension.</li>
          <li>Reporting to law enforcement where required by law.</li>
          <li>Forfeiture of remaining credits or subscription balance.</li>
        </ul>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Content Policy as laws and regulations evolve. Material
          changes will be announced via email or in-app notification. Continued use
          of the Service after changes constitutes acceptance of the updated policy.
        </p>

        <h2>9. DMCA &amp; Takedown Requests</h2>
        <p>
          If you believe content on EGAKU AI infringes your copyright, depicts
          you without consent, or otherwise violates your rights, you may submit
          a takedown request through our <a href="/contact" className="text-purple-400 hover:underline">Contact Form</a>.
        </p>
        <p>Please include:</p>
        <ul>
          <li>A description of the content and its URL on EGAKU AI.</li>
          <li>Your contact information (name, email).</li>
          <li>A statement that you have a good faith belief the use is unauthorized.</li>
          <li>For DMCA claims: a statement under penalty of perjury that the information
              is accurate and that you are the rights holder or authorized to act on their behalf.</li>
        </ul>
        <p>
          We will review all takedown requests within <strong>48 hours</strong> and
          remove infringing content promptly. Repeat infringers will have their
          accounts terminated.
        </p>
        <p>
          <strong>Deepfake / Non-consensual imagery:</strong> Reports of AI-generated
          content depicting real persons without consent are treated with the same
          urgency as CSAM reports and may result in immediate content removal and
          account termination.
        </p>

        <h2>10. Reporting Content</h2>
        <p>
          Every item in the public gallery has a <strong>Report</strong> button.
          Click it to flag content that violates this policy. Reports are reviewed
          by our team and actioned within 48 hours. Critical reports (CSAM, deepfake,
          non-consensual imagery) are prioritized for immediate review.
        </p>

        <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact</h2>
        <div className="rounded-lg border border-muted bg-card p-4">
          <p className="text-foreground font-medium">EGAKU AI — Content Policy</p>
          <p>Contact: <a href="/contact" className="text-purple-400 hover:text-purple-300">Contact Form</a></p>
          <p>Website: https://egaku-ai.com</p>
        </div>
        </section>
        </div>
      </main>
    </>
  );
}
