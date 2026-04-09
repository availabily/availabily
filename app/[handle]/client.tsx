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
import { AvailabilityResponse, Profile } from '@/lib/types';
import Link from 'next/link';

interface AvailabilityPageClientProps {
  handle: string;
}

type PageState = 'loading' | 'error' | 'select-time' | 'booking-form' | 'success';

interface ProfileResponse {
  profile: Omit<Profile, 'user_phone' | 'created_at' | 'updated_at'> | null;
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

  // Sticky CTA observer
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
    // Smooth scroll to form
    // Brief delay to allow DOM to render the form before scrolling
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

  // ─── Profile-first layout ───
  if (hasProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10">
        <div className="max-w-lg mx-auto px-5 py-8 pb-28 md:pb-10">
          {/* Brand mark */}
          <div className="mb-6">
            <Link href="/" className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity inline-block">
              <span className="text-indigo-400">AM</span>
              <span className="text-slate-500"> or </span>
              <span className="text-indigo-400">PM?</span>
            </Link>
          </div>

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="space-y-4 animate-pulse">
              <div className="h-48 rounded-3xl bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-200" />
              <div className="h-24 rounded-2xl bg-slate-200" />
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Page not found</h2>
              <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Set up your own profile →
              </Link>
            </div>
          )}

          {/* Profile + booking content */}
          {pageState !== 'loading' && pageState !== 'error' && (
            <div className="space-y-5">
              {/* A. Profile Hero Card */}
              <div ref={heroRef}>
                <ProfileHeroCard profile={profile!} />
              </div>

              {/* B. Gallery */}
              {profile!.gallery_urls.length > 0 && (
                <SwipeGallery images={profile!.gallery_urls} />
              )}

              {/* C. Bio */}
              {profile!.bio && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{profile!.bio}</p>
                </div>
              )}

              {/* C. Prompt Cards */}
              {profile!.prompt_blocks.length > 0 && (
                <div className="space-y-3">
                  {profile!.prompt_blocks.map((block) => (
                    <PromptCard key={block.id} block={block} />
                  ))}
                </div>
              )}

              {/* D. Availability / Booking section */}
              {pageState === 'select-time' && availability && (
                <AvailabilityCard
                  days={availability.days}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSlotSelect}
                />
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
                <RequestSentState displayName={displayName} />
              )}
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

  // ─── Fallback: Original minimal layout (no profile) ───
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10">
      <div className="max-w-lg mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity mb-4 inline-block">
            <span className="text-indigo-400">AM</span>
            <span className="text-slate-500"> or </span>
            <span className="text-indigo-400">PM?</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            <span className="text-indigo-500">@</span>{handle}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Availability</p>
        </div>

        {/* Loading */}
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

        {/* Error */}
        {pageState === 'error' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Page not found</h2>
            <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Create your own page →
            </Link>
          </div>
        )}

        {/* Time selection */}
        {pageState === 'select-time' && availability && (
          <div className="space-y-6">
            {availability.days.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">😴</div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">No availability</h2>
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
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-slate-500 mb-4">
                        {selectedDay.day_name} — {selectedDay.slots.length} slot{selectedDay.slots.length !== 1 ? 's' : ''} available
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

        {/* Booking form */}
        {pageState === 'booking-form' && selectedDate && selectedSlot && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Your details</h2>
            <RequestForm
              handle={handle}
              date={selectedDate}
              startTime={selectedSlot}
              onSuccess={handleSuccess}
              onBack={handleBack}
            />
          </div>
        )}

        {/* Success */}
        {pageState === 'success' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Request sent!</h2>
            <p className="text-slate-500 mb-8">
              Waiting for confirmation from @{handle}. You&apos;ll hear back soon.
            </p>
            <div className="pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-400 mb-3">Want your own availability link?</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create yours →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
