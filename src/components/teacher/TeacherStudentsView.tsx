import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  TrendingUp,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api.js';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  targetExam?: string;
  course?: string;
  className?: string;
  joinedAt: string;
  lastActivity?: string;
  assignmentsCount?: number;
  pendingEvaluationsCount?: number;
  performancePercent?: number;
  attendanceRate?: number;
}

export const TeacherStudentsView: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTeacherStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentDetail = async (studentId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getTeacherStudentDetail(studentId);
      setSelectedStudent(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load student dossier');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.targetExam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.className?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-600" />
          <span>Assigned Students & Candidate Directory</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Authorized aspirant profiles enrolled in your cohorts. Inspect learning progress, test performance, and answer submission history.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search assigned students by name, email, target exam, or class..."
          className="w-full text-xs text-stone-800 outline-none bg-transparent placeholder-stone-400"
        />
      </div>

      {/* Student List Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-stone-500">Loading student roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-700">No assigned students found</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Students will appear here once enrolled into your teaching classes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 font-mono text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student Profile</th>
                  <th className="py-3 px-3">Target Exam</th>
                  <th className="py-3 px-3">Class / Batch</th>
                  <th className="py-3 px-3">Enrolled On</th>
                  <th className="py-3 px-3 text-center">Avg Performance</th>
                  <th className="py-3 px-3 text-center">Submissions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-serif-editorial font-bold border border-amber-200 shrink-0">
                          {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{student.name}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{student.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 font-bold">
                        {student.targetExam || 'General'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-stone-700">
                      {student.className || student.course || 'Cohort Batch'}
                    </td>

                    <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                      {new Date(student.joinedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-stone-800">
                        {student.performancePercent !== undefined ? `${student.performancePercent}%` : '—'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-mono text-stone-700">
                        {student.assignmentsCount ?? 0} submitted
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentDetail(student.id)}
                        className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 transition cursor-pointer"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT DETAIL DOSSIER MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-serif-editorial font-bold text-lg border border-amber-300 shadow-2xs">
                  {selectedStudent.student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold font-serif-editorial text-stone-900">
                      {selectedStudent.student?.name || 'Candidate Dossier'}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                      {selectedStudent.dossier?.profile?.targetExam || selectedStudent.student?.targetExam || 'UPSC CSE'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                      Status: {selectedStudent.dossier?.profile?.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    {selectedStudent.student?.email} • Enrolled: {selectedStudent.student?.createdAt ? new Date(selectedStudent.student.createdAt).toLocaleDateString() : 'Active'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance Aggregation Summary */}
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                Central Performance Aggregation
              </h3>
              {selectedStudent.dossier?.hasSufficientData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                    <div className="text-amber-800 text-[11px] font-medium">Average Score</div>
                    <div className="text-xl font-bold font-mono text-amber-950 mt-1">
                      {selectedStudent.dossier?.overall?.averageScore !== null ? `${selectedStudent.dossier.overall.averageScore}%` : 'Not enough data yet'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200">
                    <div className="text-teal-800 text-[11px] font-medium">Average Accuracy</div>
                    <div className="text-xl font-bold font-mono text-teal-950 mt-1">
                      {selectedStudent.dossier?.overall?.averageAccuracy !== null ? `${selectedStudent.dossier.overall.averageAccuracy}%` : 'Not enough data yet'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200">
                    <div className="text-blue-800 text-[11px] font-medium">Tests Attempted</div>
                    <div className="text-xl font-bold font-mono text-blue-950 mt-1">
                      {selectedStudent.dossier?.overall?.totalTestAttempts ?? 0}
                    </div>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <div className="text-emerald-800 text-[11px] font-medium">Attendance Rate</div>
                    <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                      {selectedStudent.dossier?.attendance?.attendancePercentage !== null && selectedStudent.dossier?.attendance?.attendancePercentage !== undefined
                        ? `${selectedStudent.dossier.attendance.attendancePercentage}%`
                        : 'Not enough data yet'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-500 text-xs text-center font-mono">
                  Not enough data yet to aggregate comprehensive performance statistics
                </div>
              )}
            </div>

            {/* Subject-Wise Performance Breakdown */}
            {selectedStudent.dossier?.subjectPerformance && selectedStudent.dossier.subjectPerformance.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                  Subject Proficiency Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {selectedStudent.dossier.subjectPerformance.map((sub: any, idx: number) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-900">{sub.subject}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{sub.attemptedCount} questions answered</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-stone-800">{sub.accuracy}%</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          sub.status === 'STRONG' ? 'bg-emerald-100 text-emerald-800' :
                          sub.status === 'AVERAGE' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {sub.status === 'STRONG' ? 'Strong' : sub.status === 'AVERAGE' ? 'Moderate' : 'Needs Focus'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strong & Weak Topics */}
            {selectedStudent.dossier?.topicPerformance && selectedStudent.dossier.topicPerformance.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                  Topical Strengths & Focus Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.dossier.topicPerformance.map((top: any, idx: number) => (
                    <div
                      key={idx}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                        top.isStrength
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="font-medium">{top.topic}</span>
                      <span className="text-[10px] font-mono font-bold px-1 rounded bg-white/70 border border-current">
                        {top.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Classes & Courses */}
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                Enrolled Cohorts & Batches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedStudent.classes?.map((c: any) => (
                  <div key={c.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <span className="text-stone-500 text-[11px] ml-2">({c.subject})</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions & Evaluations History */}
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                Mains Submissions & Evaluated Answers
              </h3>
              {selectedStudent.submissions?.length === 0 ? (
                <div className="text-center py-4 text-xs text-stone-400 bg-stone-50 rounded-xl border border-stone-200">
                  No submissions recorded yet
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedStudent.submissions?.map((sub: any) => (
                    <div key={sub.id} className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{sub.assignmentTitle || 'Mains Assignment'}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          sub.status === 'EVALUATED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                      {sub.marksObtained !== undefined && sub.marksObtained !== null && (
                        <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-stone-800 text-xs space-y-1">
                          <div className="font-bold text-emerald-800 font-mono">
                            Awarded Marks: {sub.marksObtained}{sub.totalMarks ? ` / ${sub.totalMarks}` : ''}
                          </div>
                          {sub.feedback && <p className="text-stone-700 italic">"{sub.feedback}"</p>}
                          {sub.strengths && (
                            <div className="text-[11px] text-emerald-900 mt-1">
                              <strong>Key Strengths:</strong> {sub.strengths}
                            </div>
                          )}
                          {sub.weaknesses && (
                            <div className="text-[11px] text-rose-900">
                              <strong>Areas for Improvement:</strong> {sub.weaknesses}
                            </div>
                          )}
                          {sub.suggestions && (
                            <div className="text-[11px] text-amber-900">
                              <strong>Actionable Advice:</strong> {sub.suggestions}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test History */}
            {selectedStudent.dossier?.testHistory && selectedStudent.dossier.testHistory.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                  Recent Test Attempts & Accuracy
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedStudent.dossier.testHistory.map((t: any) => (
                    <div key={t.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-900">{t.title}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{new Date(t.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-stone-900">Score: {t.score} / {t.maxScore}</div>
                        <div className="text-[11px] text-stone-500 font-mono">Accuracy: {t.accuracy}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-mono text-[11px]">
                Authorized Candidate Dossier • Server-Authoritative
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
