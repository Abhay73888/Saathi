import Link from 'next/link';
import { Button, ShieldIcon } from '@/components/ui';
import { CompanionCardSkeleton } from '@/components/CompanionCard';
import { FeaturedCompanions } from '@/components/FeaturedCompanions';
import { CompanionStories } from '@/components/CompanionStories';
import { DualPinDemo } from '@/components/DualPinDemo';
import { ACTIVITY_EXPERIENCES } from '@saath/shared';

const QUICK_TRENDING = [
  { icon: '🎸', label: 'Concert & Gig Buddy', interest: 'concerts' },
  { icon: '☕', label: 'Artisan Coffee & Deep Talks', interest: 'coffee' },
  { icon: '🎬', label: 'IMAX Blockbuster Pal', interest: 'movies' },
  { icon: '🏃', label: 'Weekend Badminton & Run', interest: 'fitness' },
  { icon: '🎲', label: 'Board Game Cafes', interest: 'gaming' },
  { icon: '💼', label: 'Silent Co-working Sprint', interest: 'study' },
];

const TRUST_PILLARS = [
  {
    icon: '🛡️',
    title: 'Strictly Platonic & Safe',
    desc: 'Zero-tolerance anti-escort defense. All bookings are strictly for public social activities and genuine conversations.',
  },
  {
    icon: '🪪',
    title: '100% Govt ID Verified',
    desc: 'Every companion undergoes biometric age and government-issued ID validation before their profile is published.',
  },
  {
    icon: '📍',
    title: 'Public Venues & Dual PIN',
    desc: 'Meetups only happen in verified public venues (cafes, malls, parks). Sessions unlock only after mutual 4-digit PIN verification.',
  },
  {
    icon: '🆘',
    title: 'Live GPS SOS & Dispatch',
    desc: 'Instant 1-tap SOS alerts our 24/7 safety team and sends emergency WhatsApp alerts with live Google Maps coordinates.',
  },
];

