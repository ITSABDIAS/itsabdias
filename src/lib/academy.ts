export type AcademyPath = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  sort_order: number;
};

export type AcademyCourse = {
  id: string;
  path_id: string | null;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  level: string;
  estimated_minutes: number;
  author_id: string | null;
  is_nexus: boolean;
  is_featured: boolean;
  is_published: boolean;
  tags: string[];
  lessons_count: number;
  students_count: number;
  created_at?: string;
};

export type AcademyLesson = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  content: string;
  video_url: string | null;
  exercise: string | null;
  tips: string | null;
  common_mistakes: string | null;
  summary: string | null;
  duration_minutes: number;
};

export const COURSE_SELECT =
  "id, path_id, slug, title, description, image_url, level, estimated_minutes, author_id, is_nexus, is_featured, is_published, tags, lessons_count, students_count, created_at";

export function fmtMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
