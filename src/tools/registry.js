import { discTool } from './disc/index.js';
import { rodaDaVidaTool } from './roda-da-vida/index.js';

const defaultToolSlug = 'disc';

const toolHandlers = {
  [discTool.slug]: discTool,
  [rodaDaVidaTool.slug]: rodaDaVidaTool,
};

export function getToolHandler(slug) {
  return toolHandlers[slug] || toolHandlers[defaultToolSlug];
}

export function getDefaultToolSlug() {
  return defaultToolSlug;
}

export function getSupportedToolSlugs() {
  return Object.keys(toolHandlers);
}
