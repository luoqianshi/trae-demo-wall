import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Focus from "@/pages/Focus";
import BlindBox from "@/pages/BlindBox";
import Corgi from "@/pages/Corgi";
import Backpack from "@/pages/Backpack";
import Friends from "@/pages/Friends";
import Calendar from "@/pages/Calendar";
import Summary from "@/pages/Summary";
import TimePlanner from "@/pages/TimePlanner";
import FixedSchedule from "@/pages/FixedSchedule";
import Welcome from "@/pages/Welcome";
import DailyRoutine from "@/pages/DailyRoutine";
import SettingsDrawer from "@/components/Settings/SettingsDrawer";
import BottomNav from "@/components/common/BottomNav";
import OnboardingGuide from "@/components/Onboarding/OnboardingGuide";
import TimeLockOverlay from "@/components/common/TimeLockOverlay";
import VacationModal from "@/components/Settings/VacationModal";
import { useCorgiStore } from "@/store/corgiStore";
import { useUserStore } from "@/store/userStore";
import { useScheduleStore } from "@/store/scheduleStore";

// 检查是否临近暑假（6月20日-7月15日，拓宽推荐窗口）
function isNearSummerVacation(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return (month === 6 && day >= 20) || (month === 7 && day <= 15);
}

// 检查是否临近寒假（12月25日-1月25日，拓宽推荐窗口）
function isNearWinterVacation(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return (month === 12 && day >= 25) || (month === 1 && day <= 25);
}

// 判断今天是否落在指定日期范围内（含首尾）
function isTodayInRange(startStr?: string, endStr?: string): boolean {
  if (!startStr || !endStr || startStr === 'skipped' || endStr === 'skipped') return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return todayStr >= startStr && todayStr <= endStr;
}

function AppLayout() {
  const location = useLocation();
  const { corgi } = useCorgiStore();
  const { profile, setProfile } = useUserStore();
  const applyVacationMode = useScheduleStore((s) => s.applyVacationMode);
  const vacationApplied = useScheduleStore((s) => s.vacationApplied);
  const isWelcome = location.pathname === '/welcome';
  const isRoutine = location.pathname === '/routine';
  const isSetupFlow = isWelcome || isRoutine;

  // 假期弹窗状态
  const [vacationModal, setVacationModal] = useState<'summer' | 'winter' | null>(null);

  // 检查是否需要弹出假期设置提示（'skipped' 视为已 dismissed，本推荐窗口内不再弹；
  // 用户可在设置抽屉里手动切换假期模式或重新设置日期）
  useEffect(() => {
    if (!corgi.adopted || isSetupFlow) return;
    if (!profile.onboardingCompleted) return;

    // 临近暑假且未设置暑假日期（'skipped' 视为已 dismiss，不重复弹）
    if (isNearSummerVacation() && !profile.summerVacationStart) {
      setVacationModal('summer');
      return;
    }

    // 临近寒假且未设置寒假日期
    if (isNearWinterVacation() && !profile.winterVacationStart) {
      setVacationModal('winter');
      return;
    }
  }, [corgi.adopted, isSetupFlow, profile.onboardingCompleted, profile.summerVacationStart, profile.winterVacationStart]);

  // 当今天落在已配置的假期日期范围内时，自动应用假期模式；离开范围时恢复正常
  useEffect(() => {
    if (!corgi.adopted || isSetupFlow) return;
    if (!profile.onboardingCompleted) return;

    let targetMode: 'summer' | 'winter' | null = null;
    if (isTodayInRange(profile.summerVacationStart, profile.summerVacationEnd)) {
      targetMode = 'summer';
    } else if (isTodayInRange(profile.winterVacationStart, profile.winterVacationEnd)) {
      targetMode = 'winter';
    }

    if (targetMode) {
      // 进入假期范围：应用假期模式（store 内部幂等，同模式不会重复累加）
      applyVacationMode(targetMode);
    } else if (vacationApplied === 'summer' || vacationApplied === 'winter') {
      // 仅当当前应用的是由日期范围自动触发的 summer/winter 时，离开范围才自动恢复正常；
      // 用户通过设置抽屉手动选择的其他假期模式（spring/national/newyear）不被自动覆盖
      applyVacationMode('normal');
    }
  }, [corgi.adopted, isSetupFlow, profile.onboardingCompleted, profile.summerVacationStart, profile.summerVacationEnd, profile.winterVacationStart, profile.winterVacationEnd, applyVacationMode, vacationApplied]);

  const handleOnboardingComplete = () => {
    setProfile({ onboardingCompleted: true });
  };

  const handleVacationComplete = (startDate: string, endDate: string) => {
    if (vacationModal === 'summer') {
      setProfile({ summerVacationStart: startDate, summerVacationEnd: endDate });
    } else if (vacationModal === 'winter') {
      setProfile({ winterVacationStart: startDate, winterVacationEnd: endDate });
    }
    setVacationModal(null);
  };

  const handleVacationSkip = () => {
    // 跳过时记录占位字符串 'skipped' 避免重复弹窗
    if (vacationModal === 'summer') {
      setProfile({ summerVacationStart: 'skipped', summerVacationEnd: 'skipped' });
    } else if (vacationModal === 'winter') {
      setProfile({ winterVacationStart: 'skipped', winterVacationEnd: 'skipped' });
    }
    setVacationModal(null);
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/routine" element={corgi.adopted ? <DailyRoutine /> : <Navigate to="/welcome" replace />} />
        <Route path="/" element={corgi.adopted ? <Home /> : <Navigate to="/welcome" replace />} />
        <Route path="/planner" element={corgi.adopted ? <TimePlanner /> : <Navigate to="/welcome" replace />} />
        <Route path="/schedule" element={corgi.adopted ? <FixedSchedule /> : <Navigate to="/welcome" replace />} />
        <Route path="/focus" element={corgi.adopted ? <Focus /> : <Navigate to="/welcome" replace />} />
        <Route path="/blindbox" element={corgi.adopted ? <BlindBox /> : <Navigate to="/welcome" replace />} />
        <Route path="/corgi" element={corgi.adopted ? <Corgi /> : <Navigate to="/welcome" replace />} />
        <Route path="/backpack" element={corgi.adopted ? <Backpack /> : <Navigate to="/welcome" replace />} />
        <Route path="/friends" element={corgi.adopted ? <Friends /> : <Navigate to="/welcome" replace />} />
        <Route path="/calendar" element={corgi.adopted ? <Calendar /> : <Navigate to="/welcome" replace />} />
        <Route path="/summary" element={corgi.adopted ? <Summary /> : <Navigate to="/welcome" replace />} />
      </Routes>
      {!isSetupFlow && <BottomNav currentPath={location.pathname} />}
      {!isSetupFlow && <SettingsDrawer />}
      {/* 新手指引：在 /routine 及之后的页面都显示（/welcome 页面不显示，因为表单本身就是引导） */}
      {!isWelcome && !profile.onboardingCompleted && <OnboardingGuide onComplete={handleOnboardingComplete} />}
      {/* 时段锁定：学习时段屏蔽非学习相关功能 */}
      {!isSetupFlow && <TimeLockOverlay currentPath={location.pathname} />}
      {/* 假期模式弹窗 */}
      {vacationModal && (
        <VacationModal
          vacationType={vacationModal}
          onComplete={handleVacationComplete}
          onSkip={handleVacationSkip}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
