import { defineConfig } from "cypress";
import fs from "fs";
import { queryDb } from "./cypress/plugins/ConnectDB.cjs";
import ExcelJS from "exceljs";
import path from "path";
import { buffer } from "stream/consumers";
import plugin from "cypress-mochawesome-reporter/plugin";
import cucumber from "cypress-cucumber-preprocessor";

const envJson = JSON.parse(fs.readFileSync('cypress.env.json', 'utf-8'))
export default defineConfig({
  defaultCommandTimeOut: 300000,
  reporter: "cypress-mochawesome-reporter",

  reporterOptions: {
    charts: true,
    json: true,
    saveJson: true,
    reportDir: "cypress/reports",
    reportFilename: "index",
    reportPageTitle: "CAT Automation Report",
    embeddedScreenshots: true,
    saveAllAttempts: false,
  },
  "cypress-cucumber-preprocessor": {
    nonGlobalStepDefinitions: true,
    stepDefinitions: "./cypress/e2e/stepdefinitions",
  },
  e2e: {
    chromeWebSecurity: false,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      on("file:preprocessor", cucumber());
      on("task", {
        log(args) {
          console.log(...args);
          return null;
        },
      });

      plugin(on, config);
      // DB Task registration
      on('task', {
        queryDb({ query, values }) {
          return queryDb(query, values)
        },
        async readErrorExcelExcelJS(fileName) {
          const filePath = path.join(__dirname, 'cypress/downloads', fileName);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(filePath);

          const sheet = workbook.getWorksheet('ValidationErrors') || workbook.worksheets[0];
          const rows = [];
          sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push({
              ticketId: row.getCell(1).value,
              field: row.getCell(4).value,
              errorMessage: row.getCell(6).value,
            });
          });

          return rows;
        }
      })
      return config;
    },
    include: ["./node_modules/cypress", "cypress/**/*.js"],
    specPattern: "cypress/e2e/**/*.feature",
    env: {
      uploadFileName: envJson.uploadFileName,
      TAGS: 'not @ignore'
    },
    retries: 1
  },

  component: {
    setupNodeEvents(on, config) {
      return import('./cypress/plugins/index.js').then((plugin) => {
        return plugin.default ? plugin.default(on, config) : plugin(on, config);

      });
      return config;
    }
  },
});
