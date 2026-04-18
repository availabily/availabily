import { Profile } from './types';

export type QuickProfile = {
  display_name: string;
  business_name: string;
  location?: string;
};

export function isProfileCompleteForQuoting(profile: Profile | null): boolean {
  if (!profile) return false;
  return !!(profile.display_name?.trim() || profile.business_name?.trim());
}
