import express from 'express';
import { yptRepository } from '../repositories/YptRepository.js';
import { liveClassRepository } from '../repositories/LiveClassRepository.js';

export function createYptRouter(requireAuth: express.RequestHandler) {
  const router = express.Router();

  // 1. Get today summary for dashboard / focus view
  router.get(['/today', '/summary'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const summary = await yptRepository.getUserTodaySummary(user.id);
      res.json(summary);
    } catch (err: any) {
      console.error('[YPT API] getTodaySummary error:', err);
      res.status(500).json({ error: 'Failed to retrieve focus summary' });
    }
  });

  // 2. Start active study/focus session
  router.post(['/session/start', '/start', '/sessions/start', '/sessions'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { subjectId, subjectName, topic, groupId } = req.body;
      const subj = subjectName || subjectId || 'General Revision';
      const session = await yptRepository.startFocusSession(user.id, subj, groupId);
      res.status(200).json({ success: true, session });
    } catch (err: any) {
      console.error('[YPT API] startSession error:', err);
      res.status(500).json({ error: err.message || 'Failed to start study session' });
    }
  });

  // 3. Stop active study/focus session
  router.post(['/session/stop', '/stop', '/sessions/stop', '/session/end', '/end'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { sessionId, durationSeconds, endedAt } = req.body;
      const session = await yptRepository.stopFocusSession(user.id, sessionId, {
        durationSeconds: durationSeconds ? parseInt(durationSeconds, 10) : undefined,
        endedAt: endedAt ? String(endedAt) : undefined,
      });
      res.status(200).json({ success: true, session });
    } catch (err: any) {
      console.error('[YPT API] stopSession error:', err);
      res.status(500).json({ error: err.message || 'Failed to stop study session' });
    }
  });

  // 3b. Get active session for user
  router.get(['/session/active', '/active', '/session/current', '/current'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const summary = await yptRepository.getUserTodaySummary(user.id);
      res.json({
        activeStudying: summary.activeStudying,
        currentSubject: summary.currentSubject,
        todaySeconds: summary.todaySeconds,
      });
    } catch (err: any) {
      console.error('[YPT API] activeSession error:', err);
      res.status(500).json({ error: 'Failed to retrieve active session' });
    }
  });

  // 4. Get groups (my groups or discoverable)
  router.get('/groups', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { search, myGroups } = req.query as { search?: string; myGroups?: string };
      let groups: any[] = [];
      if (myGroups === 'true') {
        groups = await yptRepository.getUserGroups(user.id);
      } else {
        groups = await yptRepository.getDiscoverableGroups(user.id, search);
      }
      res.json({ success: true, groups });
    } catch (err: any) {
      console.error('[YPT API] getGroups error:', err);
      res.status(500).json({ error: 'Failed to retrieve study groups' });
    }
  });

  // 3. Discover groups
  router.get('/discover', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { search } = req.query as { search?: string };
      const groups = await yptRepository.getDiscoverableGroups(user.id, search);
      res.json(groups);
    } catch (err: any) {
      console.error('[YPT API] discoverGroups error:', err);
      res.status(500).json({ error: 'Failed to discover study groups' });
    }
  });

  // 4. Create study group
  router.post('/groups', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, description, exam, dailyGoalMinutes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Group name is required' });
      }

      const group = await yptRepository.createGroup(
        { name, description, exam, dailyGoalMinutes },
        { id: user.id, name: user.name || 'IKSHOVIA Scholar' }
      );
      res.status(201).json(group);
    } catch (err: any) {
      console.error('[YPT API] createGroup error:', err);
      res.status(500).json({ error: err.message || 'Failed to create study group' });
    }
  });

  // 5. Get group details + members
  router.get('/groups/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const groupData = await yptRepository.getGroupById(req.params.id, user.id);
      if (!groupData) {
        return res.status(404).json({ error: 'Study group not found' });
      }
      res.json(groupData);
    } catch (err: any) {
      console.error('[YPT API] getGroupDetails error:', err);
      res.status(500).json({ error: 'Failed to load study group details' });
    }
  });

  // 6. Update group
  router.put('/groups/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, description, exam, dailyGoalMinutes } = req.body;
      const updated = await yptRepository.updateGroup(
        req.params.id,
        { name, description, exam, dailyGoalMinutes },
        user.id
      );
      res.json(updated);
    } catch (err: any) {
      console.error('[YPT API] updateGroup error:', err);
      res.status(400).json({ error: err.message || 'Failed to update study group' });
    }
  });

  // 7. Delete group
  router.delete('/groups/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const deleted = await yptRepository.deleteGroup(req.params.id, user.id);
      res.json({ success: deleted });
    } catch (err: any) {
      console.error('[YPT API] deleteGroup error:', err);
      res.status(400).json({ error: err.message || 'Failed to delete study group' });
    }
  });

  // 8. Join group by invite code
  router.post('/groups/join', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { inviteCode } = req.body;
      if (!inviteCode || !inviteCode.trim()) {
        return res.status(400).json({ error: 'Invite code is required' });
      }

      const group = await yptRepository.joinByCode(inviteCode, {
        id: user.id,
        name: user.name || 'IKSHOVIA Scholar',
      });
      res.json(group);
    } catch (err: any) {
      console.error('[YPT API] joinGroup error:', err);
      res.status(400).json({ error: err.message || 'Failed to join study group' });
    }
  });

  // 8b. Join group by group ID (with optional access code)
  router.post('/groups/:id/join', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { accessCode } = req.body;
      const group = await yptRepository.joinGroupById(req.params.id, {
        id: user.id,
        name: user.name || 'IKSHOVIA Scholar'
      }, accessCode);
      res.json({ success: true, message: 'Joined study group successfully', group });
    } catch (err: any) {
      console.error('[YPT API] joinGroupById error:', err);
      res.status(400).json({ error: err.message || 'Failed to join study group' });
    }
  });

  // 8c. Get group leaderboard
  router.get('/groups/:id/leaderboard', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const groupData = await yptRepository.getGroupById(req.params.id, user.id);
      if (!groupData) {
        return res.status(404).json({ error: 'Study group not found' });
      }
      res.json({ success: true, leaderboard: groupData.members });
    } catch (err: any) {
      console.error('[YPT API] getLeaderboard error:', err);
      res.status(500).json({ error: 'Failed to retrieve group leaderboard' });
    }
  });

  // 9. Leave group
  router.post('/groups/:id/leave', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const success = await yptRepository.leaveGroup(req.params.id, user.id);
      res.json({ success });
    } catch (err: any) {
      console.error('[YPT API] leaveGroup error:', err);
      res.status(400).json({ error: err.message || 'Failed to leave study group' });
    }
  });

  // 10. Remove member (creator only)
  router.delete('/groups/:id/members/:userId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const success = await yptRepository.removeMember(req.params.id, req.params.userId, user.id);
      res.json({ success });
    } catch (err: any) {
      console.error('[YPT API] removeMember error:', err);
      res.status(400).json({ error: err.message || 'Failed to remove member' });
    }
  });

  // 11. Log completed study session
  router.post('/sessions', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { groupId, subject, durationSeconds, startedAt, endedAt } = req.body;

      if (!subject || !durationSeconds) {
        return res.status(400).json({ error: 'Subject and durationSeconds are required' });
      }

      const session = await yptRepository.logStudySession({
        userId: user.id,
        groupId,
        subject,
        durationSeconds: Math.max(1, parseInt(durationSeconds, 10)),
        startedAt: startedAt || new Date(Date.now() - durationSeconds * 1000).toISOString(),
        endedAt: endedAt || new Date().toISOString(),
      });
      res.status(201).json(session);
    } catch (err: any) {
      console.error('[YPT API] logSession error:', err);
      res.status(500).json({ error: 'Failed to record focus session' });
    }
  });

  // 12. Update active study status
  router.post('/status', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { isStudying, subject } = req.body;
      await yptRepository.updateStudyStatus(user.id, Boolean(isStudying), subject);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[YPT API] updateStatus error:', err);
      res.status(500).json({ error: 'Failed to update study status' });
    }
  });

  // Singular group aliases
  router.get('/group/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const groupData = await yptRepository.getGroupById(req.params.id, user.id);
      if (!groupData) return res.status(404).json({ error: 'Study group not found' });
      res.json(groupData);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load study group details' });
    }
  });

  router.post('/group/:id/join', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { accessCode } = req.body;
      const group = await yptRepository.joinGroupById(req.params.id, {
        id: user.id,
        name: user.name || 'IKSHOVIA Scholar'
      }, accessCode);
      res.json({ success: true, message: 'Joined study group successfully', group });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to join study group' });
    }
  });

  router.post('/group/:id/leave', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const success = await yptRepository.leaveGroup(req.params.id, user.id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to leave study group' });
    }
  });

  router.get('/group/:id/leaderboard', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const groupData = await yptRepository.getGroupById(req.params.id, user.id);
      if (!groupData) return res.status(404).json({ error: 'Study group not found' });
      res.json({ success: true, leaderboard: groupData.members });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve group leaderboard' });
    }
  });

  router.post('/group/join', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { inviteCode } = req.body;
      if (!inviteCode || !inviteCode.trim()) return res.status(400).json({ error: 'Invite code is required' });
      const group = await yptRepository.joinByCode(inviteCode, {
        id: user.id,
        name: user.name || 'IKSHOVIA Scholar',
      });
      res.json(group);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to join study group' });
    }
  });

  // ==========================================
  // CALLING SYSTEMS (Individual, Group & Direct)
  // ==========================================

  // List users available for 1:1 calling in YPT / Peer Network
  router.get(['/call/users', '/calls/users', '/contacts'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { search } = req.query as { search?: string };
      const users = await liveClassRepository.getCallableUsers(user.id, search);
      res.json(users);
    } catch (err: any) {
      console.error('[YPT Call] list callable users error:', err);
      res.status(500).json({ error: 'Failed to retrieve peers for consultation' });
    }
  });

  // Get active incoming or outgoing direct call
  router.get(['/call/active', '/calls/active'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const activeCall = await liveClassRepository.getActiveDirectCallForUser(user.id);
      res.json({ call: activeCall });
    } catch (err: any) {
      console.error('[YPT Call] active call error:', err);
      res.status(500).json({ error: 'Failed to check active call' });
    }
  });

  // Initiate direct 1:1 call
  router.post(['/call/initiate', '/calls/initiate', '/call/start', '/calls/start'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { calleeId, calleeName, calleeAvatar } = req.body;
      if (!calleeId) {
        return res.status(400).json({ error: 'calleeId is required' });
      }

      const call = await liveClassRepository.initiateDirectCall(
        { id: user.id, name: user.name || 'Scholar', avatarUrl: user.avatarUrl },
        { id: calleeId, name: calleeName || 'Peer Scholar', avatarUrl: calleeAvatar }
      );
      res.status(201).json(call);
    } catch (err: any) {
      console.error('[YPT Call] initiate call error:', err);
      res.status(500).json({ error: 'Failed to initiate video consultation' });
    }
  });

  // Respond to direct call (ACCEPT / DECLINE)
  router.post(['/call/:id/respond', '/calls/:id/respond'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { action } = req.body;
      if (action !== 'ACCEPT' && action !== 'DECLINE') {
        return res.status(400).json({ error: 'Action must be ACCEPT or DECLINE' });
      }

      const updated = await liveClassRepository.respondDirectCall(req.params.id, user.id, action);
      res.json(updated);
    } catch (err: any) {
      console.error('[YPT Call] respond call error:', err);
      res.status(400).json({ error: err.message || 'Failed to respond to consultation' });
    }
  });

  // End direct call
  router.post(['/call/:id/end', '/calls/:id/end'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const ended = await liveClassRepository.endDirectCall(req.params.id, user.id);
      res.json(ended);
    } catch (err: any) {
      console.error('[YPT Call] end call error:', err);
      res.status(400).json({ error: err.message || 'Failed to terminate call' });
    }
  });

  // Room details for direct call
  router.get(['/call/room/:roomId', '/calls/room/:roomId'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const call = await liveClassRepository.getDirectCallByRoomId(req.params.roomId);
      if (!call) {
        return res.status(404).json({ error: 'Call room not found' });
      }
      if (call.callerId !== user.id && call.calleeId !== user.id) {
        return res.status(403).json({ error: 'Not authorized for this consultation' });
      }
      res.json(call);
    } catch (err: any) {
      console.error('[YPT Call] room details error:', err);
      res.status(500).json({ error: 'Failed to load call room metadata' });
    }
  });

  // Start instant group study call room
  router.post(['/call/group', '/calls/group', '/group-calls'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { groupId, groupName } = req.body;
      const title = groupName ? `Study Group: ${groupName}` : 'YPT Collaborative Focus Sprint';
      const created = await liveClassRepository.createLiveClass({
        title,
        description: `Live group audio-video study room for peer accountability. Group: ${groupName || groupId || 'General'}`,
        subject: 'Peer Study Focus',
        exam: 'UPSC',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 120,
      }, user);
      const started = await liveClassRepository.startClass(created.id);
      res.status(201).json({ success: true, room: started });
    } catch (err: any) {
      console.error('[YPT Call] group call creation error:', err);
      res.status(500).json({ error: 'Failed to start group study room' });
    }
  });

  // ==========================================
  // SCHEDULED YPT SESSIONS & SPRINTS
  // ==========================================

  // List upcoming scheduled YPT sessions
  router.get(['/schedule', '/schedule/sessions', '/scheduled'], requireAuth, async (req, res) => {
    try {
      const sessions = await liveClassRepository.getLiveClasses({
        tab: 'upcoming',
      });
      res.json({ success: true, sessions });
    } catch (err: any) {
      console.error('[YPT Schedule] list error:', err);
      res.status(500).json({ error: 'Failed to load scheduled focus sessions' });
    }
  });

  // Schedule a new peer study session / group sprint
  router.post(['/schedule', '/schedule/create'], requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { title, subject, scheduledAt, durationMinutes, description } = req.body;
      const created = await liveClassRepository.createLiveClass({
        title: title || 'Scheduled Peer Revision Session',
        subject: subject || 'General Studies',
        exam: 'UPSC',
        scheduledAt: scheduledAt || new Date(Date.now() + 3600000).toISOString(),
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
        description: description || 'Scheduled live study session with group members',
      }, user);
      res.status(201).json({ success: true, session: created });
    } catch (err: any) {
      console.error('[YPT Schedule] create error:', err);
      res.status(500).json({ error: 'Failed to schedule study session' });
    }
  });

  return router;
}
