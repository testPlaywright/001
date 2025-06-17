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

  const entryUrl = "https://rxc-cat-test.optum.com/login";

  // Step 1: Visit the static login page
  cy.visit(entryUrl);

  // Step 2: Wait for the dynamic redirect to happen, then re-visit with Basic Auth
  cy.window().then((win) => {
    const redirectUrl = win.location.href;

    // Step 3: Revisit the redirected dynamic URL with basic auth
    cy.visit(redirectUrl, {
      auth: {
        username: basicUser,
        password: basicPass,
      },
    });

    // Step 4: Enter MSID credentials and submit
    cy.get('input[name="pf.username"]', { timeout: 15000 }).type(msid);
    cy.get('input[name="pf.pass"]').type(msidPass, { log: false });
    cy.get('input[type="submit"]').click();
  });
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