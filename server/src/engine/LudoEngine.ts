import crypto from 'node:crypto';
import {
  LudoEngine as SharedLudoEngine,
  MoveResult,
  Player,
  RoomSettings,
  DEFAULT_ROOM_SETTINGS,
} from '@ludo/shared';

export type { MoveResult };

export class LudoEngine extends SharedLudoEngine {
  constructor(
    roomId: string,
    roomCode: string,
    players: Player[],
    settings: RoomSettings = DEFAULT_ROOM_SETTINGS
  ) {
    super(roomId, roomCode, players, settings, () => crypto.randomInt(1, 7));
  }
}
