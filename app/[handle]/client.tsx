'use client';

import { useState, useEffect, useRef } from 'react';
import { ProfileHeroCard } from '@/components/profile-hero-card';
import { SwipeGallery } from '@/components/swipe-gallery';
import { PromptCard } from '@/components/prompt-card';
import { AvailabilityCard } from '@/components/availability-card';
import { LockInForm } from '@/components/lock-in-form';
import { RequestSentState } from '@/components/request-sent-state';
import { StickyBookingCTA } from '@/components/sticky-booking-cta';
import { DaySelector } from '@/components/day-selector';
import { TimeSlotGrid } from '@/components/time-slot-grid';
import { RequestForm } from '@/components/request-form';
import { QuickFactsRow } from '@/components/quick-facts-row';
import { ProfileFooter } from '@/components/profile-footer';
import { AvailabilityResponse, Profile } from '@/lib/types';
import Link from 'next/link';

interface AvailabilityPageClientProps {
  handle: string;
}

type PageState = 'loading' | 'error' | 'select-time' | 'booking-form' | 'success';

interface ProfileResponse {
  profile: Omit<Profile, 'user_phone' | 'created_at' | 'updated_at'> | null;
}

const BIO_TRUNCATE_LENGTH = 120;

function ExpandableBio({ bio, firstName }: { bio: string; firstName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isTruncatable = bio.length > BIO_TRUNCATE_LENGTH;
  const displayText = isTruncatable && !expanded ? bio.slice(0, BIO_TRUNCATE_LENGTH).trimEnd() + '…' : bio;
  const label = firstName ? `About ${firstName}` : 'About';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-5 py-5">
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-2">
        {label}
      </p>
      <p className="text-[15px] text-slate-700 leading-relaxed">
        {displayText}
      </p>
      {isTruncatable && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export function AvailabilityPageClient({ handle }: AvailabilityPageClientProps) {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);

  // Fetch availability + profile in parallel
  useEffect(() => {
    Promise.all([
      fetch(`/api/availability/${handle}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json() as Promise<AvailabilityResponse>;
        }),
      fetch(`/api/profile/${handle}`)
        .then(res => res.json() as Promise<ProfileResponse>)
        .catch(() => ({ profile: null })),
    ])
      .then(([availData, profileData]) => {
        setAvailability(availData);
        if (profileData.profile) {
          setProfile({
            user_phone: '',
            ...profileData.profile,
            gallery_urls: profileData.profile.gallery_urls ?? [],
            trust_bullets: profileData.profile.trust_bullets ?? [],
            prompt_blocks: profileData.profile.prompt_blocks ?? [],
          } as Profile);
        }
        if (availData.days.length > 0) {
          setSelectedDate(availData.days[0].date);
        }
        setPageState('select-time');
      })
      .catch(() => {
        setErrorMessage(`We couldn't find @${handle}.`);
        setPageState('error');
      });
  }, [handle]);

  // Sticky CTA observer — only show once user has scrolled past the hero
  useEffect(() => {
    if (!profile || !heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCTA(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [profile, pageState]);

  const handleSlotSelect = (startTime: string) => {
    setSelectedSlot(startTime);
    setPageState('booking-form');
    // Brief delay to let the form mount before scrolling to it
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleBack = () => {
    setSelectedSlot(null);
    setPageState('select-time');
  };

  const handleSuccess = () => {
    setPageState('success');
  };

  const scrollToBooking = () => {
    const el = document.getElementById('pick-a-time');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectedDay = availability?.days.find(d => d.date === selectedDate);
  const displayName = profile?.display_name || profile?.business_name || `@${handle}`;
  const hasProfile = !!profile && !!(profile.display_name || profile.business_name);

  // Check if there are available slots today
  const today = new Date().toISOString().slice(0, 10);
  const hasAvailabilityToday = !!(availability?.days.find(d => d.date === today && d.slots.length > 0));

  // Derive first name for personalised "About Jake" label
  const firstName = profile?.display_name?.split(' ')[0];

  // ─── Profile-first layout ───
  if (hasProfile) {
    const gallery = profile!.gallery_urls;
    const showBio = !!profile!.bio;
    const showPrompts = profile!.prompt_blocks.length > 0;
    const firstGalleryImage = gallery[0] ?? null;

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/50 to-violet-50/40">
        {/* Blurred hero background image */}
        {firstGalleryImage && (
          <div
            aria-hidden
            className="fixed inset-0 -z-10 pointer-events-none"
          >
            <img
              src={firstGalleryImage}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-2xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white/95" />
          </div>
        )}

        <div className="max-w-[480px] mx-auto px-5 py-7 pb-28 md:pb-12">
          {/* Brand mark */}
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity inline-block"
            >
              <span className="text-brand-500">AM</span>
              <span className="text-slate-500"> or </span>
              <span className="text-brand-500">PM?</span>
            </Link>
          </div>

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="space-y-4 animate-pulse">
              <div className="h-56 rounded-[28px] bg-slate-200/70" />
              <div className="h-40 rounded-2xl bg-slate-200/70" />
              <div className="h-32 rounded-2xl bg-slate-200/70" />
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
                Page not found
              </h2>
              <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Set up your own profile →
              </Link>
            </div>
          )}

          {/* Profile + booking content */}
          {pageState !== 'loading' && pageState !== 'error' && (
            <div className="stagger space-y-5">
              {/* A. Profile Hero Card */}
              <div ref={heroRef}>
                <ProfileHeroCard
                  profile={profile!}
                  handle={handle}
                  hasAvailabilityToday={hasAvailabilityToday}
                />
              </div>

              {/* B. Gallery (always renders; shows placeholder cards when empty) */}
              <SwipeGallery images={gallery} showPlaceholderWhenEmpty />

              {/* Quick Facts Row */}
              <QuickFactsRow
                serviceCategory={profile!.service_category}
                location={profile!.location}
                responseTimeMinutes={60}
                trustBulletsCount={profile!.trust_bullets.length}
              />

              {/* C. Bio */}
              {showBio && (
                <ExpandableBio bio={profile!.bio} firstName={firstName} />
              )}

              {/* C. Prompt Cards */}
              {showPrompts && (
                <div className="space-y-3">
                  {profile!.prompt_blocks.map((block) => (
                    <PromptCard key={block.id} block={block} />
                  ))}
                </div>
              )}

              {/* D. Availability / Booking section */}
              {pageState === 'select-time' && availability && (
                <div id="pick-a-time">
                  <AvailabilityCard
                    days={availability.days}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSlotSelect}
                  />
                </div>
              )}

              {/* E. Lock-in Form */}
              {pageState === 'booking-form' && selectedDate && selectedSlot && (
                <div ref={bookingRef}>
                  <LockInForm
                    handle={handle}
                    date={selectedDate}
                    startTime={selectedSlot}
                    onSuccess={handleSuccess}
                    onBack={handleBack}
                  />
                </div>
              )}

              {/* F. Request Sent */}
              {pageState === 'success' && (
                <RequestSentState
                  displayName={displayName}
                  date={selectedDate ?? undefined}
                  startTime={selectedSlot ?? undefined}
                />
              )}

              {/* Footer */}
              <ProfileFooter />
            </div>
          )}

          {/* Sticky mobile CTA */}
          <StickyBookingCTA
            visible={showStickyCTA && pageState === 'select-time'}
            onClick={scrollToBooking}
          />
        </div>
      </main>
    );
  }

  // ─── Fallback: Minimal layout (handle exists but no profile set up) ───
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40">
      <div className="max-w-[480px] mx-auto px-5 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity mb-4 inline-block"
          >
            <span className="text-brand-500">AM</span>
            <span className="text-slate-500"> or </span>
            <span className="text-brand-500">PM?</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            <span className="text-brand-500">@</span>
            {handle}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Availability</p>
        </div>

        {pageState === 'loading' && (
          <div className="space-y-4 animate-pulse">
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 w-16 rounded-2xl bg-slate-200" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-200" />
              ))}
            </div>
          </div>
        )}

        {pageState === 'error' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="font-display text-lg font-bold text-slate-900 mb-2">
              Page not found
            </h2>
            <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Create your own page →
            </Link>
          </div>
        )}

        {pageState === 'select-time' && availability && (
          <div className="space-y-6">
            {availability.days.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center">
                <div className="text-4xl mb-4">😴</div>
                <h2 className="font-display text-lg font-bold text-slate-900 mb-2">
                  No availability
                </h2>
                <p className="text-slate-500 text-sm">
                  @{handle} doesn&apos;t have any open slots in the next 14 days.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Pick a time
                  </h2>
                  <DaySelector
                    days={availability.days}
                    selectedDate={selectedDate}
                    onSelect={setSelectedDate}
                  />
                </div>

                {selectedDay && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-5">
                      <h3 className="text-sm font-semibold text-slate-500 mb-4">
                        {selectedDay.day_name} — {selectedDay.slots.length} slot
                        {selectedDay.slots.length !== 1 ? 's' : ''} available
                      </h3>
                      <TimeSlotGrid
                        slots={selectedDay.slots}
                        selectedSlot={selectedSlot}
                        onSelect={handleSlotSelect}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {pageState === 'booking-form' && selectedDate && selectedSlot && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-6">Your details</h2>
            <RequestForm
              handle={handle}
              date={selectedDate}
              startTime={selectedSlot}
              onSuccess={handleSuccess}
              onBack={handleBack}
            />
          </div>
        )}

        {pageState === 'success' && (
          <RequestSentState
            displayName={`@${handle}`}
            date={selectedDate ?? undefined}
            startTime={selectedSlot ?? undefined}
          />
        )}
      </div>
    </main>
  );
}
