// JavaScript
var heroImage = $('#heroImg');
var dest;
var prep;
var arrive;
var noteid;
var timeOut;
//var id;

document.addEventListener("deviceready", setup, false);

//$(document).ready(function () {
	//setup();
//});

$(document).bind('mobileinit',function(){
	console.log('init');
	$.mobile.changePage.defaults.changeHash = true;
	$.mobile.hashListeningEnabled = true;
	$.mobile.pushStateEnabled = false;
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true;
	$.mobile.changePage.defaults.allowSamePageTransition = false;
	$.mobile.phonegapNavigationEnabled = true;
	jQuery.mobile.defaultPageTransition='slide';
});

function alertDismissed() {
    // do something
};

function setup() {
  //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, success, error);
	//navigator.notification.alert('You are a winner!', 'alertDismissed', 'Game Over', 'Done');

	cordova.plugins.backgroundMode.enable();

	//When the alarm triggers the ID is used to set another alarm one minute later
	cordova.plugins.notification.local.on("trigger", function(notification) {

		noteid = notification.id;
    $("#alarmStop").fadeIn();
		//alert(noteid);
		timeOut = window.setTimeout(function() {
			var date = new Date();

			try {
				cordova.plugins.notification.local.schedule({
					id: noteid,
					text: "Wake up!",
					sound: "file://assets/sound/sub.mp3",
					at: date,
					foreground: true
				});
			} catch(err) {
				console.log(err);
			}
		}, 60000);
	});
};

