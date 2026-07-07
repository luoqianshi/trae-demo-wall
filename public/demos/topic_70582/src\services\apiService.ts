const API_BASE_URL = '/api';

export interface FlightSearchResult {
  success: boolean;
  data: RawFlightData[];
  count: number;
}

export interface RawFlightData {
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

export const apiService = {
  async searchFlights(from: string, to: string, date: string): Promise<FlightSearchResult> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flights/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`
      );
      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      return { success: false, data: [], count: 0 };
    }
  },

  async getFlightDetail(flightNo: string, date: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flights/detail?flightNo=${encodeURIComponent(flightNo)}&date=${date}`
      );
      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      return { success: false, data: null };
    }
  },
};