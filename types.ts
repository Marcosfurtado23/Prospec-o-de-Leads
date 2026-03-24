
export interface Lead {
  id: string;
  name: string;
  industry: string;
  website: string;
  description: string;
  potentialScore: number;
  contactSuggestions: string[];
  location: string;
  email?: string;
  phone?: string;
  recentNews?: { title: string; url: string }[];
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  whatsapp?: string;
  socialMediaAnalysis?: {
    quality: 'excelente' | 'bom' | 'regular' | 'ruim' | 'inexistente';
    observations: string;
  };
}

export interface MyCompany {
  name: string;
  industry: string;
  website: string;
  description: string;
}

export interface SearchParams {
  targetType?: 'companies' | 'professionals' | 'freelance_opportunities';
  niche: string;
  location: string;
  country?: string;
  allCountries?: boolean;
  city?: string;
  state?: string;
  allCities?: boolean;
  allStates?: boolean;
  companySize?: string;
  intent?: string;
  servicesOffered?: string; // New field for services offered
}

export interface GroundingSource {
  title: string;
  uri: string;
}