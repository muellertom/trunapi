async function start() {
 
    const stravaApi = require('strava-v3');
    const env = require('dotenv');
    env.config();
  
    const token = await stravaApi.oauth.refreshToken(process.env.STRAVA_REFRESH_TOKEN);
    const strava = new stravaApi.client(token.access_token);
  
    let Members = await strava.clubs.listMembers({ id: process.env.STRAVA_CLUB_ID, page: 1, per_page: 200 });
    const Members2 = await strava.clubs.listMembers({ id: process.env.STRAVA_CLUB_ID, page: 2, per_page: 200 });
    Members.push(Members2);
    
    const aEnrichedClubMembers = enrichClubMembers(Members);

    //console.log(aEnrichedClubMembers);
    console.log("Count Members found " + aEnrichedClubMembers.length);
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
  
    if (Members.length === 400) {
      console.log("Warnung Anzahl Mitglieder überschreitet Paging von 400! Es fehlen vermutlich welche");
    }
    else {
      console.log("Count Club members " + Members.length);
    }
  
    return Members;
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
  
  start();