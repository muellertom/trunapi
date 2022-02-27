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

  console.log("Highest dummy date found  " + maxDate.toISOString().substring(0,10));

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
      name: maxDate.toISOString().substring(0,10) + "#" + trun_settings.DummySuffix,
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
  if (new Date().toISOString().substring(0,10) === maxDate.toISOString().substring(0,10)) {
    bRequired = false;
  }

  return bRequired;
}

function getLatestDummyActivityDate(Activities) {
  var aDates = [];

  for (let i = 0; i < Activities.length; i++) {

    // 7 days into the past thats the maximum amount of dummies we create
    var DummyEarliest = new Date();
    DummyEarliest.setDate(DummyEarliest.getDate() - 7);
    aDates.push(DummyEarliest);

    if (trun_settings.isDummyActivity(Activities[i])) {
      const ActivityDate = new Date(Activities[i].name.substring(0, 10));
      aDates.push(ActivityDate);

    }

  }

  return new Date(Math.max.apply(null, aDates));
}

// Call start
const trun_settings = require('./TRunSettings')
start();