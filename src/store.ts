export type PartType = 'wall' | 'heater' | 'bench' | 'door' | 'window';

export interface SaunaPart {
    id: string;
    type: PartType;
    position: [number, number, number];
    rotation: [number, number, number];
    materialColor?: string; // Hex color for now, could be texture ID later
}

export const MATERIALS = [
    { label: 'Default', value: '' }, // Uses part default
    { label: 'Wood Light', value: '#e2c290' },
    { label: 'Wood Dark', value: '#5c4033' },
    { label: 'Stone', value: '#7d7d7d' },
    { label: 'Tile White', value: '#ececec' },
    { label: 'Tile Blue', value: '#87ceeb' },
];

export const PARTS: { type: PartType; label: string; color: string; dimensions: [number, number, number] }[] = [
    { type: 'wall', label: 'Wall', color: '#8b5a2b', dimensions: [2, 3, 0.2] },
    { type: 'heater', label: 'Heater', color: '#333333', dimensions: [0.6, 0.8, 0.4] }, // Non-square for visible rotation
    { type: 'bench', label: 'Bench', color: '#d2b48c', dimensions: [2, 0.5, 0.6] },
    { type: 'door', label: 'Door', color: '#a0522d', dimensions: [1, 2.2, 0.1] },
    { type: 'window', label: 'Window', color: '#87ceeb', dimensions: [1, 1, 0.1] },
];

export const BASIC_SAUNA_PRESET: Omit<SaunaPart, 'id'>[] = [
    // Back wall
    { type: 'wall', position: [0, 1.5, -2], rotation: [0, 0, 0] },
    { type: 'wall', position: [2, 1.5, -2], rotation: [0, 0, 0] },
    // Side walls
    { type: 'wall', position: [-2, 1.5, 0], rotation: [0, Math.PI / 2, 0] },
    { type: 'wall', position: [3, 1.5, 0], rotation: [0, Math.PI / 2, 0] },
    // Bench
    { type: 'bench', position: [0, 0.25, -1.5], rotation: [0, 0, 0] },
    // Heater
    { type: 'heater', position: [2, 0.4, 0], rotation: [0, 0, 0] },
    // Door
    { type: 'door', position: [1, 1.1, 2], rotation: [0, 0, 0] },
];
