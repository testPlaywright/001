// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --

import { BASE_URL, CANCEL, CLICKED, PASSWORD, USERNAME } from "./constants";

Cypress.Commands.add("ssoLogin", () => {
  const basicUser = Cypress.env("basic_username");
  const basicPass = Cypress.env("basic_password");
  const msid = Cypress.env("msid");
  const msidPass = Cypress.env("msid_password");
  const loginUrl = `https://${basicUser}:${basicPass}@authgateway1-dev.entsiam.uhg.com/as/.../authorization.ping`;

  // Step 1: Visit with Basic Auth
  cy.visit(loginUrl);

  // Step 2: Enter MSID credentials in the form
  cy.get('input[name="pf.username"]', { timeout: 15000 }).type(msid);
  cy.get('input[name="pf.pass"]').type(msidPass, { log: false });
  cy.get('input[type="submit"]').click();

  // Exit early since rest of the original logic is obsolete with form flow
  return;

  cy
    .request({
      method: "GET",
      url: BASE_URL,
      failOnStatusCode: false,
    })
    .then((response) => {
      const locationUrl = getLocationUrl(response);
      const authVerification = getAuthVerification(response);

      console.log("First location: ", location);
      console.log("First auth_verification: ", authVerification);

      Cypress.env("auth_verification", authVerification);

      cy
        .request({
          method: "GET",
          url: locationUrl,
        })
        .then((response) => {
          const location = getLoc(response);

          console.log("2nd location: ", location);

          cy
            .request({
              method: "POST",
              url: location,
              form: true,
              body: {
                "pf.username": USERNAME,
                "pf.pass": PASSWORD,
                "pf.ok": CLICKED,
                "pf.cancel": CANCEL,
              },
            })
            .then((response) => {
              const redirectUrl = getRedirectUrl(response);

              console.log("redirectUrl: ", redirectUrl);

              cy
                .request({
                  method: "GET",
                  url: redirectUrl,
                  headers: {
                    Cookie: "auth_verification=" + Cypress.env("auth_verification"),
                  },
                })
                .then((response) => {
                  const appSession = getAppSession(response);

                  console.log("appSession: " + appSession);

                  Cypress.env("appSession", appSession);
                  console.log("Respone ", response)
                });
            });
        });
    });
});

const getLocationUrl = (response) => {
  const responseHeaders = response.allRequestResponses[0]["Response Headers"];
  const location = responseHeaders["location"];

  return location;
};

const getAuthVerification = (response) => {
  const cookieHeader = response.headers["set-cookie"][0];
  const authVerification = extractValueFromCookie(cookieHeader, "auth_verification");

  return authVerification;
};

const getLoc = (response) => {
  const responseHeaders = response.allRequestResponses[0]["Response Headers"];
  const location = responseHeaders["location"];

  return location;
};

const getRedirectUrl = (response) => {
  const redirectRegex = /^\S+ (.+)$/; // Match non-whitespace characters followed by a space and capture the rest
  const match = redirectRegex.exec(response.redirects[0]);

  return match ? match[1] : null; // Return the captured URL or null if not found
};

const getAppSession = (response) => {
  const appSessionHeader = response.headers["set-cookie"];

  return appSessionHeader;
};

const extractValueFromCookie = (cookie, key) => {
  const [value] =
    cookie
      .split(";")
      .find((part) => part.startsWith(`${key}=`))
      ?.split("=") || [];

  return value;
};

beforeEach(() => {  
  cy.wait(2500); // Wait for 2 seconds before each test  
});

Cypress.config("defaultCommandTimeout", 10000);

//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

//This code will ensure that we are able to see logs in Headless Runs
Cypress.Commands.overwrite("log", function (log, ...args) {
  if (Cypress.browser.isHeadless) {
    return cy.task("log", args, { log: false }).then(() => {
      return log(...args);
    });
  } else {
    console.log(...args);
    return log(...args);
  }
});