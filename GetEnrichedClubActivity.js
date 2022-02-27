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

    if (trun_settings.isDummyActivity(oActivity) === true) {
      const ActivityDate = new Date(oActivity.name.substring(0, 10));
      currentDate = ActivityDate;
    }
    else {

      // new Properties
      oActivity.date = currentDate;
      oActivity.dummyid = trun_settings.buildUniqueId(oActivity);
      oActivity.nameconflict = getClubMemberNameConflict(Members, oActivity);
      oActivity.maintype = trun_settings.getMainType(oActivity.type).maintype;
      oActivity.distanceinkm = oActivity.distance / 1000;
      const maintype_setting = trun_settings.getMainTypeSettings(oActivity.maintype);
      oActivity.cent = oActivity.distanceinkm * maintype_setting.centprokm;
      oActivity.elapsed_time_in_minutes = oActivity.elapsed_time / 60;
      oActivity.moving_time_in_minutes = oActivity.moving_time / 60;
      oActivity.elapsed_duration = stats.timeConvert(oActivity.elapsed_time_in_minutes);
      oActivity.moving_time_duration = stats.timeConvert(oActivity.moving_time_in_minutes);
      oActivity.pace = stats.calculatePace(oActivity.moving_time_in_minutes, oActivity.distanceinkm);
      oActivity.minimum_pace_exceeded = false;
      oActivity.maximum_pace_exceeded = false;
      oActivity.kmh = 60 / oActivity.pace;
      
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

// Call start
const stats = require('./StatsUtility')
const trun_settings = require('./TRunSettings')
start();