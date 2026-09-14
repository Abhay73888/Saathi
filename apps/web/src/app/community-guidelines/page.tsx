import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Community Guidelines — Saath' };

export default function CommunityGuidelines() {
  return (
    <LegalPage
      title="Community Guidelines"
      updated="6 September 2026"
      sections={[
        { heading: 'What Saath is for', body: ['Coffee, dinner, movies, events, city walks, gaming, study sessions, conversation and other legitimate social companionship — in public places or online, between verified adults.'] },
        { heading: 'Zero tolerance', body: ['Sexual services or solicitation of any kind. Trafficking, coercion or exploitation. Illegal drugs or activity. Violence, threats or harassment. Scams, payment fraud or attempts to move payment off-platform. Underage use or attempts to bypass age verification. Violations lead to permanent ban and may be reported to authorities.'] },
        { heading: 'Meeting rules', body: ['Choose busy, public venues. Share your plans with someone you trust and use check-in. Do not share home addresses before a confirmed booking. Do not share OTPs, UPI PINs or financial credentials.'] },
        { heading: 'Chat rules', body: ['Keep conversations respectful and on-platform. Contact details unlock after a confirmed booking. Automated moderation flags scams, threats and payment bypass attempts — flagged messages are reviewed by humans before action.'] },
        { heading: 'Reviews', body: ['Reviews must reflect genuine completed bookings. Coercive, fake or abusive reviews are removed. Rate your experience honestly across communication, punctuality, respect and overall experience.'] },
        { heading: 'Reporting', body: ['Report anything that violates these guidelines from any profile, message or booking. HIGH-risk reports (threats, prohibited services, fraud) jump the queue and page the safety team.'] },
      ]}
    />
  );
}
