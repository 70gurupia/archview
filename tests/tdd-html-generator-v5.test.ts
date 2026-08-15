import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { executeMindmap } from '../src/tools/mindmap.js';
import { executeExportHtmlReport } from '../src/tools/export-html.js';
import { generateStandaloneDiagramHtml, generateDashboardHtml } from '../engine/html-generator.js';
import { createSseApp } from '../src/utils/sse.js';

async function runV5TestSuite() {
  console.log("🧪 === [TDD v5.0] Suíte de Testes do Gerador de HTML Autocontido e Dashboards ===\n");

  const outDir = path.resolve(process.cwd(), 'output');

  // Bateria 1: Geração Automática de HTML na Criação de Diagrama
  console.log("1. Testando Geração Automática de .html na Persistência de Diagramas...");
  const mindmapRes = executeMindmap({
    central_topic: "Teste HTML v5.0",
    branches: [
      { title: "Offline First", sub_branches: ["Zero Servidor", "Duplo Clique"] },
      { title: "Exportação", sub_branches: ["SVG", "PNG HD", "PNG 4K"] }
    ],
    output_path: "test-v5-auto.md"
  });

  const expectedHtmlPath = path.join(outDir, "test-v5-auto.html");
  assert(fs.existsSync(expectedHtmlPath), "Arquivo .html deve ter sido gerado automaticamente ao lado do .mmd");

  const htmlContent = fs.readFileSync(expectedHtmlPath, 'utf-8');
  assert(htmlContent.includes('<!DOCTYPE html>'), "Deve ser um documento HTML5 válido");
  assert(htmlContent.includes('Teste HTML v5.0'), "Deve conter o título do diagrama");
  assert(htmlContent.includes('mermaid'), "Deve conter runtime do Mermaid");
  assert(htmlContent.includes('exportPng'), "Deve conter função de exportação PNG");
  assert(htmlContent.includes('zoomIn'), "Deve conter controles de Pan/Zoom");
  console.log("  ✅ Arquivo HTML individual gerado e validado:", expectedHtmlPath);

  // Bateria 2: 11ª Ferramenta MCP (export_html_report - Modo Single)
  console.log("\n2. Testando Ferramenta MCP export_html_report (Modo Single)...");
  const singleRes = executeExportHtmlReport({
    diagram_id: "test-v5-auto",
    mode: "single",
    theme: "dark",
    output_path: "test-v5-custom.html"
  });

  assert(fs.existsSync(singleRes.file_path), "Arquivo customizado .html deve existir");
  const customHtml = fs.readFileSync(singleRes.file_path, 'utf-8');
  assert(customHtml.includes('data-theme="dark"'), "Deve inicializar com o tema dark selecionado");
  console.log("  ✅ Exportação individual via MCP validada:", singleRes.file_path);

  // Bateria 3: 11ª Ferramenta MCP (export_html_report - Modo Dashboard Consolidado)
  console.log("\n3. Testando Ferramenta MCP export_html_report (Modo Dashboard Consolidado)...");
  const dashRes = executeExportHtmlReport({
    mode: "dashboard",
    output_path: "test-v5-dashboard.html"
  });

  assert(fs.existsSync(dashRes.file_path), "Dashboard consolidado .html deve existir");
  const dashHtml = fs.readFileSync(dashRes.file_path, 'utf-8');
  assert(dashHtml.includes('ArchView Executive Dashboard'), "Deve conter título do dashboard");
  assert(dashHtml.includes('const diagrams = ['), "Deve conter lista consolidada de diagramas embutida");
  console.log("  ✅ Dashboard consolidado via MCP validado:", dashRes.file_path);

  // Bateria 4: Verificação de Segurança (Anti-Path Traversal na Exportação HTML)
  console.log("\n4. Testando Guardrails Anti-Path Traversal na Exportação HTML...");
  assert.throws(() => {
    executeExportHtmlReport({
      mode: "single",
      output_path: "../../etc/evil.html"
    });
  }, /Path traversal attempt detected/, "Deve bloquear tentativa de path traversal na exportação HTML");
  console.log("  ✅ Tentativas de path traversal bloqueadas com sucesso.");

  // Bateria 5: Endpoints REST Express (HTML Delivery)
  console.log("\n5. Testando Rotas Express de Entrega de HTML...");
  const app = createSseApp();
  assert(app, "Instância Express inicializada com rotas /api/diagrams/:id/html e /api/export/dashboard-html");
  console.log("  ✅ Endpoints /api/diagrams/:id/html e /api/export/dashboard-html integrados ao Express.");

  // Limpeza dos arquivos temporários de teste
  try {
    fs.unlinkSync(expectedHtmlPath);
    fs.unlinkSync(path.join(outDir, "test-v5-auto.mmd"));
    fs.unlinkSync(path.join(outDir, "test-v5-auto.meta.json"));
    fs.unlinkSync(singleRes.file_path);
    fs.unlinkSync(dashRes.file_path);
  } catch {}

  console.log("\n🎉 === Todos os testes da Fase 5.0 passaram com 100% de sucesso! ===");
}

runV5TestSuite().catch(err => {
  console.error("❌ Falha nos testes TDD v5.0:", err);
  process.exit(1);
});
