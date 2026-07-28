#!/usr/bin/env node
/**
 * Generates unique test credentials for Maestro e2e flows using @faker-js/faker.
 *
 * Usage:
 *   eval $(node maestro/generate-test-user.cjs)
 *   maestro test -e EMAIL="$EMAIL" -e PASSWORD="$PASSWORD" ...
 */

const { faker } = require("@faker-js/faker");

const ts = Date.now();
const slug = faker.string.alphanumeric({ length: 8, casing: "lower" });

const EMAIL = `nutriflow.e2e.${ts}.${slug}@example.com`;
const PASSWORD = `Tf${faker.string.alphanumeric(10)}!1`;
const DISPLAY_NAME = faker.person.firstName().slice(0, 18);
const MEAL_NAME = `E2E ${faker.food.dish()}`.slice(0, 40);
const COMMENT_TEXT = faker.lorem.sentence({ min: 3, max: 8 }).slice(0, 120);
const WRONG_PASSWORD = `Wrong${faker.string.alphanumeric(8)}!`;

const shellEscape = (value) => String(value).replace(/'/g, `'\\''`);

const vars = {
  EMAIL,
  PASSWORD,
  DISPLAY_NAME,
  MEAL_NAME,
  COMMENT_TEXT,
  WRONG_PASSWORD,
};

for (const [key, value] of Object.entries(vars)) {
  process.stdout.write(`export ${key}='${shellEscape(value)}'\n`);
}

process.stderr.write(`${JSON.stringify(vars, null, 2)}\n`);
