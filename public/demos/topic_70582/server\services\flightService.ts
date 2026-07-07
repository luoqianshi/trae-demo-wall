import type { Route, Segment, Layover, RouteType } from '../../shared/types';
import { API_CONFIG } from '../config/apiConfig';

interface RawFlightData {
  flightNo: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  duration: number;
}

export class FlightService {
  private baseURL = API_CONFIG.VARIFLIGHT.BASE_URL;
  private apiKey = API_CONFIG.VARIFLIGHT.API_KEY;

  async searchFlights(
    from: string,
    to: string,
    date: string
  ): Promise<RawFlightData[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseURL}/flights/search?from=${from}&to=${to}&date=${date}&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Variflight API error:', error);
      return [];
    }
  }

  async getFlightDetails(flightNo: string, date: string): Promise<RawFlightData | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseURL}/flights/detail?flightNo=${flightNo}&date=${date}&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Variflight API error:', error);
      return null;
    }
  }
}

export const flightService = new FlightService();