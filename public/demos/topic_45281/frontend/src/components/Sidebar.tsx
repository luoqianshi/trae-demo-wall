import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Stethoscope,
  CreditCard,
  Pill,
  Bed,
  HeartPulse,
  Scissors,
  Archive,
  ClipboardList,
  Building2,
  Database,
  LineChart,
  HandHeart,
  Microscope,
  Shield,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Hospital,
  Calendar,
  DollarSign,
  FileSearch,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  roles: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "门诊业务",
    icon: Activity,
    items: [
      { path: "/appointment-registration", label: "预约挂号", icon: Calendar },
      { path: "/outpatient-management", label: "门诊挂号", icon: Activity },
      { path: "/doctor-workstation", label: "医生工作站", icon: Stethoscope },
      { path: "/charge-management", label: "收费管理", icon: CreditCard },
      { path: "/pharmacy-dispense", label: "药房发药", icon: Pill },
    ],
    roles: ["admin", "ADMIN", "doctor", "DOCTOR", "cashier", "pharmacist", "patient", "PATIENT"],
  },
  {
    label: "住院业务",
    icon: Bed,
    items: [
      { path: "/inpatient-management", label: "住院管理", icon: Bed },
      { path: "/nurse-workstation", label: "护士工作站", icon: HeartPulse },
      { path: "/surgery-anesthesia", label: "手术麻醉", icon: Scissors },
    ],
    roles: ["admin", "ADMIN", "doctor", "DOCTOR", "nurse"],
  },
  {
    label: "药品管理",
    icon: Pill,
    items: [
      { path: "/drug-management", label: "药品管理", icon: Pill },
    ],
    roles: ["admin", "ADMIN", "pharmacist"],
  },
  {
    label: "医技科室",
    icon: Microscope,
    items: [
      { path: "/medical-core", label: "医疗业务", icon: Stethoscope },
      { path: "/medical-extended", label: "医疗扩展", icon: Microscope },
      { path: "/physical-exam", label: "体检中心", icon: ClipboardList },
      { path: "/medical-record-archive", label: "病案管理", icon: Archive },
    ],
    roles: ["admin", "ADMIN", "doctor", "DOCTOR", "nurse"],
  },
  {
    label: "财务管理",
    icon: DollarSign,
    items: [
      { path: "/financial-management", label: "财务管理", icon: DollarSign },
    ],
    roles: ["admin", "ADMIN"],
  },
  {
    label: "综合管理",
    icon: Settings,
    items: [
      { path: "/admin-dashboard", label: "管理员控制台", icon: Shield },
      { path: "/medical-management", label: "医疗管理", icon: Shield },
      { path: "/operation-management", label: "运营管理", icon: Settings },
      { path: "/department-management", label: "科室管理", icon: Building2 },
      { path: "/info-maintenance", label: "信息维护", icon: Database },
      { path: "/statistics-query", label: "统计查询", icon: LineChart },
      { path: "/order-execution-tracking", label: "医嘱执行跟踪", icon: FileSearch },
    ],
    roles: ["admin", "ADMIN"],
  },
  {
    label: "患者服务",
    icon: HandHeart,
    items: [
      { path: "/huimin-service", label: "惠民服务", icon: HandHeart },
      { path: "/patient-chain", label: "患者全链路", icon: User },
    ],
    roles: ["admin", "ADMIN", "doctor", "DOCTOR", "cashier", "nurse"],
  },
];

const ROLE_NAMES: Record<string, string> = {
  ADMIN: "信息科管理员",
  DOCTOR: "医生",
  PATIENT: "患者",
  admin: "系统管理员",
  doctor: "医生",
  nurse: "护士",
  cashier: "收费员",
  pharmacist: "药师",
  patient: "访客",
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(NAV_GROUPS.map((g) => g.label))
  );

  const filteredGroups = useMemo(() => {
    if (!isAuthenticated || user?.userType === "PATIENT" || user?.role === "patient") {
      return NAV_GROUPS.filter((g) => g.label === "门诊业务");
    }
    return NAV_GROUPS.filter((g) => g.roles.includes(user?.userType || "") || g.roles.includes(user?.role || ""));
  }, [isAuthenticated, user?.userType, user?.role]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <aside className="h-screen w-56 fixed left-0 top-0 flex flex-col z-40 bg-card border-r border-border shadow-sm overflow-hidden">
      <Link to="/" className="flex items-center gap-3 px-5 h-14 border-b border-border shrink-0">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
          <Hospital className="text-primary-foreground" size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-on-surface leading-tight">医院 HIS</div>
          <div className="text-[10px] text-on-surface-variant leading-tight">医院管理系统</div>
        </div>
      </Link>

      <Link
        to="/"
        className={`motion-nav-item mx-3 mt-3 ${isActivePath("/") ? "is-active" : ""}`}
      >
        <LayoutDashboard size={16} />
        <span>管理中枢</span>
      </Link>

      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {filteredGroups.map((group, gi) => {
          const isExpanded = expandedGroups.has(group.label);
          const hasActiveChild = group.items.some((item) => isActivePath(item.path));

          return (
            <div key={group.label} className="mb-1 motion-row" style={{ animationDelay: `${Math.min(gi * 24, 120)}ms` }}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={`motion-nav-group ${hasActiveChild ? "is-active" : ""}`}
              >
                <group.icon size={14} />
                <span className="flex-1 text-left">{group.label}</span>
                {isExpanded ? (
                  <ChevronDown size={12} className="transition-transform duration-300 ease-out" />
                ) : (
                  <ChevronRight size={12} className="transition-transform duration-300 ease-out" />
                )}
              </button>

              <div
                className="motion-collapse"
                style={{
                  maxHeight: isExpanded ? `${group.items.length * 42 + 8}px` : "0px",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="mt-0.5 ml-2 space-y-0.5">
                  {group.items.map((item, ii) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`motion-nav-item motion-nav-child ${isActivePath(item.path) ? "is-active" : ""}`}
                      style={{ animationDelay: isExpanded ? `${Math.min(ii * 20, 100)}ms` : "0ms" }}
                    >
                      <item.icon size={14} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border shrink-0 relative">
        {isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-2.5 px-2">
              <div className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 shadow-sm relative z-10">
                {(user.doctorInfo?.name || user.patientInfo?.name || user.loginName || "U").charAt(0)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-on-surface font-medium truncate">
                  {user.doctorInfo?.name || user.patientInfo?.name || user.loginName}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {ROLE_NAMES[user.userType] || ROLE_NAMES[user.role] || "访客"}{user.department ? ` · ${user.department.name}` : user.doctorInfo?.dept ? ` · ${user.doctorInfo.dept}` : ""}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="motion-press mt-2 w-full py-1.5 text-xs text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl flex items-center justify-center gap-1.5"
            >
              <LogOut size={12} />
              退出登录
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="motion-press w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 shadow-sm"
          >
            登录系统
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
