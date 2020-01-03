let express = require('express');
let app = express();
let bodyParser = require('body-parser');
const openGeocoder = require('node-open-geocoder');
const ipstack = require('ipstack')

require('custom-env').env('apikey')

const DarkSky = require('dark-sky')
const darksky = new DarkSky(process.env.DARK_SKY)


app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs')
app.use(express.static("public"));

app.get('/', function (req, responseMaster) {

    ipstack("check", process.env.IPSTACK, (err, response) => {
        function getDarkSky(lat, lng) {
            darksky
                .latitude(lat)
                .longitude(lng)
                .units('ca')
                .language('en')
                .exclude('minutely')
                .extendHourly(true)
                .get()
                .then((res) => {
                    var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                    var days2 = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'thursday', 'Friday', 'Saturday'];
                    var currentDay = days2[(new Date((res.hourly.data[0].time) * 1000)).getDay()]

                    var currentTime = (new Date((res.hourly.data[0].time) * 1000)).getHours()

                    if (currentTime == 0) {
                        currentTime = (currentTime + 12) + ":00 AM";
                    } else if (currentTime == 12) {
                        currentTime = currentTime + ":00 PM"
                    } else if (currentTime > 12) {
                        currentTime = (currentTime - 12) + ":00 PM"
                    } else {
                        currentTime = currentTime + ":00 AM"
                    }

                    var hourlyTime = []
                    var hourlyIcon = []
                    var hourlyTemp = []
                    for (var i = 0; i <= 23; i++) {
                        var hourlyCurrentTime = (new Date((res.hourly.data[i].time) * 1000)).getHours()
                        if (hourlyCurrentTime == 0) {
                            hourlyCurrentTime = (hourlyCurrentTime + 12) + "AM";
                        } else if (hourlyCurrentTime == 12) {
                            hourlyCurrentTime = hourlyCurrentTime + "PM"
                        } else if (hourlyCurrentTime > 12) {
                            hourlyCurrentTime = (hourlyCurrentTime - 12) + "PM"
                        } else {
                            hourlyCurrentTime = hourlyCurrentTime + "AM"
                        }
                        hourlyTime.push(hourlyCurrentTime)

                        var iconHolder = res.hourly.data[i].icon

                        if (iconHolder === "clear-day" || iconHolder === "clear-night") {
                            iconHolder = "clear"
                        } else if (iconHolder === "partly-cloudy-day" || iconHolder === "partly-cloudy-night") {
                            iconHolder = "partly"
                        } else if (iconHolder === "rain" || iconHolder === "snow" || iconHolder === "sleet" || iconHolder === "wind" || iconHolder === "fog" || iconHolder === "cloudy" || iconHolder === "hail" || iconHolder === "thunderstorm" || iconHolder === "tornado") {
                            //do nothing
                        } else {
                            iconHolder = "clear"
                        }

                        hourlyIcon.push(iconHolder)
                        hourlyTemp.push(Math.round(res.hourly.data[i].temperature))
                    }

                    var dailyDate = []
                    var dailyIcon = []
                    var dailyTemp = []

                    for (var i = 0; i <= 7; i++) {
                        dailyDate.push(days[(new Date((res.daily.data[i].time) * 1000)).getDay()])
                        var iconHolder = res.daily.data[i].icon

                        if (iconHolder === "clear-day" || iconHolder === "clear-night") {
                            iconHolder = "clear"
                        } else if (iconHolder === "partly-cloudy-day" || iconHolder === "partly-cloudy-night") {
                            iconHolder = "partly"
                        } else if (iconHolder === "rain" || iconHolder === "snow" || iconHolder === "sleet" || iconHolder === "wind" || iconHolder === "fog" || iconHolder === "cloudy" || iconHolder === "hail" || iconHolder === "thunderstorm" || iconHolder === "tornado") {
                            //do nothing
                        } else {
                            iconHolder = "clear"
                        }

                        dailyIcon.push(iconHolder)
                        dailyTemp.push(Math.round((res.daily.data[i].temperatureMin + res.daily.data[i].temperatureMax) / 2))
                    }

                    var icon = res.currently.icon;

                    if (icon === "clear-day" || icon === "clear-night") {
                        icon = "clear"
                    } else if (icon === "partly-cloudy-day" || icon === "partly-cloudy-night") {
                        icon = "partly"
                    } else if (icon === "rain" || icon === "snow" || icon === "sleet" || icon === "wind" || icon === "fog" || icon === "cloudy" || icon === "hail" || icon === "thunderstorm" || icon === "tornado") {
                        //do nothing
                    } else {
                        icon = "clear"
                    }

                    var dayTime = 0

                    if (res.currently.time <= res.daily.data[0].sunriseTime || res.currently.time >= res.daily.data[0].sunsetTime) {
                        dayTime = dayTime - dayTime + 0.75
                    } else {
                        dayTime = (dayTime - dayTime) + (res.daily.data[0].sunsetTime - res.currently.time) / (res.daily.data[0].sunsetTime - res.daily.data[0].sunriseTime)

                        if (dayTime >= 0.5) {
                            dayTime = (dayTime - 0.5) * 1.5
                        } else {
                            dayTime = ((1 - dayTime) - 0.5) * 1.5
                        }

                    }

                    responseMaster.render('pages/index', {
                        error: null,
                        searchError: null,
                        fullData: res,
                        city: response.city,
                        state: response.region_name,
                        currentTemp: Math.round(res.currently.temperature),
                        currentIcon: icon,
                        currentPop: Math.round(res.currently.precipProbability * 100),
                        currentHumidity: Math.round(res.currently.humidity * 100),
                        currentWind: Math.round(res.currently.windSpeed),
                        currentWindBearing: res.currently.windBearing,
                        currentPressure: Math.round(res.currently.pressure) / 10,
                        currentTime: currentTime,
                        currentDay: currentDay,
                        hourlyTime: hourlyTime,
                        hourlyIcon: hourlyIcon,
                        hourlyTemp: hourlyTemp,
                        dailyDate: dailyDate,
                        dailyIcon: dailyIcon,
                        dailyTemp: dailyTemp,
                        dayTime: dayTime.toFixed(2)
                    });
                })
                .catch((error) => {
                    responseMaster.render('pages/index', {
                        error: error,
                        searchError: null,
                        fullData: null,
                        city: null,
                        state: null,
                        currentTemp: null,
                        currentIcon: null,
                        currentPop: null,
                        currentHumidity: null,
                        currentWind: null,
                        currentWindBearing: null,
                        currentPressure: null,
                        currentTime: null,
                        currentDay: null,
                        hourlyTime: null,
                        hourlyIcon: null,
                        hourlyTemp: null,
                        dailyDate: null,
                        dailyIcon: null,
                        dailyTemp: null,
                        dayTime: 0
                    });
                })
        }

        if (err) {
            getDarkSky(43.70317077636719, -79.51219177246094)
        } else {
            getDarkSky(response.latitude, response.longitude)
        }
    })
});

