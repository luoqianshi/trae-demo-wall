import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouteStore, TILE_LAYER_PRESETS } from '../../store/useRouteStore';
import type { RoutePoint } from '../../types';
import { generateShape } from '../../utils/shapes';
import { haversineDistance, bearing } from '../../utils/geo';
import { getPaceSegments } from '../../utils/sportsData';

export function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const rawLineRef = useRef<L.Polyline | null>(null);
  const snappedLineRef = useRef<L.Polyline[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const arrowMarkersRef = useRef<L.Marker[]>([]);
  const editMarkersRef = useRef<L.Marker[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);

  const {
    drawMode,
    currentShape,
    displayPoints,
    rawPoints,
    shapeSize,
    isProcessing,
    settings,
    addPoint,
    setRawPoints,
    setIsDrawing,
    finishDrawing,
    undoPoint,
    snapRoute,
    generateSportsData,
    updatePoint,
    insertPoint,
    removePoint,
  } = useRouteStore();

  const [shapePreview, setShapePreview] = useState<{ lat: number; lng: number } | null>(null);
  const shapePreviewRef = useRef<L.Polyline | null>(null);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current) return;
    // HMR 或严格模式下容器可能已被初始化，先强制清理
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [39.9042, 116.4074],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
    });

    const currentSettings = useRouteStore.getState().settings;
    const initialPreset = TILE_LAYER_PRESETS.find(p => p.id === currentSettings.tileLayerId) || TILE_LAYER_PRESETS[0];
    const initialTileUrl = currentSettings.tileLayerId === 'custom' && currentSettings.customTileUrl
      ? currentSettings.customTileUrl
      : initialPreset.url;
      
    tileLayerRef.current = L.tileLayer(initialTileUrl, {
      attribution: initialPreset.attribution,
      subdomains: initialPreset.subdomains || 'abc',
      maxZoom: initialPreset.maxZoom,
    }).addTo(map);

    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addTo(map);

    mapRef.current = map;
    (window as any)._mapInstance = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { drawMode: mode, currentShape: shape, displayPoints: dp } = useRouteStore.getState();
      
      if (mode === 'click') {
        useRouteStore.getState().addPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (mode === 'shape' && shape) {
        const shapePoints = generateShape(
          shape, 
          e.latlng.lat, 
          e.latlng.lng, 
          useRouteStore.getState().shapeSize
        );
        useRouteStore.getState().setRawPoints(shapePoints);
        useRouteStore.getState().setDrawMode('pan');
      } else if (mode === 'edit' && dp.length >= 2) {
        const insertResult = findNearestSegment(dp, e.latlng.lat, e.latlng.lng);
        if (insertResult) {
          useRouteStore.getState().insertPoint(insertResult.index + 1, { lat: e.latlng.lat, lng: e.latlng.lng });
        }
      }
    });

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      const { drawMode: mode, displayPoints: dp } = useRouteStore.getState();
      e.originalEvent.preventDefault();
      
      if (mode === 'click' || mode === 'free') {
        useRouteStore.getState().undoPoint();
      } else if (mode === 'edit' && dp.length > 2) {
        const nearest = findNearestPoint(dp, e.latlng.lat, e.latlng.lng);
        if (nearest && nearest.distance < 20) {
          useRouteStore.getState().removePoint(nearest.index);
        }
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const state = useRouteStore.getState();
      
      if (state.drawMode === 'shape' && state.currentShape) {
        setShapePreview({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (shapePreview) {
        setShapePreview(null);
      }

      if (isDrawingRef.current && state.drawMode === 'free') {
        const last = lastPointRef.current;
        if (!last || haversineDistance(last.lat, last.lng, e.latlng.lat, e.latlng.lng) > 15) {
          const point = { lat: e.latlng.lat, lng: e.latlng.lng };
          lastPointRef.current = point;
          
          const currentRaw = useRouteStore.getState().rawPoints;
          useRouteStore.getState().setRawPoints([...currentRaw, point]);
        }
      }
    });

    const container = mapContainerRef.current;
    
    const handleMouseDown = (e: MouseEvent) => {
      const state = useRouteStore.getState();
      if (state.drawMode !== 'free') return;
      if (e.button !== 0) return;
      // 只处理地图区域内的点击，忽略控件区域
      const target = e.target as HTMLElement;
      if (!target.closest('.leaflet-map-pane') && target !== container) return;
      
      isDrawingRef.current = true;
      lastPointRef.current = null;
      useRouteStore.getState().setIsDrawing(true);
      
      const point = map.mouseEventToLatLng(e);
      const p = { lat: point.lat, lng: point.lng };
      lastPointRef.current = p;
      useRouteStore.getState().setRawPoints([p]);
    };

    const handleMouseUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        useRouteStore.getState().finishDrawing();
      }
    };

    const handleMouseLeave = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        useRouteStore.getState().finishDrawing();
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        },
        () => {
          // ignore
        }
      );
    }

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  // 绘制模式切换时的地图交互控制
  useEffect(() => {
    if (!mapRef.current) return;

    if (drawMode === 'pan' || drawMode === 'edit') {
      mapRef.current.dragging.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.scrollWheelZoom.enable();
      mapContainerRef.current!.style.cursor = drawMode === 'edit' ? 'pointer' : '';
    } else {
      mapRef.current.dragging.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.scrollWheelZoom.enable();
      
      if (drawMode === 'free') {
        mapContainerRef.current!.style.cursor = 'crosshair';
      } else if (drawMode === 'click') {
        mapContainerRef.current!.style.cursor = 'crosshair';
      } else if (drawMode === 'shape') {
        mapContainerRef.current!.style.cursor = 'copy';
      }
    }
  }, [drawMode]);

  // 瓦片层切换
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const preset = TILE_LAYER_PRESETS.find(p => p.id === settings.tileLayerId);
    let tileUrl: string;
    let tileOptions: L.TileLayerOptions;

    if (settings.tileLayerId === 'custom' && settings.customTileUrl) {
      tileUrl = settings.customTileUrl;
      tileOptions = {
        attribution: 'Custom Tile Layer',
        maxZoom: 19,
      };
    } else if (preset) {
      tileUrl = preset.url;
      tileOptions = {
        attribution: preset.attribution,
        subdomains: preset.subdomains || 'abc',
        maxZoom: preset.maxZoom,
      };
    } else {
      return;
    }

    // 移除旧瓦片层，添加新瓦片层
    tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(tileUrl, tileOptions).addTo(mapRef.current);

    // 暗色瓦片不需要滤镜，其他默认瓦片用滤镜实现暗色效果
    const tilePane = document.querySelector('.leaflet-tile-pane') as HTMLElement;
    if (tilePane) {
      const isDarkPreset = preset?.dark === true;
      tilePane.style.filter = isDarkPreset ? '' : 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6)';
    }
  }, [settings.tileLayerId, settings.customTileUrl]);

  // 绘制中的原始路线（虚线蓝色）
  useEffect(() => {
    if (!mapRef.current) return;

    if (rawLineRef.current) {
      rawLineRef.current.remove();
      rawLineRef.current = null;
    }

    if (rawPoints.length > 1 && (drawMode === 'click' || drawMode === 'free')) {
      const latlngs = rawPoints.map((p) => [p.lat, p.lng] as [number, number]);
      rawLineRef.current = L.polyline(latlngs, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 6',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (rawPoints.length > 0 && (drawMode === 'click' || drawMode === 'shape')) {
      const startIcon = L.divIcon({
        className: 'start-marker',
        html: '<div style="width:14px;height:14px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      
      const endIcon = L.divIcon({
        className: 'end-marker',
        html: '<div style="width:14px;height:14px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      if (rawPoints.length > 0) {
        const start = L.marker([rawPoints[0].lat, rawPoints[0].lng], { icon: startIcon });
        start.addTo(mapRef.current);
        markersRef.current.push(start as unknown as L.Marker);
      }
      
      if (rawPoints.length > 1) {
        const end = L.marker([rawPoints[rawPoints.length - 1].lat, rawPoints[rawPoints.length - 1].lng], { icon: endIcon });
        end.addTo(mapRef.current);
        markersRef.current.push(end as unknown as L.Marker);
      }
    }
  }, [rawPoints, drawMode]);

  // 渲染最终路线（配速着色）+ 方向箭头 + 编辑控制点
  useEffect(() => {
    if (!mapRef.current) return;

    snappedLineRef.current.forEach((line) => line.remove());
    snappedLineRef.current = [];

    arrowMarkersRef.current.forEach((m) => m.remove());
    arrowMarkersRef.current = [];

    editMarkersRef.current.forEach((m) => m.remove());
    editMarkersRef.current = [];

    if (displayPoints.length < 2) return;
    if (isProcessing) return;
    if (rawPoints.length > 0 && (drawMode === 'click' || drawMode === 'free')) return;

    // 渲染配速着色路线段
    const segments = getPaceSegments(displayPoints);
    for (const segment of segments) {
      const segmentPoints = displayPoints.slice(segment.startIndex, segment.endIndex + 1);
      if (segmentPoints.length < 2) continue;

      const latlngs = segmentPoints.map((p) => [p.lat, p.lng] as [number, number]);
      const line = L.polyline(latlngs, {
        color: segment.color,
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);
      
      snappedLineRef.current.push(line);
    }

    // 渲染方向箭头：沿路线每隔 ~200m 放一个
    const arrowInterval = 200; // 米
    let cumDist = 0;
    let distSinceArrow = 0;
    for (let i = 1; i < displayPoints.length; i++) {
      const prev = displayPoints[i - 1];
      const curr = displayPoints[i];
      const segDist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      distSinceArrow += segDist;
      cumDist += segDist;

      if (distSinceArrow >= arrowInterval) {
        distSinceArrow = 0;
        const b = bearing(prev.lat, prev.lng, curr.lat, curr.lng);
        const arrowIcon = L.divIcon({
          className: 'route-arrow',
          html: `<div style="
            width: 0; height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 10px solid rgba(255,255,255,0.7);
            transform: rotate(${b}deg);
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
          "></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        const arrowMarker = L.marker([curr.lat, curr.lng], { icon: arrowIcon, interactive: false });
        arrowMarker.addTo(mapRef.current);
        arrowMarkersRef.current.push(arrowMarker as unknown as L.Marker);
      }
    }

    // 编辑模式：渲染可拖拽控制点
    if (drawMode === 'edit' && displayPoints.length >= 2) {
      const step = Math.max(1, Math.floor(displayPoints.length / 30)); // 最多30个控制点
      const editIcon = L.divIcon({
        className: 'edit-marker',
        html: '<div style="width:12px;height:12px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5);cursor:grab;"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      for (let i = 0; i < displayPoints.length; i += step) {
        const p = displayPoints[i];
        const marker = L.marker([p.lat, p.lng], { 
          icon: editIcon, 
          draggable: true,
          zIndexOffset: 1000,
        });
        
        const idx = i;
        marker.on('drag', (e) => {
          const pos = e.target.getLatLng();
          // 实时更新路线视觉（不更新 store，避免频繁渲染）
          const currentDisplay = useRouteStore.getState().displayPoints;
          const updated = [...currentDisplay];
          updated[idx] = { ...updated[idx], lat: pos.lat, lng: pos.lng };
          // 直接更新 snappedLine 的坐标
          updateSnappedLinePositions(updated);
        });
        
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          useRouteStore.getState().updatePoint(idx, { lat: pos.lat, lng: pos.lng });
        });
        
        marker.addTo(mapRef.current);
        editMarkersRef.current.push(marker as unknown as L.Marker);
      }
    }
  }, [displayPoints, isProcessing, rawPoints.length, drawMode]);

  // 辅助函数：拖拽时实时更新路线坐标
  function updateSnappedLinePositions(points: RoutePoint[]) {
    if (!mapRef.current) return;
    
    snappedLineRef.current.forEach((line) => line.remove());
    snappedLineRef.current = [];

    const segments = getPaceSegments(points);
    for (const segment of segments) {
      const segmentPoints = points.slice(segment.startIndex, segment.endIndex + 1);
      if (segmentPoints.length < 2) continue;

      const latlngs = segmentPoints.map((p) => [p.lat, p.lng] as [number, number]);
      const line = L.polyline(latlngs, {
        color: segment.color,
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);
      
      snappedLineRef.current.push(line);
    }
  }

  // 形状预览
  useEffect(() => {
    if (!mapRef.current || !shapePreview || !currentShape) {
      if (shapePreviewRef.current) {
        shapePreviewRef.current.remove();
        shapePreviewRef.current = null;
      }
      return;
    }

    const shapePoints = generateShape(currentShape, shapePreview.lat, shapePreview.lng, shapeSize);
    const latlngs = shapePoints.map((p) => [p.lat, p.lng] as [number, number]);

    if (shapePreviewRef.current) {
      shapePreviewRef.current.setLatLngs(latlngs);
    } else {
      shapePreviewRef.current = L.polyline(latlngs, {
        color: '#F97316',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 5',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);
    }
  }, [shapePreview, currentShape, shapeSize]);

  // 路线完成后自动调整视图
  useEffect(() => {
    if (!mapRef.current) return;
    if (displayPoints.length < 2) return;
    if (drawMode === 'click' || drawMode === 'free') return;

    const lats = displayPoints.map((p) => p.lat);
    const lngs = displayPoints.map((p) => p.lng);
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
    
    mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });
  }, [displayPoints.length > 0 && displayPoints[displayPoints.length - 1].distance, drawMode]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-screen relative"
    />
  );
}

// 辅助函数：找到距离点击位置最近的点
function findNearestPoint(
  points: RoutePoint[], 
  clickLat: number, 
  clickLng: number
): { index: number; distance: number } | null {
  if (points.length === 0) return null;

  let minDist = Infinity;
  let bestIndex = -1;

  for (let i = 0; i < points.length; i++) {
    const dist = haversineDistance(clickLat, clickLng, points[i].lat, points[i].lng);
    if (dist < minDist) {
      minDist = dist;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) return null;
  return { index: bestIndex, distance: minDist };
}

// 辅助函数：找到距离点击位置最近的路线线段
function findNearestSegment(
  points: RoutePoint[], 
  clickLat: number, 
  clickLng: number,
  thresholdMeters: number = 15
): { index: number; distance: number } | null {
  if (points.length < 2) return null;

  let minDist = Infinity;
  let bestIndex = -1;

  for (let i = 0; i < points.length - 1; i++) {
    const dist = pointToSegmentDistance(
      clickLat, clickLng,
      points[i].lat, points[i].lng,
      points[i + 1].lat, points[i + 1].lng
    );
    if (dist < minDist) {
      minDist = dist;
      bestIndex = i;
    }
  }

  if (bestIndex === -1 || minDist > thresholdMeters) return null;
  return { index: bestIndex, distance: minDist };
}

// 点到线段的距离（米）
function pointToSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  
  let t = 0;
  if (lenSq > 0) {
    t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  }
  
  const projLat = ax + t * dx;
  const projLng = ay + t * dy;
  
  return haversineDistance(px, py, projLat, projLng);
}
