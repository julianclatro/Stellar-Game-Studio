// Game Engines — Public API

// F02: Room Navigation
export {
  RoomEngine,
  NavigationError,
} from './room-engine';

export type {
  RoomSnapshot,
} from './room-engine';

// F03: Inventory System
export {
  InventoryEngine,
  InventoryError,
} from './inventory-engine';

export type {
  InspectionResult,
} from './inventory-engine';

// F04: Dialogue Engine
export {
  DialogueEngine,
} from './dialogue-engine';

export type {
  DialogueState,
  DialogueOption,
  DialogueResolution,
  DialogueHistory,
} from './dialogue-engine';

// F05: Accusation System
export {
  AccusationEngine,
  AccusationError,
} from './accusation-engine';

export type {
  AccusationStatus,
  AccusationResult,
  Accusation,
  AccusationAttempt,
} from './accusation-engine';
