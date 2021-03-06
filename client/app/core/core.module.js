(function() {
  'use strict';

  angular
    .module('travelcal.core', [
      'angularMoment',
      'google.places',
      'ngMaterial',
      'ngMdIcons',
      'ngStorage',
      'ngMessages',
      'ngStorage',
      'ui.router',
      'ui.calendar'
    ])
    .config(function($mdThemingProvider) {
      $mdThemingProvider
      .theme('default')
      .primaryPalette('blue')
      .accentPalette('blue-grey')
    });
})();
