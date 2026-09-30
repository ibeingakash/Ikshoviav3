import express from 'express';
import { liveClassRepository } from '../repositories/LiveClassRepository.js';

export function createLiveClassRouter(requireAuth: express.RequestHandler, requireAdmin: express.RequestHandler) {
  const router = express.Router();

  // 1. List Classes
  router.get('/classes', async (req, res) => {
    try {
      const { exam, status, teacherId, search, tab, adminView } = req.query as Record<string, string>;
      const user = (req as any).user;
      const isAdminUser = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'TEACHER');
      const isAdminView = isAdminUser && adminView === 'true';

      const classes = await liveClassRepository.getLiveClasses({
        exam,
        status,
        teacherId,
        search,
        tab,
        userId: user?.id,
        isAdminView,
      });
      res.json(classes);
    } catch (err: any) {
      console.error('[LiveAPI] getClasses error:', err);
      res.status(500).json({ error: 'Failed to retrieve live classes' });
    }
  });

  // 2. Get Single Class
  router.get('/classes/:id', async (req, res) => {
    try {
      const liveClass = await liveClassRepository.getLiveClassById(req.params.id);
      if (!liveClass) {
        return res.status(404).json({ error: 'Live class not found' });
      }
      res.json(liveClass);
    } catch (err: any) {
      console.error('[LiveAPI] getClassById error:', err);
      res.status(500).json({ error: 'Failed to retrieve class details' });
    }
  });

  // 3. Create Class (Teacher or Admin)
  router.post('/classes', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const isTeacherOrAdmin = user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isTeacherOrAdmin) {
        return res.status(403).json({ error: 'Only instructors and administrators can schedule live classes' });
      }

      const created = await liveClassRepository.createLiveClass(req.body, user);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('[LiveAPI] createClass error:', err);
      res.status(500).json({ error: err.message || 'Failed to create live class' });
    }
  });

  // 3b. Instant Group Call Room (Any authenticated user can create/host a group study call)
  router.post(['/group-calls', '/classes/instant-group'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { title, topic, exam, maxParticipants, description } = req.body;
      const groupData = {
        title: title || `${user.name || 'Scholar'}'s Group Call Room`,
        topic: topic || 'Group Study & Doubts',
        exam: exam || 'ALL',
        meetingType: 'GROUP_STUDY' as const,
        status: 'LIVE' as const,
        isPublished: true,
        maxParticipants: maxParticipants || 25,
        description: description || 'Real-time peer collaborative audio/video room with screen share and interactive whiteboard.',
        recordingEnabled: true,
        chatEnabled: true,
        studentMicAllowed: true,
        studentCameraAllowed: true,
        waitingRoomEnabled: false,
        screenSharingAllowed: true,
        fileSharingAllowed: true,
      };

      const created = await liveClassRepository.createLiveClass(groupData, user);
      // Immediately activate the live class so participants enter live room directly
      const started = await liveClassRepository.startClass(created.id);
      res.status(201).json(started || created);
    } catch (err: any) {
      console.error('[LiveAPI] createGroupCall error:', err);
      res.status(500).json({ error: err.message || 'Failed to initialize group call room' });
    }
  });

  // 3c. Lookup meeting by human-readable meeting ID (e.g. IK-GRP-7A41 or IK-UPSC-8B12)
  router.get(['/meetings/:meetingId', '/classes/meeting/:meetingId'], requireAuth, async (req, res) => {
    try {
      const { meetingId } = req.params;
      const cleanId = meetingId.trim().toUpperCase();
      const liveClass = await liveClassRepository.getLiveClassById(cleanId);
      if (!liveClass) {
        return res.status(404).json({ error: `Meeting room '${cleanId}' not found. Please check the Meeting ID.` });
      }
      res.json(liveClass);
    } catch (err: any) {
      console.error('[LiveAPI] getMeetingById error:', err);
      res.status(500).json({ error: 'Failed to look up meeting room' });
    }
  });

  // 4. Update Class
  router.patch('/classes/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const current = await liveClassRepository.getLiveClassById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Class not found' });

      const isHost = current.teacherId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isHost) {
        return res.status(403).json({ error: 'Permission denied to modify this class' });
      }

      const updated = await liveClassRepository.updateLiveClass(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('[LiveAPI] updateClass error:', err);
      res.status(500).json({ error: 'Failed to update live class' });
    }
  });

  // 5. Delete Class
  router.delete('/classes/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const current = await liveClassRepository.getLiveClassById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Class not found' });

      const isHost = current.teacherId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isHost) {
        return res.status(403).json({ error: 'Permission denied to delete this class' });
      }

      const deleted = await liveClassRepository.deleteClass(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      console.error('[LiveAPI] deleteClass error:', err);
      res.status(500).json({ error: 'Failed to delete live class' });
    }
  });

  // 6. Start Class (Host / Admin)
  router.post('/classes/:id/start', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const current = await liveClassRepository.getLiveClassById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Class not found' });

      const isHost = current.teacherId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isHost) {
        return res.status(403).json({ error: 'Only the assigned instructor or admin can start the class' });
      }

      const started = await liveClassRepository.startClass(req.params.id);
      res.json(started);
    } catch (err: any) {
      console.error('[LiveAPI] startClass error:', err);
      res.status(500).json({ error: 'Failed to start live class' });
    }
  });

  // 7. End Class (Host / Admin)
  router.post('/classes/:id/end', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const current = await liveClassRepository.getLiveClassById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Class not found' });

      const isHost = current.teacherId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isHost) {
        return res.status(403).json({ error: 'Only the assigned instructor or admin can end the class' });
      }

      const ended = await liveClassRepository.endClass(req.params.id);
      res.json(ended);
    } catch (err: any) {
      console.error('[LiveAPI] endClass error:', err);
      res.status(500).json({ error: 'Failed to end live class' });
    }
  });

  // 7.1 Publish/Unpublish Class (Host / Admin)
  router.post('/classes/:id/publish', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const current = await liveClassRepository.getLiveClassById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Class not found' });

      const isHost = current.teacherId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isHost) {
        return res.status(403).json({ error: 'Permission denied to modify publication state' });
      }

      const { isPublished } = req.body;
      const updated = await liveClassRepository.publishClass(req.params.id, isPublished !== false);
      res.json(updated);
    } catch (err: any) {
      console.error('[LiveAPI] publishClass error:', err);
      res.status(500).json({ error: 'Failed to update publication state' });
    }
  });

  // 7.2 Cancel Class (Host / Admin)
  router.post('/classes/:id/cancel', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const current = await liveClassRepository.getLiveClassById(req.params.id);
      if (!current) return res.status(404).json({ error: 'Class not found' });

      const isHost = current.teacherId === user.id || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!isHost) {
        return res.status(403).json({ error: 'Permission denied to cancel class' });
      }

      const cancelled = await liveClassRepository.cancelClass(req.params.id);
      res.json(cancelled);
    } catch (err: any) {
      console.error('[LiveAPI] cancelClass error:', err);
      res.status(500).json({ error: 'Failed to cancel class' });
    }
  });

  // 8. Register for Class
  router.post('/classes/:id/register', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const participant = await liveClassRepository.registerParticipant(req.params.id, user, 'STUDENT');
      res.json(participant);
    } catch (err: any) {
      console.error('[LiveAPI] register error:', err);
      res.status(500).json({ error: 'Failed to register for class' });
    }
  });

  // 9. Join Class Room - Validates auth & returns secure room identifier
  router.post('/classes/:id/join', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const liveClass = await liveClassRepository.getLiveClassById(req.params.id);
      if (!liveClass) {
        return res.status(404).json({ error: 'Live class not found' });
      }

      if (liveClass.status === 'CANCELLED') {
        return res.status(400).json({ error: 'Cannot join a cancelled live session' });
      }

      if (liveClass.status === 'COMPLETED') {
        return res.status(400).json({ error: 'This live session has already ended' });
      }

      if (liveClass.isLocked && liveClass.teacherId !== user.id && user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'This live session is locked by the instructor' });
      }

      const isTeacher = liveClass.teacherId === user.id || user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      const participant = await liveClassRepository.recordJoin(liveClass.id, user, isTeacher);

      // Generate deterministic, non-guessable room identifier without exposing raw URLs
      const roomName = `ikshovia_live_${liveClass.meetingId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      res.json({
        participant,
        roomConfig: {
          roomName,
          meetingId: liveClass.meetingId,
          title: liveClass.title,
          isTeacher: participant.role === 'TEACHER' || participant.role === 'ADMIN',
          waitingRoom: !participant.isAdmitted,
        },
      });
    } catch (err: any) {
      console.error('[LiveAPI] joinClass error:', err);
      res.status(500).json({ error: err.message || 'Failed to join live class' });
    }
  });

  // 10. Leave Class
  router.post('/classes/:id/leave', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      await liveClassRepository.recordLeave(req.params.id, user.id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[LiveAPI] leaveClass error:', err);
      res.status(500).json({ error: 'Failed to record leave' });
    }
  });

  // 11. Participants & State
  router.get('/classes/:id/participants', async (req, res) => {
    try {
      const participants = await liveClassRepository.getParticipants(req.params.id);
      res.json(participants);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  });

  router.patch('/classes/:id/participants/state', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const targetUserId = req.body.targetUserId || user.id;

      // Only teacher/admin can admit or mute others
      if (targetUserId !== user.id && user.role !== 'ADMIN' && user.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Unauthorized to change other participants state' });
      }

      const updated = await liveClassRepository.updateParticipantState(req.params.id, targetUserId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update participant state' });
    }
  });

  // 12. Attendance Report & CSV Export
  router.get('/classes/:id/attendance', requireAuth, async (req, res) => {
    try {
      const attendance = await liveClassRepository.getAttendance(req.params.id);
      res.json(attendance);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
  });

  router.get('/classes/:id/attendance/export', requireAuth, async (req, res) => {
    try {
      const liveClass = await liveClassRepository.getLiveClassById(req.params.id);
      const { records } = await liveClassRepository.getAttendance(req.params.id);

      const headers = ['Student ID', 'Student Name', 'Email', 'Join Time', 'Leave Time', 'Total Duration (Minutes)', 'Rejoins', 'Attendance Status'];
      const rows = records.map(r => [
        `"${r.userId}"`,
        `"${r.userName}"`,
        `"${r.userEmail || ''}"`,
        `"${r.joinTime}"`,
        `"${r.leaveTime || 'Still Active'}"`,
        Math.round(r.totalDurationSeconds / 60),
        r.rejoinCount,
        r.attendanceStatus,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_${liveClass?.meetingId || req.params.id}.csv"`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to export attendance CSV' });
    }
  });

  // 13. Messages
  router.get('/classes/:id/messages', async (req, res) => {
    try {
      const messages = await liveClassRepository.getMessages(req.params.id);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.post('/classes/:id/messages', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const role = (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'ADMIN' : (user.role === 'TEACHER' ? 'TEACHER' : 'STUDENT');
      const message = await liveClassRepository.addMessage(req.params.id, user, req.body.message, role);
      res.status(201).json(message);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  router.post('/classes/:id/messages/:messageId/pin', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only teachers can pin messages' });
      }
      const success = await liveClassRepository.pinMessage(req.params.id, req.params.messageId, req.body.isPinned !== false);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to pin message' });
    }
  });

  router.delete('/classes/:id/messages/:messageId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only teachers or admins can delete messages' });
      }
      const success = await liveClassRepository.deleteMessage(req.params.id, req.params.messageId);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // 14. Questions / Q&A
  router.get('/classes/:id/questions', async (req, res) => {
    try {
      const questions = await liveClassRepository.getQuestions(req.params.id);
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  });

  router.post('/classes/:id/questions', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const question = await liveClassRepository.addQuestion(req.params.id, user, req.body.question);
      res.status(201).json(question);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit question' });
    }
  });

  router.post('/classes/:id/questions/:questionId/upvote', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const updated = await liveClassRepository.upvoteQuestion(req.params.id, req.params.questionId, user.id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to upvote question' });
    }
  });

  router.patch('/classes/:id/questions/:questionId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only instructors can moderate questions' });
      }
      const updated = await liveClassRepository.updateQuestion(req.params.id, req.params.questionId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update question' });
    }
  });

  // 15. Files / Handouts
  router.get('/classes/:id/files', async (req, res) => {
    try {
      const files = await liveClassRepository.getFiles(req.params.id);
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });

  router.post('/classes/:id/files', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const file = await liveClassRepository.addFile(req.params.id, user, req.body);
      res.status(201).json(file);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to upload class file' });
    }
  });

  // 16. Recordings
  router.get('/recordings', async (req, res) => {
    try {
      const classId = req.query.classId as string | undefined;
      const recordings = await liveClassRepository.getRecordings(classId);
      res.json(recordings);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch recordings' });
    }
  });

  router.post('/classes/:id/recordings', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only teachers can publish recordings' });
      }
      const recording = await liveClassRepository.addRecording(req.params.id, req.body);
      res.status(201).json(recording);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save recording' });
    }
  });

  // 17. Polls
  router.get('/classes/:id/polls', async (req, res) => {
    try {
      const user = (req as any).user;
      const polls = await liveClassRepository.getPolls(req.params.id, user?.id);
      res.json(polls);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch polls' });
    }
  });

  router.post('/classes/:id/polls', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only teachers can create polls' });
      }
      const poll = await liveClassRepository.createPoll(req.params.id, user, req.body);
      res.status(201).json(poll);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create poll' });
    }
  });

  router.post('/classes/:id/polls/:pollId/vote', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const success = await liveClassRepository.submitPollVote(req.params.id, req.params.pollId, user.id, req.body.optionId);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit vote' });
    }
  });

  router.post('/classes/:id/polls/:pollId/close', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only teachers can close polls' });
      }
      const success = await liveClassRepository.closePoll(req.params.id, req.params.pollId);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to close poll' });
    }
  });

  // 18. Admin Analytics
  router.get('/admin/analytics', requireAdmin, async (req, res) => {
    try {
      const analytics = await liveClassRepository.getAdminAnalytics();
      res.json(analytics);
    } catch (err: any) {
      console.error('[LiveAPI] admin analytics error:', err);
      res.status(500).json({ error: 'Failed to calculate analytics' });
    }
  });

  // ==========================================
  // 1:1 Direct Video Call System
  // ==========================================

  // List users available to call
  router.get('/calls/users', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { search } = req.query as { search?: string };
      const users = await liveClassRepository.getCallableUsers(user.id, search);
      res.json(users);
    } catch (err: any) {
      console.error('[LiveCalls] list users error:', err);
      res.status(500).json({ error: 'Failed to retrieve contacts for calling' });
    }
  });

  // Get active incoming or outgoing direct call
  router.get('/calls/active', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const activeCall = await liveClassRepository.getActiveDirectCallForUser(user.id);
      res.json({ call: activeCall });
    } catch (err: any) {
      console.error('[LiveCalls] active call error:', err);
      res.status(500).json({ error: 'Failed to check active call' });
    }
  });

  // Initiate direct call
  router.post('/calls/initiate', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { calleeId, calleeName, calleeAvatar } = req.body;
      if (!calleeId) {
        return res.status(400).json({ error: 'calleeId is required' });
      }

      const call = await liveClassRepository.initiateDirectCall(
        { id: user.id, name: user.name || 'Scholar', avatarUrl: user.avatarUrl },
        { id: calleeId, name: calleeName || 'User', avatarUrl: calleeAvatar }
      );
      res.status(201).json(call);
    } catch (err: any) {
      console.error('[LiveCalls] initiate call error:', err);
      res.status(500).json({ error: 'Failed to place call' });
    }
  });

  // Respond to direct call (ACCEPT or DECLINE)
  router.post('/calls/:id/respond', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { action } = req.body;
      if (action !== 'ACCEPT' && action !== 'DECLINE') {
        return res.status(400).json({ error: 'Action must be ACCEPT or DECLINE' });
      }

      const updated = await liveClassRepository.respondDirectCall(req.params.id, user.id, action);
      res.json(updated);
    } catch (err: any) {
      console.error('[LiveCalls] respond call error:', err);
      res.status(400).json({ error: err.message || 'Failed to respond to call' });
    }
  });

  // End direct call
  router.post('/calls/:id/end', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const ended = await liveClassRepository.endDirectCall(req.params.id, user.id);
      res.json(ended);
    } catch (err: any) {
      console.error('[LiveCalls] end call error:', err);
      res.status(400).json({ error: err.message || 'Failed to end call' });
    }
  });

  // Room details for direct call
  router.get('/calls/room/:roomId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const call = await liveClassRepository.getDirectCallByRoomId(req.params.roomId);
      if (!call) {
        return res.status(404).json({ error: 'Call room not found' });
      }
      if (call.callerId !== user.id && call.calleeId !== user.id) {
        return res.status(403).json({ error: 'Not authorized for this call room' });
      }
      res.json(call);
    } catch (err: any) {
      console.error('[LiveCalls] call room error:', err);
      res.status(500).json({ error: 'Failed to load call room' });
    }
  });

  return router;
}
