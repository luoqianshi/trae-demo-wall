import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Target, Clock, MapPin } from "lucide-react";
import type { SpatialPlanResponse } from "../lib/api";

const USER_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%230ea5e9' opacity='0.9'/%3E%3Ccircle cx='16' cy='16' r='8' fill='white'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%230ea5e9'/%3E%3C/svg%3E";

const TASK_ICON_URL = (priority: string) => {
  const colors: Record<string, string> = {
    high: "%23ef4444",
    medium: "%23f97316",
    low: "%2322c55e",
  };
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='16' fill='${colors[priority] || "%236b7280"}' opacity='0.95'/%3E%3Ccircle cx='18' cy='18' r='12' fill='rgba(255,255,255,0.1)'/%3E%3Ctext x='18' y='24' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3E%E2%98%85%3C/text%3E%3C/svg%3E`;
};

const userMarkerIcon = L.icon({
  iconUrl: USER_ICON_URL,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const taskMarkerIcon = (priority: string) =>
  L.icon({
    iconUrl: TASK_ICON_URL(priority),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);

  return null;
}

interface MapViewProps {
  spatialPlan: SpatialPlanResponse | null;
  userLocation: [number, number];
  selectedTask: string | null;
  onSelectTask: (id: string) => void;
}

export default function MapView({
  spatialPlan,
  userLocation,
  selectedTask,
  onSelectTask,
}: MapViewProps) {
  const mapRef = useRef<any>(null);

  const getPathCoordinates = (): [number, number][] => {
    if (!spatialPlan?.tasks) return [];
    const coords: [number, number][] = [userLocation];
    spatialPlan.tasks.forEach((task) => {
      coords.push([task.latitude, task.longitude]);
    });
    return coords;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <MapContainer
      ref={mapRef}
      center={userLocation}
      zoom={15}
      className="w-full h-full"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapController center={userLocation} />

      <Marker position={userLocation} icon={userMarkerIcon}>
        <Popup>
          <div className="text-center min-w-[180px]">
            <div className="font-bold text-blue-600 mb-1 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" />
              我的位置
            </div>
            <div className="text-sm text-gray-600">
              {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>

      {spatialPlan?.tasks && spatialPlan.tasks.length > 0 && (
        <Polyline
          positions={getPathCoordinates()}
          color="#0071e3"
          weight={3}
          opacity={0.6}
          dashArray="8, 12"
        />
      )}

      {spatialPlan?.tasks.map((task) => (
        <Marker
          key={task.id}
          position={[task.latitude, task.longitude]}
          icon={taskMarkerIcon(task.priority)}
          eventHandlers={{
            click: () => onSelectTask(task.id),
          }}
        >
          <Popup>
            <div className="min-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                <span className="font-bold text-gray-800 text-lg">{task.name}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.suggested_duration}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {task.type}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
