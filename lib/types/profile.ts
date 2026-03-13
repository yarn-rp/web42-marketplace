export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
  bio: string | null
  website: string | null
  github_handle: string | null
  profile_readme: string | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  stripe_payouts_enabled: boolean
  created_at: string
}
