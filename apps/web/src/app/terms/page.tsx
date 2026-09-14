import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Terms & Conditions — Saath' };

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="6 September 2026"
      sections={[
        { heading: '1. Adults-only platform', body: ['Saath is available only to persons aged 18 or older. By creating an account you confirm you are at least 18 years old. Age is verified through government identity verification for companions.'] },
        { heading: '2. Legitimate social companionship only', body: ['Saath facilitates companionship for social, recreational and conversational activities in public settings or online. Sexual services, erotic services, illegal services, trafficking, coercion, drug-related activity or violence are strictly prohibited and result in immediate and permanent ban, with reports to authorities where required.'] },
        { heading: '3. Bookings and payments', body: ['All bookings and payments must occur through the platform. Off-platform payment solicitation is prohibited and voids platform protection. Cancellation refunds follow the schedule displayed at checkout (100% more than 48 hours before, 50% between 24–48 hours, 0% within 24 hours, unless a dispute ruling says otherwise).'] },
        { heading: '4. Code of conduct', body: ['Treat every member with respect. Harassment, hate speech, threats, unsolicited contact, discrimination, or requests for prohibited services may lead to warning, suspension or ban. Meet in well-lit public places for in-person sessions.'] },
        { heading: '5. Safety obligations', body: ['Use the check-in/check-out tools and trusted-contact sharing where appropriate. Report concerning behaviour promptly. Saath provides safety tools but does not guarantee the conduct of any individual; exercise the same caution you would with any new acquaintance.'] },
        { heading: '6. Accounts', body: ['Provide accurate information. One account per person. Impersonation, fake verification or fraudulent payment instruments are prohibited and may be reported to law enforcement.'] },
        { heading: '7. Liability', body: ['Saath acts as an intermediary marketplace. To the extent permitted by law, platform liability is limited to platform fees collected for the relevant booking. Nothing in these terms excludes liability for fraud or personal injury caused by negligence of the platform.'] },
        { heading: '8. Grievance officer (India)', body: ['Complaints may be directed to the grievance officer via the Safety Center, under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.'] },
      ]}
    />
  );
}
