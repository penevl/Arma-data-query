function getPlayers() {
  var toReturn = []
  var data = JSON.parse(document.querySelector('#chart-data').textContent)
  data.forEach(element => {
    toReturn.unshift(element.playerCount)
  });

  return toReturn

}

function getDates() {

  var toReturn = []
  var data = JSON.parse(document.querySelector('#chart-data').textContent)
  data.forEach(element => {
    toReturn.unshift(element.date)
  });

  return toReturn

}

var options = {
  series: [{
    name: "Attendees",
    data: getPlayers()
}],
  chart: {
  height: 350,
  type: 'line',
  zoom: {
    enabled: true
  }
},
dataLabels: {
  enabled: true
},
stroke: {
  curve: 'straight'
},
title: {
  text: 'Attendance',
  align: 'left',
},
xaxis: {
  categories: getDates(),
}
};

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();


