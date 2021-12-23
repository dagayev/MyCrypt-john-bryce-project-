/// <reference path="jquery-3.4.1.js" />
"use strict";

$(() => {
    const onPageLoad = new pageObj();
    onPageLoad.startApp();
    // Spinner - for loading
    const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2" style="color: #4c9db6"></i>');
    spinner.insertAfter($('#searchBtn'));
});

function pageObj() {
    this.reportsCoinsObj = {}; // Declaration for reportsPage (chart)
    this.startApp = () => {
        const openPage = this.openPage;

        // Gets coins from API
        this.getAllCoins("https://api.coingecko.com/api/v3/coins/list", allCoins => {
            this.allCoinsArr = allCoins.slice(0, 200);
            openPage('homePage', this.allCoinsArr);
        });

        // BackToTop btn
        $(window).scroll(() => {
            if ($(window).scrollTop() > 300) {
                $('#bTop').removeProp('hidden');
            } else {
                $('#bTop').prop('hidden', true);
            }
        });

        $('#bTop').on('click', function (e) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: 0 }, '300');
        });

        // Search
        $('#searchInput').focus(() => {
            $(window).keyup((event) => { // Treats 'enter' keyboard 
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $("#searchBtn").click();
                }
                if (event.keyCode === 27) { // Treats 'esc' keyboard 
                    event.preventDefault();
                    $("#searchInput").val('');
                    openPage('homePage', this.allCoinsArr);
                }
            });

            this.search = () => {
                const searchCoin = $("#searchInput").val().toLowerCase();
                //  Filters allCoinsArr - search if it includes inputValue
                if (searchCoin) {
                    const liveResults = this.allCoinsArr.filter(y => { return y.symbol.toLowerCase().includes(searchCoin) });
                    openPage('homePage', liveResults);
                } else {
                    $('#searchInput').blur().focus();
                    openPage('homePage', this.allCoinsArr);
                }
            }

            $('#searchBtn').click(() => {
                this.search();
            });

            $('#searchInput').mouseup(() => {
                $("#searchInput").val('');
                openPage('homePage', this.allCoinsArr);
            });

            $('#searchInput').keyup(() => {
                this.search();
            });
        });
    }

    $('#homeBtm').click(() => {
        // Spinner - for loading
        const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2" style="color: #4c9db6"></i>');
        spinner.insertAfter($('#searchBtn'));
    });

    this.displayHomeHtml = (allCoins) => {
        this.selectedCoinsArr = [];
        // Maps all coins from API; creates a card for each coin and appends each card in html
        const homePageStr = allCoins.map(({ id, name, symbol }) => {
            return (`
            <div class="card border-info mx-1 my-2" id="coinCard${id}" name="coinCard${id}" style="width: 16rem;">
                <div class="card-body text-info">
                    <div class="row input-group">
                        <div class="pl-3">
                            <h5 class="card-title"><b>${symbol}</b></h5>
                        </div>
                        <div class="pr-2">
                            <label class="switch" id="switchSlider${id}">
                                <input type="checkbox" class="switchInfo info" data-toggle="toggle" data-switch-id="${id}" id="switch${symbol}">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <p class="card-title">${name}</p>
                    <div class="form-group" id="collapseGroup">
                        <p>
                            <button type="button" data-parent="#collapseGroup" class="btn btn-info mr-2 form-control-costum col-md-6" id="${id}" data-toggle="collapse" data-target="#collapseMoreInfo${id}" aria-expanded="false" aria-controls="collapseMoreInfo${id}">More Info</button>   
                        </p>
                        <div class="collapse" id="collapseMoreInfo${id}" style="font-size:small;">
                            <div class="coinCollapseInfo" id="coinMoreInfo${id}"></div>
                        </div>
                    </div>
                </div>
            </div>
            `)
        });

        const domNodes = $('<div class="row"/>').append(homePageStr);
        // Once appended, removes spinner
        $('#searchBtn').next('i').remove();
        this.coinCardEvents(domNodes);
        this.onLoadSelectedCoins(domNodes);

        return domNodes;
    }

    // Gets selectedCoins from localStorage
    this.onLoadSelectedCoins = (domNodes) => {
        if (localStorage.getItem("selectedCoinsArr") == null) {
            localStorage.clear();
        } else {
            this.selectedCoinsArr = JSON.parse(localStorage.getItem("selectedCoinsArr"));
            let found = this.selectedCoinsArr.map(x => this.allCoinsArr.find(y => { return y.symbol == x })); // Finds selected coins amongst allCoinsArr
            found.length && found.forEach(f => domNodes.find(`#switch${f.symbol}`).prop('checked', 'checked')); // Ensures selected coins' switches are checked 
        }
    }

    this.spliceSelectedCoinsArr = (itemSymbol) => {
        if (this.selectedCoinsArr.includes(itemSymbol)) {
            this.selectedCoinsArr.splice(this.selectedCoinsArr.indexOf(itemSymbol), 1);
            localStorage.removeItem(this.selectedCoinsArr);
            localStorage.setItem("selectedCoinsArr", JSON.stringify(this.selectedCoinsArr));
        }
    }

    this.addToSelectedCoinsArr = (itemSymbol) => {
        if (!this.selectedCoinsArr.includes(itemSymbol)) {
            this.selectedCoinsArr.push(itemSymbol);
            localStorage.removeItem(this.selectedCoinsArr);
            localStorage.setItem("selectedCoinsArr", JSON.stringify(this.selectedCoinsArr));
        }
    }

    this.coinCardEvents = (domNodes) => {
        // Manages coins' switches 
        domNodes.find('.switchInfo').on('change', (e) => {
            const element = $(e.currentTarget);
            const isChecked = element.prop('checked');
            const itemId = element.data('switchId');
            const found = this.allCoinsArr.find(value => itemId == value.id); // Extracts coin's symbol from allCoinsArr
            const itemSymbol = found.symbol;

            if (this.selectedCoinsArr.length < 5 || !isChecked) {
                isChecked ? this.addToSelectedCoinsArr(itemSymbol) : this.spliceSelectedCoinsArr(itemSymbol);
            } else {
                element.prop('checked', false); // Prevents selection of more than 5 coins
                alert('Please select no more than 5 coins');
            }
            if (this.selectedCoinsArr.length == 5) {
                this.addUserCoinToModal(this.selectedCoinsArr); // Collects all 5 selected coins and opens modal
                $("#selectedCoins").modal('show');
            }
            return itemId, this.selectedCoinsArr;
        });

        // Manages coin's moreInfo button
        domNodes.find('.btn').on('click', (e) => {
            const infoBtn = $(e.currentTarget);
            const itemId = infoBtn.attr('id');

            this.getCoinData(`https://api.coingecko.com/api/v3/coins/${itemId}`, selectedCoin => this.displayMoreInfo(selectedCoin));

            // Spinner - for loading
            const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2"></i>');
            spinner.insertAfter(infoBtn);
            // Changes btn text 'More' to 'Less'
            infoBtn.text(function (i, v) {
                return v === "More Info" ? "Less Info" : "More Info";
            });
        });
    }

    this.displayMoreInfo = (itemId) => {
        $(`#coinMoreInfo${itemId.id}`).empty();
        $('.btn').next('i').remove();

        const coinMoreInfo = `
        <div class="row">
            <div class="col-md-7 col-sm-7 pl-4">
                <p>
                    <b>Price: </b><br>
                    $ ${itemId.market_data.current_price.usd}<br>
                    € ${itemId.market_data.current_price.eur}<br>
                    ₪ ${itemId.market_data.current_price.ils}<br>
                </p>
            </div>
            <div class="col-md-5 col-sm-5">
                <p> 
                    <img src="${itemId.image.large}" class="rounded d-block cardImg" >
                </p>
            </div>
        </div> 
        `;
        $(`#coinMoreInfo${itemId.id}`).append(coinMoreInfo);
    }

    this.addUserCoinToModal = (userSelectedCoins) => {
        $('.showCoins').empty();

        const coinElm = userSelectedCoins.map((itemSymbol) => {
            return (`
            <div class="input-group">
                <div class="pl-3 my-2">
                    <h5 class="ml-3">${itemSymbol}</h5>
                </div>
                <div class="pr-2 my-2">
                    <label class="switch" id="switchSlider${itemSymbol}">
                        <input type="checkbox" checked class="switchInfo info modalSwitch" data-toggle="toggle" id="${itemSymbol}">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>`);
        });

        const domModal = $('<div />').append(coinElm);
        $('.showCoins').append(domModal);
        this.modalEvents(domModal);
        return domModal;
    }

    this.modalEvents = (domModal) => {
        domModal.find('.switchInfo').on('change', (e) => {
            const modalElm = $(e.currentTarget);
            const elmId = modalElm.attr('id');
            const isChecked = modalElm.prop('checked');

            $(`#switch${elmId}`).prop('checked', isChecked); // Correlates modal's switch to card's switch (in background)

            if (!isChecked) {
                this.spliceSelectedCoinsArr(elmId);
                $(`#switch${elmId}`).prop('checked', false);
                if (this.selectedCoinsArr.length == 0) {
                    $(document).find("#selectedCoins").modal('hide'); // Closes modal if no coin has been selected
                }
            } else {
                this.addToSelectedCoinsArr(elmId);
            }
        });

        $('#toReports').click(() => {
            const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2" style="color: #4c9db6"></i>');
            spinner.insertAfter($('#searchBtn'));
            this.openReportsPage();
        })
    }

    $('#reportBtn').click(() => {
        // Spinner - for loading
        const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2" style="color: #4c9db6"></i>');
        spinner.insertAfter($('#searchBtn'));
        this.openReportsPage();
    });

    this.openReportsPage = () => {
        // NavBar
        $("#homeBtm").removeClass("nav nav-link active").addClass("nav-link");
        $("#aboutBtn").removeClass("nav nav-link active").addClass("nav-link");
        $("#reportBtn").toggleClass("nav-link nav-link active");


        if (this.selectedCoinsArr.length < 1) {
            // In the event of no coin has been selected
            const noCoinsReport = `
                <div>
                    <p class="pageInfo m-5 p-5"><b>No coins were selected!</b> <br><br>
                    Please return to home page and select up to 5 coins
                </div>`;

            $(`#pageMainDiv`).empty().append(noCoinsReport);
            // Once appended, removes spinner
            $('#searchBtn').next('i').remove();
        } else {
            const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2" style="color: #4c9db6"></i>');
            spinner.insertAfter($('#searchBtn'));

            this.openPage('reportsPage');
        }
    }
    // -----------------------------------------------------------------------------------------------------------------
    // ReportsPage: CHARTS

    this.createChart = () => {
        $("#selectedCoins").modal('hide');

        const chartTitle = this.selectedCoinsArr.join(", "); // Edits selectedCoinsArr for chart title
        let data = [];  // Declares a new arr to store data from API

        for (let coinSymbol in this.reportsCoinsObj) { // Defines chart data for each coin
            if (Object.prototype.hasOwnProperty.call(this.reportsCoinsObj, coinSymbol)) {
                data.push({
                    type: "spline",
                    xValueType: "dateTime",
                    yValueFormatString: "$ ####.##",
                    xValueFormatString: "hh:mm:ss",
                    name: coinSymbol,
                    showInLegend: true,
                    dataPoints: this.reportsCoinsObj[coinSymbol]
                })
            }
        }

        this.chart = new CanvasJS.Chart("chartContainer", {
            animationEnabled: true,
            title: {
                text: chartTitle + " in USD",
            },
            axisX: {
                title: "Time",
                fontSize: 22,
            },
            axisY: {
                prefix: "$",
                includeZero: true,
                viewportMinimum: -0.3,
                viewportMaximum: 3,
                interval: 0.3
            },
            toolTip: {
                shared: true
            },
            legend: {
                fontSize: 18,
            },
            data,
        });
        // Once chart is ready - removes spinner
        $('#searchBtn').next('i').remove();

        return this.chart;
    }

    this.displayReportsHtml = () => {
        const userSelectedCoins = this.selectedCoinsArr.join(',').toLocaleUpperCase(); // Turns arr to str - extract data from API 

        this.getReportsData(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${userSelectedCoins}&tsyms=USD`, data => {
            for (let coinSymbol in data) {
                if (Object.hasOwnProperty.call(data, coinSymbol)) { // Creates an Obj of data (for each coin)
                    let price = { x: new Date(), y: data[coinSymbol].USD }; // Canvasjs DataPoints as an obj 
                    !this.reportsCoinsObj[coinSymbol] ? this.reportsCoinsObj[coinSymbol] = [price] : this.reportsCoinsObj[coinSymbol].push(price);
                    if (this.reportsCoinsObj[coinSymbol].length > 10) { // Limits axisX display to 10 points
                        this.reportsCoinsObj[coinSymbol].shift();
                    }
                }
            }
            !this.chart ? this.createChart() : this.chart.render(); // If there's no chart(first time) - create a chart, else, render current chart
        });

        if (!this.reportsInterval) { // Updates chart every 2sec
            this.reportsInterval = setInterval(() => {
                this.displayReportsHtml();
            }, 2000);
        }

        $('#searchBtn').next('i').remove();
    }

    // -----------------------------------------------------------------------------------------------------------------
    // AboutPage

    $("#aboutBtn").click(() => {
        this.openPage('aboutPage');
    });

    this.displayAboutHtml = () => {
        // NavBar
        $("#homeBtm").removeClass("nav nav-link active").addClass("nav-link");
        $("#reportBtn").removeClass("nav nav-link active").addClass("nav-link");
        $("#aboutBtn").toggleClass("nav-link nav-link active");

        // this.destroyChart();

        const spinner = $('<i class="fa fa-spinner fa-spin my-2 mx-2" style="color: #4c9db6"></i>');
        spinner.insertAfter($('#searchBtn'));

        const pageInfo = `
            <p class="pageInfo"><img src="img/awesomo.gif" alt="miniMe" id="myImg" align="middle">This project has been submitted as part of of a Full Stack Developer programme.<br>
            <i style="color: #ef8440">All About Cryptocurrency</i> supports a Single Page Application (SPA) which contains a single HTML page.
            The website's data is stored in a database (server-side); Javascript runs in client-side, containing Ajax requests to <i>coingecko</i> <a href="https://api.coingecko.com/api/v3/coins/list/" target="_blank">API</a> (https://api.coingecko.com/api/v3/coins/list/).
            All website's content is built and injected into index.html via Javascript<br>
            <i style="color: #ef8440">All About Cryptocurrency</i>'s objective is to present an up-to-date information about Cryptocurrencies. Data includes Cryptocurrency's: Name, Symbol, Image, and Current Price (in USD, EUR, and ILS).<br><br>
            The API's data was first mapped using available <i>JSON Editor Online</i> to identify the ways in which the data has been stored (i.e. Array and/or Object).<br>
            Once the API was mapped, its data has been stored locally (client-side) in order to accelerate page loading. Yet, since market data changes frequently, storing has been limitted to a timeframe of two minutes in order to invoke a new contact to the API server to insure an up-to-date data retrieved.</p><br><br>
            <ol class="pageInfo" ><i style="color: #ef8440"><b>All About Cryptocurrency</i>'s Webpage contains three tabs:</b>
                <li style="margin-left: 35px; margin-top:5px;"> <u>Home</u> - includes all cryptocurrencies retrieved from <i>coingecko</i> API server allowing users to select up to 5 cryptocurrencies for Live Reports (chart in Live Reoprts section).</li>
                <li style="margin-left: 35px; margin-top:5px;"> <u>Live Reports</u> - presents a chart with multiple axes for all 5 selected cryptocurrencies, using jQuery's canvas.js.</li>
                <li style="margin-left: 35px; margin-top:5px;"> <u>About</u> - includes <i style="color: #ef8440">All About Cryptocurrency</i>'s objectives and specification.</li>
            </ol>
            <p class="pageInfo"><i style="color: #ef8440">All About Cryptocurrency</i> allows users to select up to 5 cryptocurrencies; to that end, each selected coin has been "pushed" into an assigned array that corresponds with the selected coins' 'switch' inputs so that the user will have an immediate indication as to which and how many cryptocurrencies has been chosen.<br><br>
            Apart from the transition between the three tabs, the navigation bar allows users to search for a specific cryptocurrency. The search has been design in accordance with the prject's specification, that is, a search for a cryptocurrency's Symbol rather than it's ID or Name. Upon typing in search input, the presentation of the cryptocurrencies is reduced to match user's request.</p>
            
        `;
        $(`#pageMainDiv`).append(pageInfo);
        $('#searchBtn').next('i').remove();
    }
    aboutBtn

    this.htmls = {
        homePage: this.displayHomeHtml,
        reportsPage: this.displayReportsHtml,
        aboutPage: this.displayAboutHtml,
    }

    // aJax calls
    this.getAllCoins = (url, callBack) => {
        $.ajax({
            method: "GET",
            url: url,
            success: response => callBack(response),
            error: err => alert("Error: " + err.message),
        });
    }

    this.getCoinData = (url, callBack) => {
        $.ajax({
            method: "GET",
            url: url,
            success: response => callBack(response),
            error: err => alert("Error: " + err.message),
        });
    }

    this.getReportsData = (url, callBack) => {
        $.ajax({
            method: "GET",
            url: url,
            success: response => callBack(response),
            error: err => alert("Error: " + err.message),
        })
    }
    // openPage
    this.openPage = (page, coinsData) => {
        $("#pageMainDiv").empty();
        $("#pageMainDiv").append(this.htmls[page](coinsData));
    }
}