'use strict';

angular.module('marketviewApp')
  .controller('MainCtrl', function ($scope, $http, socket, $filter) {

    $scope.format = {};
    $scope.percent = {
                        series: {
                          compare: 'percent'
                        }
                     };

    $scope.toggleFormat = function() {
      $scope.format = ($scope.format === $scope.percent ? {} : $scope.percent);
      $scope.refreshChart();
    };

    $scope.yearAgo = function() {
        var day = new Date();
        return ""+(day.getFullYear()-1)+'-'+(day.getMonth()<9? '0':'')+(day.getMonth()+1)+'-'+(day.getDate()<9? '0':'')+day.getDate();
    };

    $scope.processStocks = function(dbdata) {
        $scope.stocks = dbdata;
        for (var j=0;j<dbdata.length; j++) {
            for (var i=0; i< dbdata[j].data.length; i++ ) {
                 $scope.stocks[j].data[i][0] = Date.parse(dbdata[j].data[i][0]);
            } 
        }
        socket.syncUpdates("stock", $scope.stocks, function(b, c, d) {
            setTimeout(function() {
                $scope.refreshChart();
            }, 500);
        });
        $scope.refreshChart();
    };

    $scope.addStock = function() {
      if ($scope.newStock !== "") {

          $(".btn").prop("disabled", true); 
          $(".form-control").prop("disabled", true); 
 
          $scope.newStock = $scope.newStock.toUpperCase();
          $http.get("https://www.quandl.com/api/v3/datasets/WIKI/" + $scope.newStock + ".json" +
                    "?order=asc&exclude_headers=true&trim_start=" + $scope.yearAgo() + 
                    "&column_index=4&auth_token=p5yEmuXHuJ2SB7cXjLHw")
              .then(function(resp) {
                 var stockData = {
                      name: $scope.newStock,
                      data: resp.data.dataset.data.map(function(item) {
                         return [$filter("date")(item[0], "longDate"), item[1]]
                      })
                 };

                 $http.post("/api/stocks", stockData)
                    .success(function() {

                        $(".btn").prop("disabled", false);
                        $(".form-control").prop("disabled", false);

                        $scope.newStock = "";
                        $http.get("/api/stocks/").success($scope.processStocks)
                    });
                }
                , function(err) {
                    $(".btn").prop("disabled", false);
                    $(".form-control").prop("disabled", false);

                    alert('Code '+$scope.newStock+': '+err.statusText);
                    $scope.newStock = "";
                });
      } 
    };

    $scope.deleteStock = function(stock) {
      $http.delete('/api/stocks/' + stock._id)
            .success(function() {
                $http.get("/api/stocks/")
                    .success(function(resp) {
                        $scope.stocks = resp, 
                        socket.syncUpdates("stock", $scope.stocks, function(b, c, d) {
                            $scope.refreshChart();
                        }); 
                        $scope.refreshChart();
                    })
            })
    };

    $scope.refreshChart = function() {
        $("#chart").highcharts('StockChart', {
 
               rangeSelector: {
                    selected: 1
                },

                legend: {
                   enabled: true
                },

                plotOptions: $scope.format,

                tooltip: {
                    pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                    valueDecimals: 2
                },

                series: $scope.stocks
            });
      };

    $http.get("/api/stocks/").success($scope.processStocks);

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('stock');
    });
  });
