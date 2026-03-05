// app/legal/privacy/page.tsx
export const metadata = { title: "Privacy Policy – Lyrgenic" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 space-y-8 text-foreground">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          1. Information We Collect
        </h2>
        <p>We collect the following types of information:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong className="text-foreground/80">Account data</strong>: name,
            email address, and encrypted password (or OAuth tokens if you sign
            in with Google).
          </li>
          <li>
            <strong className="text-foreground/80">Audio files</strong>:
            beat/instrumental files you upload are stored in cloud object
            storage (AWS S3 or Cloudflare R2) and are used solely to provide
            analysis and generation services.
          </li>
          <li>
            <strong className="text-foreground/80">Project data</strong>:
            project settings, generated lyrics, version history, and generation
            parameters.
          </li>
          <li>
            <strong className="text-foreground/80">Usage data</strong>: API call
            logs, generation counts, and error logs used to operate and improve
            the Service.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          2. How We Use Your Information
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>To provide, operate, and improve the Service</li>
          <li>To detect and prevent abuse or fraudulent activity</li>
          <li>To send transactional emails (account verification)</li>
          <li>To respond to support requests</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          3. AI Processing
        </h2>
        <p>
          When you request lyrics generation, your project parameters (genre,
          vibe, topic, etc.) and audio analysis results are sent to Groq&apos;s
          API to generate lyric suggestions. Audio files are{" "}
          <strong className="text-foreground/80">not</strong> transmitted to
          Groq. Please review{" "}
          <a
            href="https://groq.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            Groq&apos;s Privacy Policy
          </a>{" "}
          for details on how they handle API data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          4. Data Retention
        </h2>
        <p>
          Your projects and generated lyrics are retained until you delete them
          or close your account. Uploaded audio files may be automatically
          deleted from storage after 90 days of project inactivity to manage
          costs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          5. Third-Party Services
        </h2>
        <p>
          We use the following third-party services that may process your data:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong className="text-foreground/80">Groq</strong> — lyrics
            generation AI
          </li>
          <li>
            <strong className="text-foreground/80">AWS / Cloudflare</strong> —
            file storage
          </li>
          <li>
            <strong className="text-foreground/80">Google</strong> — optional
            OAuth sign-in
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          6. Your Rights
        </h2>
        <p>You may at any time:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Request a copy of your data (data portability)</li>
          <li>Request deletion of your account and associated data</li>
          <li>Correct inaccurate personal information</li>
        </ul>
        <p>
          To exercise these rights, contact{" "}
          <a
            href="mailto:privacy@lyrgenic.com"
            className="text-purple-400 hover:underline"
          >
            privacy@lyrgenic.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
        <p>
          We use session cookies to keep you logged in. We do not use tracking
          or advertising cookies. You can disable cookies in your browser, but
          this will prevent you from staying signed in.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          8. Changes to This Policy
        </h2>
        <p>
          We may update this policy from time to time. We will notify you of
          significant changes by email or via an in-app notice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at{" "}
          <a
            href="mailto:privacy@lyrgenic.com"
            className="text-purple-400 hover:underline"
          >
            privacy@lyrgenic.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
