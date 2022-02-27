var trun_settings = {}
trun_settings.DummySuffix = "ClubStats_Date"

const mappingMainType = [
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

const mainType = [
  { maintype: "Run", centprokm: 0.20, minimum_pace: 9.5, maximum_pace: 3 },
  { maintype: "Bike", centprokm: 0.05, minimum_pace: 7, maximum_pace: 2 },
  { maintype: "Walking", centprokm: 0.20, maximum_pace: 9.5 },
  { maintype: "Others", centprokm: 0 }
]

const technicalUser = { firstname: "Team", lastname: "R." }

trun_settings.getTechnicalUser = function () {
  return { firstname: "Team", lastname: "R." };
}

trun_settings.isDummyActivity = function isDummyActivity(Activity) {
  if (Activity.name.substring(11, 26) === trun_settings.DummySuffix ||
     (Activity.athlete.firstname === technicalUser.firstname && Activity.athlete.firstname === technicalUser.lastname)) {
    return true
  } else {
    return false
  }
}

trun_settings.getMainType = function getMainType(ActivityType) {

  var maintype = { type: "Default", maintype: "Others" }; // Default

  for (let i = 0; i < mappingMainType.length; i++) {
    if (mappingMainType[i].type === ActivityType) {
      maintype = mappingMainType[i];
    }
  }

  return maintype;
}

trun_settings.getMainTypeSettings = function getMainTypeSetting(maintype) {
  for (let i = 0; i < mainType.length; i++) {
    if (mainType[i].maintype === maintype) {
      return mainType[i];
    }
  }
}

trun_settings.buildUniqueId = function buildUniqueId(Activity) {
  return Activity.type + "#" + Activity.athlete.firstname + "#" +
  Activity.athlete.lastname + "#" + Activity.elapsed_time + "#" + Activity.distance + "#" +
  Activity.date.toISOString().substring(0,10);
}

module.exports = trun_settings