$(document).on('pagecreate', '#home', function () {
	console.log("Home fired");
	$("#loader").hide();
	//$("#alarmStop").show();
	//window.localStorage.clear();

	$('#working').on('click', function (event) {
		//Values from the alarm page are gathered to be used
		dest = $("#dest").val();
		prep = $("#prep").val().split(":");
		arrive = $("#arrive").val().split(":");
		console.log($("#prep").val());

		//If statements checking that all the inputs are filled out
		if(dest.length == 0 || $("#prep").val() == "" || $("#arrive").val() == "") {
			alert("Please input in all boxes");
		} else {
			$("#loader").show();
			//var dist_API = ("https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=16+martin+street,lincoln&destinations=university+of+lincoln,lincoln&mode=walking&key=AIzaSyDd4SiJLAaOZK_VxepunQo0D79i-sxQTMU");

			//console.log(dist);
			console.log(dest);

			//Checking if the device is online, if not an error msg is displayed
			if (!window.navigator.offline) {
				//Distance API - https://www.w3schools.com/html/html5_geolocation.asp
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(distance);
				} else {
					console.log("nope");
				}
			} else {
				alert("Please connect to the internet");
			}
		}
	});

		//Distance information is gathered and weather API called to influence the alarm
		function distance(position) {
		var origin = String(position.coords.latitude + " " + position.coords.longitude);
		var service = new google.maps.DistanceMatrixService();

		service.getDistanceMatrix(
			{
				origins: [origin],
				destinations: [dest],
				travelMode: 'WALKING'
			}, callback);

		function callback(response, status) {
			var value = response.rows[0].elements[0].duration.value;
			var origin = response.originAddresses[0];

			var search = $.ajax({
				url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%" +
				"20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20" +
				"geo.places(1)%20where%20text%3D%22"+ dest +"%2C%20ak%22)&format=json" +
				"&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
				success: function(result) {
					console.log(result.query.results.channel.item.forecast[0].text);
					var text = result.query.results.channel.item.forecast[0].text;

					if(text == "Snow" || text == "Light Snow Showers" || text ==
					"Snow Flurries" || text == "Blowing Snow") {
						value += 1500;
						console.log("snow");
					}

					if(text == "Thundershowers" || text == "Scattered Thunderstorms" || text ==
					"Isolated Thunderstorms") {
						value += 1000;
						console.log("thunder");
					}

					console.log(origin);
					setAlarm(value, origin);
				}
			});
			console.log(value);
			//add weather api function to return the weather time to then pass to setAlarm
		}
	};

	//The inputs are manipulated to make them ready to be used for the notification
	//plugin and to show on the alarm page
	function setAlarm(value, origin) {
		var prepMin = (+ prep[0]) * 60 + (+ prep[1]);
		var arriveMin = (+ arrive[0]) * 60 + (+ arrive[1]);

		//Uses the google distance to manipulate the time from inputs
		var distance = Math.round(parseInt(value) / 60);
		var calc = Math.abs(arriveMin - prepMin - distance);

		//Makes sure the hours do not exceed 24 hours
		while(calc > 1400) {
			calc -= 1400;
		}

		var hours = Math.floor( calc / 60);
		var min = calc % 60;

		var notiForm = new Date();
		notiForm.setHours(hours);
		notiForm.setMinutes(min);
		//if(hours < 12) {
			//notiForm.setDate(notiForm.getDate() + 1);
		//}
		//var notiString = "today_at_" + notiForm.getHours() + "_" + notiForm.getMinutes() + "_am";

		if (min < 10) {
			min = "0" + min;
		}
		var display = hours + ":" + min;
		$("#alarm").html("Alarm time: " + display);

		console.log("Time: " + display.toString());
		$("#loader").hide();
		//console.log(notiForm, display);

		//read the alarms file and see what ids are available
		notification(notiForm, display, origin);
	};

	//The notification information is saved to local storeage to be used by the
	//alarms page incase the user wants to delete the alarm.  The notification
	//alarm is then set using the notification plugin
	function notification(notiForm, display, origin) {
		var id;
		var dest = $("#dest").val();
		var prep = $("#prep").val();
		var arrive = $("#arrive").val();

		//console.log(display);

		var ids = window.localStorage.getItem("ids");
		if(ids != null) {
			console.log("not null");
			idSplit = ids.split(",");
			id = parseInt(idSplit[idSplit.length -1]) + 1;
			var idList = [ids];
			idList.push(id);
			window.localStorage.setItem("ids", idList);
		} else {
			console.log("null");
			id = 1;
			window.localStorage.setItem("ids", id.toString());
		}

		console.log(id);

		try {
			cordova.plugins.notification.local.schedule({
				id: id,
				text: "Wake up!",
				sound: "file://assets/sound/sub.mp3",
				at: new Date(notiForm),
				foreground: true
			});
		} catch(err) {
			console.log(err);
			alert(err);
		}

		var myObj = {};
		myObj["AlarmId"] = id;
		myObj["Origin"] = origin;
		myObj["ExpectTime"] = display;
		myObj["Destination"] = dest;
		myObj["PrepTime"] = prep;
		myObj["DesiredToA"] = arrive;
		console.log(origin);

		console.log(myObj);

		console.log(myObj.toString());
		window.localStorage.setItem(id.toString(), JSON.stringify(myObj));
		//window.localStorage.clear();
		//alert(window.localStorage.getItem(id.toString()));
		console.log(window.localStorage.getItem(id.toString()));
	}


	//The alarm stop button that is shown when an alarm is triggered to allow
	//the user to stop the alarm.  This also saves the alarm that was triggered
	//to a new local storage area to be used by the analytics page.  Then the
	//stop alarm button and snooze button are hidden.
	$('#alarmStp').on('click', function (event) {
		var OldIds = window.localStorage.getItem("OldIds");
		var OldId;
		console.log(noteid);

		if(OldIds != null) {
			console.log("not null");
			idSplit = OldIds.split(",");
			var idList = [idSplit];
			idList.push(noteid);
			OldId = parseInt(idSplit[idSplit.length -1]) + 1;
			window.localStorage.setItem("OldIds", idList);
		} else {
			console.log("null");
			OldId = 1;
			window.localStorage.setItem("OldIds", OldId.toString());
		}

		try {
			var oldParse = jQuery.parseJSON(window.localStorage.getItem(noteid));
			console.log(oldParse);
			var myObj = {};
			myObj["AlarmId"] = noteid;
			myObj["Origin"] = oldParse.Origin;
			myObj["ExpectTime"] = oldParse.ExpectTime;
			myObj["Destination"] = oldParse.Destination;
			myObj["PrepTime"] = oldParse.PrepTime;
			myObj["DesiredToA"] = oldParse.DesiredToA;
			myObj["AlarmTime"] = new Date(new Date()).getHours() + ":" + new Date(new Date()).getMinutes();

			window.localStorage.setItem("Old" + OldId, JSON.stringify(myObj));
			//alert("Old item in alarmstp" + window.localStorage.getItem("Old" + OldId, JSON.stringify(myObj)));
		} catch(err) {
			console.log(err);
			alert(err);
		}

		cordova.plugins.notification.local.clear(noteid, function() {
			//alert("Alarm stopped");
		});

		cordova.plugins.notification.local.cancel(noteid, function() {
			//alert("Alarm cancelled");
			window.clearTimeout(timeOut);
			window.localStorage.removeItem(noteid);
			$("#alarmStop").hide();
		});
	});

	//The alarm snooze button overwrites the current alarm and adds 5 minutes to
	//the date to act as a snooze feature.
	$('#alarmSnz').on('click', function (event) {
		var date = new Date();
		date.setMinutes(date.getMinutes() + 5);

		try {
			cordova.plugins.notification.local.update({
				id: noteid,
				text: "Wake up!",
				sound: "file://assets/sound/sub.mp3",
				at: date,
				foreground: true
			});
		} catch(err) {
			console.log(err);
		}
		//alert("Alarm snoozed");
	});
});

