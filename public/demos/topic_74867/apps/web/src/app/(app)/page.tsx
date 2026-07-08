'use client';

import { useEffect } from 'react';
import { PageTransition } from '@/components/page-transition';
import { useFamilyHubStore } from '@/stores/family-hub-store';
import { HeroSection } from '@/components/home/hero-section';
import { AIInterviewSection } from '@/components/home/ai-interview-section';
import { FamilyStatusSection } from '@/components/home/family-status-section';
import { DashboardSection } from '@/components/home/dashboard-section';
import { LifeTreeSection } from '@/components/home/life-tree-section';
import { ShimoCoreSection } from '@/components/home/shimo-core-section';
import { AgentRuntimeSection } from '@/components/home/agent-runtime-section';
import { SkillsSection } from '@/components/home/skills-section';
import { LearningTimelineSection } from '@/components/home/learning-timeline-section';
import { ShiMoAnywhereSection } from '@/components/home/shiMo-anywhere-section';

export default function FamilyAIHubPage() {
  const fetchAll = useFamilyHubStore((s) => s.fetchAll);

  // Fetch all data from backend API on mount (with fallback to seed data)
  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Periodic background sync every 60s to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchAll();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <PageTransition>
      <div className="w-full min-h-screen px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 pb-32">
        <div className="max-w-6xl mx-auto space-y-10 sm:space-y-16">
          {/* 1. Hero (60-70vh) */}
          <HeroSection />

          {/* 2. AI Interview (时墨主动开始聊天) */}
          <AIInterviewSection />

          {/* 3. 今日家庭状态 */}
          <FamilyStatusSection />

          {/* 4. 家庭AI数据中心 (Dashboard) */}
          <DashboardSection />

          {/* 5. 生命树 (50% page height, core visualization) */}
          <LifeTreeSection />

          {/* 6. ShiMo Core */}
          <ShimoCoreSection />

          {/* 7. Agent Runtime */}
          <AgentRuntimeSection />

          {/* 8. Skills Library */}
          <SkillsSection />

          {/* 9. Learning Timeline */}
          <LearningTimelineSection />

          {/* 10. ShiMo Anywhere (设备同步) */}
          <ShiMoAnywhereSection />
        </div>
      </div>
    </PageTransition>
  );
}
