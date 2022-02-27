var Stats = {}
 
Stats.timeConvert  = function timeConvert(n) {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.trunc(minutes);
    var seconds = n - Math.trunc(n);
    return rhours + ":" + rminutes + ":" + seconds.toString().substring(2, 4);
  }
  
  Stats.calculatePace = function calcPace(minutes, km) {
    var pace = minutes / km;
    paceMinutes = Math.floor(pace);
    paceSeconds = Math.round((pace - paceMinutes) * 60);
    if (paceSeconds < 10) {
      paceSeconds = "0" + paceSeconds;
    }
  
    return Number.parseFloat(paceMinutes + "." + paceSeconds);
  }

module.exports = Stats