'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/image-uploader';
import { PromptBlock } from '@/lib/types';
import { cn } from '@/lib/cn';

const PROMPT_SUGGESTIONS = [
  'What people book me for',
  'My style of service',
  'What to expect',
  'Best fit clients',
  'Why people choose me',
];

export interface ProfileFormData {
  display_name: string;
  business_name: string;
  headline: string;
  bio: string;
  location: string;
  trust_bullets: string[];
  prompt_blocks: PromptBlock[];
  avatar_url: string;
  gallery_urls: string[];
}

interface ProfileSetupSectionProps {
  data: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
  className?: string;
}

export function ProfileSetupSection({ data, onChange, className }: ProfileSetupSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const update = useCallback((partial: Partial<ProfileFormData>) => {
    onChange({ ...data, ...partial });
  }, [data, onChange]);

  const updateBullet = (index: number, value: string) => {
    const bullets = [...data.trust_bullets];
    bullets[index] = value;
    update({ trust_bullets: bullets });
  };

  const updatePromptBlock = (index: number, field: 'prompt' | 'answer', value: string) => {
    const blocks = [...data.prompt_blocks];
    blocks[index] = { ...blocks[index], [field]: value };
    update({ prompt_blocks: blocks });
  };

  const addPromptBlock = () => {
    if (data.prompt_blocks.length >= 3) return;
    update({
      prompt_blocks: [
        ...data.prompt_blocks,
        { id: `pb-${Date.now()}`, prompt: '', answer: '' },
      ],
    });
  };

  const removePromptBlock = (index: number) => {
    const blocks = data.prompt_blocks.filter((_, i) => i !== index);
    update({ prompt_blocks: blocks });
  };

  const handleAvatarUpload = useCallback(async (file: File): Promise<string | null> => {
    const url = await fileToDataUrl(file);
    update({ avatar_url: url });
    return url;
  }, [update]);

  const handleGalleryUpload = useCallback(async (file: File): Promise<string | null> => {
    const url = await fileToDataUrl(file);
    update({ gallery_urls: [...data.gallery_urls, url] });
    return url;
  }, [data.gallery_urls, update]);

  const handleGalleryRemove = useCallback((index: number) => {
    const urls = data.gallery_urls.filter((_, i) => i !== index);
    update({ gallery_urls: urls });
  }, [data.gallery_urls, update]);

  const handleAvatarRemove = useCallback(() => {
    update({ avatar_url: '' });
  }, [update]);

  return (
    <div className={cn('border-2 border-slate-100 rounded-2xl overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <h3 className="text-base font-bold text-slate-900">Make it yours</h3>
          <p className="text-sm text-slate-500 mt-0.5">Help customers feel confident booking with you</p>
        </div>
        <svg
          className={cn('w-5 h-5 text-slate-400 transition-transform duration-200', expanded && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-5">
          {/* Avatar */}
          <ImageUploader
            label="Profile photo or logo"
            images={data.avatar_url ? [data.avatar_url] : []}
            maxImages={1}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            hint="Square works best"
          />

          {/* Gallery */}
          <ImageUploader
            label="Gallery images"
            images={data.gallery_urls}
            maxImages={5}
            onUpload={handleGalleryUpload}
            onRemove={handleGalleryRemove}
            hint="Show off your work, your space, or your team"
          />

          {/* Name fields */}
          <Input
            id="display_name"
            label="Display name"
            placeholder="e.g., Jake Martinez"
            value={data.display_name}
            onChange={(e) => update({ display_name: e.target.value })}
            autoComplete="name"
          />

          <Input
            id="business_name"
            label="Business name"
            placeholder="e.g., Jake's Mobile Detail"
            value={data.business_name}
            onChange={(e) => update({ business_name: e.target.value })}
            autoComplete="organization"
          />

          <Input
            id="headline"
            label="Short headline"
            placeholder="e.g., Premium auto detailing in Maui"
            value={data.headline}
            onChange={(e) => update({ headline: e.target.value })}
          />

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-slate-700">
              Short bio
            </label>
            <textarea
              id="bio"
              placeholder="Tell customers a little about you or your business (300 chars max)"
              value={data.bio}
              onChange={(e) => update({ bio: e.target.value.slice(0, 300) })}
              maxLength={300}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
            />
            <p className="text-xs text-slate-400 text-right">{data.bio.length}/300</p>
          </div>

          {/* Location */}
          <Input
            id="location"
            label="Location"
            placeholder="e.g., Lahaina, HI"
            value={data.location}
            onChange={(e) => update({ location: e.target.value })}
          />

          {/* Trust bullets */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Trust bullets (up to 3)</label>
            <p className="text-xs text-slate-400 -mt-1">Short highlights that build confidence</p>
            {[0, 1, 2].map((idx) => (
              <input
                key={idx}
                type="text"
                placeholder={['e.g., 5-star rated', 'e.g., Licensed & insured', 'e.g., 500+ clients served'][idx]}
                value={data.trust_bullets[idx] || ''}
                onChange={(e) => updateBullet(idx, e.target.value.slice(0, 50))}
                maxLength={50}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ))}
          </div>

          {/* Prompt blocks */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-700">Prompt cards</label>
            <p className="text-xs text-slate-400 -mt-2">Add up to 3 questions and answers to give customers a feel for what you offer</p>

            {data.prompt_blocks.map((block, idx) => (
              <div key={block.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Prompt {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removePromptBlock(idx)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Question</label>
                  <select
                    value={PROMPT_SUGGESTIONS.includes(block.prompt) ? block.prompt : '__custom__'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        updatePromptBlock(idx, 'prompt', '');
                      } else {
                        updatePromptBlock(idx, 'prompt', val);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PROMPT_SUGGESTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__custom__">Write your own…</option>
                  </select>
                  {!PROMPT_SUGGESTIONS.includes(block.prompt) && (
                    <input
                      type="text"
                      placeholder="Your custom question"
                      value={block.prompt}
                      onChange={(e) => updatePromptBlock(idx, 'prompt', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Answer</label>
                  <textarea
                    placeholder="Your answer..."
                    value={block.answer}
                    onChange={(e) => updatePromptBlock(idx, 'answer', e.target.value.slice(0, 500))}
                    maxLength={500}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-xs text-slate-400 text-right">{block.answer.length}/500</p>
                </div>
              </div>
            ))}

            {data.prompt_blocks.length < 3 && (
              <button
                type="button"
                onClick={addPromptBlock}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors text-left"
              >
                + Add a prompt card
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Client-side file → data URL (for preview and demo mode)
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        // Resize to max 1200px wide, preserving aspect ratio
        const maxWidth = 1200;
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
