async function start() {

  const stravaApi = require('strava-v3');
  const env = require('dotenv');
  env.config();

  const token = await stravaApi.oauth.refreshToken(process.env.STRAVA_REFRESH_TOKEN);
  const strava = new stravaApi.client(token.access_token);
  await createDummy(strava);

  console.log("RateLimitExceeded: " + strava.rateLimiting.exceeded());
  console.log("RateLimitFractionReached: " + strava.rateLimiting.fractionReached());

}

async function createDummy(strava) {

  const Activities = await strava.athlete.listActivities({})
  const maxDate = getLatestDummyActivityDate(Activities);

  console.log("Höchstes Dummydatum " + maxDate.toLocaleDateString('en-CA'));

  if (IsDummyCreateRequired(maxDate, strava) === true) {
    createDummyActivity(maxDate, strava)
  } else {
    console.log("Nothing to do dummy activites exist");
  }



}

async function createDummyActivity(maxDate, strava) {
  const currentDate = new Date();
  var bCount = 0;

  maxDate.setUTCDate(maxDate.getUTCDate() + 1); // since its the highest date that exists start createion 1 day in the future
  maxDate.setUTCHours(23, 59, 59, 999); // at 23:59 at the end of day create dummy acitvity

  while (maxDate.getUTCDate() < currentDate.getUTCDate()) {

    // no dummy activity for current day Grabber uses that day as default
    // prevent endless loop at all cost due to API limits
    if (maxDate.toISOString().substring(0,10)=== currentDate.toISOString().substring(0,10) ||
        bCount > 15) {
      break;
    }

    var ActivityData = {
      name: maxDate.toISOString().substring(0,10) + "#" + getDummySuffix(),
      type: "Run",
      description: "Dummy Activity for date determination",
      elapsed_time: 1,
      distance: 1,
      start_date_local: maxDate.toISOString(),
      hide_from_home: true,
      private: true
    }

    createdActivity = await strava.activities.create(ActivityData)

    bCount += 1;
    console.log("Dummy Activity created for " + maxDate.toISOString().substring(0,10));
    maxDate.setUTCDate(maxDate.getUTCDate() + 1);

  }

}

function IsDummyCreateRequired(maxDate, strava) {

  var bRequired = true;

  if (new Date().toLocaleDateString('de') === maxDate.toLocaleDateString('de')) {
    bRequired = false;
  }

  return bRequired;

}

function getLatestDummyActivityDate(Activities) {
  var aDates = [];

  for (let i = 0; i < Activities.length; i++) {

    // 7 Tage in die Vergangenheit soviele legen wir max an
    var DummyEarliest = new Date();
    DummyEarliest.setDate(DummyEarliest.getDate() - 7);
    aDates.push(DummyEarliest);

    if (Activities[i].name.substring(11, 26) === getDummySuffix()) {
      const ActivityDate = new Date(Activities[i].name.substring(0, 10));
      aDates.push(ActivityDate);

    }

  }

  return new Date(Math.max.apply(null, aDates));

}

function getDummySuffix() {
  return DummySuffix = "ClubStats_Date"
}

// Call start
start();