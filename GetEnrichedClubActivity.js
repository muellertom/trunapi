const { default: strava } = require('strava-v3');

async function start() {

  const stravaApi = require('strava-v3');
  const env = require('dotenv');
  env.config();

  const token = await stravaApi.oauth.refreshToken(process.env.STRAVA_REFRESH_TOKEN);
  const strava = new stravaApi.client(token.access_token);

  const Activities = await strava.clubs.listActivities({ id: process.env.STRAVA_CLUB_ID, page: 1, per_page: 200 });
  const Members = await strava.clubs.listMembers({ id: process.env.STRAVA_CLUB_ID, page: 1, per_page: 200 });

  const aEnrichedClubMembers = enrichClubMembers(Members);
  const aEnrichtedActivity = enrichActivies(Activities, aEnrichedClubMembers);

  console.log("Count Activities found " + aEnrichtedActivity.length);
  console.log("RateLimitExceeded: " + strava.rateLimiting.exceeded());
  console.log("RateLimitFractionReached: " + strava.rateLimiting.fractionReached());
}

function enrichClubMembers(Members) {
  for (var i = 0; i < Members.length; i++) {

    var iCount = 0;
    for (var j = 0; j < Members.length; j++) {
      if (Members[i].firstname === Members[j].firstname && Members[i].lastname === Members[j].lastname) {
        iCount = iCount + 1;
      }
    }

    if (iCount > 1) {
      Members[i].nameconflict = true;
      console.log("Name Conflict " + Members[i].firstname + " " + Members[i].lastname);
    } else {
      Members[i].nameconflict = false;
    }

  }

  if (Members.length === 200) {
    console.log("Warnung Anzahl Mitglieder überschreitet Paging von 200! Es fehlen vermutlich welche");
  }
  else {
    console.log("Count Club members " + Members.length);
  }

  return Members;
}

function enrichActivies(Activities, Members) {
  var aEnrichedActivity = [];
  var currentDate = new Date();

  for (let i = 0; i < Activities.length; i++) {

    let oActivity = Activities[i];

    if (isDummyActivity(oActivity) === true) {
      const ActivityDate = new Date(oActivity.name.substring(0, 10));
      currentDate = ActivityDate;
    }
    else {

      // new Properties
      oActivity.date = currentDate;
      oActivity.dummyid = buildId(oActivity);
      oActivity.nameconflict = getClubMemberNameConflict(Members, oActivity);
      oActivity.maintype = getMainType(oActivity).maintype;
      oActivity.distanceinkm = oActivity.distance / 1000;
      const maintype_setting = getMainTypeSetting(oActivity.maintype);
      oActivity.cent = oActivity.distanceinkm * maintype_setting.centprokm;
      oActivity.elapsed_time_in_minutes = oActivity.elapsed_time / 60;
      oActivity.moving_time_in_minutes = oActivity.moving_time / 60;
      oActivity.elapsed_duration = timeConvert(oActivity.elapsed_time_in_minutes);
      oActivity.moving_time_duration = timeConvert(oActivity.moving_time_in_minutes);
      oActivity.pace = calcPace(oActivity.moving_time_in_minutes, oActivity.distanceinkm);
      oActivity.minimum_pace_exceeded = false;
      oActivity.maximum_pace_exceeded = false;

      if (oActivity.pace > maintype_setting.minimum_pace) {
        oActivity.minimum_pace_exceeded = true;
      }

      if (oActivity.pace < maintype_setting.maximum_pace) {
        oActivity.maximum_pace_exceeded = true;
      }

      aEnrichedActivity.push(oActivity);

    }

  }

  return aEnrichedActivity;

}

// Suffix for Dummy Activities
function getDummySuffix() {
  return DummySuffix = "ClubStats_Date"
}

// build a unique id as we do not have the stava Activity ID due to data protection laws...
function buildId(Activity) {

  return Activity.type + "#" + Activity.athlete.firstname + "#" +
  Activity.athlete.lastname + "#" + Activity.elapsed_time + "#" + Activity.distance + "#" +
  Activity.date.toLocaleDateString('de');

}

// Is the Activity of our technical user
function isDummyActivity(Activity) {

  const oDummyUser = getTechnicalUser();

  if (Activity.name.substring(11, 26) === getDummySuffix() ||
    (Activity.athlete.firstname === oDummyUser.firstname && Activity.athlete.firstname === oDummyUser.lastname)) {
    return true
  } else {
    return false
  }

}

// gets Club member
function getClubMemberNameConflict(Members, Activity) {

  var bNameConflict = false;
  for (let j = 0; j < Members.length; j++) {
    if (Members[j].firstname === Activity.athlete.firstname && Members[j].lastname === Activity.athlete.lastname) {
      bNameConflict = Members[j].nameconflict;
    }
  }

  return bNameConflict;
}

// T.RUN Technical User is unique
function getTechnicalUser() {
  return { firstname: "Team", lastname: "R." };
}

function getMappingMainType() {

  return [
    { type: "Run", maintype: "Run" },
    { type: "Ride", maintype: "Bike" },
    { type: "VirtualRun", maintype: "Run" },
    { type: "VirtualRide", maintype: "Bike" },
    { type: "Walk", maintype: "Walking" },
    { type: "Hike", maintype: "Walking" },
    { type: "EBikeRide", maintype: "Bike" },
    { type: "Handcycle", maintype: "Bike" },
    { type: "Snowshoe", maintype: "Walking" }
  ]
}

function getMainType(Activity) {

  var maintype = { type: "Default", maintype: "Others" }; // Default
  const aMapping = getMappingMainType();
  for (let i = 0; i < aMapping.length; i++) {
    if (aMapping[i].type === Activity.type) {
      maintype = aMapping[i];
    }
  }

  return maintype;
}

function getSettingsMainType() {
  return [
      { maintype: "Run", centprokm: 0.20, minimum_pace: 9.5, maximum_pace: 3 },
      { maintype: "Bike", centprokm: 0.05, minimum_pace: 7, maximum_pace: 2 },
      { maintype: "Walking", centprokm: 0.20, maximum_pace: 9.5 },
      { maintype: "Others", centprokm: 0 }
  ]
}

function getMainTypeSetting(maintype) {
  const aMapping = getSettingsMainType();
  for (let i = 0; i < aMapping.length; i++) {
    if (aMapping[i].maintype === maintype) {
      return aMapping[i];
    }
  }
}

function timeConvert(n) {
  var num = n;
  var hours = (num / 60);
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.trunc(minutes);
  var seconds = n - Math.trunc(n);
  return rhours + ":" + rminutes + ":" + seconds.toString().substring(2, 4);
}

function calcPace(minutes, km) {
  var pace = minutes / km;
  paceMinutes = Math.floor(pace);
  paceSeconds = Math.round((pace - paceMinutes) * 60);
  if (paceSeconds < 10) {
    paceSeconds = "0" + paceSeconds;
  }

  return Number.parseFloat(paceMinutes + "." + paceSeconds);
}

// Call start
start();