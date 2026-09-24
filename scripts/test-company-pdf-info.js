"use strict";
const assert = require("node:assert/strict");
const info = require("../src/features/company/company-pdf-info.js");
const result = info.getCompanyPdfInfo({ businessName: "Empresa", companyInstagram: "empresa", whatsappNumber: "85 99999-9999" }, { formatPhoneForPdf: (value) => value, systemName: "Sistema" });
assert.equal(result.nome, "Empresa");
assert.equal(result.instagram, "@empresa");
assert.equal(result.whatsapp, "85 99999-9999");
console.log("company_pdf_info_tests_ok");
