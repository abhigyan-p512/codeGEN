const rooms = new Map();
const socketToRoom = new Map();

function createRoom({
  roomId,
  hostSocketId,
  hostUser,
  timeLimit = 600,
  difficulty = null,
}) {
  const room = {
    id: roomId,
    players: new Map(),
    playerOrder: [],
    started: false,
    problem: null,
    startAt: null,
    timeLimit,
    difficulty,
    submissions: [],
    winner: null,
    timer: null,
  };

  room.players.set(hostSocketId, hostUser);
  room.playerOrder.push(hostSocketId);

  rooms.set(roomId, room);
  socketToRoom.set(hostSocketId, roomId);

  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function getRoomIdBySocket(socketId) {
  return socketToRoom.get(socketId) || null;
}

function addPlayer(roomId, socketId, user) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players.set(socketId, user);
  if (!room.playerOrder.includes(socketId)) {
    room.playerOrder.push(socketId);
  }

  socketToRoom.set(socketId, roomId);
  return room;
}

function removePlayer(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players.delete(socketId);
  room.playerOrder = room.playerOrder.filter((id) => id !== socketId);
  socketToRoom.delete(socketId);

  if (room.players.size === 0) {
    clearRoomTimer(roomId);
    rooms.delete(roomId);
    return null;
  }

  return room;
}

function listPlayers(room) {
  if (!room) return [];

  return room.playerOrder
    .map((socketId, idx) => {
      const user = room.players.get(socketId);
      if (!user) return null;
      return {
        slot: idx === 0 ? "A" : "B",
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        rating: user.rating,
        socketId,
      };
    })
    .filter(Boolean);
}

function recordSubmission(roomId, submission) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.submissions.push(submission);
  return room;
}

function setWinner(roomId, winner) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.winner = winner;
  return room;
}

function setRoomTimer(roomId, timerHandle) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.timer) {
    clearTimeout(room.timer);
  }
  room.timer = timerHandle;
}

function clearRoomTimer(roomId) {
  const room = rooms.get(roomId);
  if (room?.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

function destroyRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  clearRoomTimer(roomId);
  room.players.forEach((_, socketId) => socketToRoom.delete(socketId));
  rooms.delete(roomId);
}

module.exports = {
  createRoom,
  getRoom,
  getRoomIdBySocket,
  addPlayer,
  removePlayer,
  listPlayers,
  recordSubmission,
  setWinner,
  setRoomTimer,
  clearRoomTimer,
  destroyRoom,
};

