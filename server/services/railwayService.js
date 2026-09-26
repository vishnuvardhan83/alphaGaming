// AlphaQ Gaming — Railway Variables & Environment Service
// Manages environment variables via Railway GraphQL API, Railway CLI, and process.env.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RAILWAY_GQL_URL = "https://backboard.railway.com/graphql/v2";

const PROJECT_ID = process.env.RAILWAY_PROJECT_ID || "4074b32b-3cc9-4bbc-a4b0-a81dedbf6aa7";
const ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID || "f323c8e1-2ef6-487e-bca8-ea633a8febdf";
const SERVICE_ID = process.env.RAILWAY_SERVICE_ID || "4550b64f-f638-4c1c-a402-f902fec5034a";

/**
 * Attempts to retrieve Railway API access token.
 */
function getRailwayToken() {
  if (process.env.RAILWAY_API_TOKEN) return process.env.RAILWAY_API_TOKEN.trim();
  if (process.env.RAILWAY_TOKEN) return process.env.RAILWAY_TOKEN.trim();

  // Try checking ~/.railway/config.json if running in dev environment
  try {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    const cfgPath = path.join(home, ".railway", "config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      if (cfg?.user?.accessToken) {
        return cfg.user.accessToken;
      }
      if (cfg?.user?.token) {
        return cfg.user.token;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Checks if Railway CLI is executable in the current environment.
 */
function hasRailwayCli() {
  try {
    execSync("railway --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Executes a GraphQL request to Railway.
 */
async function railwayGraphql(query, variables = {}) {
  const token = getRailwayToken();
  if (!token) {
    throw new Error("No Railway API token found. Please set RAILWAY_API_TOKEN.");
  }

  const res = await fetch(RAILWAY_GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || "Railway GraphQL query failed");
  }
  return json.data;
}

/**
 * Fetches all environment variables.
 */
async function getVariables() {
  // Method 1: Try Railway CLI if available
  if (hasRailwayCli()) {
    try {
      const out = execSync("railway variable list --json", { encoding: "utf8", timeout: 8000 });
      const parsed = JSON.parse(out);
      return {
        source: "railway_cli",
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID,
        variables: parsed,
      };
    } catch (e) {
      console.warn("[RailwayService] CLI fetch failed, falling back to GraphQL/process.env:", e.message);
    }
  }

  // Method 2: Try Railway GraphQL API
  const token = getRailwayToken();
  if (token) {
    try {
      const query = `
        query getVars($projectId: String!, $environmentId: String!, $serviceId: String) {
          variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
        }
      `;
      const data = await railwayGraphql(query, {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID,
      });

      return {
        source: "railway_api",
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID,
        variables: data.variables || {},
      };
    } catch (e) {
      console.warn("[RailwayService] GraphQL fetch failed, falling back to process.env:", e.message);
    }
  }

  // Method 3: Fallback to process.env
  const relevantKeys = [
    "ADMIN_EMAIL",
    "ADMIN_PHONES",
    "ADMIN_PASSWORD",
    "DB_CLIENT",
    "EMAILJS_SERVICE_ID",
    "EMAILJS_TEMPLATE_ID",
    "EMAILJS_PUBLIC_KEY",
    "EMAILJS_PRIVATE_KEY",
    "JWT_SECRET",
    "MYSQL_DATABASE",
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "PORT",
    "RAILWAY_ENVIRONMENT",
    "RAILWAY_PROJECT_NAME",
    "RAILWAY_PUBLIC_DOMAIN",
  ];

  const filtered = {};
  for (const k of relevantKeys) {
    if (process.env[k] !== undefined) {
      filtered[k] = process.env[k];
    }
  }

  return {
    source: "process_env",
    projectId: PROJECT_ID,
    environmentId: ENVIRONMENT_ID,
    serviceId: SERVICE_ID,
    variables: filtered,
  };
}

/**
 * Sets or updates a single environment variable in Railway and locally.
 */
async function setVariable(name, value) {
  const safeName = String(name || "").trim().toUpperCase();
  const safeValue = String(value || "");

  if (!safeName) {
    throw new Error("Variable name is required.");
  }
  if (!/^[A-Z0-9_]+$/.test(safeName)) {
    throw new Error("Variable name must contain only uppercase letters, numbers, and underscores.");
  }

  let railwayUpdated = false;
  let methodUsed = "none";

  // Try CLI first
  if (hasRailwayCli()) {
    try {
      execSync(`railway variable set "${safeName}=${safeValue.replace(/"/g, '\\"')}"`, {
        encoding: "utf8",
        timeout: 10000,
      });
      railwayUpdated = true;
      methodUsed = "railway_cli";
    } catch (e) {
      console.warn("[RailwayService] CLI set failed:", e.message);
    }
  }

  // Try GraphQL if CLI didn't succeed
  if (!railwayUpdated) {
    const token = getRailwayToken();
    if (token) {
      try {
        const mutation = `
          mutation variableUpsert($input: VariableUpsertInput!) {
            variableUpsert(input: $input)
          }
        `;
        await railwayGraphql(mutation, {
          input: {
            projectId: PROJECT_ID,
            environmentId: ENVIRONMENT_ID,
            serviceId: SERVICE_ID,
            name: safeName,
            value: safeValue,
          },
        });
        railwayUpdated = true;
        methodUsed = "railway_api";
      } catch (e) {
        console.warn("[RailwayService] GraphQL variableUpsert failed:", e.message);
      }
    }
  }

  // Always update in-memory process.env immediately
  process.env[safeName] = safeValue;

  return {
    ok: true,
    name: safeName,
    value: safeValue,
    railwayUpdated,
    methodUsed,
    message: railwayUpdated
      ? `Variable ${safeName} updated in Railway (${methodUsed}). Railway will apply it to new containers.`
      : `Variable ${safeName} updated in server memory. (To persist to Railway, configure RAILWAY_API_TOKEN).`,
  };
}

/**
 * Deletes an environment variable from Railway.
 */
async function deleteVariable(name) {
  const safeName = String(name || "").trim().toUpperCase();
  if (!safeName) {
    throw new Error("Variable name is required.");
  }

  let railwayDeleted = false;

  if (hasRailwayCli()) {
    try {
      execSync(`railway variable delete "${safeName}" --service alphaq-app`, {
        encoding: "utf8",
        timeout: 10000,
      });
      railwayDeleted = true;
    } catch (e) {
      console.warn("[RailwayService] CLI delete failed:", e.message);
    }
  }

  if (!railwayDeleted) {
    const token = getRailwayToken();
    if (token) {
      try {
        const mutation = `
          mutation variableDelete($input: VariableDeleteInput!) {
            variableDelete(input: $input)
          }
        `;
        await railwayGraphql(mutation, {
          input: {
            projectId: PROJECT_ID,
            environmentId: ENVIRONMENT_ID,
            serviceId: SERVICE_ID,
            name: safeName,
          },
        });
        railwayDeleted = true;
      } catch (e) {
        console.warn("[RailwayService] GraphQL variableDelete failed:", e.message);
      }
    }
  }

  delete process.env[safeName];

  return {
    ok: true,
    name: safeName,
    railwayDeleted,
  };
}

module.exports = {
  getVariables,
  setVariable,
  deleteVariable,
};
