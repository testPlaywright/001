/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars

import cucumber from "cypress-cucumber-preprocessor";
import {addPlugin} from "cypress-mochawesome-reporter/plugin";

export default (on, config) => {
  addPlugin(on, config);
  on("file:preprocessor", cucumber()); 
  return config;
}
