import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, Recommendation, CareerReport } from "@/types";
import { recommendCareers, generateActionPlan } from "@/engine/careerEngine";
import { getCareerById } from "@/data/careers";

interface AppState {
  // 用户画像
  userProfile: UserProfile;
  // 推荐结果
  recommendations: Recommendation[];
  // 选中的职业 ID
  selectedCareerId: string | null;
  // 报告
  report: CareerReport | null;
  // 是否已完成输入
  hasInput: boolean;
  // 浏览模式（跳过画像直接选职业）
  browseMode: boolean;

  // Actions
  setUserProfile: (profile: UserProfile) => void;
  generateRecommendations: () => void;
  selectCareer: (careerId: string) => void;
  generateReport: () => void;
  setBrowseMode: (v: boolean) => void;
  reset: () => void;
}

const defaultProfile: UserProfile = {
  interests: [],
  personality: {
    rational: 50,
    introvert: 50,
    stable: 50,
    creative: 50,
    collaborative: 50,
  },
  strongSubjects: [],
  dislikedWork: [],
  futureExpectation: "",
};

/** 轻量存储结构：只存 ID，不存完整 Career 对象 */
interface StoredState {
  userProfile: UserProfile;
  recommendationIds: { careerId: string; matchScore: number; reason: string; scoreBreakdown?: Recommendation["scoreBreakdown"] }[];
  selectedCareerId: string | null;
  reportIds: { selectedCareerId: string; generatedAt: string; actionPlan: CareerReport["actionPlan"] } | null;
  hasInput: boolean;
  browseMode: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProfile: defaultProfile,
      recommendations: [],
      selectedCareerId: null,
      report: null,
      hasInput: false,
      browseMode: false,

      setUserProfile: (profile) =>
        set({ userProfile: profile, hasInput: true, browseMode: false }),

      generateRecommendations: () => {
        const { userProfile } = get();
        const recs = recommendCareers(userProfile);
        set({ recommendations: recs });
      },

      selectCareer: (careerId) => set({ selectedCareerId: careerId }),

      setBrowseMode: (v) => set({ browseMode: v }),

      generateReport: () => {
        const { userProfile, recommendations, selectedCareerId } = get();
        if (recommendations.length === 0) return;
        const actionPlan = generateActionPlan(recommendations);
        const report: CareerReport = {
          userProfile,
          recommendations,
          selectedCareerId: selectedCareerId || recommendations[0].career.id,
          generatedAt: new Date().toISOString(),
          actionPlan,
        };
        set({ report });
      },

      reset: () =>
        set({
          userProfile: defaultProfile,
          recommendations: [],
          selectedCareerId: null,
          report: null,
          hasInput: false,
          browseMode: false,
        }),
    }),
    {
      name: "career-experience-store",
      // 只存储轻量数据，通过 careerId 按需查找完整 Career
      partialize: (state): StoredState => ({
        userProfile: state.userProfile,
        recommendationIds: state.recommendations.map((r) => ({
          careerId: r.career.id,
          matchScore: r.matchScore,
          reason: r.reason,
          scoreBreakdown: r.scoreBreakdown,
        })),
        selectedCareerId: state.selectedCareerId,
        reportIds: state.report
          ? {
              selectedCareerId: state.report.selectedCareerId,
              generatedAt: state.report.generatedAt,
              actionPlan: state.report.actionPlan,
            }
          : null,
        hasInput: state.hasInput,
        browseMode: state.browseMode,
      }),
      // 恢复时从 careerId 重新组装完整对象
      merge: (persisted, current) => {
        const stored = persisted as StoredState | undefined;
        if (!stored) return current;

        const recommendations: Recommendation[] = stored.recommendationIds
          .map((r) => {
            const career = getCareerById(r.careerId);
            return career ? { career, matchScore: r.matchScore, reason: r.reason, scoreBreakdown: r.scoreBreakdown } : null;
          })
          .filter(Boolean) as Recommendation[];

        let report: CareerReport | null = null;
        if (stored.reportIds) {
          const selectedCareer = getCareerById(stored.reportIds.selectedCareerId);
          if (selectedCareer) {
            report = {
              userProfile: stored.userProfile,
              recommendations,
              selectedCareerId: stored.reportIds.selectedCareerId,
              generatedAt: stored.reportIds.generatedAt,
              actionPlan: stored.reportIds.actionPlan,
            };
          }
        }

        return {
          ...current,
          userProfile: stored.userProfile,
          recommendations,
          selectedCareerId: stored.selectedCareerId,
          report,
          hasInput: stored.hasInput,
          browseMode: stored.browseMode,
        };
      },
    }
  )
);
