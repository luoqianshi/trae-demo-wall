export interface Travel {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  aiAnalysisStatus: 'completed' | 'processing' | 'pending';
  aiProgress: number;
  days: number;
  aiData?: AIDataSource;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  image?: string;
  aiAdded?: boolean;
}

export interface TimelineItem {
  date: string;
  day: string;
  activities: Activity[];
}

export interface Hotel {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  price: number;
  rating: number;
  image: string;
}

export interface Flight {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
}

export interface Expense {
  category: string;
  amount: number;
  color: string;
}

export interface MemoryCard {
  id: string;
  image: string;
  title: string;
  description: string;
  date: string;
}

export interface AIDataSource {
  photos: number;
  videos: number;
  orders: number;
  aiEvents: number;
  distance: number;
  locations: number;
  days: number;
  happinessMoment?: HappinessMoment;
}

export interface HappinessMoment {
  date: string;
  time: string;
  location: string;
  image: string;
  reason: string;
  photosTaken: number;
  stayDuration: string;
}

export interface DiaryEntry {
  date: string;
  paragraphs: string[];
}

export interface AIDiaryContent {
  entries: DiaryEntry[];
  summary: string;
}

export interface JournalEntry {
  date: string;
  newPhotos: number;
  aiSummary: string;
  locationCount: number;
  stayDuration: string;
  insight: string;
}

export interface TravelCompletion {
  totalDays: number;
  recordedDays: number;
  photos: number;
  videos: number;
  locations: number;
  events: number;
}

export interface TravelDetail extends Travel {
  timeline: TimelineItem[];
  hotels: Hotel[];
  flights: Flight[];
  photos: Photo[];
  aiDiary: string | AIDiaryContent;
  expenses: Expense[];
  memoryCards: MemoryCard[];
  journalEntries: JournalEntry[];
  completion: TravelCompletion;
  mapTrack: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
    points: { lat: number; lng: number; name: string }[];
  };
}

export interface AIAnalysisStep {
  id: string;
  label: string;
  detail: string;
  icon: string;
  duration: number;
}

export interface PendingImport {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  files: { name: string; type: string; size: string }[];
  steps: AIAnalysisStep[];
  resultId: string;
}
