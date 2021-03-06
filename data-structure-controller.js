(function(){
    'use strict';

    angular.module('calendar')
        .controller('dataCtrl',dataCtrl)
        .filter('range', function() {
          return function(input, total) {
            total = parseInt(total); //Make string input int
            for (var i=0; i<total; i++)
              input.push(i);
            return input;
          };
        });

	function dataCtrl ($window, $sce){
        var vm = this;

        vm.gui = null;
        var count = [];
        vm.index = null;
        vm.showResults = false; //show accordion
        vm.showCalendar = false;//show print calendar
        vm.endDay = 17;
        vm.year = new Date().getFullYear();
        var year = new Date().getFullYear();
        var fallStartDate;
        var springStartDate;
        var winterStartDate;
        var winterEndDate;
        var summerStartDate;
        var summerEndDate;

        vm.yearList = [];
        for(var i = 4; i > 0; i--){
			vm.yearList.push(year - i);
        }
        for(i = 0; i < 10; i++){
			vm.yearList.push(year + i);
        }
        console.log('Years List: '+vm.yearList);
		vm.dayTypes = {
			ACAD: 'Academic Work Day',
			INST: 'Instructional Day',
			CONV: 'Convocation',
			COMM: 'Commencement',
			FINL: 'Finals',
			HOLI: 'Holiday',
//			WKND: 'Weekend',
			START: 'Semester Start',
//			FILL: 'Fill',
			OPEN: 'No classes, campus open',
			SUMM: 'Summer Sessions',
			WINT: 'Winter Session'
//			UNK: 'Unknown'
		};

		vm.hardRules = [
//			"Fall semester is at least 15 weeks long",
//			"Spring semester is at least 15 weeks long",
			"Instructional Days is 147 \xB1 2 days",
			"Academic Work Days is 147 \xB1 2 days",
			"Fall and Spring semesters do not start on a Friday",
			"Fall and Spring finals are 5 weekdays and one Saturday (either before, in the middle, or after)",
			"Fall semester must start between Aug 17 and Sep 1",
			"Spring semester must start on or after Jan 15 (or Jan 16, if it is a leap year)",
			"Spring semester must end on or before May 31",
			"2-5 days between Convocation and the beginning of Fall semester",
			"10-15 Winter session Instructional Days",
			"Summer session is at least 12 calendar weeks",
			"4 days between the end of Spring finals and before Summer start date are reserved for Commencement",
			"Spring Break is a calendar week",
			"Fall Break is the Wednesday before Thanksgiving, Thursday, and Friday",
			"Holidays are always considered to be of day type Holiday",
			"Holidays that fall on weekends are observed on the nearest workdays",
			"Academic Work Days include Instructional, Final and Commencement days but exclude 'Campus Open-No Classes' days (Fall/Spring breaks)",
			"Convocation is held on an Academic Work Day between the first day of Fall and the first day of Fall classes."

		];

		vm.selections = {
			rules: []
		};

		vm.softRules = {
			weekdayIdNum: 'Even distribution of one day per week classes (14-15)',
			convocationFriBeforeFirstID: 'Convocation is a Friday before the first Instructional Day (ID) of Fall semester',
			fallStartMon: 'Fall semester starts on a Monday',
			extendedFallBreak: 'Extended Fall break (take off Monday-Wednesday before Thanksgiving)',
			fallFinalsMonday: 'Fall semester finals start on a Monday',
			summerToFallMoreThanWeek: 'Difference between the end of Summer and start of Fall semester is more than 7 calendar days',
			CesarChavezInSpringBreak: 'Put Cesar Chavez Day in Spring Break (after if not selected)',
			springFinalsMonday: 'Spring semester finals start on a Monday',
			commencementTueFri: 'Commencement is Tuesday - Friday',
			commencementBeforeMemorial: 'Commencement is before Memorial Day',
			limitWinterTenDays: "Limit winter session to 10 days long",
			springAfterMLK: "Spring start after MLK"
		};

        function getCount(){
			var startDate = {};
			startDate.month = "AUG";
			startDate.dayNumber = vm.endDay;
			count = getEntryCount(parseInt(vm.year), startDate, vm.selections.rules);

			if(count[0] == 0){
				console.log("no calendars due to the following conflicts:");
				console.log(count[1]);
			}
		}

		vm.getIndexCount = function(){
			console.log('SEND INFORMATION FOR BACKEND : '+vm.year);
			console.log(vm.selections.rules);
			getCount();
			vm.count = count;
			console.log(count);
			vm.showResults = true;
		}

		vm.initializeNewData = function(){
			// this is for parsing the URL into usable parts and connecting them w/ this instance of the controller
			var locate = window.location;
			document.hiddenForm.hiddenName.value = locate;

			var text = document.hiddenForm.hiddenName.value;

			function delineate(str){
				var theleft = str.indexOf("=") + 1;
				var theright = str.indexOf("&");
				return(str.substring(theleft, theright));
			}
			var year = delineate(text);

			function delineate2(str){
				var startOfPrevious = str.indexOf("=") + 1;
				var new_string = str.slice(startOfPrevious);
				var theleft = new_string.indexOf("=") + 1;
				new_string = new_string.slice(theleft);
				var theright = new_string.indexOf("&");
				return(new_string.substring(0, theright));
			}
			var date = delineate2(text);

			function delineate3(str){
				var startOfPrevious = str.indexOf("=") + 1;
				var new_string = str.slice(startOfPrevious);
				startOfPrevious = new_string.indexOf("=") + 1;
				new_string = new_string.slice(startOfPrevious);
				startOfPrevious = new_string.indexOf("=") + 1;
				new_string = new_string.slice(startOfPrevious);
				var theright = new_string.indexOf("&");
				return(new_string.substring(0, theright));
			}
			var list = binStringToSelections(delineate3(text));

			function delineateLast(str){
				var point = str.lastIndexOf("=");
				return(str.substring(point+1,str.length));
			}
			vm.index = delineateLast(text);

			var startDate = {};
			startDate.month = "AUG";
			startDate.dayNumber = date;

			vm.gui = constructCalendarData(parseInt(year), startDate, list, false, vm.index);
			console.log(vm.gui);
			console.log(inIFrame())
			vm.showCalendar = !inIFrame();
		}

		function inIFrame(){
		    try {
		        return window.self !== window.top;
		    } catch (e){
		        return true;
		    }
		}

		function selectionsToBinString(softErrors){
        	var urlString = Math.pow(10, 12);
			for(var i = 0; i < softErrors.length; i++){
				switch(softErrors[i]){
					case "weekdayIdNum":urlString += 1*Math.pow(10, 11);break;
					case "fallStartMon":urlString += 1*Math.pow(10, 10);break;
					case "summerToFallMoreThanWeek":urlString += 1*Math.pow(10, 9);break;
					case "convocationFriBeforeFirstID":urlString += 1*Math.pow(10, 8);break;
					case "extendedFallBreak":urlString += 1*Math.pow(10, 7);break;
					case "commencementTueFri":urlString += 1*Math.pow(10, 6);break;
					case "CesarChavezInSpringBreak":urlString += 1*Math.pow(10, 5);break;
					case "fallFinalsMonday":urlString += 1*Math.pow(10, 4);break;
					case "springFinalsMonday":urlString += 1*Math.pow(10, 3);break;
					case "commencementBeforeMemorial":urlString += 1*Math.pow(10, 2);break;
					case "limitWinterTenDays":urlString += 1*Math.pow(10, 1);break;
					case "springAfterMLK":urlString += 1;break;
					default:
				}
            }
            return urlString.toString().substring(1, 13);
        }

        function binStringToSelections(binary){
			var selections = [];
			for(var i = 0; i < binary.length; i++){
				if(binary[i] == 1){
					switch(i){
						case 0:selections.push("weekdayIdNum");break;
						case 1:selections.push("fallStartMon");break;
						case 2:selections.push("summerToFallMoreThanWeek");break;
						case 3:selections.push("convocationFriBeforeFirstID");break;
						case 4:selections.push("extendedFallBreak");break;
						case 5:selections.push("commencementTueFri");break;
						case 6:selections.push("CesarChavezInSpringBreak");break;
						case 7:selections.push("fallFinalsMonday");break;
						case 8:selections.push("springFinalsMonday");break;
						case 9:selections.push("commencementBeforeMemorial");break;
						case 10:selections.push("limitWinterTenDays");break;
						case 11:selections.push("springAfterMLK");break;
						default:
					}
				}
			}
			return selections;
        }

		vm.test = function(index){
			console.log(index);
		}

		vm.loadIFrame = function(index){
			var iFrame = document.getElementById("frame" + index);
			console.log(iFrame);
			iFrame.src = targetToString(vm.year, vm.endDay, index);
		}
		
		function targetToString(year, endDay, index){
			return "calendar.html?year="+year+"&date="+endDay+"&sel="+selectionsToBinString(vm.selections.rules)+"&num="+index;
		}
		
		vm.getCalendar = function(index){
            //setting the initials for the constructCalendarData -- !!!!!!!!!!!
			var binSelections = selectionsToBinString(vm.selections.rules);
			$window.open("calendar.html?year="+vm.year+"&date="+vm.endDay+"&sel="+binSelections+"&num="+index);

//			if(vm.gui[0].length == 0){
//				console.log("no calendars due to the following conflicts:");
//				console.log(vm.gui[1]);
//			}
        };

        vm.printPage = function(index){
//        	console.log(index)
//        	console.log('printThis'+index)
//        	console.log(document.getElementById('printThis'+index))
//        	console.log(document.getElementById('printThis'+index).innerHTML)

        	html2canvas(document.getElementById('printThis'+index), {
        		onrendered: function(canvas){
        			var data = canvas.toDataURL();
        			//window.open(data);
        			var docDefinition = {
        				content: [{
        					image: data,
        					fit: [595 , 700 ]
//        					width: 500
        				}]
        			};
        			pdfMake.createPdf(docDefinition).open();
//        			pdfMake.createPdf(docDefinition).print();
        		}
        	});
        }

        // for the special styling of the first days of the semesters
        vm.dayStyle = function(option,type,month,day,year){
        	// THIS IS VERY INEFFICIENT. FIGURE OUT A WAY TO REDO.
				fallStartDate = option.candidateEntryData[option.candidateEntryData.boundaries['FALL_START']];
				springStartDate = option.candidateEntryData[option.candidateEntryData.boundaries['SPRING_START']];
				winterStartDate = option.candidateEntryData[option.candidateEntryData.boundaries['WINTER_START']];
				winterEndDate = option.candidateEntryData[option.candidateEntryData.boundaries['WINTER_END']];
				summerStartDate = option.candidateEntryData[option.candidateEntryData.boundaries['SUMMER_START']];
				summerEndDate = option.candidateEntryData[option.candidateEntryData.boundaries['SUMMER_END']];
        	if(day == fallStartDate.dayNumber && month == fallStartDate.month && year == fallStartDate.year)
        		return "START"
        	else if(day == springStartDate.dayNumber && month == springStartDate.month && year == springStartDate.year)
				return "START"
        	else if(month == winterStartDate.month && year == winterStartDate.year)
        		if(day >= winterStartDate.dayNumber && day <= winterEndDate.dayNumber && type == 'INST')
					return "WINT"
				else
					return type
			else if(type== 'INST' && ((month == summerStartDate.month && day >= summerStartDate.dayNumber) || month == 'JUN' || month == 'JUL' || (month == summerEndDate.month && day <= summerEndDate.dayNumber)))
	        	return "SUMM"
			else
        		return type
        };

//        var fallStart = vm.gui.candidateEntryData.previousYearEnd;
//        fallStart.month;
//        fallStart.dayNumber;
//        var springStart = vm.gui.candidateEntryData[vm.gui.candidateEntryData.boundaries["SPRING_START"]];
//        springStart.month;
//        springStart.dayNumber;



function CreateCalendar(academicYear){
	//MAPPER******************************/

	//data to return
	var data = new ReturnData([], [], academicYear);
	//always points to next calendar week day
	var startDay = getFirstWeekday(academicYear, 7);
	//gui displays from May of academic year to August of the next
	var yearCounter = academicYear;
	//starting in May
	var monthCounter = 7;

	//YEARS**/
	while(yearCounter <= academicYear + 1){

		//MONTHS**/
		while((yearCounter == academicYear && monthCounter < 12) || (yearCounter == academicYear + 1 && monthCounter < 8)){

			var month = new Month([], monthCounter, Months[monthCounter], []);
			month.yearNumber = yearCounter;
			var weekCounter = 0;
			var dayOfMonth = 1;
			var dayLimit = getDaysInMonth(yearCounter, monthCounter);
			//WEEKS**/
			while(weekCounter < 6){ //six to fill the calendar data space

				var week = new Week([], weekCounter, Terms[4]);
				var weekDayCounter = 0;

				//fill days in beginning of month

				while((weekDayCounter < startDay) && (dayOfMonth <= dayLimit)){
					var day = new Day(0, weekDayCounter, 7, 4);
					weekDayCounter++;
					week.daySet.push(day);
				}//stop filling
				//DAYS**/
				//here is where the true days are added to the calendar
				while(weekDayCounter < 7 && (dayOfMonth <= dayLimit)){

					var day = new Day(dayOfMonth, weekDayCounter, 8, 4);
					dayOfMonth++;
					weekDayCounter++;
					startDay = (weekDayCounter == 7)?0:startDay + 1;
					week.daySet.push(day);
					day.month = Months[monthCounter];
					day.year = yearCounter;
					if(weekDayCounter == 1 || weekDayCounter == 7)
						day.type = "WKND";
					data.candidateEntryData.push(day);
				}//stop adding days
				//fill days at end of month
				while(dayOfMonth > dayLimit && weekDayCounter < 7){
					var day = new Day(0, weekDayCounter, 7, 4);
					weekDayCounter++;
					week.daySet.push(day);
				}//stop filling

				weekCounter++;
				weekDayCounter = 0;
				month.weekSet.push(week);
			}//end week

			monthCounter++;


			//month.monthHtml = monthStringHTML(month);



			data.guiTree.push(month);
		}//end month

		monthCounter = 0;
		yearCounter++;
	}//end year

	return data;
}


		/*
*	Constructs data for the gui and analyzer
*
*	@param academicYear The starting year to be worked on
*	@return Data for the gui and analyzer
*/
function constructCalendarData(academicYear, startDate, conditions, innerCall, index){
	//DATA AND FUNCTIONS

	var data = CreateCalendar(academicYear);

	var setConditions = [];
	if((typeof startDate == "undefined")||(typeof conditions == "undefined")){
		var spareConditions = ["fallStartMon", "summerToFallMoreThanWeek", "convocationFriBeforeFirstID",
			"extendedFallBreak", "commencementTueFri", "CesarChavezInSpringBreak", "limitWinterTenDays", "springAfterMLK"];
		setConditions = spareConditions;
		//spareConditions = TranslateConditions(spareConditions);
		var spareStartDate = [];
		spareStartDate.month = "AUG";
		spareStartDate.dayNumber = 23;
		data.candidateEntryData.startDate = spareStartDate;
	}
	else{
		data.candidateEntryData.startDate = startDate;
		data.candidateEntryData.conditions = conditions;
	}
	data.candidateEntryData.conditions = TranslateConditions(data.candidateEntryData.conditions);
	ExecuteProgram(data.candidateEntryData, startDate, data.candidateEntryData.conditions);


	if(!((typeof innerCall == "undefined")|| innerCall == true)){

		var testPoss = getPossibilities(data.candidateEntryData);

		//var success = applyPossibilities(data.candidateEntryData, testPoss);

		//var success = getCalendarCount(data.candidateEntryData, testPoss);

		//console.log(getEntryCount(academicYear, startDate, conditions));

		var testGetByIndex = calendarByIndex(data.candidateEntryData, testPoss, index);
		//var testGetByIndex = calendarByIndex(data.candidateEntryData, testPoss, 0);

		//console.log(testGetByIndex);

		return testGetByIndex;

	}
	else{

		return data;

	}

}//end creation of data

function getEntryCount(academicYear, startDate, conditions){
	var data = CreateCalendar(academicYear);

	var setConditions = [];
	if((typeof startDate == "undefined")||(typeof conditions == "undefined")){
		var spareConditions = ["fallStartMon", "summerToFallMoreThanWeek", "convocationFriBeforeFirstID",
			"extendedFallBreak", "commencementTueFri", "CesarChavezInSpringBreak", "limitWinterTenDays", "springAfterMLK"];
		setConditions = spareConditions;
		//spareConditions = TranslateConditions(spareConditions);
		var spareStartDate = [];
		spareStartDate.month = "AUG";
		spareStartDate.dayNumber = 23;
		data.candidateEntryData.startDate = spareStartDate;
	}
	else{
		data.candidateEntryData.startDate = startDate;
		data.candidateEntryData.conditions = conditions;
	}
	data.candidateEntryData.conditions = TranslateConditions(data.candidateEntryData.conditions);
	ExecuteProgram(data.candidateEntryData, startDate, data.candidateEntryData.conditions);
	var testPoss = getPossibilities(data.candidateEntryData);

	return getCalendarCount(data.candidateEntryData, testPoss);
}

var Months = new Enum(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]);

var DayLimits = new Enum([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])

var DaysOfWeek = new Enum(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'UNK']);

var DayTypes = new Enum(["ACAD", "INST", "CONV", "COMM", "FINL", "HOLI", "WKND", "FILL", "UNK", "OPEN"]);

var Terms = new Enum(["FALL", "WINT", "SPRI", "SUMM", "UNK"]);

/*
*	Creates a week object/container
*
*	@param dayNumber The calendar number associated with the day
*	@param dayOfWeek The enumerated day of the week (SUNDAY-SATURDAY)
*	@param type The academic category of the day
*	@param term The enumerated term the day belongs to (FALL - SUMMER)
*/
function Day(dayNumber, dayOfWeek, type, term){
	this.dayNumber = dayNumber;
	this.dayOfWeek = DaysOfWeek[dayOfWeek];
	this.type = DayTypes[type];
	this.term = Terms[term];
}

/*
*	Creates a week object/container
*
*	@param weekNumber The indexed number relative to the month
*	@param termWeek The indexed number relative to the term
*	@param daySet A container to hold days belonging to the week
*/
function Week(daySet, weekNumber, termWeek){
	this.daySet = daySet;
	this.weekNumber = weekNumber;
	this.termWeek = termWeek; //counts the number
}

/*
*	Creates a month object/container
*
*	@param monthNumber The indexed number relative to the year
*	@param monthName The name of the month
*	@param weekSet A container to hold the weeks of the month
*	@param dayTypeCounters A container to hold maps of day type occurrences
*/
function Month(weekSet, monthNumber, monthName, dayTypeCounters){
	this.weekSet = weekSet;
	this.monthNumber = monthNumber;
	this.monthName = monthName;
	this.dayTypeCounters = dayTypeCounters;
}

/*
*	Creates a year object/container
*
*	@param yearNumber The 4 digit year
*	@param monthSet A container to hold the months of the year
*/
function Year(monthSet, yearNumber){
	this.monthSet = monthSet;
	this.yearNumber = yearNumber;
}

/*
*	Defines the data structures returned by the calendar maker. They reference
*	eachother, so changing a day in one changes the other as well, so that the gui
*	can update easily
*
*	@param guiTree The containers for gui mapping
*	@param candidateList A list of eligible academic days for analysis
*/
function ReturnData(guiTree, candidateEntryData, academicYear){
	this.guiTree = guiTree;
	this.candidateEntryData = candidateEntryData;
	this.year = academicYear;
}

/*
*	Given a year and a month, this constructs the first day from the Date library
*	to retrieves the first day of the week for the month
*/
function getFirstWeekday(year, month){
	var date = new Date(year, month, 0);
	return (date.getDay() + 1) % 7;
}

/*
*	For getting the count of days in a month
*/
function getDaysInMonth(year, month){
	if((month == 1) && (year % 4 == 0)){
		return DayLimits[month] + 1;

	}
	return DayLimits[month];
}

/*
*	For making enumerated values
*
*/
function Enum(constantsList) {
	for (var i in constantsList) {
		this[constantsList[i]] = i;
	}
	return constantsList;
}

function ExecuteProgram(data, startDate, conditions){
	SetConditions(data, startDate, conditions);
	InitializeHandles(data);
	SetTypes(data);
	updateData(data);
}

function TranslateConditions(strings){
	var booleans = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	booleans[0] = (strings.indexOf("weekdayIdNum") < 0)?0:1;
	booleans[1] = (strings.indexOf("fallStartMon") < 0)?0:1;
	booleans[2] = (strings.indexOf("summerToFallMoreThanWeek") < 0)?0:1;
	booleans[3] = (strings.indexOf("convocationFriBeforeFirstID") < 0)?0:1;
	booleans[4] = (strings.indexOf("extendedFallBreak") < 0)?0:1;
	booleans[5] = (strings.indexOf("commencementTueFri") < 0)?0:1;
	booleans[6] = (strings.indexOf("CesarChavezInSpringBreak") < 0)?0:1;
	booleans[7] = (strings.indexOf("fallFinalsMonday") < 0)?0:1;
	booleans[8] = (strings.indexOf("springFinalsMonday") < 0)?0:1;
	booleans[9] = (strings.indexOf("commencementBeforeMemorial") < 0)?0:1;


	booleans[10] = (strings.indexOf("limitWinterTenDays") < 0)?0:1;
	booleans[11] = (strings.indexOf("springAfterMLK") < 0)?0:1;


	return booleans;
}

function SetConditions(candidateEntry, previousYearEnd, softRules){
	candidateEntry.conditions = softRules;
	candidateEntry.previousYearEnd = GetDayIndex(candidateEntry, previousYearEnd);
}

function SetDataCounts(candidateEntry){
	candidateEntry.reportCounts = {"ACAD_FALL_AND_SPRING" : 0, "INST_FALL_AND_SPRING" : 0, "ACAD_FALL_AND_SUN" : 0,
		"ACAD_FALL_AND_MON" : 0, "ACAD_FALL_AND_TUE" : 0, "ACAD_FALL_AND_WED" : 0, "ACAD_FALL_AND_THU" : 0,
		"ACAD_FALL_AND_FRI" : 0, "ACAD_FALL_AND_SAT" : 0, "ACAD_SPRING_AND_SUN" : 0, "ACAD_SPRING_AND_MON" : 0, 
		"ACAD_SPRING_AND_TUE" : 0, "ACAD_SPRING_AND_WED" : 0, "ACAD_SPRING_AND_THU" : 0, "ACAD_SPRING_AND_FRI" : 0, 
		"ACAD_SPRING_AND_SAT" : 0, "ACAD_AUG" : 0, "ACAD_SEP": 0, "ACAD_NOV": 0, "ACAD_DEC" : 0, 
		"ACAD_JAN" : 0, "ACAD_FEB" : 0, "ACAD_MAR" : 0, "ACAD_APR": 0, "ACAD_MAY" : 0, "ACAD_SUMMER" : 0, "ACAD_WINTER" : 0, "INST_FALL_AND_SUN" : 0,
		"INST_FALL_AND_MON" : 0, "INST_FALL_AND_TUE" : 0, "INST_FALL_AND_WED" : 0, "INST_FALL_AND_THU" : 0,
		"INST_FALL_AND_FRI" : 0, "INST_FALL_AND_SAT" : 0, "INST_SPRING_AND_SUN" : 0, "INST_SPRING_AND_MON" : 0, 
		"INST_SPRING_AND_TUE" : 0, "INST_SPRING_AND_WED" : 0, "INST_SPRING_AND_THU" : 0, "INST_SPRING_AND_FRI" : 0, 
		"INST_SPRING_AND_SAT" : 0, "INST_AUG" : 0, "INST_SEP": 0, "INST_NOV": 0, "INST_DEC" : 0, 
		"INST_JAN" : 0, "INST_FEB" : 0, "INST_MAR" : 0, "INST_APR": 0, "INST_MAY" : 0, "INST_SUMMER" : 0, "INST_WINTER" : 0,
		"ACAD_FALL" : 0, "ACAD_SPRING" : 0, "INST_FALL" : 0, "INST_SPRING" : 0};
}

function InitializeHandles(candidateEntry){
	SetMonthHandles(candidateEntry);
	SetHolidays(candidateEntry);
	SetBoundaries(candidateEntry);
	SetTypes(candidateEntry);
	SetDataCounts(candidateEntry);
}

function SetMonthHandles(candidateEntry){
	candidateEntry.monthMarkers = {"AUGUST" : 0, "SEPTEMBER" : 0, "OCTOBER" : 0, "NOVEMBER" : 0, "DECEMBER" : 0,
		"JANUARY" : 0, "FEBRUARY" : 0, "MARCH" : 0, "APRIL" : 0, "MAY" : 0, "JUNE" : 0, "JULY" : 0};
	var monthCounter = 0;
	for(var i = 0; i < candidateEntry.length - 1; i++){
		if(candidateEntry[i].month != candidateEntry[i + 1].month){
			monthCounter ++;
			switch(monthCounter){
				case 0:	candidateEntry.monthMarkers["AUGUST"] = i + 1; break;
				case 1:	candidateEntry.monthMarkers["SEPTEMBER"] = i + 1; break;
				case 2:	candidateEntry.monthMarkers["OCTOBER"] = i + 1; break;
				case 3:	candidateEntry.monthMarkers["NOVEMBER"] = i + 1; break;
				case 4:	candidateEntry.monthMarkers["DECEMBER"] = i + 1; break;
				case 5:	candidateEntry.monthMarkers["JANUARY"] = i + 1;	break;
				case 6:	candidateEntry.monthMarkers["FEBRUARY"] = i + 1; break;
				case 7:	candidateEntry.monthMarkers["MARCH"] = i + 1; break;
				case 8:	candidateEntry.monthMarkers["APRIL"] = i + 1; break;
				case 9:	candidateEntry.monthMarkers["MAY"] = i + 1; break;
				case 10: candidateEntry.monthMarkers["JUNE"] = i + 1; break;
				case 11: candidateEntry.monthMarkers["JULY"] = i + 1; break;
				default:
			}
		}
	}
}

function SetHolidays(candidateEntry){
	candidateEntry.holidayMarkers = {"THANKSGIVING" : 0, "CESARCHAVEZ" : 0, "VETERANS" : 0, "CHRISTMAS" : 0, "MLK" : 0};
	//JANUARY
	SetHoliday(candidateEntry, candidateEntry.monthMarkers["JANUARY"], null); 
	SetDayHoliday(candidateEntry, candidateEntry.monthMarkers["JANUARY"], "MON", 3, "MLK");
	//MARCH


	SetHoliday(candidateEntry, candidateEntry.monthMarkers["MARCH"] + 30, "CESARCHAVEZ");


	//MAY
	SetDayHoliday(candidateEntry, candidateEntry.monthMarkers["MAY"], "MON", 
		(filter(candidateEntry, candidateEntry.monthMarkers["MAY"], candidateEntry.monthMarkers["JUNE"], isDay, "MON").length), null);			
	//JULY
	SetHoliday(candidateEntry, candidateEntry.monthMarkers["JULY"] + 3, null);
	//SEPTEMBER
	SetDayHoliday(candidateEntry, candidateEntry.monthMarkers["SEPTEMBER"], "MON", 1, null);
	//NOVEMBER
	SetHoliday(candidateEntry, candidateEntry.monthMarkers["NOVEMBER"] + 10, "VETERANS");


	SetDayHoliday(candidateEntry, candidateEntry.monthMarkers["NOVEMBER"], "THU",4, "THANKSGIVING", null);


	SetHoliday(candidateEntry, candidateEntry.holidayMarkers["THANKSGIVING"] + 1, null);

	//DECEMBER
	for(var i = 0; i < 7; i++)
		SetHoliday(candidateEntry, candidateEntry.monthMarkers["DECEMBER"] + 24 + i, "CHRISTMAS");
}

function SetHoliday(list, index, handle){
	if(list[index].dayOfWeek == "SAT"){
		list[index - 1].type = "HOLI";
		if(handle != null){
			list.holidayMarkers[handle] = index - 1;
		}
	}
	else if(list[index].dayOfWeek == "SUN"){
		list[index + 1].type = "HOLI";
		if(handle != null){
			list.holidayMarkers[handle] = index + 1;
		}
	}
	else{
		list[index].type= "HOLI";
		if(handle != null){
			list.holidayMarkers[handle] = index;
		}
	}			
}

function SetDayHoliday(list, startIndex, day, count, handle){
	var countDays = 0;
	for(var i = 0; countDays < count; i++){
		if(list[startIndex + i].dayOfWeek == day){
			countDays++;
		}
		if(countDays == count){
			if(handle != null){
				list.holidayMarkers[handle] = startIndex + i;
			}
			list[startIndex + i].type = "HOLI";
		}
	}
}

function countEligibles(list, start, finish){ //start and finish are boundaries/markers
	var count = 0;
	for(var i = start; i < finish; i++){
		var day = list[i];
		if(!(day.type == "WKND" || day.type == "HOLI")){
			count++;
		}
	}
	return count;
}

function Enum(constantsList) {
	for (var i in constantsList) {
		this[constantsList[i]] = i;
	}
	return constantsList;
}

function GetDayIndex(data, date, secondOccurrence){
	var counter = 0;
	var skip = ((typeof secondOccurrence == "undefined")|| (secondOccurrence == false))?0:1;
	while(skip >= 0){
		while(date.month != data[counter].month){
			counter++;
		}
		while(date.dayNumber != data[counter].dayNumber){
			counter++;
		}
		skip--;
		if(skip == 0){
			while(data[counter].dayNumber != 1){
				counter++;
			}
		}
	}
	return counter;
}

function SetBoundaries(candidateEntry){

	if(candidateEntry[candidateEntry.previousYearEnd].dayOfWeek == "SAT" ||
		candidateEntry[candidateEntry.previousYearEnd].dayOfWeek == "SUN"){
		while(candidateEntry[candidateEntry.previousYearEnd].dayOfWeek != "MON"){
			candidateEntry.previousYearEnd++;
		}
	}

	candidateEntry.boundaries = {"FALL_START" : 0, "FALL_END" : 0, "WINTER_START" : 0, "WINTER_END" : 0,
		"SPRING_START" : 0, "SPRING_END" : 0, "SUMMER_START" : 0, "SUMMER_END" : 0};
	var boundaries = candidateEntry.boundaries;

	//FALL
	
	candidateEntry.boundaries["FALL_START"] = candidateEntry.previousYearEnd;
	while(candidateEntry.boundaries["FALL_START"] - candidateEntry.previousYearEnd < 2 ||
		candidateEntry.previousYearEnd > candidateEntry.boundaries["FALL_START"] ||
		candidateEntry[candidateEntry.boundaries["FALL_START"]].dayOfWeek == "FRI"){
	
		candidateEntry.boundaries["FALL_START"] = candidateEntry.boundaries["FALL_START"] + 1;
	}
	candidateEntry.boundaries["FALL_END"] = 24 + candidateEntry.monthMarkers["DECEMBER"];
	while(countEligibles(candidateEntry, candidateEntry.boundaries["FALL_END"], 24 + candidateEntry.monthMarkers["DECEMBER"]) < 8){
		candidateEntry.boundaries["FALL_END"] = candidateEntry.boundaries["FALL_END"] - 1;
	}

	//WINTER
	candidateEntry.boundaries["WINTER_START"] = candidateEntry.monthMarkers["JANUARY"];
	candidateEntry.boundaries["WINTER_START"]++;
	if(candidateEntry[candidateEntry.boundaries["WINTER_START"]].dayOfWeek == "SUN" ||
		candidateEntry[candidateEntry.boundaries["WINTER_START"]].dayOfWeek == "SAT"){
		while(candidateEntry[candidateEntry.boundaries["WINTER_START"]].dayOfWeek != "MON"){
					candidateEntry.boundaries["WINTER_START"]++;

		}
	}
	else if(candidateEntry[candidateEntry.boundaries["WINTER_START"]].dayOfWeek == "MON"){
		candidateEntry.boundaries["WINTER_START"]++;
	}


	if(candidateEntry.conditions[11] == 0){
		for(var i = 0, fridays = 0; fridays <= 3; i++){
			if(candidateEntry[candidateEntry.boundaries["WINTER_START"] + i].dayOfWeek == "FRI"){
				fridays++;
				if(fridays == 3){
					candidateEntry.boundaries["WINTER_END"] = candidateEntry.boundaries["WINTER_START"] + i + 1;
				}
			}
		}
		switch(candidateEntry[candidateEntry.boundaries["WINTER_START"]].dayOfWeek){
			case "WED": candidateEntry.boundaries["WINTER_END"] = candidateEntry.boundaries["WINTER_END"] + 4;
			break;
			case "THU": candidateEntry.boundaries["WINTER_END"] = candidateEntry.boundaries["WINTER_END"] + 6;
			break;
			case "FRI": candidateEntry.boundaries["WINTER_END"] = candidateEntry.boundaries["WINTER_END"] + 9;
			break;
			default:
		}
	}
	else{

		candidateEntry.boundaries["WINTER_END"] = candidateEntry.holidayMarkers["MLK"] + 1;
	}


	//SPRING
	candidateEntry.boundaries["SPRING_START"] = candidateEntry.boundaries["WINTER_END"];
	while(candidateEntry[candidateEntry.boundaries["SPRING_START"]].dayOfWeek == "FRI"){
		candidateEntry.boundaries["WINTER_END"] = candidateEntry.boundaries["WINTER_END"] + 1;
		candidateEntry.boundaries["SPRING_START"] = candidateEntry.boundaries["SPRING_START"] + 1;
	}
	candidateEntry.boundaries["SPRING_END"] = candidateEntry.monthMarkers["JUNE"] - 14;
	while(candidateEntry[candidateEntry.boundaries["SPRING_END"]].dayOfWeek != "MON"){
		candidateEntry.boundaries["SPRING_END"] = candidateEntry.boundaries["SPRING_END"] - 1;
	}
	//SUMMER
	candidateEntry.boundaries["SUMMER_START"] = 0 + candidateEntry.monthMarkers["JUNE"] - 1;
	candidateEntry.boundaries["SUMMER_END"] = candidateEntry.boundaries["SUMMER_START"] + (12*7);
}

function SetTypes(data){
	var index = 0;
	
	for(var a = 0; a < data.length; a++){
		if((data[a].dayOfWeek == "SAT") || (data[a].dayOfWeek == "SUN")){
			data[a].type = "WKND";
		}
		else{
			if(data[a].type != "HOLI"){
				data[a].type = "UNK";
			}
		}
	}


	index += data.holidayMarkers["THANKSGIVING"];
	while(data[index].dayOfWeek != "MON"){
		index--;
	}
	while(data[index].dayOfWeek != "SAT"){
		if(data[index].dayOfWeek == "THU" || data[index].dayOfWeek == "FRI"){
			data[index].type = "HOLI";
		}
		else{
			data[index].type = (data.conditions[4] == 1 )?"OPEN":"INST";
		}
		index++;
	}
	
	index = 0;
	index += data.holidayMarkers["CESARCHAVEZ"];
	if(data.conditions[6] == 1){
		while(data[index].dayOfWeek != "MON"){
			index --;
		}
	}
	else{
		if(data[index].dayOfWeek == "MON"){
			index++;
		}
		while(data[index].dayOfWeek != "MON"){
			index++;
		}
	}
	while(data[index].dayOfWeek != "SAT"){
		if(data[index].type != "HOLI"){
			data[index].type = "OPEN";
		}
		index++;
	}

	
	index = data.boundaries["FALL_END"];
	assignFinals(data, index);
	
	index = data.boundaries["SPRING_END"];
	assignFinals(data, index);
	
	index = data.previousYearEnd;
	var end = data.boundaries["FALL_START"];
	assignAWD(data, index, end);
	
	index = data.boundaries["FALL_END"];
	end = data.monthMarkers["DECEMBER"] + 24;
	assignAWD(data, index, end);
	
	index = data.boundaries["SPRING_END"];
	end = data.boundaries["SUMMER_START"]
	assignAWD(data, index, end);
	
	index = data.boundaries["FALL_START"];
	end = data.boundaries["FALL_END"];
	assignID(data, index, end);
	
	index = data.boundaries["WINTER_START"];
	end = data.boundaries["WINTER_END"];
	assignID(data, index, end);
	
	index = data.boundaries["SPRING_START"];
	end = data.boundaries["SPRING_END"];
	assignID(data, index, end);
	
	index = data.boundaries["SUMMER_START"];
	end = data.boundaries["SUMMER_END"];
	assignID(data, index, end);
	
	index = data.boundaries["SUMMER_START"] - 1;
	assignCOMM(data, index);
	
	assignCONV(data);

	if(data.conditions[10] == 1){
		index = data.boundaries["SPRING_START"] - 1;
		//console.log(filter(data, data.boundaries["WINTER_START"], index, isType, "INST").length);
		while(filter(data, data.boundaries["WINTER_START"], index + 1, isType, "INST").length > 10){
			if(data[index].type != "HOLI" && data[index].dayOfWeek != "SAT" && data[index].dayOfWeek != "SUN"){
				data[index].type = "OPEN";
			}
			index--;
		}
	}
}


function assignFinals(data, index){
	var numberOfFinals = 0;
	while(data[index].dayOfWeek == "SUN" || data[index].dayOfWeek == "SAT"){
		index++;
	}
	while(numberOfFinals < 6){
		if((data[index].dayOfWeek != "SUN") && data[index].type != "HOLI"){
			data[index].type = "FINL";
			numberOfFinals++;
		}
		index++;
	}
}

function assignAWD(data, start, end){
	while(start < end){
		if(data[start].type != "FINL" && data[start].type != "HOLI" && data[start].type != "OPEN" &&
			data[start].dayOfWeek != "SAT" && data[start].dayOfWeek != "SUN"){
			data[start].type = "ACAD";
		}
		start++;
	}
}

function assignID(data, start, end){
	while(start < end){
		if(data[start].type != "FINL" && data[start].type != "HOLI" && data[start].type != "ACAD" &&
			data[start].type != "OPEN" && data[start].dayOfWeek != "SAT" && data[start].dayOfWeek != "SUN"){
			data[start].type = "INST";
		}
		start++;
	}
}
	
function assignCOMM(data, start){
	var commDays = 0;
	while(commDays < 4){
		if(data[start].dayOfWeek != "SUN" && data[start].dayOfWeek != "SAT" && data[start].type != "HOLI"){
			data[start].type = "COMM";
			commDays++;
		}
		start--;
	}
}
	
function assignCONV(data){
	while(data[data.previousYearEnd].dayOfWeek == "SAT" || data[data.previousYearEnd].dayOfWeek == "SUN"){
		data.previousYearEnd++;
	}
	for(var i = data.previousYearEnd; i < data.boundaries["FALL_START"] - 1; i++){
		if(data[i].dayOfWeek == "FRI"){
			data[i].type = "CONV";
			data.convocation = 0 + i;
			i = data.boundaries["FALL_START"];
		}
		if(i == data.boundaries["FALL_START"] - 2){
			data[i].type = "CONV";
			data.convocation = 0 + i;
		}
	}
}

function filter(list, start, finish, filterFunction, searchValues){
	var filtered = [];
	for(var i = start; i < finish; i++){
		var day = list[i];
		if((typeof filterFunction == "undefined")||(typeof searchValues == "undefined") ||
				(filterFunction == false)||(searchValues == false)){
			filtered.push(day);
		}
		else{
			if(filterFunction(day, searchValues)){
				filtered.push(day);
			}		
		}
	}
	return filtered;
}

function isDay(day, searchValues){
	return (searchValues.indexOf(day.dayOfWeek) > -1);
}			

function isType(day, searchValues){
	return (searchValues.indexOf(day.type) > -1);
}

function isMonth(day, searchValues){
	return (searchValues.indexOf(day.month) > -1);
}

function updateData(data){

	// data.reportCounts["ACAD_FALL"] = filter(data, data.boundaries["FALL_START"], data.boundaries["FALL_END"], isType, ["ACAD", "FINL", "COMM", "CONV", "INST"]).length;
	// data.reportCounts["ACAD_SPRING"] = filter(data, data.boundaries["SPRING_START"], data.boundaries["SPRING_END"], isType, ["ACAD", "FINL", "COMM", "CONV", "INST"]).length;
	// data.reportCounts["INST_FALL"] = filter(data, data.boundaries["FALL_START"], data.boundaries["FALL_END"], isType, ["INST"]).length;
	// data.reportCounts["INST_SPRING"] = filter(data, data.boundaries["SPRING_START"], data.boundaries["SPRING_END"], isType, ["INST"]).length;


	var f = filter(data, data.previousYearEnd, data.holidayMarkers["CHRISTMAS"], isDay, ["MON", "TUE", "WED", "THU", "FRI"]);
	f = filter(f, 0, f.length, isType, ["ACAD", "INST", "CONV", "COMM", "FINL"]);

	var s = filter(data, data.boundaries["SPRING_START"], data.boundaries["SUMMER_START"], isDay, ["MON", "TUE", "WED", "THU", "FRI"]);
	var s = filter(s, 0, s.length, isType, ["ACAD", "INST", "CONV", "COMM", "FINL"]);



	 data.reportCounts["ACAD_FALL"] = f.length + 1;
	 data.reportCounts["ACAD_SPRING"] = s.length + 1;
	 data.reportCounts["ACAD_FALL_AND_SPRING"] = data.reportCounts["ACAD_FALL"] + data.reportCounts["ACAD_SPRING"];

	data.reportCounts["ACAD_FALL_AND_SUN"] = 0;
	data.reportCounts["ACAD_FALL_AND_MON"] = filter(f, 0, f.length, isDay, "MON").length;
	data.reportCounts["ACAD_FALL_AND_TUE"] = filter(f, 0, f.length, isDay, "TUE").length;
	data.reportCounts["ACAD_FALL_AND_WED"] = filter(f, 0, f.length, isDay, "WED").length;
	data.reportCounts["ACAD_FALL_AND_THU"] = filter(f, 0, f.length, isDay, "THU").length;
	data.reportCounts["ACAD_FALL_AND_FRI"] = filter(f, 0, f.length, isDay, "FRI").length;
	data.reportCounts["ACAD_FALL_AND_SAT"] = 1;
	data.reportCounts["ACAD_SPRING_AND_SUN"] = 0;
	data.reportCounts["ACAD_SPRING_AND_MON"] = filter(s, 0, s.length, isDay, "MON").length;
	data.reportCounts["ACAD_SPRING_AND_TUE"] = filter(s, 0, s.length, isDay, "TUE").length;;
	data.reportCounts["ACAD_SPRING_AND_WED"] = filter(s, 0, s.length, isDay, "WED").length;
	data.reportCounts["ACAD_SPRING_AND_THU"] = filter(s, 0, s.length, isDay, "THU").length;
	data.reportCounts["ACAD_SPRING_AND_FRI"] = filter(s, 0, s.length, isDay, "FRI").length;
	data.reportCounts["ACAD_SPRING_AND_SAT"] = 1;
	data.reportCounts["ACAD_AUG"] = filter(f, 0, f.length, isMonth, "AUG").length;
	data.reportCounts["ACAD_SEP"] = filter(f, 0, f.length, isMonth, "SEP").length;
	data.reportCounts["ACAD_OCT"] = filter(f, 0, f.length, isMonth, "OCT").length;
	data.reportCounts["ACAD_NOV"] = filter(f, 0, f.length, isMonth, "NOV").length;
	data.reportCounts["ACAD_DEC"] = filter(f, 0, f.length, isMonth, "DEC").length + 1;
	data.reportCounts["ACAD_JAN"] = filter(s, 0, s.length, isMonth, "JAN").length;
	data.reportCounts["ACAD_FEB"] = filter(s, 0, s.length, isMonth, "FEB").length;
	data.reportCounts["ACAD_MAR"] = filter(s, 0, s.length, isMonth, "MAR").length;
	data.reportCounts["ACAD_APR"] = filter(s, 0, s.length, isMonth, "APR").length;
	data.reportCounts["ACAD_MAY"] = filter(s, 0, s.length, isMonth, "MAY").length + 1;

	 f = filter(f, 0, f.length, isType, "INST");
	 s = filter(s, 0, s.length, isType, "INST");

	 data.reportCounts["INST_FALL"] = f.length;
	 data.reportCounts["INST_SPRING"] = s.length;
	data.reportCounts["ID_FALL_AND_SPRING"] =  data.reportCounts["INST_FALL"] +  data.reportCounts["INST_SPRING"];

	data.reportCounts["INST_FALL_AND_SUN"] = 0;
	data.reportCounts["INST_FALL_AND_MON"] = filter(f, 0, f.length, isDay, "MON").length;
	data.reportCounts["INST_FALL_AND_TUE"] = filter(f, 0, f.length, isDay, "TUE").length;
	data.reportCounts["INST_FALL_AND_WED"] = filter(f, 0, f.length, isDay, "WED").length;
	data.reportCounts["INST_FALL_AND_THU"] = filter(f, 0, f.length, isDay, "THU").length;
	data.reportCounts["INST_FALL_AND_FRI"] = filter(f, 0, f.length, isDay, "FRI").length;
	data.reportCounts["INST_FALL_AND_SAT"] = 0;
	data.reportCounts["INST_SPRING_AND_SUN"] = 0;
	data.reportCounts["INST_SPRING_AND_MON"] = filter(s, 0, s.length, isDay, "MON").length;
	data.reportCounts["INST_SPRING_AND_TUE"] = filter(s, 0, s.length, isDay, "TUE").length;;
	data.reportCounts["INST_SPRING_AND_WED"] = filter(s, 0, s.length, isDay, "WED").length;
	data.reportCounts["INST_SPRING_AND_THU"] = filter(s, 0, s.length, isDay, "THU").length;
	data.reportCounts["INST_SPRING_AND_FRI"] = filter(s, 0, s.length, isDay, "FRI").length;
	data.reportCounts["INST_SPRING_AND_SAT"] = 0;
	data.reportCounts["INST_AUG"] = filter(f, 0, f.length, isMonth, "AUG").length;
	data.reportCounts["INST_SEP"] = filter(f, 0, f.length, isMonth, "SEP").length;
	data.reportCounts["INST_OCT"] = filter(f, 0, f.length, isMonth, "OCT").length;
	data.reportCounts["INST_NOV"] = filter(f, 0, f.length, isMonth, "NOV").length;
	data.reportCounts["INST_DEC"] = filter(f, 0, f.length, isMonth, "DEC").length;
	data.reportCounts["INST_JAN"] = filter(s, 0, s.length, isMonth, "JAN").length;
	data.reportCounts["INST_FEB"] = filter(s, 0, s.length, isMonth, "FEB").length;
	data.reportCounts["INST_MAR"] = filter(s, 0, s.length, isMonth, "MAR").length;
	data.reportCounts["INST_APR"] = filter(s, 0, s.length, isMonth, "APR").length;
	data.reportCounts["INST_MAY"] = filter(s, 0, s.length, isMonth, "MAY").length;

	data.reportCounts["INST_WINTER"] = filter(data, data.boundaries["WINTER_START"], data.boundaries["SPRING_START"], isType, "INST").length;
	data.reportCounts["INST_SUMMER"] = filter(data, data.boundaries["SUMMER_START"], data.boundaries["SUMMER_END"], isType, "INST").length;

}

function checkRules(data){
	var errors = [];
	var softRules = data.conditions;

	var idDaysFall = filter(data, data.boundaries["FALL_START"], data.boundaries["FALL_END"], isType, "INST");
	var idDaysSpring = filter(data, data.boundaries["SPRING_START"], data.boundaries["SPRING_END"], isType, "INST");

	if(softRules[0] == 1){
		if(((filter(idDaysFall, 0, idDaysFall.length, isDay, "MON").length != 14)&&
			(filter(idDaysFall, 0, idDaysFall.length, isDay, "MON").length != 15))||
			((filter(idDaysFall, 0, idDaysFall.length, isDay, "TUE").length != 14)&&
			(filter(idDaysFall, 0, idDaysFall.length, isDay, "TUE").length != 15))||
			((filter(idDaysFall, 0, idDaysFall.length, isDay, "WED").length != 14)&&
			(filter(idDaysFall, 0, idDaysFall.length, isDay, "WED").length != 15))||
			((filter(idDaysFall, 0, idDaysFall.length, isDay, "THU").length != 14)&&
			(filter(idDaysFall, 0, idDaysFall.length, isDay, "THU").length != 15))||
			((filter(idDaysFall, 0, idDaysFall.length, isDay, "FRI").length != 14)&&
			(filter(idDaysFall, 0, idDaysFall.length, isDay, "FRI").length != 15))||
			((filter(idDaysSpring, 0, idDaysSpring.length, isDay, "MON").length != 14)&&
			(filter(idDaysSpring, 0, idDaysSpring.length, isDay, "MON").length != 15))||
			((filter(idDaysSpring, 0, idDaysSpring.length, isDay, "TUE").length != 14)&&
			(filter(idDaysSpring, 0, idDaysSpring.length, isDay, "TUE").length != 15))||
			((filter(idDaysSpring, 0, idDaysSpring.length, isDay, "WED").length != 14)&&
			(filter(idDaysSpring, 0, idDaysSpring.length, isDay, "WED").length != 15))||
			((filter(idDaysSpring, 0, idDaysSpring.length, isDay, "THU").length != 14)&&
			(filter(idDaysSpring, 0, idDaysSpring.length, isDay, "THU").length != 15))||
			((filter(idDaysSpring, 0, idDaysSpring.length, isDay, "FRI").length != 14)&&
			(filter(idDaysSpring, 0, idDaysSpring.length, isDay, "FRI").length != 15))){
				errors.push("UNEVEN ID/WEEKDAY BALANCE");
		}
	}
	if(softRules[1] == 1){
		if(data[data.boundaries["FALL_START"]].dayOfWeek != "MON"){
			errors.push("FALL DOESN'T START ON MONDAY");
		}
	}
	if(softRules[2] == 1){
		if(data.boundaries["FALL_START"] - data.previousYearEnd < 7){
			errors.push("UNDER 1 WEEK SUMMER TO FALL");
		}
	}
	if(softRules[3] == 1){
		
		if(data[data.convocation].dayOfWeek != "FRI"){


			errors.push("CONV NOT FRIDAY BEFORE FALL START");
		}
		
		/*
		var convIndex = 0;
		while(data[convIndex].type != "CONV"){
			convIndex++;
		}
		if(!((data[convIndex].dayOfWeek == "FRI")&&(data[data.boundaries["FALL_START"]] - convIndex == 3))){
			errors.push("CONV NOT FRIDAY BEFORE FALL START");
		}
		*/
	}


	var totalID = idDaysFall.length + idDaysSpring.length;
	if(softRules[4] == 1){
		var start = data.holidayMarkers["THANKSGIVING"] - 1;

		if(filter(data, data.holidayMarkers["THANKSGIVING"] - 3, data.holidayMarkers["THANKSGIVING"] + 2, isType, "OPEN").length != 3){
			errors.push("NOT EXTENDED THANKSGIVING");
		}

	}
	else{
		var start = data.holidayMarkers["THANKSGIVING"] - 1;
		if(filter(data, data.holidayMarkers["THANKSGIVING"] - 3, data.holidayMarkers["THANKSGIVING"] + 2, isType, "OPEN").length != 0){
			errors.push("EXTENDED THANKSGIVING");
		}
	}


	if(softRules[5] == 1){
		var start = data.boundaries["SPRING_END"];
		while(data[start].type != "COMM"){
			start++;
		}
		var chain = 0;
		var commCount = 0;
		while(commCount < 4){
			
			if(data[start].type == "COMM"){
				commCount++;
			}
			chain++;
			start++;
		}
		if(!(data[start].dayOfWeek == "SAT" && chain == 4)){
			errors.push("COMMENCEMENT NOT TUES TIL FRI");
		}
	}

	if(softRules[6] == 1){
		var start = data.holidayMarkers["CESARCHAVEZ"];
		if(data[start].dayOfWeek == "FRI"){
			if(data[start - 1].type != "OPEN"){
				errors.push("CESAR CHAVEZ NOT IN SPRING BREAK");
			}
		}
		else{
			if(data[start + 1].type != "OPEN"){
				errors.push("CESAR CHAVEZ NOT IN SPRING BREAK");
			}
		}
	}
	else{
		var start = data.holidayMarkers["CESARCHAVEZ"];
		if(data[start].dayOfWeek == "FRI"){
			if(data[start - 1].type == "OPEN"){
				errors.push("CESAR CHAVEZ IN SPRING BREAK");
			}
		}
		else{
			if(data[start + 1].type == "OPEN"){
				errors.push("CESAR CHAVEZ IN SPRING BREAK");
			}
		}
	}

	if(softRules[7] == 1){
		var start = 0 + data.boundaries["FALL_END"];
		while(data[start].dayOfWeek == "SUN"){
			start ++;
		}
		if(data[start].dayOfWeek != "MON"){
			errors.push("FALL FINALS DON'T START MONDAY");
		}
	}
	if(softRules[8] == 1){
		var start = 0 + data.boundaries["SPRING_END"];
		while(data[start].dayOfWeek == "SUN"){
			start ++;
		}
		if(data[start].dayOfWeek != "MON"){
			errors.push("SPRING FINALS DON'T START MONDAY");
		}
	}
	if(softRules[9] == 1){
		var start = data.monthMarkers["JUNE"];
		while((data[start].type != "HOLI") && ( data[start].type != "COMM")){
			start --;
		}
		if(data[start].type == "COMM"){
			errors.push("COMMENCEMENT ENDS AFTER MEMORIAL DAY");
		}
	}


	if(softRules[10] == 1){
		if(filter(data, data.boundaries["WINTER_START"], data.boundaries["SPRING_START"], isType, "INST").length != 10){
			errors.push("WINTER BREAK NOT TEN DAYS");
		}
		//filter(start, end, function, args);
	}
	if(softRules[11] == 1){
		if(data.boundaries["SPRING_START"] != data.holidayMarkers["MLK"] + 1){
			errors.push("SPRING DOESNT START DAY AFTER MLK");
		}
	}


	if(data.previousYearEnd > data.boundaries["FALL_START"]){
		errors.push("YEAR-FALL OVERLAP");
	}
	if(data.boundaries["FALL_START"] > data.boundaries["FALL_END"]){
		errors.push("NO FALL");
	}
	if(data.boundaries["FALL_END"] > data.boundaries["WINTER_START"]){
		errors.push("FALL-WINTER OVERLAP");
	}
	if(data.boundaries["WINTER_START"] > data.boundaries["WINTER_END"]){
		errors.push("NO WINTER");
	}
	if(data.boundaries["WINTER_END"] > data.boundaries["SPRING_START"]){
		errors.push("WINTER-SPRING OVERLAP");
	}
	if(data.boundaries["SPRING_START"] > data.boundaries["SPRING_END"]){
		errors.push("NO SPRING");
	}
	if(data.boundaries["SPRING_END"] > data.boundaries["SUMMER_START"]){
		errors.push("SPRING-SUMMER OVERLAP");
	}
	if(data.boundaries["SUMMER_START"] > data.boundaries["SUMMER_END"]){
		errors.push("NO SUMMER");
	}
	
	if((data.boundaries["FALL_END"] - data.boundaries["FALL_START"]) < 106){
		errors.push("FALL NOT 15 WEEKS LONG");
	}
	if((data.boundaries["SPRING_END"] - data.boundaries["SPRING_START"]) < 106){
		errors.push("SPRING NOT 15 WEEKS LONG");
	}
	if(totalID < 145){
		errors.push("ID LESS THAN 145");
	}
	if(totalID > 149){
		errors.push("ID MORE THAN 149");
	}
	if(filter(data, data.previousYearEnd, data.boundaries["WINTER_START"], isType, ["ACAD", "FINL", "COMM", "CONV", "INST"]).length + 
		filter(data, data.boundaries["SPRING_START"], data.boundaries["SUMMER_START"], isType, ["ACAD", "FINL", "COMM", "CONV", "INST"]).length < 170){
		errors.push("AWD LESS THAN 170");
	}
	if(filter(data, data.previousYearEnd, data.boundaries["WINTER_START"], isType, ["ACAD", "FINL", "COMM", "CONV", "INST"]).length + 
		filter(data, data.boundaries["SPRING_START"], data.boundaries["SUMMER_START"], isType, ["ACAD", "FINL", "COMM", "CONV", "INST"]).length > 180){
		errors.push("AWD MORE THAN 180");
	}

	if(data[data.boundaries["FALL_START"]].dayOfWeek == "FRI"){
		errors.push("FALL START ON FRIDAY");
	}
	if(data[data.boundaries["SPRING_START"]].dayOfWeek == "FRI"){
		errors.push("SPRING START ON FRIDAY");
	}
	if(filter(data, data.boundaries["FALL_END"], data.boundaries["WINTER_START"], isType, "FINL").length < 6){
		errors.push("TOO FEW FALL FINALS");
	}
	if(filter(data, data.boundaries["SPRING_END"], data.boundaries["SUMMER_START"], isType, "FINL").length < 6){
		errors.push("TOO FEW SPRING FINALS");
	}
	if(data[data.boundaries["FALL_START"]].month == "AUG" && 
		data[data.boundaries["FALL_START"]].dayNumber < 17){
		errors.push("FALL START BEFORE AUG 17");
	}
	if(data[data.boundaries["FALL_START"]].month == "SEP" && 
		data[data.boundaries["FALL_START"]].dayNumber > 1){
		errors.push("FALL START AFTER SEP 1");
	}
	var leep = (data.year % 4 == 0)?1:0;
	if(data[data.boundaries["SPRING_START"]].month == "JAN" && 
		data[data.boundaries["SPRING_START"]].dayNumber < 15 + leep){
		errors.push("SPRING START BEFORE JAN 15 + LEEP");
	}
	if(data[data.boundaries["SUMMER_START"]].month != "MAY"){
		errors.push("SUMMER START AFTER MAY 31");
	}
	if(data[data.boundaries["SUMMER_END"]].month != "AUG"){
		errors.push("SUMMER END AFTER AUG 31");
	}
	if(data.boundaries["FALL_START"] - data.convocation < 2){
		errors.push("LESS THAN 2 DAYS CONV TO FALL");
	}
	if(data.boundaries["FALL_START"] - data.convocation > 5){
		errors.push("MORE THAN 5 DAYS CONV TO FALL");
	}


	if(filter(data, data.boundaries["WINTER_START"], data.boundaries["WINTER_END"], isType, "INST").length < 10){
		errors.push("LESS THAN 10 WINTER INST DAYS");
	}


	if(filter(data, data.boundaries["WINTER_START"], data.boundaries["WINTER_END"], isType, "INST").length > 15){
		errors.push("MORE THAN 15 WINTER INST DAYS");
	}
	if((data.boundaries["SUMMER_END"] - data.boundaries["SUMMER_START"]) / 7 != 12){
		errors.push("NOT 12 SUMMER WEEKS");
	}
	if(filter(data, data.boundaries["SPRING_END"], data.boundaries["SUMMER_START"], isType, "COMM").length != 4){
		errors.push("NOT 4 COMMENCEMEMT DAYS");
	}
	var springVacation = filter(data, data.monthMarkers["MARCH"], data.monthMarkers["MAY"], isType, ["HOLI", "ACAD"]);
	/*
	if(springVacation.length != 5 && springVacation[0].dayOfWeek != "MON"){
		errors.push("SPRING VACATION NOT CALENDAR WEEK");
	}			
	var fallVacation = filter(data, data.holidayMarkers["THANKSGIVING"] - 3, data.holidayMarkers["THANKSGIVING"] + 2, isType, ["HOLI", "ACAD"]);
	if(fallVacation.length != 5 && fallVacation[0].dayOfWeek != "MON"){
		errors.push("FALL VACATION NOT CALENDAR WEEK");
	}
*/
	return errors;
}

function getPossibilities(data){
	//return array of possibilites for each index
	var fallStarts = [];
	var fallEnds = [];
	var winterEnds = []; //winter end = spring start
	var springEnds = []; 
	var summerStarts = []; // summer end = summer start + (12 * 7)
	
	//FALL_START
	while(data[data.previousYearEnd].dayOfWeek == "SAT" || data[data.previousYearEnd].dayOfWeek == "SUN"){
		data.previousYearEnd++;
	}
	var earliestFallStart = indexByStartAndCount(data.previousYearEnd, 2, 1, false, true);
	//for(var i = earliestFallStart; i < GetDayIndex(data, data[data.monthMarkers["SEPTEMBER"] + 2]); i++){
	for(var i = earliestFallStart; i < indexByStartAndCount(data.monthMarkers["SEPTEMBER"] + 4, 1, 1, false, true); i++){
		while(data[i].dayOfWeek == "FRI" || data[i].dayOfWeek == "SAT" || data[i].dayOfWeek == "SUN" ||
			data[i].type == "HOLI" || i < GetDayIndex(data, data[data.monthMarkers["AUGUST"] + 16])){
			i++;
		}
		if(i < indexByStartAndCount(data.monthMarkers["SEPTEMBER"] + 4, 1, 1, false, true))
			fallStarts.push(0 + i);
		//*not friday
		//*not weekend
		//*after august 16 (while-loop increment)(do first)
		//*after prevYearEnd (start condition)
		//*not on holiday
		//*before september 2 (termination condition)
	}
	
	//FALL_END
	var lastFallEnd = indexByStartAndCount(data.holidayMarkers["CHRISTMAS"], 5, -1, true, false);
	var earliestFallEnd = fallStarts[0] + (7 * 15) + 1;

	while(data[earliestFallEnd].dayOfWeek != "TUE"){
		earliestFallEnd++;
	}
	for(var i = earliestFallEnd; i < lastFallEnd; i++){
		while(data[i].dayOfWeek == "SAT" || data[i].dayOfWeek == "SUN" || data[i].type == "HOLI"){
			i++;
		}
		if(i < lastFallEnd)
			fallEnds.push(0 + i);
		//start at smallest 15 weeks possible (start condition) (times 15 then increment until TUES)
		//not holiday
		//not weekend
		//must have 7 days for finals before winter + 3 days for grading (end condition)
	}
	
	//WINTER_END&SPRING_START
	
	
	var earliestWinterEnd = (data.conditions[11] == 0) ? 
			indexByStartAndCount(data.monthMarkers["JANUARY"], 11, 1, false, true):
			data.holidayMarkers["MLK"] + 1;
	var lastWinterEnd = (data.conditions[11] == 0) ?
			indexByStartAndCount(data.monthMarkers["JANUARY"], 16, 1, false, false):
			data.holidayMarkers["MLK"] + 1;
			
	for(var i = earliestWinterEnd; i <= lastWinterEnd; i++){
		var leap = (data[data.monthMarkers["JANUARY"]].year % 4 == 0)?1:0;
		while(data[i].dayOfWeek == "SAT" || 
			data[i].dayOfWeek == "SUN" || data[i].type == "HOLI"){
			i++;
		}
		if((i <= lastWinterEnd) && (data[i].dayOfWeek != "FRI")){ 
			winterEnds.push(0 + i);
		}
	}
	
	
	//SPRING_END
	var earliestSpringEnd = winterEnds[0] + 7 * 15;
	while(data[earliestSpringEnd].dayOfWeek != "TUE"){
		earliestSpringEnd++;
	}
	
	
	for(var i = earliestSpringEnd; i < data.monthMarkers["JUNE"] - 3; i ++){
		while(data[i].dayOfWeek == "SAT" || data[i].dayOfWeek == "SUN" || data[i].type == "HOLI"){
			i++;
		}
		if(i < data.monthMarkers["JUNE"] - 3)
			springEnds.push(0 + i);
	}
	
	
	//SUMMER_START
	var earliestSummerStart = indexByStartAndCount(springEnds[0], 10, 1, true, true);
	var augustStart = data.monthMarkers["JULY"] + 31;
	for(var i = earliestSummerStart; ((i < data.monthMarkers["JUNE"]) && ( i < augustStart + 30 - (12 * 7))); i++){
		while(data[i].dayOfWeek == "SAT" || data[i].dayOfWeek == "SUN" || data[i].type == "HOLI"){
			i++;
		}
		if(((i < data.monthMarkers["JUNE"]) && ( i < augustStart + 30 - (12 * 7)))){
			summerStarts.push(i);
		}
		//before jun 1 (term condition)
		//summer start - spring end >= 7 + 4 exculding weekends. (initial while loop)
		//summers start + 12 * 7 must be less than september 1 (termination condition)
		//not holiday
		//not weekend
	}
		
	//direction = -1 or +1
	//countFridays is true or false (false for fall start and spring start (winter end))
	//earliest = false means latest
	function indexByStartAndCount(initialIndex, daysRequired, directionVector, countFridays, earliest){
		if(directionVector == 1){
			daysRequired --;
		}
		while(daysRequired > 0){
			while(data[initialIndex].type == "HOLI" || data[initialIndex].dayOfWeek == "SAT" || data[initialIndex].dayOfWeek == "SUN"){
				initialIndex += directionVector;
			}
			daysRequired--;
			initialIndex += directionVector;
		}
		if(!countFridays){
			if(data[initialIndex.dayOfWeek == "FRI"]){
				if(earliest){
					initialIndex += 3;
				}
				else{
					initialIndex--;
				}
			}
		}
		return initialIndex;
	}
		
	return [fallStarts, fallEnds, winterEnds, springEnds, summerStarts];
}

function getCalendarCount(data, possibilites){
	var calendarCount = 0;
	//console.log(possibilites);
	//most important thing is holidays are set
	if(countPossibilities(possibilites) != 0){
		var softErrors = ["UNEVEN ID/WEEKDAY BALANCE", "FALL DOESN'T START ON MONDAY", "UNDER 1 WEEK SUMMER TO FALL", "CONV NOT FRIDAY BEFORE FALL START",
			"NOT 3 AWD BEFORE THANKSGIVING", "COMMENCEMENT NOT TUES TIL FRI", "CESAR CHAVEZ NOT IN SPRING BREAK", "FALL FINALS DON'T START MONDAY", 
			"SPRING FINALS DON'T START MONDAY", "COMMENCEMENT ENDS AFTER MEMORIAL DAY", "WINTER BREAK NOT TEN DAYS", "SPRING DOESNT START DAY AFTER MLK"];
	
		var options = [];
		var conflicts = [];	
		var errors = [];		
		var testCount = 0;
		var smallestHardError = [];
		var returnCalendar;
		
		var px = filter(data, data.previousYearEnd, data.holidayMarkers["CHRISTMAS"], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length - 
			filter(data, data.previousYearEnd, data.holidayMarkers["CHRISTMAS"], isType, ["HOLI"]).length;
		var ab;//
		var wc;//
		var cd;//
		var de;
		var ce;//
		
		
		
		
		
		
		for(var a = 0; a < possibilites[0].length; a++){
			for(var b = 0; b < possibilites[1].length; b++){
				var ab = filter(data, possibilites[0][a], possibilites[1][b], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
					filter(data, possibilites[0][a], possibilites[1][b], isType, ["HOLI"]).length;
				for(var c = 0; c < possibilites[2].length; c++){
					wc = filter(data, data.boundaries["WINTER_START"],  possibilites[2][c], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
						filter(data, data.boundaries["WINTER_START"],  possibilites[2][c], isType, ["HOLI"]).length;
					for(var d = 0; d < possibilites[3].length; d++){
						var cd = filter(data, possibilites[2][c], possibilites[3][d], isDay,["MON", "TUE", "WED", "THU", "FRI"]).length -
							filter(data, possibilites[2][c], possibilites[3][d], isType, ["HOLI"]).length;
						if(!(
							((ab) + (cd) - 5 < 145) ||
							((ab) + (cd) - 8 > 149) ||
							(cd/5 < 14) || (cd/5 > 16))){
							for(var e = 0; e < possibilites[4].length; e++){
								var de = filter(data, possibilites[3][d], possibilites[4][e], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
										filter(data, possibilites[3][d], possibilites[4][e], isType, ["HOLI"]).length;
								var ce = cd + de;
								
								
								
								
								
								if(!(
									((px + ce) + 2 < 170) ||
									((px + ce) + 2 > 180) ||
									(de < 9) ||(ab/5 < 14) || (ab/5 > 16) ||(wc < 10) || (wc > 15))){
								
										



									 testCount++;
									//if(testCount % 100 == 0)
									//	console.log(testCount);


									data.boundaries["FALL_START"] = 0 + possibilites[0][a];
									data.boundaries["FALL_END"] = 0 + possibilites[1][b];
									data.boundaries["WINTER_END"] = 0 + possibilites[2][c];
									data.boundaries["SPRING_START"] = 0 + possibilites[2][c];
									data.boundaries["SPRING_END"] = 0 + possibilites[3][d];
									data.boundaries["SUMMER_START"] = 0 + possibilites[4][e];
									data.boundaries["SUMMER_END"] = 0 + data.boundaries["SUMMER_START"] + (12 * 7);
										
										
									SetTypes(data);
									//updateData(data);
									errors = checkRules(data);
									
									if(errors.length != 0){
																				
										
										if((filterNewErrors(softErrors, errors).length == 0) && ((errors.length < conflicts.length) || (conflicts.length == 0))){
											conflicts = errors;
											//console.log(errors);
											//console.log(data);
										}	
										else{
																								//console.log("hard error violation");

											if(smallestHardError.length == 0 || filterNewErrors(softErrors, errors).length < smallestHardError.length){
												smallestHardError = errors;
												if(smallestHardError.indexOf("") > 0){
													console.log("hard error violation");
												}
											}
										}
										
									}
									else{
										calendarCount++;
									}
								}
							}
						}
					}
				}
			}
		}


		//console.log(options.length);
		return [calendarCount, (conflicts.length == 0)?filterNewErrors(softErrors, checkRules(data)):conflicts];
	}
	else{
		//console.log("NO OPTIONS WITH THE GIVEN PARAMETERS");
		return [[], checkRules(data)];
	}
}

function calendarByIndex(data, possibilites, index){

	var calendarCount = 0;

	var softErrors = ["UNEVEN ID/WEEKDAY BALANCE", "FALL DOESN'T START ON MONDAY", "UNDER 1 WEEK SUMMER TO FALL", "CONV NOT FRIDAY BEFORE FALL START",
		"NOT 3 AWD BEFORE THANKSGIVING", "COMMENCEMENT NOT TUES TIL FRI", "CESAR CHAVEZ NOT IN SPRING BREAK", "FALL FINALS DON'T START MONDAY",
		"SPRING FINALS DON'T START MONDAY", "COMMENCEMENT ENDS AFTER MEMORIAL DAY", "WINTER BREAK NOT TEN DAYS", "SPRING DOESNT START DAY AFTER MLK"];
	var options = [];
	var conflicts = [];
	var errors = [];
	var testCount = 0;
	var smallestHardError = [];
	var returnCalendar;

	var px = filter(data, data.previousYearEnd, data.holidayMarkers["CHRISTMAS"], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
		filter(data, data.previousYearEnd, data.holidayMarkers["CHRISTMAS"], isType, ["HOLI"]).length;
	var ab;//
	var wc;//
	var cd;//
	var de;
	var ce;//

	for(var a = 0; a < possibilites[0].length; a++){
		for(var b = 0; b < possibilites[1].length; b++){
			var ab = filter(data, possibilites[0][a], possibilites[1][b], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
				filter(data, possibilites[0][a], possibilites[1][b], isType, ["HOLI"]).length;
			for(var c = 0; c < possibilites[2].length; c++){
				wc = filter(data, data.boundaries["WINTER_START"],  possibilites[2][c], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
					filter(data, data.boundaries["WINTER_START"],  possibilites[2][c], isType, ["HOLI"]).length;
				for(var d = 0; d < possibilites[3].length; d++){
					var cd = filter(data, possibilites[2][c], possibilites[3][d], isDay,["MON", "TUE", "WED", "THU", "FRI"]).length -
						filter(data, possibilites[2][c], possibilites[3][d], isType, ["HOLI"]).length;
					if(!(
						((ab) + (cd) - 5 < 145) ||
						((ab) + (cd) - 8 > 149) ||
						(cd/5 < 14) || (cd/5 > 16))){
						for(var e = 0; e < possibilites[4].length; e++){
							var de = filter(data, possibilites[3][d], possibilites[4][e], isDay, ["MON", "TUE", "WED", "THU", "FRI"]).length -
									filter(data, possibilites[3][d], possibilites[4][e], isType, ["HOLI"]).length;
							var ce = cd + de;

							if(!(
								((px + ce) + 2 < 170) ||
								((px + ce) + 2 > 180) ||
								(de < 9) ||(ab/5 < 14) || (ab/5 > 16) ||(wc < 10) || (wc > 15))){

								data.boundaries["FALL_START"] = 0 + possibilites[0][a];
								data.boundaries["FALL_END"] = 0 + possibilites[1][b];
								data.boundaries["WINTER_END"] = 0 + possibilites[2][c];
								data.boundaries["SPRING_START"] = 0 + possibilites[2][c];
								data.boundaries["SPRING_END"] = 0 + possibilites[3][d];
								data.boundaries["SUMMER_START"] = 0 + possibilites[4][e];
								data.boundaries["SUMMER_END"] = 0 + data.boundaries["SUMMER_START"] + (12 * 7);


								SetTypes(data);
								errors = checkRules(data);

								if(errors.length == 0){
									if(calendarCount == index){

										var possibleCalendar = constructCalendarData(
											data[0].year,
											data[data.previousYearEnd],
											intToAnne(data.conditions), true);

										possibleCalendar.candidateEntryData.boundaries["FALL_START"] = 0 + possibilites[0][a];
										possibleCalendar.candidateEntryData.boundaries["FALL_END"] = 0 + possibilites[1][b];
										possibleCalendar.candidateEntryData.boundaries["WINTER_END"] = 0 + possibilites[2][c];
										possibleCalendar.candidateEntryData.boundaries["SPRING_START"] = 0 + possibilites[2][c];
										possibleCalendar.candidateEntryData.boundaries["SPRING_END"] = 0 + possibilites[3][d];
										possibleCalendar.candidateEntryData.boundaries["SUMMER_START"] = 0 + possibilites[4][e];
										possibleCalendar.candidateEntryData.boundaries["SUMMER_END"] =
											0 + possibleCalendar.candidateEntryData.boundaries["SUMMER_START"] + (12 * 7);
										SetTypes(possibleCalendar.candidateEntryData);
										updateData(possibleCalendar.candidateEntryData);

										return possibleCalendar;

									}
									else{
										calendarCount++;
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function anneToLyn(softErrors){
	var lyndons = [];
	for(var i = 0; i < softErrors.length; i++){
		switch(softErrors[i]){
			case "weekdayIdNum":lyndons.push("UNEVEN ID/WEEKDAY BALANCE");break;
			case "fallStartMon":lyndons.push("FALL DOESN'T START ON MONDAY");break;
			case "summerToFallMoreThanWeek":lyndons.push("UNDER 1 WEEK SUMMER TO FALL");break;
			case "convocationFriBeforeFirstID":lyndons.push("CONV NOT FRIDAY BEFORE FALL START");break;
			case "extendedFallBreak":lyndons.push("NOT 3 AWD BEFORE THANKSGIVING");break;
			case "commencementTueFri":lyndons.push("COMMENCEMENT NOT TUES TIL THURS");break;
			case "CesarChavezInSpringBreak":lyndons.push("CESAR CHAVEZ NOT IN SPRING BREAK");break;
			default:
		}
	}
	return lyndons;
}

function intToAnne(softErrors){
	var annes = [];
	for(var i = 0; i < softErrors.length; i++){
		if(softErrors[i] == 1){
			switch(i){
				case 0:annes.push("weekdayIdNum");break;
				case 1:annes.push("fallStartMon");break;
				case 2:annes.push("summerToFallMoreThanWeek");break;
				case 3:annes.push("convocationFriBeforeFirstID");break;
				case 4:annes.push("extendedFallBreak");break;
				case 5:annes.push("commencementTueFri");break;
				case 6:annes.push("CesarChavezInSpringBreak");break;
				case 7:annes.push("fallFinalsMonday");break;
				case 8:annes.push("springFinalsMonday");break;
				case 9:annes.push("commencementBeforeMemorial");break;


				case 10:annes.push("limitWinterTenDays");break;
				case 11:annes.push("springAfterMLK");break;


				default:
			}	
		}
	}
	return annes;
}

//TEMP FOR TEST
function countPossibilities(possibilities){
	return possibilities[0].length*possibilities[1].length*possibilities[2].length*possibilities[3].length*possibilities[4].length;
}


function filterNewErrors(oldErrors, newErrors){
	var newErrorReturn = [];
	for(var i = 0; i < newErrors.length; i++){
		if(oldErrors.indexOf(newErrors[i]) < 0){
			newErrorReturn.push(newErrors[i]);
		}
	}
	return newErrorReturn;
}

//HTML OUTPUT FUNCTIONS
/*
                                <tr ng-repeat="week in month.weekSet">
                                    <td ng-repeat="day in week.daySet" ng-class="data.dayStyle(option,day.type,day.month,day.dayNumber,day.year)"><label ng-show="day.dayNumber != 0">{{day.dayNumber}}</label></td>
                                </tr>
*/

function dayStringHTML(day){
	var retString = '<td class="' + day.type + '">';
	if(day.dayNumber != 0){
		retString += day.dayNumber;
	}
	retString += '</td>';
	return retString;
}

function weekStringHTML(week){
	var retString = "<tr>";
	for(var i = 0; i < week.daySet.length; i++){
		retString += dayStringHTML(week.daySet[i]);
	}
	retString += "</tr>";
	return retString;
}

function monthStringHTML(month){
	var retString = "";
	for(var i = 0; i < month.weekSet.length; i++){
		retString += weekStringHTML(month.weekSet[i]);
	}

	console.log(month.monthName + ' ' + month.yearNumber);

	document.getElementById(''+ month.monthName + ' ' + month.yearNumber + '').appendChild(retString);
	//return retString;
}

  }
}());