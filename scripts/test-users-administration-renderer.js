"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const usersRenderer = require(path.join(__dirname, "..", "src", "features", "users", "users-administration-renderer.js"));

let users = [{ id: "u-1", nome: "Ana", email: "ana@example.test", papel: "sales", ativo: true }];
const context = {
  escaparAttr: String,
  escaparHtml: String,
  getClientUsers: () => users,
  getCurrentPlanSlug: () => "pro",
  getPlanEntitlements: () => ({ employees: true }),
  getPlanoAtual: () => ({ nome: "Pro" }),
  getUiLayoutRelation: () => ({ className: "" }),
  getUsuarioAtual: () => users[0],
  getUsers: () => users,
  isSuperAdmin: () => false,
  normalizeUsers: (value) => value,
  renderAppButton: ({ label }) => `<button>${label}</button>`,
  renderUiIcon: () => "",
  renderUiLayoutAttributes: () => "",
  setUsers: (value) => { users = value; },
  userIsBlocked: () => false
};

assert.equal(usersRenderer.planAllowsEmployees(undefined, context), true);
assert.match(usersRenderer.renderEmployeeAdministration(undefined, context), /Adicionar funcionário/);
assert.match(usersRenderer.renderAdminUsers(context), /Ana/);
console.log("users_administration_renderer_tests_ok");
