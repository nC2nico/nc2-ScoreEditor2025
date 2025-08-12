import { pixelsPerSecond } from '../store.js';

/**
 * Converts a time value (in seconds) to a Y-coordinate on the timeline.
 * @param {number} time The time in seconds.
 * @returns {number} The corresponding Y-coordinate.
 */
export const timeToY = (time) => time * pixelsPerSecond.value;

/**
 * Converts a Y-coordinate on the timeline to a time value (in seconds).
 * @param {number} y The Y-coordinate.
 * @returns {number} The corresponding time in seconds.
 */
export const yToTime = (y) => y / pixelsPerSecond.value;