const USE_CASES = [
  {
    quote: 'Just moved to Bangalore for my tech job and knew nobody. Booked a companion for a weekend specialty coffee crawl in Indiranagar — felt completely natural and safe!',
    author: 'Aakash S., Software Engineer',
    city: 'Bengaluru',
    tag: 'Relocation & City Crawl',
  },
  {
    quote: 'None of my friends wanted to go to the music festival. Found an awesome music lover here, shared cab & food, and had the time of my life!',
    author: 'Pooja M., UX Designer',
    city: 'Delhi NCR',
    tag: 'Music & Concerts',
  },
  {
    quote: 'Needed an accountability buddy for weekend marathon training and morning runs. Super professional, respectful, and punctual.',
    author: 'Rohan K., Product Manager',
    city: 'Mumbai',
    tag: 'Fitness & Sports',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white pt-12 pb-20 md:py-28">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute -left-20 -bottom-40 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" aria-hidden />
        
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs md:text-sm font-bold text-teal-100 mb-6 shadow-inner">
            <ShieldIcon className="w-4 h-4 text-emerald-300" />
            <span>India&apos;s First Verified Platonic Companionship Platform · 18+ Only</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.15]">
            Never miss out on experiences <span className="text-teal-300 underline decoration-teal-400/50 underline-offset-4">because you have no one to go with.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-teal-100/90 max-w-2xl leading-relaxed">
            Book identity-verified, respectful companions for concerts, cafe crawls, movies, fitness, city walks, and social events. Safe, platonic, and pay-by-the-hour.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/explore">
              <Button variant="light" size="lg" className="shadow-lg hover:shadow-xl text-teal-900 font-extrabold px-8">
                Explore Activity Partners →
              </Button>
            </Link>
            <Link href="/become-a-companion">
              <Button variant="secondary" size="lg" className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20">
                Become a Companion (Earn ₹500+/hr)
              </Button>
            </Link>
          </div>

          {/* Quick trending pills */}
          <div className="mt-10 pt-6 border-t border-white/15">
            <p className="text-xs uppercase tracking-widest text-teal-300/80 font-bold mb-3">
              Popular right now:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TRENDING.map((item) => (
                <Link
                  key={item.label}
                  href={`/explore?interest=${item.interest}`}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:scale-105"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Spotlight Stories (Mobile-First Story Circles) */}
      <div className="max-w-6xl mx-auto px-0 sm:px-4 -mt-6">
        <CompanionStories />
      </div>

      {/* Activity Experiences Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-700 font-black">Curated Hangouts</span>
            <h2 className="font-display text-3xl md:text-4xl text-teal-950 font-bold mt-1">
              Choose by experience
            </h2>
          </div>
          <Link href="/explore" className="text-sm font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1">
            Browse all categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ACTIVITY_EXPERIENCES.map((exp) => (
            <Link
              key={exp.id}
              href={`/explore?interest=${exp.slug}`}
              className="group bg-white rounded-2xl p-5 border border-sand-200/80 shadow-card hover:shadow-pop hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl p-2.5 bg-sand-100 rounded-xl inline-block group-hover:scale-110 transition-transform">
                  {exp.icon}
                </span>
                <h3 className="font-display font-bold text-base text-sand-900 mt-3 group-hover:text-teal-700 transition-colors">
                  {exp.label}
                </h3>
                <p className="text-xs text-sand-600 mt-1 line-clamp-2 leading-relaxed">
                  {exp.tagline}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-100 flex items-center justify-between text-[11px] font-bold text-teal-700">
                <span>{exp.popularVibe}</span>
                <span className="group-hover:translate-x-1 transition-transform">Find →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Verified Companions */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-700 font-black">Handpicked &amp; Top Rated</span>
            <h2 className="font-display text-3xl md:text-4xl text-teal-950 font-bold mt-1">
              Popular companions near you
            </h2>
            <p className="text-sand-600 text-sm mt-1">Identity verified, background cleared, and rated 4.8+ by previous clients.</p>
          </div>
          <Link href="/explore" className="text-sm font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1">
            See all companions →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeaturedCompanions
            fallback={
              <>
                <CompanionCardSkeleton />
                <CompanionCardSkeleton />
                <CompanionCardSkeleton />
              </>
            }
          />
        </div>
      </section>

      {/* Trust & Safety Charter Band */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-sand-900 text-white p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
              🛡️ Zero-Tolerance Policy
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              Safety isn&apos;t a feature. <br />It is the foundation of Saath.
            </h2>
            <p className="mt-4 text-sm md:text-base text-teal-100/90 leading-relaxed">
              We engineered a multi-layered verification and dispatch system to make platonic social hangouts completely secure, comfortable, and dignified.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {TRUST_PILLARS.map((p) => (
              <div key={p.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <span className="text-2xl">{p.icon}</span>
                <h3 className="font-bold text-base text-white mt-2">{p.title}</h3>
                <p className="text-xs md:text-sm text-teal-200/80 mt-1.5 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Dual-PIN Simulator */}
          <div className="mt-10">
            <DualPinDemo />
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-teal-200/70">
              Need immediate help or have questions? Our Safety Response Desk is operational 24/7.
            </div>
            <Link href="/safety" className="text-xs font-bold text-teal-300 hover:text-white underline underline-offset-4">
              Read our full Safety &amp; Trust Guidelines →
            </Link>
          </div>
        </div>
      </section>

      {/* Real Social Stories / Testimonials */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-teal-700 font-black">Real Experiences</span>
          <h2 className="font-display text-3xl md:text-4xl text-teal-950 font-bold mt-1">
            Why urban India hangs out with Saath
          </h2>
          <p className="text-sand-600 text-sm mt-2">
            Breaking social awkwardness and making cities friendlier, one meetup at a time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {USE_CASES.map((u, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-sand-200 shadow-card flex flex-col justify-between">
              <div>
                <span className="bg-teal-50 text-teal-800 border border-teal-200/60 rounded-full px-3 py-1 text-xs font-bold inline-block mb-4">
                  {u.tag}
                </span>
                <p className="text-sm text-sand-800 italic leading-relaxed">
                  &ldquo;{u.quote}&rdquo;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-sand-100">
                <p className="font-bold text-sm text-sand-900">{u.author}</p>
                <p className="text-xs text-sand-500">{u.city}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Conversion CTA */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-teal-50 border border-teal-200/80 p-8 md:p-12 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-teal-950 font-bold">
            Ready to find your companion for this weekend?
          </h2>
          <p className="text-sand-700 text-base max-w-xl mx-auto mt-3">
            Browse hundreds of background-checked companions in your city. Transparent pricing, zero hidden fees, and instant booking.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/explore">
              <Button size="lg" className="px-8 font-bold">
                Find Companions Now
              </Button>
            </Link>
            <Link href="/community-guidelines">
              <Button variant="secondary" size="lg">
                View Community Charter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

