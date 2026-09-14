'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, Badge, Button, Stars } from './ui';

interface StoryCompanion {
  id: string;
  name: string;
  city: string;
  vibe: string;
  activity: string;
  icon: string;
  rating: number;
  rate: string;
  bio: string;
  online: boolean;
}

const FEATURED_STORIES: StoryCompanion[] = [
  {
    id: 'comp_ananya',
    name: 'Ananya V.',
    city: 'Bengaluru · Indiranagar',
    vibe: 'Music & Indie Gigs',
    activity: 'Concert Pal',
    icon: '🎸',
    rating: 4.9,
    rate: '₹600/hr',
    bio: 'Attending weekend live sets at Fandom and antiSOCIAL. Looking for indie rock & electronic music enthusiasts to split cabs and vibe together!',
    online: true,
  },
  {
    id: 'comp_kabir',
    name: 'Kabir M.',
    city: 'Mumbai · Bandra',
    vibe: 'Specialty Coffee',
    activity: 'Cafe Explorer',
    icon: '☕',
    rating: 5.0,
    rate: '₹550/hr',
    bio: 'Pour-over and flat white connoisseur. Exploring hidden micro-roasteries across Bandra and Fort. Great listener for startup and tech talks.',
    online: true,
  },
  {
    id: 'comp_zoya',
    name: 'Zoya K.',
    city: 'Delhi NCR · Hauz Khas',
    vibe: 'Art & Heritage',
    activity: 'Museum Walk',
    icon: '🏛️',
    rating: 4.8,
    rate: '₹500/hr',
    bio: 'Art history graduate exploring NGMA, Lodhi Art District, and heritage monuments. Happy to take aesthetic photos of you too!',
    online: false,
  },
  {
    id: 'comp_arjun',
    name: 'Arjun D.',
    city: 'Bengaluru · Koramangala',
    vibe: 'Badminton & Fitness',
    activity: 'Morning Run',
    icon: '🏃',
    rating: 4.9,
    rate: '₹500/hr',
    bio: 'Looking for a regular weekend morning badminton partner or 5k/10k run buddy around Cubbon Park. Punctual, energetic, and supportive.',
    online: true,
  },
  {
    id: 'comp_priya',
    name: 'Priya S.',
    city: 'Pune · Koregaon Park',
    vibe: 'Board Games & Trivia',
    activity: 'Game Night',
    icon: '🎲',
    rating: 5.0,
    rate: '₹650/hr',
    bio: 'Catan, Ticket to Ride, and strategy board game geek. Regular at local board game cafes. Super warm, welcoming, and friendly!',
    online: true,
  },
  {
    id: 'comp_rohit',
    name: 'Rohit T.',
    city: 'Hyderabad · Jubilee Hills',
    vibe: 'Culinary Crawl',
    activity: 'Street Food Pal',
    icon: '🥘',
    rating: 4.8,
    rate: '₹550/hr',
    bio: 'Exploring midnight dosa lanes, authentic biryani spots, and Irani chai cafes. Great companion for foodies who hate dining alone!',
    online: true,
  },
];

export function CompanionStories() {
  const [selectedStory, setSelectedStory] = useState<StoryCompanion | null>(null);

  return (
    <section className="relative">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="font-display font-bold text-base text-sand-900 tracking-tight">
            Spotlight Companions
          </h3>
        </div>
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
          Available Today
        </span>
      </div>

      {/* Stories horizontal carousel */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x snap-mandatory">
        {FEATURED_STORIES.map((story, idx) => (
          <button
            key={story.id}
            onClick={() => setSelectedStory(story)}
            className="flex flex-col items-center flex-none w-[76px] group snap-start text-left focus:outline-none"
            aria-label={`View ${story.name}'s profile spotlight`}
          >
            {/* Story gradient ring */}
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-marigold-500 via-teal-500 to-teal-700 group-hover:scale-105 transition-transform duration-200">
              <div className="p-0.5 bg-white rounded-full">
                <Avatar name={story.name} size="md" index={idx} />
              </div>
              {/* Activity badge pill */}
              <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full shadow-sm border border-sand-200 w-5 h-5 flex items-center justify-center">
                {story.icon}
              </span>
            </div>

            <span className="text-xs font-bold text-sand-900 mt-2 truncate w-full text-center group-hover:text-teal-700 transition-colors">
              {story.name.split(' ')[0]}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold truncate w-full text-center">
              {story.activity}
            </span>
          </button>
        ))}
      </div>

      {/* Story Quick-Sheet Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeUp"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-pop overflow-hidden border border-sand-200/80 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-teal-800 to-teal-950 text-white p-6 pb-12">
              <button
                onClick={() => setSelectedStory(null)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
              >
                ✕
              </button>

              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-teal-100 mb-3">
                <span>{selectedStory.icon}</span>
                <span>{selectedStory.activity}</span>
              </div>

              <h4 className="font-display font-bold text-2xl text-white">
                {selectedStory.name}
              </h4>
              <p className="text-xs text-teal-200 mt-0.5">
                📍 {selectedStory.city}
              </p>
            </div>

            {/* Overlapping Avatar & details */}
            <div className="p-6 pt-0 relative">
              <div className="flex items-end justify-between -mt-8 mb-4">
                <div className="p-1 bg-white rounded-full shadow-md">
                  <Avatar name={selectedStory.name} size="lg" index={1} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-sand-500 font-bold uppercase tracking-wider">Hourly Rate</span>
                  <span className="text-xl font-black text-teal-900">{selectedStory.rate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Stars value={selectedStory.rating} />
                <Badge tone="verified" className="text-xs">100% Govt ID Verified</Badge>
                {selectedStory.online && (
                  <Badge tone="online" className="text-xs">Active Now</Badge>
                )}
              </div>

              <p className="text-sm text-sand-700 leading-relaxed mb-6 bg-sand-50 p-3.5 rounded-2xl border border-sand-200/60">
                &ldquo;{selectedStory.bio}&rdquo;
              </p>

              <div className="flex gap-3">
                <Link
                  href="/explore"
                  className="flex-1"
                  onClick={() => setSelectedStory(null)}
                >
                  <Button size="lg" className="w-full text-base font-extrabold shadow-md">
                    Book Companion →
                  </Button>
                </Link>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="px-5 py-3 rounded-lg border border-sand-200 text-sm font-bold text-sand-700 hover:bg-sand-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
