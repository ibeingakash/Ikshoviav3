import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { liveClassRepository } from './repositories/LiveClassRepository.js';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  classId: string;
}

export function setupLiveClassWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });
  const roomClients = new Map<string, Set<ClientConnection>>();
  const clientMap = new Map<WebSocket, ClientConnection>();

  function broadcastToRoom(classId: string, payload: any, excludeWs?: WebSocket) {
    const clients = roomClients.get(classId);
    if (!clients) return;
    const msg = JSON.stringify(payload);
    clients.forEach(client => {
      if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(msg);
        } catch (err) {
          console.error('[LiveSocket] Broadcast error:', err);
        }
      }
    });
  }

  // Handle upgrade for /api/live/ws
  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
    if (pathname === '/api/live/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const { type, classId, payload } = parsed;

        if (type === 'JOIN_ROOM') {
          const { user, role } = payload;
          const conn: ClientConnection = {
            ws,
            userId: user.id,
            userName: user.name,
            role: role || 'STUDENT',
            classId,
          };

          clientMap.set(ws, conn);
          if (!roomClients.has(classId)) {
            roomClients.set(classId, new Set());
          }
          roomClients.get(classId)!.add(conn);

          // Notify room of user join
          broadcastToRoom(classId, {
            type: 'USER_JOINED',
            classId,
            payload: {
              userId: user.id,
              userName: user.name,
              avatarUrl: user.avatarUrl,
              role: conn.role,
              joinedAt: new Date().toISOString(),
            },
          }, ws);

          // Send confirmation to joining user
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED_SUCCESS',
            classId,
            payload: {
              activeCount: roomClients.get(classId)?.size || 1,
            },
          }));
        } else if (type === 'CHAT_MESSAGE') {
          const conn = clientMap.get(ws);
          if (!conn) return;

          const saved = await liveClassRepository.addMessage(
            conn.classId,
            { id: conn.userId, name: conn.userName },
            payload.message,
            conn.role
          );

          broadcastToRoom(conn.classId, {
            type: 'NEW_CHAT_MESSAGE',
            classId: conn.classId,
            payload: saved,
          });
        } else if (type === 'REACTION') {
          const conn = clientMap.get(ws);
          if (!conn) return;

          broadcastToRoom(conn.classId, {
            type: 'EMOJI_REACTION',
            classId: conn.classId,
            payload: {
              emoji: payload.emoji,
              userId: conn.userId,
              userName: conn.userName,
              timestamp: Date.now(),
            },
          });
        } else if (type === 'RAISE_HAND') {
          const conn = clientMap.get(ws);
          if (!conn) return;

          await liveClassRepository.updateParticipantState(conn.classId, conn.userId, {
            handRaised: payload.handRaised,
          });

          broadcastToRoom(conn.classId, {
            type: 'HAND_RAISED_CHANGED',
            classId: conn.classId,
            payload: {
              userId: conn.userId,
              userName: conn.userName,
              handRaised: payload.handRaised,
              timestamp: new Date().toISOString(),
            },
          });
        } else if (type === 'QUESTION_SUBMIT') {
          const conn = clientMap.get(ws);
          if (!conn) return;

          const question = await liveClassRepository.addQuestion(
            conn.classId,
            { id: conn.userId, name: conn.userName },
            payload.question
          );

          broadcastToRoom(conn.classId, {
            type: 'QUESTION_ADDED',
            classId: conn.classId,
            payload: question,
          });
        } else if (type === 'QUESTION_UPVOTE') {
          const conn = clientMap.get(ws);
          if (!conn) return;

          const updated = await liveClassRepository.upvoteQuestion(
            conn.classId,
            payload.questionId,
            conn.userId
          );

          broadcastToRoom(conn.classId, {
            type: 'QUESTION_UPDATED',
            classId: conn.classId,
            payload: updated,
          });
        } else if (type === 'QUESTION_ANSWER') {
          const conn = clientMap.get(ws);
          if (!conn || (conn.role !== 'TEACHER' && conn.role !== 'ADMIN')) return;

          const updated = await liveClassRepository.updateQuestion(
            conn.classId,
            payload.questionId,
            {
              status: payload.status || 'ANSWERED',
              answer: payload.answer,
              isPinned: payload.isPinned,
            }
          );

          broadcastToRoom(conn.classId, {
            type: 'QUESTION_UPDATED',
            classId: conn.classId,
            payload: updated,
          });
        } else if (type === 'POLL_CREATE') {
          const conn = clientMap.get(ws);
          if (!conn || (conn.role !== 'TEACHER' && conn.role !== 'ADMIN')) return;

          const poll = await liveClassRepository.createPoll(
            conn.classId,
            { id: conn.userId, name: conn.userName },
            payload
          );

          broadcastToRoom(conn.classId, {
            type: 'POLL_CREATED',
            classId: conn.classId,
            payload: poll,
          });
        } else if (type === 'POLL_VOTE') {
          const conn = clientMap.get(ws);
          if (!conn) return;

          await liveClassRepository.submitPollVote(
            conn.classId,
            payload.pollId,
            conn.userId,
            payload.optionId
          );

          const polls = await liveClassRepository.getPolls(conn.classId, conn.userId);
          const updatedPoll = polls.find(p => p.id === payload.pollId);

          broadcastToRoom(conn.classId, {
            type: 'POLL_UPDATED',
            classId: conn.classId,
            payload: updatedPoll,
          });
        } else if (type === 'MUTE_ALL') {
          const conn = clientMap.get(ws);
          if (!conn || (conn.role !== 'TEACHER' && conn.role !== 'ADMIN')) return;

          broadcastToRoom(conn.classId, {
            type: 'MUTE_ALL_TRIGGERED',
            classId: conn.classId,
            payload: { byTeacher: conn.userName },
          });
        } else if (type === 'KICK_PARTICIPANT') {
          const conn = clientMap.get(ws);
          if (!conn || (conn.role !== 'TEACHER' && conn.role !== 'ADMIN')) return;

          await liveClassRepository.updateParticipantState(conn.classId, payload.targetUserId, {
            status: 'REMOVED',
          });

          broadcastToRoom(conn.classId, {
            type: 'PARTICIPANT_KICKED',
            classId: conn.classId,
            payload: { targetUserId: payload.targetUserId },
          });
        } else if (type === 'END_CLASS_FOR_ALL') {
          const conn = clientMap.get(ws);
          if (!conn || (conn.role !== 'TEACHER' && conn.role !== 'ADMIN')) return;

          await liveClassRepository.endClass(conn.classId);

          broadcastToRoom(conn.classId, {
            type: 'CLASS_ENDED_BY_HOST',
            classId: conn.classId,
            payload: { teacherName: conn.userName },
          });
        }
      } catch (err) {
        console.error('[LiveSocket] Message handle error:', err);
      }
    });

    ws.on('close', async () => {
      const conn = clientMap.get(ws);
      if (conn) {
        const room = roomClients.get(conn.classId);
        if (room) {
          room.delete(conn);
          if (room.size === 0) {
            roomClients.delete(conn.classId);
          }
        }
        clientMap.delete(ws);

        // Record leave in database
        try {
          await liveClassRepository.recordLeave(conn.classId, conn.userId);
        } catch (e) {
          // ignore
        }

        broadcastToRoom(conn.classId, {
          type: 'USER_LEFT',
          classId: conn.classId,
          payload: {
            userId: conn.userId,
            userName: conn.userName,
            leftAt: new Date().toISOString(),
          },
        });
      }
    });
  });

  console.log('[LiveSocket] WebSocket Classroom Server mounted on /api/live/ws');
}
