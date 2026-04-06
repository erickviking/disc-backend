/**
 * ═══════════════════════════════════════════════════════════════
 * DISC — Backend: Suporte a imagePosition no config da Tool
 * ═══════════════════════════════════════════════════════════════
 * 
 * Alterações:
 *   1. PATCH /admin/tools/:id aceita { imagePosition: "center 20%" }
 *      → salva em tool.config.imagePosition
 *   2. GET /tools/all retorna campo config para o frontend ler
 * 
 * Execução:
 *   cd C:\disc-system\backend
 *   node add-image-position.cjs
 * 
 * Sem migration necessária — usa campo config (Json) já existente.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const toolsPath = path.join(__dirname, 'src', 'routes', 'tools.js');
let content = fs.readFileSync(toolsPath, 'utf-8');

// Backup
fs.copyFileSync(toolsPath, toolsPath + '.bak-' + Date.now());
console.log('✓ Backup criado');

// 1. Adicionar imagePosition ao schema do PATCH
const oldSchema = "const schema = z.object({ isActive: z.boolean().optional(), isDefault: z.boolean().optional(), name: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional() });";
const newSchema = "const schema = z.object({ isActive: z.boolean().optional(), isDefault: z.boolean().optional(), name: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional(), imagePosition: z.string().optional() });";

if (content.includes(oldSchema)) {
  content = content.replace(oldSchema, newSchema);
  console.log('✓ Schema PATCH atualizado');
} else {
  console.log('⚠ Schema PATCH não encontrado (já atualizado?)');
}

// 2. Alterar o PATCH handler para salvar imagePosition no config
const oldPatch = `const data = schema.parse(req.body);
    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });`;

const newPatch = `const { imagePosition, ...data } = schema.parse(req.body);
    
    // Se imagePosition foi enviado, merge no campo config (Json)
    if (imagePosition !== undefined) {
      const existing = await prisma.tool.findUnique({ where: { id: req.params.id }, select: { config: true } });
      data.config = { ...(existing?.config || {}), imagePosition };
    }
    
    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });`;

if (content.includes('const data = schema.parse(req.body);\n    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });')) {
  content = content.replace(
    'const data = schema.parse(req.body);\n    const tool = await prisma.tool.update({ where: { id: req.params.id }, data });',
    newPatch
  );
  console.log('✓ PATCH handler atualizado para salvar imagePosition no config');
} else {
  console.log('⚠ PATCH handler não encontrado no formato esperado');
}

// 3. Adicionar config ao select de /tools/all
const oldSelect = "select: { id: true, slug: true, name: true, description: true, icon: true, color: true, category: true, sortOrder: true, isActive: true },";
const newSelect = "select: { id: true, slug: true, name: true, description: true, icon: true, color: true, category: true, sortOrder: true, isActive: true, config: true },";

if (content.includes(oldSelect)) {
  content = content.replace(oldSelect, newSelect);
  console.log('✓ GET /tools/all agora retorna config');
} else {
  console.log('⚠ GET /tools/all select não encontrado (já atualizado?)');
}

fs.writeFileSync(toolsPath, content);
console.log('\n✅ Backend atualizado!');
console.log('Próximo: git add . && git commit -m "feat: imagePosition no config da Tool" && git push');
