import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_FIDCS } from "../app/mock-data";
import { calculateMatches } from "../app/matching";
import type { FidcProfile, OperationForm } from "../app/types";

const operation: OperationForm = {
  companyName: "Empresa Teste",
  cnpj: "11.222.333/0001-81",
  segment: "Agro",
  annualRevenue: 4_500_000_000,
  city: "Rondonópolis",
  state: "MT",
  amount: 500_000_000,
  operationType: "Capital de Giro",
  hasGuarantee: true,
  guaranteeValue: 700_000_000,
  guaranteeType: "Recebíveis",
  salesMethod: "Contratos B2B",
  receiptMethod: "Boleto",
};

test("aplica critérios obrigatórios e explica inelegibilidade", () => {
  const results = calculateMatches(operation, INITIAL_FIDCS);
  const multiplica = results.find((result) => result.fidc.name === "Multiplica");
  const delMonte = results.find((result) => result.fidc.name === "Del Monte");
  assert.equal(multiplica?.eligible, true);
  assert.equal(multiplica?.score, 100);
  assert.equal(delMonte?.eligible, false);
  assert.match(delMonte?.explanation ?? "", /faturamento/i);
});

test("respeita operador máximo configurado pelo administrador", () => {
  const configured: FidcProfile = {
    ...INITIAL_FIDCS[0],
    id: "max-test",
    name: "Máximo Teste",
    revenueMode: "Máximo",
    minRevenue: 4_000_000_000,
  };
  const [result] = calculateMatches(operation, [configured]);
  assert.equal(result.eligible, false);
  assert.equal(result.criteria[0].passed, false);
});

test("ignora FIDCs que não estão ativos", () => {
  const inactive = { ...INITIAL_FIDCS[0], status: "Arquivado" as const };
  assert.deepEqual(calculateMatches(operation, [inactive]), []);
});
