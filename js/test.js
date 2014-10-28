
// Here you can specify the views for testing

"use strict";

function createTestViews() {
  // You can add your test views here to define the action for "Test Preset" button
  // The views defined here will be launched when the system starts
  createView("Chart", "chart").load();
  createView("Network", "network").load();
  createView("Genome Browser", "binding").load();

  /*
   * the following code create a network and load some genes (currently not working)
   */
  /*
  var net1 = createView("Network1", "network");
  net1.load({
      network: "th17",
      genesRegex: "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$"
    });
  */
}
