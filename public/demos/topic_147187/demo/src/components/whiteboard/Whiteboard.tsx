import { useRef, useEffect, useState, useCallback } from 'react';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { WhiteboardToolbar } from './WhiteboardToolbar';

export const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const { currentTool, toolColor, toolSize, clearCanvas } = useWhiteboardStore();

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (clearCanvas) {
      const ctx = getContext();
      const canvas = canvasRef.current;
      if (ctx && canvas) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [clearCanvas, getContext]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastPos({ x, y });

    const ctx = getContext();
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (currentTool === 'text') {
      ctx.font = `${toolSize * 8}px sans-serif`;
      ctx.fillStyle = toolColor;
      ctx.fillText('双击输入文字', x, y);
      ctx.closePath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = getContext();
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = toolSize * 8;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (currentTool === 'rectangle') {
      ctx.strokeStyle = toolColor;
      ctx.lineWidth = toolSize;
      ctx.strokeRect(lastPos.x, lastPos.y, x - lastPos.x, y - lastPos.y);
    } else if (currentTool === 'circle') {
      ctx.strokeStyle = toolColor;
      ctx.lineWidth = toolSize;
      const radiusX = Math.abs(x - lastPos.x);
      const radiusY = Math.abs(y - lastPos.y);
      ctx.beginPath();
      ctx.ellipse(lastPos.x, lastPos.y, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'line') {
      ctx.strokeStyle = toolColor;
      ctx.lineWidth = toolSize;
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.strokeStyle = toolColor;
      ctx.lineWidth = toolSize;
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = getContext();
    if (ctx) {
      ctx.closePath();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      <WhiteboardToolbar />
      <div className="flex-1 p-2 lg:p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair bg-white dark:bg-gray-100 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};