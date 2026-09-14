import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy — Saath' };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="6 September 2026"
      sections={[
        { heading: 'What we collect', body: ['Account data: email, phone (verified via OTP), display name, age confirmation. Profile data: photos, bio, interests, languages and city. Booking & payment data: bookings, payment status from our payment processor (card numbers never touch our systems). Safety data: check-in status, one-time SOS location if you trigger it, trusted contacts you choose.'] },
        { heading: 'Identity documents', body: ['Identity verification is performed by a third-party identity provider on their hosted flow. We receive only a pass/fail, age assertion and a reference number. We do not store images of identity documents.'] },
        { heading: 'Location', body: ['We never continuously track you. Live location is captured only when you actively share it during an active checked-in booking, is visible only to safety staff and your chosen trusted contacts, and is automatically purged within 24 hours after the session.'] },
        { heading: 'How data is used', body: ['To operate bookings, payments, matching, safety moderation and support; to prevent fraud and prohibited activity; to send transactional notifications. Moderation (including automated risk scoring) assists human reviewers — automated systems do not issue permanent bans.'] },
        { heading: 'Sharing', body: ['Payment data goes to RBI-regulated payment processors. Verification data goes to our identity provider. We do not sell personal data. Lawful requests from authorities are assessed and minimised.'] },
        { heading: 'Your rights (DPDP Act, 2023)', body: ['You may access, correct or request deletion of your personal data, withdraw consent, and request a copy of your data, via the profile settings or the grievance contact. Deletion is subject to records we must retain for legal and payment reconciliation purposes.'] },
      ]}
    />
  );
}
