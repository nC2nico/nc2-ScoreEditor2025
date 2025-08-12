import { MODULE_INFO, MODULE_LANE_COUNT } from '../constants.js';

/**
 * Gets the display information for a given module ID.
 * @param {number} moduleId The ID of the module.
 * @returns {object} The module information (name, color, etc.).
 */
export function getModuleInfo(moduleId) {
  return MODULE_INFO[moduleId] ?? MODULE_INFO[9]; // Fallback to 'None'
}

/**
 * Gets the number of lanes for a given module ID.
 * @param {number} moduleId The ID of the module.
 * @returns {number} The number of lanes.
 */
export function getLaneCount(moduleId) {
  return MODULE_LANE_COUNT[moduleId] ?? 0;
}