//Alarms page
//$(document).on("pagecreate", "#alarms", function() {
	//listview();
//});

$(document).on("pagebeforeshow", "#alarms", function() {
	$("#alarmCon").find("#alarmsList").remove();
	$("#alarmCon").append("<ul data-role='listview' id='alarmsList' " +
	" style='list-style: none; padding: 0; text-align: center;'></ul>");
	listview();
});

//The listview function reads the information stored on the local storeage to
//add each alarm to the page.
function listview() {
	var ids = window.localStorage.getItem("ids");
	//console.log(ids);

	if(ids != null) {
		idSplit = ids.split(",");
		for(var i = 0;  i < idSplit.length; i++) {
			var item = idSplit[i];
			var alarm = window.localStorage.getItem(item.toString());
			if(alarm != null) {
				var myObj = jQuery.parseJSON(alarm);
				console.log(myObj);
				//alert(myObj);
				//background-color: black;

				try {
					$("#alarmCon").find("#alarmsList").append("<li id=list"
					+ myObj.AlarmId + " style='list-style-position:inside; border-radius:" +
					" 25px; border: 5px solid white; background-color: #666666;'> " +
					"Destination: " + myObj.Destination + "<br>" +
					"Prep time: " + myObj.PrepTime + "<br>" +
					"Desired time of arrival: " + myObj.DesiredToA + "<br>" +
					"Expected alarm time: " + myObj.ExpectTime +
					" <button id=dltAlrm" + myObj.AlarmId +
					" class='ui-btn ui-corner-all' style='width: 50%; margin: 0 auto;' onclick=dltAlrm("
					+ myObj.AlarmId +")>Delete alarm</button></li><br id=br"
					+ myObj.AlarmId + ">");
				} catch(err) {
					console.log(err);
					alert(err);
				}
			} else {
				//break
			}
		}
	} else {
		//no alarms
	}

	//Alarm delete button deletes all the stored alarms on the device.
	$('#alarmsDel').on('click', function (event) {
		window.localStorage.clear();
		$("#alarmCon").find("#alarmsList").fadeOut();
	});
}

//When a delete alarm button is pressed the ID is passed to the function to
//find the ID in the ids stored on the device.  The ID and the stored information
//associated with that ID are rhen deleted along with any upcoming alarms it had set.
function dltAlrm(alarmDelId) {
	console.log(alarmDelId);
	$("#alarmCon").find("#alarmsList").find("#list" + alarmDelId).fadeOut();
	$("#alarmCon").find("#alarmsList").find("#br" + alarmDelId).fadeOut();

	var ids = window.localStorage.getItem("ids");
	var idList = ids.split(",");
	var index = idList.indexOf(String(alarmDelId));
	idList.splice(index, 1);
	console.log(idList);

	window.localStorage.removeItem("ids");
	if(idList.length > 0) {
		window.localStorage.setItem("ids", idList);
		console.log(window.localStorage.setItem("ids", idList));
	}
	console.log(window.localStorage.getItem(alarmDelId));
	window.localStorage.removeItem(alarmDelId);

	cordova.plugins.notification.local.clear(alarmDelId, function() {
		//alert("alarm cleared");
	});

	cordova.plugins.notification.local.cancel(alarmDelId, function() {
		//alert("alarm cancelled");
	});
}

