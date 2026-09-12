import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  Search,
  Filter
} from 'lucide-react';
import { LiveClass, LiveClassAttendance } from '../../types/liveClass.js';
import { liveClassService } from '../../services/liveClassService.js';

interface LiveAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveClass: LiveClass;
}

export const LiveAttendanceModal: React.FC<LiveAttendanceModalProps> = ({
  isOpen,
  onClose,
  liveClass,
}) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<LiveClassAttendance[]>([]);
  const [summary, setSummary] = useState({
    totalEnrolled: 0,
    totalAttended: 0,
    presentCount: 0,
    lateCount: 0,
    leftEarlyCount: 0,
    averageDurationMinutes: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen && liveClass) {
      loadAttendance();
    }
  }, [isOpen, liveClass.id]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await liveClassService.getAttendance(liveClass.id);
      setRecords(data.records || []);
      setSummary(data.summary || {
        totalEnrolled: liveClass.enrolledCount || 0,
        totalAttended: 0,
        presentCount: 0,
        lateCount: 0,
        leftEarlyCount: 0,
        averageDurationMinutes: 0,
      });
    } catch (err) {
      console.error('[Attendance Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/live/classes/${liveClass.id}/attendance/export`, '_blank');
  };

  if (!isOpen) return null;

  const filteredRecords = records.filter(r => {
    const matchesSearch = !search ||
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || r.attendanceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0F1424] border border-stone-800 text-stone-100 rounded-2xl shadow-2xl overflow-hidden my-6">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800 bg-[#141A2E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Classroom Attendance Report</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-normal">
                  {liveClass.meetingId}
                </span>
              </h3>
              <p className="text-xs text-stone-400 line-clamp-1">{liveClass.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-stone-900/40 border-b border-stone-800">
          <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800">
            <div className="text-xs text-stone-400 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Total Attended</span>
            </div>
            <div className="text-xl font-bold text-white">
              {summary.totalAttended} <span className="text-xs font-normal text-stone-500">/ {summary.totalEnrolled || 1}</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              {Math.round(((summary.totalAttended || 0) / (summary.totalEnrolled || 1)) * 100)}% attendance rate
            </div>
          </div>

          <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800">
            <div className="text-xs text-stone-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Presence</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {summary.presentCount}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Joined on time & attended
            </div>
          </div>

          <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800">
            <div className="text-xs text-stone-400 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Late / Partial</span>
            </div>
            <div className="text-xl font-bold text-amber-400">
              {summary.lateCount + summary.leftEarlyCount}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Late ({summary.lateCount}) • Left early ({summary.leftEarlyCount})
            </div>
          </div>

          <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800">
            <div className="text-xs text-stone-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Avg Watch Time</span>
            </div>
            <div className="text-xl font-bold text-purple-300">
              {summary.averageDurationMinutes} <span className="text-xs font-normal text-stone-500">mins</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Per attending scholar
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-stone-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {(['ALL', 'PRESENT', 'LATE', 'LEFT_EARLY'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                  statusFilter === status
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Records Table */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading attendance logs...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              No attendance records match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/80 uppercase text-[10px] tracking-wider text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Join Time</th>
                    <th className="py-3 px-4">Leave Time</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Rejoins</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                  {filteredRecords.map((rec) => {
                    const durationMins = Math.round(rec.totalDurationSeconds / 60);
                    return (
                      <tr key={rec.id} className="hover:bg-stone-800/30 transition-colors">
                        <td className="py-3 px-4 font-sans font-medium text-stone-100">
                          <div>{rec.userName}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{rec.userEmail || rec.userId}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {new Date(rec.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {rec.leaveTime ? new Date(rec.leaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (
                            <span className="text-emerald-400 font-sans text-[10px]">Active Now</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-200">
                          {durationMins} mins
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {rec.rejoinCount}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            rec.attendanceStatus === 'PRESENT'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : rec.attendanceStatus === 'LATE'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-stone-800 border-stone-700 text-stone-400'
                          }`}>
                            {rec.attendanceStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-[#141A2E] flex items-center justify-between text-xs text-stone-400">
          <span>Showing {filteredRecords.length} student records</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
