import { discTool } from './disc/index.js';
import { rodaDaVidaTool } from './roda-da-vida/index.js';
import { emotionalIntelligenceTool } from './inteligencia-emocional/index.js';
import { personalValuesTool } from './valores-pessoais/index.js';

const defaultToolSlug = 'disc';

const toolHandlers = {
  [discTool.slug]: discTool,
  [rodaDaVidaTool.slug]: rodaDaVidaTool,
  [emotionalIntelligenceTool.slug]: emotionalIntelligenceTool,
  [personalValuesTool.slug]: personalValuesTool,
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