$(document).on( "pagebeforeshow", "#analytics", function() {
  console.log("map fired");

	//console.log(window.localStorage.getItem("OldIds"));
	//console.log(window.localStorage.getItem("Old" + window.localStorage.getItem("OldIds")[0]));

	$("#oldAlarms").find("#alarmHistDrop").find("option").remove().end();

	var OldIds = window.localStorage.getItem("OldIds");
	//var select = document.getElementById("alarmHistDrop");

	//The oldids are looped through and their attributes used to add to the dropdown list
	if(OldIds != null) {
		//alert(OldIds);
		idSplit = OldIds.split(",");
		var select = document.getElementById("alarmHistDrop");
		for(var i = 0;  i < idSplit.length; i++) {
			var item = idSplit[i];
			var alarm = window.localStorage.getItem("Old" + item.toString());
			//alert("item" + item.toString());
			//alert("alarm in history" + alarm);
			if(alarm != null) {
				var myObj = jQuery.parseJSON(alarm);
				console.log(myObj);
				//console.log(myObj.Destination);

				try {
					var opt = document.createElement("option");
					opt["value"] = myObj.AlarmId;
					opt["innerHTML"] = myObj.Destination;
					select.appendChild(opt);
					$("#alarmHistDrop").val($("#alarmHistDrop option:first").val());
				} catch(err) {
					console.log(err);
				}
				//$('select option:first-child').attr("selected", "selected");
			}
		}
		//$("#alarmHistDrop").val($("#target option:first").val());
	} else {
		//no alarms
	}
});

//When an item is selected in the drop down list the value associated with
//item selected is then used to find the information stored.  This information
//is then shown to the user and map plotted with the origin and destination information.
$(document).on('change', 'select', function() {
	//console.log($(this).val());
	var value = $(this).val();
	var OldId = window.localStorage.getItem("Old" + value);
	var myObj = jQuery.parseJSON(OldId);
	var origin = myObj.Origin;
	var dest = myObj.Destination;
	var prep = myObj.PrepTime;
	var desi = myObj.DesiredToA;
	var alarmTime = myObj.AlarmTime;

	$("#map-canvas").hide();

	$("#analytics").find("#destHist").text("Destination: " + dest);
	$("#analytics").find("#prepHist").text("Prep time: " + prep);
	$("#analytics").find("#DesiHist").text("Desired time of arrival: " + desi);
	$("#analytics").find("#AlarmHist").text("Alarm time: " + alarmTime);

	if (!window.navigator.offline) {
		console.log("online");

		var locList = [];

		var oriCall = $.ajax({
				url: "https://maps.googleapis.com/maps/api/geocode/json?address="+ origin +",%20UK&key=AIzaSyDd4SiJLAaOZK_VxepunQo0D79i-sxQTMU",
				success: function(result) {
					locList.push(new google.maps.LatLng(result.results[0].geometry.location.lat, result.results[0].geometry.location.lng));
				}
			});

			var destCall = $.ajax({
				url: "https://maps.googleapis.com/maps/api/geocode/json?address="+ dest +",%20UK&key=AIzaSyDd4SiJLAaOZK_VxepunQo0D79i-sxQTMU",
				success: function(result) {
					locList.push(new google.maps.LatLng(result.results[0].geometry.location.lat, result.results[0].geometry.location.lng));
					drawMap();
				}
			});

			function drawMap() {
					var myOptions = {
							zoom: 10,
							center: locList[0],
							mapTypeId: google.maps.MapTypeId.ROADMAP
					};
					var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
					// Add an overlay to the map of current lat/lng
					var path = new google.maps.Polyline({
						path: locList,
						strokeColor: "#FF0000",
						strokeOpacity: 1.0,
						strokeWeight: 2
					});

					path.setMap(map);

					var origin = new google.maps.Marker({
							position: locList[0],
							map: map,
							title: origin
					});

					var destin = new google.maps.Marker({
							position: locList[1],
							map: map,
							title: dest
					});

					$("#map-canvas").show();
			}

			function analyticLoad(OldId) {
				alert(id);
			}
	} else {
		console.log("offline");
		alert("Map not shown, device is offline");
	}
});
