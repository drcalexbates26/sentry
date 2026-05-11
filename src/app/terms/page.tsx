import type { Metadata } from "next";
import { LegalShell } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Sentry by Dark Rock",
  description: "The agreement that governs your use of Sentry by Dark Rock Labs.",
};

const LAST_UPDATED = "May 8, 2026";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service ("<strong>Terms</strong>") govern your use of the Sentry platform operated by Dark Rock
        Labs, Inc. ("<strong>Dark Rock</strong>"). By creating an account or otherwise using Sentry, you agree to these
        Terms on behalf of yourself and any organization you represent.
      </p>

      <h2>1. The service</h2>
      <p>
        Sentry is a multi-tenant SaaS platform for cyber-resilience operations. We grant you a non-exclusive,
        non-transferable, revocable license to access and use Sentry for your internal business purposes during your
        subscription.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You are responsible for credentials, for actions taken under your account, and for keeping registration details
        current. Sharing a single user account across multiple individuals is prohibited.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to: (a) reverse-engineer Sentry or attempt to access source code; (b) probe or attack the service
        outside an authorized security test; (c) upload unlawful, infringing, or malicious content; (d) use Sentry to
        violate the rights or privacy of any third party. Violations may result in suspension or termination.</p>

      <h2>4. Subscription and fees</h2>
      <p>
        Paid plans renew automatically until canceled. Fees are non-refundable except as required by law. We may revise
        pricing on renewal with at least 30 days' notice.
      </p>

      <h2>5. Customer data</h2>
      <p>
        You retain all rights to the data you upload ("<strong>Customer Data</strong>"). You grant us a limited license
        to host, process, and transmit Customer Data solely to deliver the service. Our processing of personal data is
        governed by our Data Processing Agreement (DPA).
      </p>

      <h2>6. Confidentiality</h2>
      <p>
        Each party agrees to protect the other's confidential information with the same care it uses for its own
        (and no less than reasonable care).
      </p>

      <h2>7. Warranties &amp; disclaimers</h2>
      <p>
        We will perform the service with reasonable skill and care. <strong>EXCEPT AS EXPRESSLY STATED, SENTRY IS
        PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</strong>, including merchantability, fitness for a particular
        purpose, and non-infringement.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        Each party's aggregate liability for any claims arising under these Terms is limited to fees paid to Dark Rock
        in the 12 months preceding the claim. Neither party is liable for indirect, incidental, or consequential
        damages, including lost profits or loss of data, except where prohibited by law.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        Each party will defend the other against third-party claims arising from its breach of these Terms, subject to
        prompt notice, sole control of the defense, and reasonable cooperation.
      </p>

      <h2>10. Term &amp; termination</h2>
      <p>
        Either party may terminate for material breach if uncured after 30 days' notice. On termination, your access
        ceases and we delete Customer Data in accordance with the Privacy Policy.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA, without regard to conflicts of law. Disputes
        are resolved exclusively in the state or federal courts of Delaware.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms; material changes will be announced by email at least 30 days before they take
        effect.
      </p>

      <h2>13. Contact</h2>
      <p>
        Dark Rock Labs, Inc. ·{" "}
        <a href="mailto:legal@darkrocksecurity.com">legal@darkrocksecurity.com</a>
      </p>
    </LegalShell>
  );
}
