export {
  fetchDashboardOverviewFromApi as getDashboardOverview,
  fetchPlatformStatusesFromApi as getPlatformStatuses,
} from '@/services/backend-adapter';

import { fetchDashboardOverviewFromApi } from '@/services/backend-adapter';

export async function getSystemStatuses() {
  const overview = await fetchDashboardOverviewFromApi();
  return overview.systems;
}