app.post('/', function (req, responseMaster) {
    let location = req.body.city;

    openGeocoder()
        .geocode(location)
        .end((err, res) => {
            if (err) {
                getError();
            } else {
                if (res[0] == undefined) {
                    getError();
                } else if (res[0].address.city == undefined) {
                    if (res[0].address.state_district == undefined) {
                        getDarkSky(res[0].lat, res[0].lon, res[0].address.state, res[0].address.country);
                    } else {
                        getDarkSky(res[0].lat, res[0].lon, res[0].address.state_district, res[0].address.state);
                    }
                } else {
                    getDarkSky(res[0].lat, res[0].lon, res[0].address.city, res[0].address.state);
                }


            }
        })

    function getError() {
        responseMaster.render('pages/index', {
            error: null,
            searchError: location,
            fullData: null,
            city: null,
            state: null,
            currentTemp: null,
            currentIcon: null,
            currentPop: null,
            currentHumidity: null,
            currentWind: null,
            currentWindBearing: null,
            currentPressure: null,
            currentTime: null,
            currentDay: null,
            hourlyTime: null,
            hourlyIcon: null,
            hourlyTemp: null,
            dailyDate: null,
            dailyIcon: null,
            dailyTemp: null,
            dayTime: 0
        });
    }

    function getDarkSky(lat, lng, city, state) {
        darksky
            .latitude(lat)
            .longitude(lng)
            .units('ca')
            .language('en')
            .exclude('minutely')
            .extendHourly(true)
            .get()
            .then((res) => {
                var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                var days2 = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'thursday', 'Friday', 'Saturday'];
                var currentDay = days2[(new Date((res.hourly.data[0].time) * 1000)).getDay()]

                var currentTime = (new Date((res.hourly.data[0].time) * 1000)).getHours()

                if (currentTime == 0) {
                    currentTime = (currentTime + 12) + ":00 AM";
                } else if (currentTime == 12) {
                    currentTime = currentTime + ":00 PM"
                } else if (currentTime > 12) {
                    currentTime = (currentTime - 12) + ":00 PM"
                } else {
                    currentTime = currentTime + ":00 AM"
                }

                var hourlyTime = []
                var hourlyIcon = []
                var hourlyTemp = []
                for (var i = 0; i <= 23; i++) {
                    var hourlyCurrentTime = (new Date((res.hourly.data[i].time) * 1000)).getHours()
                    if (hourlyCurrentTime == 0) {
                        hourlyCurrentTime = (hourlyCurrentTime + 12) + "AM";
                    } else if (hourlyCurrentTime == 12) {
                        hourlyCurrentTime = hourlyCurrentTime + "PM"
                    } else if (hourlyCurrentTime > 12) {
                        hourlyCurrentTime = (hourlyCurrentTime - 12) + "PM"
                    } else {
                        hourlyCurrentTime = hourlyCurrentTime + "AM"
                    }
                    hourlyTime.push(hourlyCurrentTime)

                    var iconHolder = res.hourly.data[i].icon

                    if (iconHolder === "clear-day" || iconHolder === "clear-night") {
                        iconHolder = "clear"
                    } else if (iconHolder === "partly-cloudy-day" || iconHolder === "partly-cloudy-night") {
                        iconHolder = "partly"
                    } else if (iconHolder === "rain" || iconHolder === "snow" || iconHolder === "sleet" || iconHolder === "wind" || iconHolder === "fog" || iconHolder === "cloudy" || iconHolder === "hail" || iconHolder === "thunderstorm" || iconHolder === "tornado") {
                        //do nothing
                    } else {
                        iconHolder = "clear"
                    }
                    hourlyIcon.push(iconHolder)
                    hourlyTemp.push(Math.round(res.hourly.data[i].temperature))
                }

                var dailyDate = []
                var dailyIcon = []
                var dailyTemp = []

                for (var i = 0; i <= 7; i++) {
                    dailyDate.push(days[(new Date((res.daily.data[i].time) * 1000)).getDay()])
                    var iconHolder = res.daily.data[i].icon

                    if (iconHolder === "clear-day" || iconHolder === "clear-night") {
                        iconHolder = "clear"
                    } else if (iconHolder === "partly-cloudy-day" || iconHolder === "partly-cloudy-night") {
                        iconHolder = "partly"
                    } else if (iconHolder === "rain" || iconHolder === "snow" || iconHolder === "sleet" || iconHolder === "wind" || iconHolder === "fog" || iconHolder === "cloudy" || iconHolder === "hail" || iconHolder === "thunderstorm" || iconHolder === "tornado") {
                        //do nothing
                    } else {
                        iconHolder = "clear"
                    }

                    dailyIcon.push(iconHolder)
                    dailyTemp.push(Math.round((res.daily.data[i].temperatureMin + res.daily.data[i].temperatureMax) / 2))
                }

                var icon = res.currently.icon;

                if (icon === "clear-day" || icon === "clear-night") {
                    icon = "clear"
                } else if (icon === "partly-cloudy-day" || icon === "partly-cloudy-night") {
                    icon = "partly"
                } else if (icon === "rain" || icon === "snow" || icon === "sleet" || icon === "wind" || icon === "fog" || icon === "cloudy" || icon === "hail" || icon === "thunderstorm" || icon === "tornado") {
                    //do nothing
                } else {
                    icon = "clear"
                }

                var dayTime = 0

                if (res.currently.time <= res.daily.data[0].sunriseTime || res.currently.time >= res.daily.data[0].sunsetTime) {
                    dayTime = dayTime - dayTime + 0.75
                } else {
                    dayTime = (dayTime - dayTime) + (res.daily.data[0].sunsetTime - res.currently.time) / (res.daily.data[0].sunsetTime - res.daily.data[0].sunriseTime)

                    if (dayTime >= 0.5) {
                        dayTime = (dayTime - 0.5) * 1.5
                    } else {
                        dayTime = ((1 - dayTime) - 0.5) * 1.5
                    }

                }

                responseMaster.render('pages/index', {
                    error: null,
                    searchError: null,
                    fullData: res,
                    city: city,
                    state: state,
                    currentTemp: Math.round(res.currently.temperature),
                    currentIcon: icon,
                    currentPop: Math.round(res.currently.precipProbability * 100),
                    currentHumidity: Math.round(res.currently.humidity * 100),
                    currentWind: Math.round(res.currently.windSpeed),
                    currentWindBearing: res.currently.windBearing,
                    currentPressure: Math.round(res.currently.pressure) / 10,
                    currentTime: currentTime,
                    currentDay: currentDay,
                    hourlyTime: hourlyTime,
                    hourlyIcon: hourlyIcon,
                    hourlyTemp: hourlyTemp,
                    dailyDate: dailyDate,
                    dailyIcon: dailyIcon,
                    dailyTemp: dailyTemp,
                    dayTime: dayTime.toFixed(2)

                });
            })
            .catch((error) => {
                responseMaster.render('pages/index', {
                    error: error,
                    searchError: null,
                    fullData: null,
                    city: null,
                    state: null,
                    currentTemp: null,
                    currentIcon: null,
                    currentPop: null,
                    currentHumidity: null,
                    currentWind: null,
                    currentWindBearing: null,
                    currentPressure: null,
                    currentTime: null,
                    currentDay: null,
                    hourlyTime: null,
                    hourlyIcon: null,
                    hourlyTemp: null,
                    dailyDate: null,
                    dailyIcon: null,
                    dailyTemp: null,
                    dayTime: 0
                });
            })
    }

});

app.listen(3000, function () {
    console.log('connected!');
});
