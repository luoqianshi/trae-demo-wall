import type { Subject, SubjectMeta } from "@/types";

export const SUBJECTS: SubjectMeta[] = [
  {
    code: "chinese",
    name: "语文",
    shortName: "语",
    color: "#e74c3c",
    bg: "bg-rose-50",
    text: "text-rose-600",
  },
  {
    code: "math",
    name: "数学",
    shortName: "数",
    color: "#3c63ff",
    bg: "bg-brand-50",
    text: "text-brand-600",
  },
  {
    code: "english",
    name: "英语",
    shortName: "英",
    color: "#9b59b6",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  {
    code: "physics",
    name: "物理",
    shortName: "物",
    color: "#1abc9c",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
  {
    code: "chemistry",
    name: "化学",
    shortName: "化",
    color: "#e67e22",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    code: "biology",
    name: "生物",
    shortName: "生",
    color: "#2ecc71",
    bg: "bg-green-50",
    text: "text-green-600",
  },
  {
    code: "history",
    name: "历史",
    shortName: "史",
    color: "#8b6f47",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  {
    code: "geography",
    name: "地理",
    shortName: "地",
    color: "#16a085",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    code: "politics",
    name: "政治",
    shortName: "政",
    color: "#c0392b",
    bg: "bg-red-50",
    text: "text-red-600",
  },
];

export const SUBJECT_MAP: Record<Subject, SubjectMeta> = SUBJECTS.reduce(
  (acc, s) => ({ ...acc, [s.code]: s }),
  {} as Record<Subject, SubjectMeta>,
);

export function getSubject(code: Subject): SubjectMeta {
  return SUBJECT_MAP[code] ?? SUBJECTS[1];
}
