import express from 'express';
import { yptRepository } from '../repositories/YptRepository.js';

export function createYptRouter(requireAuth: express.RequestHandler) {
  const router = express.Router();

  // 1. Get today summary for dashboard / widget
  router.get('/summary', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const summary = await yptRepository.getUserTodaySummary(user.id);
      res.json(summary);
    } catch (err: any) {
      console.error('[YPT API] getSummary error:', err);
      res.status(500).json({ error: 'Failed to retrieve focus summary' });
    }
  });

  // 2. Get user's groups
  router.get('/groups', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const groups = await yptRepository.getUserGroups(user.id);
      res.json(groups);
    } catch (err: any) {
      console.error('[YPT API] getGroups error:', err);
      res.status(500).json({ error: 'Failed to retrieve user study groups' });
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

  return router;
}
