import { create } from 'zustand';

export type Role = 'company' | 'creator' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  country: string;
  // Company specific
  sector?: string;
  website?: string;
  description?: string;
  logo?: string;
  // Creator specific
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  socials?: SocialAccount[];
  reliabilityScore?: number;
  walletBalance?: number;
  walletPending?: number;
}

export interface SocialAccount {
  id: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook' | 'X' | 'Snapchat';
  url: string;
  isVerified: boolean;
  followers: number;
  engagementRate: number;
  username: string;
}

interface StoreState {
  currentUser: User | null;
  users: User[];
  login: (email: string, role: Role) => void;
  logout: () => void;
  register: (user: Partial<User>) => void;
  updateProfile: (updates: Partial<User>) => void;
  addSocialAccount: (social: SocialAccount) => void;
  verifySocialAccount: (socialId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentUser: null,
  users: [
    {
      id: '1',
      email: 'test@company.com',
      role: 'company',
      name: 'Tech Africa',
      country: 'Sénégal',
      sector: 'Technologie',
      description: 'Startup innovante basée à Dakar.',
    },
    {
      id: '2',
      email: 'test@creator.com',
      role: 'creator',
      name: 'Awa Fall',
      firstName: 'Awa',
      lastName: 'Fall',
      country: 'Sénégal',
      bio: 'Créatrice lifestyle et tech.',
      reliabilityScore: 4.8,
      walletBalance: 150,
      walletPending: 50,
      socials: [
        {
          id: 's1',
          platform: 'Instagram',
          url: 'https://instagram.com/awafall',
          isVerified: true,
          followers: 15000,
          engagementRate: 4.2,
          username: '@awafall'
        }
      ]
    }
  ],
  login: (email, role) => set((state) => {
    const user = state.users.find(u => u.email === email && u.role === role);
    if (user) {
      return { currentUser: user };
    }
    // Auto-register for demo purposes if not found
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      role,
      name: email.split('@')[0],
      country: 'Sénégal',
      walletBalance: 0,
      walletPending: 0,
      socials: [],
      reliabilityScore: 5.0,
    };
    return {
      users: [...state.users, newUser],
      currentUser: newUser
    };
  }),
  logout: () => set({ currentUser: null }),
  register: (user) => set((state) => {
    const newUser = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      walletBalance: 0,
      walletPending: 0,
      socials: [],
      reliabilityScore: 5.0,
    } as User;
    return {
      users: [...state.users, newUser],
      currentUser: newUser
    };
  }),
  updateProfile: (updates) => set((state) => {
    if (!state.currentUser) return state;
    const updatedUser = { ...state.currentUser, ...updates };
    return {
      currentUser: updatedUser,
      users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    };
  }),
  addSocialAccount: (social) => set((state) => {
    if (!state.currentUser || state.currentUser.role !== 'creator') return state;
    const updatedUser = {
      ...state.currentUser,
      socials: [...(state.currentUser.socials || []), social]
    };
    return {
      currentUser: updatedUser,
      users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    };
  }),
  verifySocialAccount: (socialId) => set((state) => {
    if (!state.currentUser || state.currentUser.role !== 'creator') return state;
    const updatedSocials = state.currentUser.socials?.map(s => 
      s.id === socialId ? { ...s, isVerified: true, followers: Math.floor(Math.random() * 50000) + 1000, engagementRate: (Math.random() * 5 + 1).toFixed(1) as any } : s
    );
    const updatedUser = { ...state.currentUser, socials: updatedSocials };
    return {
      currentUser: updatedUser,
      users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    };
  })
}));
