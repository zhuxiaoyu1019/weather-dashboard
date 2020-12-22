$(document).ready(function () {
    var tempSymbol;
    var speedUnit;
    var list = JSON.parse(localStorage.getItem("tagged"));

    getCurrLocation();
    displayTaggedCity();

    $("form").on("submit", function (e) {
        e.preventDefault();
        var city = $("input").val();

        getData(city);
        setTimeout(isTag, 200);
    });

    $(".star").on("click", function () {
        saveDashboard();
        displayTaggedCity();
    });

    $(".dropdown-item").on("click", function () {
        var tagCity = $(this).text();

        getData(tagCity);
        setTimeout(isTag, 200);
    });

    function getCurrLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
        }
    }

    function success(position) {
        console.log(position);
        var currLat = position.coords.latitude;
        var currLon = position.coords.longitude;
        var currLocation = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currLat}&longitude=${currLon}&localityLanguage=en`;

        $.ajax({
            url: currLocation,
            method: "GET"
        }).then(function (response) {
            console.log(response);
            var currCity = response.localityInfo.administrative[response.localityInfo.administrative.length - 1].name;
            getData(currCity);
        });
    }

    function error() {
        $("#city-name").text("Geolocation is not supported by this browser.");
    }

    function getData(city) {
        fetchBackgroundImg(city);
        updateWeatherInfo(city);
    }

    function fetchBackgroundImg(city) {
        var cityPhotoURL = `https://pixabay.com/api/?key=19583748-194e84cf7389e34d110846517&q=${city} city&image_type=photo&pretty=true&min_width=1440&min_height=512`;

        $.ajax({
            url: cityPhotoURL,
            method: "GET"
        }).then(function (response) {
            var randNum = Math.floor(Math.random() * response.hits.length);
            $("#background-img").attr("src", response.hits[randNum].largeImageURL);
            $("#background-img").attr("alt", city);
        });
    }

    function mode() {
        var unit = $(".form-select").val();
        if (unit === "metric") {
            tempSymbol = "°C";
            speedUnit = "m/s";
        } else if (unit === "imperial") {
            tempSymbol = "°F";
            speedUnit = "mi/h";
        } else {
            tempSymbol = "K";
            speedUnit = "m/s";
        }
        return unit;
    }

    function updateWeatherInfo(city) {
        var unit = mode();
        var weatherQueryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=5dc02834735d933b05d5b154458369e8`;

        $.ajax({
            url: weatherQueryURL,
            method: "GET"
        }).then(function (response) {
            var lat = response.coord.lat;
            var lon = response.coord.lon;
            var uvIndexQueryURL = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=5dc02834735d933b05d5b154458369e8`;

            $("#city-name").text(response.name);
            $("#weather-icon").attr("src", `https://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`);
            $("#weather-icon").attr("alt", `${response.weather[0].description}`);
            $("#weather-description").text(response.weather[0].description);

            $("#temp").text(response.main.temp.toFixed(1) + tempSymbol);
            $("#humidity").text(response.main.humidity + "%");
            $("#wind-speed").text(response.wind.speed + " " + speedUnit);

            $.ajax({
                url: uvIndexQueryURL,
                method: "GET"
            }).then(function (response) {
                $("#uv-index").text(response.value);
                if (response.value <= 2.99) {
                    $("#uv-index").css("color", "green");
                } else if (response.value >= 3 && response.value <= 5.99) {
                    $("#uv-index").css("color", "yellow");
                } else if (response.value >= 6 && response.value <= 7.99) {
                    $("#uv-index").css("color", "orange");
                } else if (response.value >= 8 && response.value <= 10.99) {
                    $("#uv-index").css("color", "red");
                } else {
                    $("#uv-index").css("color", "purple");
                }
            });

            hourlyForecast(lat, lon);

            dailyForcast(lat, lon);
        });
    }

    function hourlyForecast(lat, lon) {
        var unit = mode();
        var hourlyForecastQueryURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${unit}&appid=5dc02834735d933b05d5b154458369e8`;

        $.ajax({
            url: hourlyForecastQueryURL,
            method: "GET"
        }).then(function (response) {
            var DateTime = luxon.DateTime;
            var currTimeData = DateTime.local().setZone(`${response.timezone}`);
            var currTime = currTimeData.c.hour;

            $("#date").text(currTimeData.c.year + "-" + currTimeData.c.month + "-" + currTimeData.c.day);

            $(".time").each(function () {
                currTime++;
                if (currTime < 12) {
                    $(this).text(`${currTime}AM`);
                } else {
                    currTimePM = currTime - 12;
                    if (currTimePM === 0) {
                        $(this).text("12PM");
                    } else if (currTimePM === 12) {
                        $(this).text("12AM");
                    } else {
                        $(this).text(`${currTimePM}PM`);
                    }
                }
                if (currTime > 23) {
                    currTime = 0;
                }
            });

            $(".hourly-icon").each(function (index) {
                $(this).attr("src", `https://openweathermap.org/img/wn/${response.hourly[index + 1].weather[0].icon}@2x.png`);
                $(this).attr("alt", response.hourly[index + 1].weather[0].description);
            });

            $(".hourly-temp").each(function (index) {
                var hourlyTemp = response.hourly[index + 1].temp;
                $(this).text(hourlyTemp.toFixed(1) + tempSymbol);
            });
        });
    }

    function dailyForcast(lat, lon) {
        var unit = mode();
        var dailyForecastQueryURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${unit}&appid=5dc02834735d933b05d5b154458369e8`;

        $.ajax({
            url: dailyForecastQueryURL,
            method: "GET"
        }).then(function (response) {
            $(".day").each(function (index) {
                var nextDay = moment().add(index + 1, 'days').format().substring(0, 10);
                $(this).text(nextDay);
            });

            $(".daily-icon").each(function (index) {
                $(this).attr("src", `https://openweathermap.org/img/wn/${response.daily[index + 1].weather[0].icon}@2x.png`);
                $(this).attr("alt", response.daily[index + 1].weather[0].description);
            });

            $(".daily-description").each(function (index) {
                $(this).text(response.daily[index + 1].weather[0].description);
            });

            $(".daily-temp-range").each(function (index) {
                $(this).text(response.daily[index + 1].temp.min.toFixed(1) + tempSymbol + " - " + response.daily[index + 1].temp.max.toFixed(1) + tempSymbol);
            });
        });
    }

    function saveDashboard() {
        var state = $(".star").attr("data-state");
        var city = $("#city-name").text();
        var inArr = $.inArray(city, list);

        if (state === "unsave") {
            var savedIcon = $(".star").attr("data-saved");

            $(".star").attr("class", savedIcon);
            $(".star").attr("data-state", "saved");

            if (localStorage.getItem("tagged") === null) {
                list = [city];
            } else {
                if (inArr === -1 || list.length === 0) {
                    list.push(city);
                }
            }
        } else {
            var unsaveIcon = $(".star").attr("data-unsave");

            $(".star").attr("class", unsaveIcon);
            $(".star").attr("data-state", "unsave");

            if (inArr !== -1) {
                var index = jQuery.inArray(city, list);
                list.splice(index, 1);
            }
        }

        localStorage.setItem("tagged", JSON.stringify(list));
    }

    function displayTaggedCity() {
        $(".dropdown-menu").contents().remove();
        var arr = JSON.parse(localStorage.getItem("tagged"));

        $.each(arr, function () {
            var newList = $(`<li><a class="dropdown-item" href="#">${this}</a></li>`);
            $(".dropdown-menu").prepend(newList);
        });
    }

    function isTag() {
        if (localStorage.getItem("tagged") !== null) {
            var cityTitle = $("#city-name").text();
            var inArr = $.inArray(cityTitle, list);
            if (inArr === -1) {
                var unsaveIcon = $(".star").attr("data-unsave");

                $(".star").attr("class", unsaveIcon);
                $(".star").attr("data-state", "unsave");
            } else {
                var savedIcon = $(".star").attr("data-saved");

                $(".star").attr("class", savedIcon);
                $(".star").attr("data-state", "saved");
            }
        }
    }

});