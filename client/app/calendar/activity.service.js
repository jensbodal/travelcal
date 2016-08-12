(function () {
  'use strict';

  angular
    .module('travelcal')
    .service('ActivityService', ActivityService);

  ActivityService.$inject = [
    '$mdDialog'
  ];

  function ActivityService($mdDialog) {
    this.createActivityForm = createActivityForm;
    this.editActivityForm = editActivityForm;

    return this;


    // custom moment UTC to JSON date object; month subtracted by 1 because javascript dates are fun
    function _customJsonDate(date) {
      var myRegExp = /(\d{4})\-(\d{2})\-(\d{2})(.*)/g;
      var match = myRegExp.exec(date);
      return {
        year: match[1],
        month: match[2] - 1,
        day: match[3]
      };
    }

    function _momentUtcToDate(date) {
      date = _customJsonDate(date);
      return new Date(date.year, date.month, date.day);
    }

    // remove timezone offset from date and convert to ISO date string
    // http://stackoverflow.com/a/7423831/679716
    function _smartDate(date) {
      var targetTime = date;
      var timeZone = 0;
      var tzDifference = timeZone * 60 - targetTime.getTimezoneOffset();
      var offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);
      return offsetTime.toISOString();
    }


    // http://stackoverflow.com/a/7616484/679716
    function _hashCode(string) {
      var hash = 0, i, chr, len;
      if (string.length === 0) return hash;
      for (i = 0, len = string.length; i < len; i++) {
        chr   = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    // dates must be UTC strings
    // 2016-09-23T00:00:00+00:00
    function createActivityForm(startDate, endDate) {
      var activity = {
        start: _momentUtcToDate(startDate),
        end: _momentUtcToDate(endDate)
      }

      return $mdDialog.show({
        controller: DialogController,
        controllerAs: 'vm',
        templateUrl: 'static/app/new-item/new-item.template.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        fullscreen: false,
        locals: {
          edit: false,
          activity: activity,
          start: startDate
        }
      })
      // when something is passed to the button we add it to the hide and succeed in life
        .then(function(activity) {
          return activity;
        }, function() {
          console.log('dialog closed');
          return false;
        });
    }

    function editActivityForm() {
      // this will be fun 2
    }

    DialogController.$inject = [
      '$mdDialog',
      'CurrencyService',
      'locals'
    ]
    function DialogController($mdDialog, CurrencyService, locals) {
      var vm = this;
      vm.edit = locals.edit;
      vm.activity = locals.activity;
      vm.start = locals.start;

      vm.hide = hide;
      vm.add = add;
      vm.cancel = cancel;
      vm.deleteActivity = deleteActivity;
      vm.update = update;
      vm.newItemForm = {};
      vm.repetitionTypes = ['total', 'per person', 'per day'];
      vm.selected = [];
      vm.currency = '';

      vm.formIsValid = formIsValid;

      /* DIALOG FUNCTIONS */
      function hide() {
        console.log('hiding');
        $mdDialog.hide('JENSBODAL');
      };

      function add(answer) {
        console.log('adding trip');
        $mdDialog.hide(answer);
      }

      function cancel() {
        $mdDialog.cancel();
        $mdDialog.hide('U@FJI');
      };

      function deleteActivity() {
        $mdDialog.hide(true);
      }

      // update handles both adding and updating activities
      function update(_activity) {
        var activity = angular.copy(_activity);

        if (!activity.currency) {
          activity.currency = 'USD';
        }
        if (!activity.id) {
          activity.id = _hashCode(activity.title+Date.now());
        }

        // do a bunch of fun stuff to make times work
        if (activity.startTime) {
          activity.startTime = moment(activity.startTime);
          activity.startTime = moment(vm.activity.start)
            .hours(activity.startTime.hours())
            .minutes(activity.startTime.minutes())
            .seconds(0).milliseconds(0).toDate();


          var targetTime = activity.startTime;
          var timeZone = 0;
          var tzDifference = timeZone * 60 - targetTime.getTimezoneOffset();
          var offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);

          activity.startTime = _smartDate(activity.startTime);
          activity.start = activity.startTime;
        }

        if (activity.endTime) {
          activity.endTime = moment(activity.endTime);
          activity.endTime = moment(vm.activity.end)
            .hours(activity.endTime.hours())
            .minutes(activity.endTime.minutes())
            .seconds(0).milliseconds(0).toDate();

          activity.endTime = _smartDate(activity.endTime);
          activity.end = activity.endTime;
        }

        $mdDialog.hide(activity);
      };
      /* END  DIALOG FUNCTIONS */
 
      /* FORM FUNCTIONS */
      function formIsValid(form) {
        if (form) {
          return form.$valid;
        }
        return false;
      }

      vm.activity.allDay = true;

      if (vm.edit) {
        console.log('editing');
        vm.activity.startTime = moment(vm.activity.startTime).toDate()
        vm.activity.endTime = moment(vm.activity.endTime).toDate()
        vm.activity.start = moment(vm.activity.start) || undefined;
        vm.activity.end = moment(vm.activity.end) || undefined;

        if (vm.activity.startTime) {
          var time = moment(vm.activity.startTime)
          var hour = time.hours()
          var min = time.minutes()
          vm.activity.start.hour(hour)
          vm.activity.start.minute(min)
        }
        if (vm.activity.endTime) {
          var time = moment(vm.activity.endTime)
          var hour = time.hours()
          var min = time.minutes()
          vm.activity.end.hour(hour)
          vm.activity.end.minute(min)
        }

        vm.title = 'Edit Activity';
        vm.currency = vm.activity.currency;

      } 
      // else we have a new activity
      else {

        vm.title = 'Add a New Activity'
        vm.activity.allDay = false;
        vm.activity.quantity = 1;
        vm.activity.repetitionType = 'total';
        vm.currency = 'USD';      // default currency

        vm.activity.endTime = moment(vm.activity.end)
          .hours(23).minutes(59).seconds(0).milliseconds(0).toDate();
        vm.activity.startTime = moment(vm.activity.start)
          .hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
      }

      vm.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) {
          list.splice(idx, 1);
        } else {
          list.push(item);
        }
      };

      vm.exists = function (item, list) {
        return list.indexOf(item) > -1;
      }

      CurrencyService.getCurrencies()
        .then(function success(response) {
          vm.currencies = response.data;
          vm.currencyNames = Object.getOwnPropertyNames(vm.currencies.rates);
          vm.currencyNames.push(response.data.base);
          vm.currencyNames.sort();
          vm.currencyAutoComplete = [];
          for (var i = 0; i < vm.currencyNames.length; i++) {
            var newCurrency = { value: vm.currencyNames[i], display: vm.currencyNames[i] };
            vm.currencyAutoComplete.push(newCurrency);
          }
        }, function error(response) {
          console.log(response);
        });

        vm.newCurrency = function newCurrency(currency) {
          alert('Sorry, that currency is not supported.')
        }
        vm.querySearch = function querySearch(query) {
          return query ? vm.currencyAutoComplete.filter(createFilterFor(query)) : vm.currencyAutoComplete;
        }

        function createFilterFor(query) {
          var uppercaseQuery = angular.uppercase(query);
          return function filterFn(currency) {
            return (currency.value.indexOf(uppercaseQuery) === 0);
          }
        }
        vm.updateCurrency = function updateCurrency(currentCurrency) {
          vm.activity.currency = currentCurrency;
          return;
        }

        vm.renderStart = function() {
          if (!moment.isMoment(vm.activity.start)) {
            vm.activity.start = moment(vm.activity.start)
          }
          return vm.activity.start.utc().format('MMMM Do, YYYY')
        }

    }
  }

})();
