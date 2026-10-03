import { allParts, getExam, gradeFor } from "@/lib/exams";

export { allParts, gradeFor };

export function telcB1Exam() {
  const exam = getExam("telc-b1");
  if (!exam) throw new Error("telc-b1 missing");
  return exam;
}
