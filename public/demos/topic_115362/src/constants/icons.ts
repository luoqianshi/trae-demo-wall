import {
  Type, AlignLeft, Hash, ToggleLeft, ChevronDown, CircleDot,
  CheckSquare, Calendar, Clock, CalendarClock, Paperclip, Table,
  type LucideIcon,
} from "lucide-react";
import type { ControlType } from "@/types";

// 控件图标映射
export const CONTROL_ICONS: Record<ControlType, LucideIcon> = {
  input: Type,
  textarea: AlignLeft,
  number: Hash,
  switch: ToggleLeft,
  select: ChevronDown,
  radio: CircleDot,
  checkbox: CheckSquare,
  date: Calendar,
  time: Clock,
  datetime: CalendarClock,
  upload: Paperclip,
  table: Table,
};
