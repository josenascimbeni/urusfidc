import assert from "node:assert/strict";
import test from "node:test";
import { activeTemplateItems, checklistItemsForFidc, createDocuments, INITIAL_CHECKLIST_TEMPLATES, STANDARD_CHECKLIST_ITEMS } from "../app/mock-data";

test("todo FIDC herda o padrão Urus e soma apenas seus adicionais", () => {
  const multiplicaTemplate = INITIAL_CHECKLIST_TEMPLATES.find((template) => template.fidcId === "multiplica");
  assert.ok(multiplicaTemplate);
  assert.equal(activeTemplateItems(multiplicaTemplate).length, 1);
  assert.equal(checklistItemsForFidc("multiplica").length, STANDARD_CHECKLIST_ITEMS.length + 1);
  assert.equal(checklistItemsForFidc("brr").length, STANDARD_CHECKLIST_ITEMS.length);
});

test("excluir um adicional não remove documentos herdados do padrão", () => {
  const templates = structuredClone(INITIAL_CHECKLIST_TEMPLATES);
  const multiplica = templates.find((template) => template.fidcId === "multiplica");
  assert.ok(multiplica);
  multiplica.activeVersion = 2;
  multiplica.versions.push({ id: "tpl-multiplica-v2", version: 2, createdAt: "16/08/2026", createdBy: "admin", items: [] });
  assert.deepEqual(checklistItemsForFidc("multiplica", templates).map((item) => item.id), STANDARD_CHECKLIST_ITEMS.map((item) => item.id));
  assert.equal(createDocuments("OP-TEST", "owner", ["multiplica"], templates).length, STANDARD_CHECKLIST_ITEMS.length);
});

test("documento adicional preserva a classificação de obrigatoriedade", () => {
  const templates = structuredClone(INITIAL_CHECKLIST_TEMPLATES);
  const multiplica = templates.find((template) => template.fidcId === "multiplica");
  assert.ok(multiplica);
  const active = multiplica.versions.find((version) => version.version === multiplica.activeVersion);
  assert.ok(active);
  active.items.push({ ...active.items[0], id: "optional-report", name: "Relatório complementar", required: false, order: 2 });
  const requirements = createDocuments("OP-OPTIONAL", "owner", ["multiplica"], templates);
  const optional = requirements.find((requirement) => requirement.name === "Relatório complementar");
  assert.equal(optional?.required, false);
  assert.equal(requirements.filter((requirement) => requirement.required).includes(optional!), false);
});
