/**
 * @fileoverview Specifications of the constant data values used by Genotet.
 */

var Data = {
  /**
   * Data queries are sent to this address via http and received via jsonp.
   */
  serverURL: 'http://localhost:3000/genotet',

  /**
   * Genes with binding data available in the Genotet system.
   * TODO(bowen): Create the array upon organism selection,
   *     retrieve gene list from server.
   */
  bindingGenes: [
    'BATF', 'IRF4', 'MAF', 'RORC', 'STAT3', 'Hif1a', 'Etv6', 'Jmjd3',
    'BATF-Th0', 'BATF-Th17', 'cMaf-Th0', 'cMaf-Th17', 'Fosl2-Th0', 'Fosl2-Th17',
    'IRF4-Th0', 'IRF4-Th17', 'p300-Th0', 'p300-Th17', 'RORg-Th0', 'RORg-Th17',
    'STAT3-Th0', 'STAT3-Th17', 'RNA-Seq-1h', 'RNA-Seq-3h', 'RNA-Seq-6h',
    'RNA-Seq-9h', 'RNA-Seq-16h', 'RNA-Seq-24h', 'RNA-Seq-48h',
    'FAIRE-Seq-IRF4+', 'FAIRE-Seq-IRF4-', 'FAIRE-Seq-Batf+', 'FAIRE-Seq-Batf-'
  ],

  /**
   * Binding data chromosomes. The array is created upon Data initialization.
   */
  bindingChrs: [],

  /**
   * Current organism.
   */
  organism: 'th17',

  /**
   * Color scale from red to green.
   */
  redBlueScale: ['#ab1e1e', 'gray', '#1e6eab'],

  /**
   * Initializes Data properties.
   */
  init: function() {
    for (var i = 0; i < 19; i++) {
      this.bindingChrs.push((i + 1).toString());
    }
    this.bindingChrs = this.bindingChrs.concat(['M', 'X', 'Y']);
  }
};
