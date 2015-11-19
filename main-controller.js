(function () {
    'use strict';

    angular.module('calendar')
        .controller('mainCtrl', mainCtrl);

    mainCtrl.$inject = ['dataService'];

    function mainCtrl(dataService) {
        var vm = this;

        vm.showSelections = false;
        vm.showIdRadio = false;
        vm.year = new Date().getFullYear();
        vm.gui = null;
        vm.selections = {
            rules: []
        };

        vm.softRules = {
            weekdayIdNum: 'Even distribution of one day per week classes (14-15)',
            fallStartMon: 'Fall semester starts on a Monday',
            summerToFallMoreThanWeek: 'Difference between the end of Summer and start of Fall semester is more than 7 calendar days',
            convocationFriBeforeFirstID: 'Convocation is a Friday before the first Instructional Day (ID) of Fall semester',
            extendedFallBreak: 'Extended Fall break (take off Monday-Wednesday before Thanksgiving)',
            commencementTueFri: 'Commencement is Tuesday - Friday',
            CesarChavezInSpringBreak: 'Attempt to put Cesar Chavez Day in Spring Break'
        };

        vm.rulesContainCtrlId = function() {
            for(var i in vm.selections.rules){
                //console.log(vm.selections.rules[i]);
                if(vm.selections.rules[i] == 'ctrlIdNum'){
                    return true;
                }
            }
            return false;
        };

        vm.finished = function() {
            vm.showIdRadio = vm.rulesContainCtrlId();
            console.log('SEND INFORMATION FOR BACKEND : '+vm.year);
            console.log(vm.selections.rules);
            console.log(vm.showIdRadio);
            vm.showSelections = true;
        };

        vm.constructCalendar = function(year) {
            vm.year = year;
            console.log('CONSTRUCT CALENDAR WITH: '+vm.year);
            vm.gui = dataService.constructCalendarData(year);
            console.log('GUI TREE:');
            console.log(vm.gui);
        };

        console.log("Inside mainCtrl");
        //vm.gui = dataService.constructCalendarData(2017);
        //console.log('GUI TREE:');
        //console.log(vm.gui);
    }
}());