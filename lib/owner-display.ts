import { Profile } from './types';
import { User } from './types';

export function ownerDisplayName(profile: Profile | null, user: User): string {
  return profile?.business_name || profile?.display_name || `@${user.handle}`;
}

export function ownerLongName(profile: Profile | null, user: User): string {
  if (profile?.business_name && profile?.display_name) {
    return `${profile.business_name} (${profile.display_name})`;
  }
  return profile?.business_name || profile?.display_name || `@${user.handle}`;
}
