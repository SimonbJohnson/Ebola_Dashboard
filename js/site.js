function generateLineChart(){
    var margin = {top: 20, right: 20, bottom: 25, left: 55},
        width = $("#line_total").width() - margin.left - margin.right,
        height = $("#line_total").height() - margin.top - margin.bottom;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
            .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .x(function(d) { 
            return x(d.key);
        })
        .y(function(d) { return y(d.value); });


    var svg = d3.select("#line_total").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          
    x.domain(d3.extent(cases['Total'], function(d) { 
        return d.key; }));
    y.domain([0,d3.max(cases['Total'], function(d) { return d.value; })]);

    svg.append("g")
        .attr("class", "xaxis axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "yaxis axis")
        .call(yAxis);

    var g = svg.append("g");
        
    g.append("text")
        .attr("x", 40)
        .attr("y", 0)
        .attr("dy", ".71em")
        .text("Cases");

    g.append("rect")
        .attr("x", 25)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill","steelblue");

    g.append("text")
        .attr("x", 40)
        .attr("y", 20)
        .attr("dy", ".71em")
        .text("Deaths");

    g.append("rect")
        .attr("x", 25)
        .attr("y", 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill","red");

    svg.append("path")
        .datum(cases['Total'])
        .attr("class", "line")
        .attr("d", line)
        .attr("fill","none")
        .attr("stroke","steelblue")
        .attr("stroke-width","2px");

    svg.append("path")
        .datum(deaths['Total'])
        .attr("class", "line2")
        .attr("d", line)
        .attr("fill","none")
        .attr("stroke","red")
        .attr("stroke-width","2px");
}

function generateKeyStats(id,keystats,cases,deaths){
    
    var html = '<div class="col-xs-6">';
    html = html + '<p  class="stat_title">Cases</p><p class="stat">'+formatComma(cases[cases.length-1]["value"]) + '<p>';
    html = html + '<p class="stat_title">Population</p><p class="stat">'+keystats["population"] + '<p>';   
    html = html + '</div><div class="col-xs-6">';
    html = html + '<p  class="stat_title">Deaths</p><p class="stat">'+formatComma(deaths[deaths.length-1]["value"]) + '<p>';
    html = html + '<p  class="stat_title">Crude Mortality Rate</p><p class="stat">'+Math.round(deaths[deaths.length-1]["value"]/cases[cases.length-1]["value"]*100) + '%<p>';
    html=html+'</div>';
    $(id).html(html);
}

function generateMap(){
    var color = ["#ffffff","#ffe082","#ffbd13","#ff8053","#ff493d"];
    
    byWeek.filterAll();
    byCountry.filterAll();
    byRegion.filterAll();
    byRegionName.filterAll();
        
    byWeek.filter(function(d){
        return $.inArray(d.valueOf(), lastWeeks) > -1;
    });    
 
    var margin = {top: 10, right: 210, bottom: 10, left: 10},
    width = $('#map').width() - margin.left - margin.right,
    height = 325;
   
    var projection = d3.geo.mercator()
        .center([-3,5])
        .scale(1800);

    var tooltip = d3.select("#map").append("tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
        
    var svg = d3.select('#map').append("svg")
        .attr("width", width+margin.left+margin.right)
        .attr("height", height);

    var path = d3.geo.path()
        .projection(projection);

    var g = svg.append("g");    

    g.selectAll("path")
        .data(regions.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke",'#aaaaaa')
        .attr("stroke-width","0px")
        .attr("fill",'#ffffff')
        .attr("id",function(d){return d.properties.PCODEUSE;})
        .attr("class","region")
        .on("mouseover",function(d){
            d3.select(this).attr("stroke-width",7);
            d3.select(this).attr("stroke","steelblue");
            transitionLineChart(d.properties.PCODEUSE,true);
            transitionTitles(d.properties.NAMEUSE,true);
        })
        .on("mouseout",function(d){
            d3.select(this).attr("stroke","#aaaaaa");
            transitionLineChart(currentFilter,false);
            transitionTitles(currentFilter,false);
            if(currentFilter=="Total"){
                d3.select(this).attr("stroke-width",0);
            } else {
                d3.select(this).attr("stroke-width",1);
            }
        })        
        .append("svg:title")
        .text(function(d) { return d.properties.NAMEUSE; });   
    sumNewConfirmedCasesByRegion.all().forEach(function(e) {  
    if(e.value==0){
                d3.select("#"+e.key).attr("fill",color[0]);
            } else if(e.value<10){
                d3.select("#"+e.key).attr("fill",color[1]);
            } else if(e.value<25){
                d3.select("#"+e.key).attr("fill",color[2]);
            } else if(e.value<50){
                d3.select("#"+e.key).attr("fill",color[3]);
            } else {
                d3.select("#"+e.key).attr("fill",color[4]);
            }            
    });
    
    var g = svg.append("g");
    
    g.selectAll("path")
        .data(westafrica.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke",'#aaaaaa')
        .attr("fill",'none')
        .attr("class","country");    

    var mapLabels = svg.append("g");    

    mapLabels.selectAll('text')
      .data(westafrica.features)
         .enter()
         .append("text")
         .attr("x", function(d,i){
                     return path.centroid(d)[0]-20;})
         .attr("y", function(d,i){
                     return path.centroid(d)[1];})
         .attr("dy", ".55em")
         .attr("class","maplabel")
         .style("font-size","12px")
         .attr("opacity",0.4)
         .text(function(d,i){
                      return d.properties.NAME;
                  });
                  
    var g = svg.append("g"); 
    
    g.selectAll("circles").data(medicalCentres)
        .enter()
        .append("circle")
        .attr('cx',function(d){
            var point = projection([ d.Longitude, d.Latitude ]);
            return point[0];
         })
        .attr('cy',function(d){
            var point = projection([ d.Longitude, d.Latitude ]);
            return point[1];
         })
        .attr("r", 4)
        .attr("class","medical_centres")
        .attr("fill", "steelblue")
        .attr("opacity",0.5)
        .on('mouseover', function (d) {
            var xPos = parseFloat(d3.select(this).attr('cx'));
            var yPos = parseFloat(d3.select(this).attr('cy'));

            tooltip     
                .style("opacity", .9) 
                .style("left", xPos + 30)     
                .style("top", yPos);
            tooltip.html(tooltipText(d.Name, d.Country, d.Town, d.Organisation));
        })
        .on('mouseout', function () {
            tooltip
                .style("left", -50)     
                .style("top", -50)
                .style("opacity", 0); 
        });
    
    var legendx=450;
    var legendy=20;
        
    var g = svg.append("g");
    
    g.append("rect")
        .attr("x", legendx-10)
        .attr("y", 0)
        .attr("width", 500)
        .attr("height", height)
        .attr("fill","#ffffff");    
    
    g.append("rect")
        .attr("x", 0+legendx)
        .attr("y", 20+legendy)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill",color[0])
        .attr("stroke","#000000")
        .attr("stroke-width",1);

    g.append("text")
        .attr("x",15+legendx)
        .attr("y",28+legendy)
        .text("No cases")
        .attr("font-size","10px");    
        
    g.append("rect")
        .attr("x", 0+legendx)
        .attr("y", 40+legendy)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill",color[1]);

    g.append("text")
        .attr("x",15+legendx)
        .attr("y",48+legendy)
        .text("1 to 9 cases in the last 2 weeks")
        .attr("font-size","10px");

    g.append("rect")
        .attr("x", 0+legendx)
        .attr("y", 60+legendy)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill",color[2]);

    g.append("text")
        .attr("x",15+legendx)
        .attr("y",68+legendy)
        .text("10 to 24 cases in the last 2 weeks")
        .attr("font-size","10px");

    g.append("rect")
        .attr("x", 0+legendx)
        .attr("y", 80+legendy)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill",color[3]);

    g.append("text")
        .attr("x",15+legendx)
        .attr("y",88+legendy)
        .text("25 to 49 cases in the last 2 weeks")
        .attr("font-size","10px");

    g.append("rect")
        .attr("x", 0+legendx)
        .attr("y", 100+legendy)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill",color[4]);

    g.append("text")
        .attr("x",15+legendx)
        .attr("y",108+legendy)
        .text("50+ cases in the last 2 weeks")
        .attr("font-size","10px");

    g.append("circle")
        .attr("cx",5+legendx)
        .attr("cy",125+legendy)
        .attr("r",5)
        .attr("fill","steelblue");

    g.append("text")
        .attr("x",15+legendx)
        .attr("y",128+legendy)
        .text("Ebola Treatment Centre")
        .attr("font-size","10px");        
        
}

function tooltipText(name, country, town, organisation) {
    text = "";
    if (name !== "")
        text += "Name: " + name + "<br/>";
    if (country !== "")
        text += "Country: " + country + "<br/>";
    if (town !== "")
        text += "Town: " + town + "<br/>";
    if (organisation !== "")
        text += "Organisation: " + organisation + "<br/>";
    return text;
}

function transitionLineChart(filter,region){

    if(region){
        byWeek.filterAll();
        byCountry.filterAll();
        byRegion.filterAll();
        byRegionName.filterAll();
        
        byRegion.filter(filter);
        console.log(byWeek.top(Infinity));
        var casesdata = totalCasesByDate.all();
        var deathsdata = totalDeathsByDate.all();
        console.log(casesdata);
    } else {
        var casesdata = cases[filter];
        var deathsdata = deaths[filter];       
    }

    var margin = {top: 20, right: 20, bottom: 25, left: 55},
        width = $("#line_total").width() - margin.left - margin.right,
        height = $("#line_total").height() - margin.top - margin.bottom;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
            .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .x(function(d) { return x(d.key); })
        .y(function(d) { return y(d.value); });
  
    x.domain(d3.extent(casesdata,function(d) { return d.key; }));
    y.domain([0,d3.max(casesdata, function(d) { return d.value; })]);

    d3.selectAll(".line")
        .datum(casesdata)
        .transition().duration(duration)
        .attr("d", line);
        
    d3.selectAll(".line2")
        .datum(deathsdata)
        .transition().duration(duration)
        .attr("d", line);    
           
    d3.selectAll(".yaxis")
        .transition().duration(duration)
        .call(yAxis);

    d3.selectAll(".xaxis")
        .transition().duration(duration)
        .call(xAxis);
}


function transitionTitles(filter,region){
    var title = filter;
    if(filter==="Total"){title = "Guinea, Liberia and Sierra Leone";}
    if(!region){$("#key_stats_title").html("Key Stats for " + title);}
    $("#cul_tot_title").html("Cumulative Total for " + title);
}

function transitionMap(filter){
    if(filter==="Total"){
        var projection = d3.geo.mercator()
            .center([-3,5])
            .scale(1800);
        var width = "0";
    }
    else {
        var width = "1";
    }
    if(filter==="Sierra Leone"){
        var projection = d3.geo.mercator()
            .center([-9,7.7])
            .scale(6000);
    }
    if(filter==="Guinea"){
        var projection = d3.geo.mercator()
            .center([-6.5,8.3])
            .scale(3200);
    }    
    if(filter==="Liberia"){
        var projection = d3.geo.mercator()
            .center([-6,5])
            .scale(4000);
    }
    
    var path = d3.geo.path()
        .projection(projection);    
    
    d3.selectAll('.country').transition().duration(duration)
            .attr('d', path).attr("stroke-width",width*3+1+"px");
    
    d3.selectAll('.region').transition().duration(duration)
            .attr('d', path).attr("stroke-width",width+"px");    
    
    d3.selectAll('.maplabel').transition().duration(duration)
        .attr("x", function(d,i){
                     return path.centroid(d)[0]-20;})
        .attr("y", function(d,i){
                     return path.centroid(d)[1];});    

    d3.selectAll(".medical_centres")
        .data(medicalCentres)
        .transition().duration(duration)
        .attr('cx',function(d){
                var point = projection([ d.Longitude, d.Latitude ]);
                return point[0];
         })
        .attr('cy',function(d){
                var point = projection([ d.Longitude, d.Latitude ]);
                return point[1];
         });
}

function transition(filter){
    transitionLineChart(filter,false);
    generateKeyStats("#key_stats",keyStats[filter],cases[filter],deaths[filter]);
    generateBarChart(filter);    
    transitionTitles(filter,false);
    transitionMap(filter);
}

function generateBarChart(filter){
    $("#bar_chart").html("");
    if(filter=="Total"){
        byWeek.filterAll();
        byCountry.filterAll();
        byRegion.filterAll();
        byRegionName.filterAll();
        byWeek.filter(function(d){
          return $.inArray(d.valueOf(), lastWeeks) > -1;
        });             
        var data=sumNewConfirmedCasesByCountry.all();        
    } else {
        byWeek.filterAll();
        byCountry.filterAll();
        byRegion.filterAll();
        byRegionName.filterAll();
        
        byCountry.filter(filter);
        byWeek.filter(function(d){
          return $.inArray(d.valueOf(), lastWeeks) > -1;
        });        

        var datatemp=sumNewConfirmedCasesByRegionName.all();
        var data =[];
        for(var i = datatemp.length - 1; i >= 0; i--) {
            if(datatemp[i].value !== 0) {
              data.push(datatemp[i]);
            }
        }
    }

    var margin = {top: 10, right: 75, bottom: 80, left: 70},
        width = $("#bar_chart").width() - margin.left - margin.right,
        height =  $("#bar_chart").height() - margin.top - margin.bottom;
    
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width]);

    var y = d3.scale.linear()
        .range([0,height]); 

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);
      
    x.domain(data.map(function(d) {return d.key; }));
    var ydomain=d3.extent(data,function(d){return d.value;});
    y.domain([ydomain[1]*1.1,0]);
    
    var svg = d3.select("#bar_chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis baraxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "start")
            .attr("transform", function(d) {
                return "rotate(35)" 
                });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);    

    svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect") 
            .attr("x", function(d,i) { return x(d.key); })
            .attr("width", x.rangeBand()-1)
            .attr("y", function(d){
                           return y(d.value);            
            })
            .attr("height", function(d) {
                           return height-y(d.value);
            })
            .on("click",function(d){
                if(currentFilter=="Total"){
                    currentFilter=d.key;
                    $("#barchartfilter").html('<button id="filterbarbutton" class="filterbutton">'+ currentFilter +' X</button>');
                    $("#filterbarbutton").on("click",function(){
                        $("#barchartfilter").html("");
                        currentFilter = "Total";
                        transition(currentFilter);
                    });
                    transition(currentFilter);
                }
            })
            .attr("fill","steelblue");
}

var currentFilter = "Total";
//var color = {"Sierra Leone":"#5677fc","Liberia":"#e51c23","Guinea":"#ffeb3b","Nigeria":"#259b24"};
var color = {"Sierra Leone":"#f36c60","Liberia":"#b0120a","Guinea":"#dd191d"};
var duration = 1500;
var parseDate = d3.time.format("%d/%m/%Y").parse;
var i;

for(i=0;i<cases["Total"].length;i++){
    cases["Total"][i].key = parseDate(cases["Total"][i].key);
    cases["Liberia"][i].key = parseDate(cases["Liberia"][i].key);
    cases["Sierra Leone"][i].key = parseDate(cases["Sierra Leone"][i].key);
    cases["Guinea"][i].key = parseDate(cases["Guinea"][i].key);
    deaths["Total"][i].key = parseDate(deaths["Total"][i].key);
    deaths["Liberia"][i].key = parseDate(deaths["Liberia"][i].key);
    deaths["Sierra Leone"][i].key = parseDate(deaths["Sierra Leone"][i].key);
    deaths["Guinea"][i].key = parseDate(deaths["Guinea"][i].key);    
}

for(i=0;i<data.length;i++){
    data[i].WeekDate=parseDate(data[i].WeekDate);
}

var cf = crossfilter(data);

byCountry = cf.dimension(function(d){return d.Country;});
byWeek = cf.dimension(function(d){return d.WeekDate;});
byRegion = cf.dimension(function(d){return d.PCodeUse;});
byRegionName = cf.dimension(function(d){return d.Region;});
byDate = cf.dimension(function(d){return d.WeekDate;});

var sumNewCasesByRegionName = byRegionName.group().reduceSum(function(d){return d.NewCases;});
var sumNewCasesByRegion = byRegion.group().reduceSum(function(d){return d.NewCases;});
var sumNewCasesByCountry = byCountry.group().reduceSum(function(d){return d.NewCases;});

var sumNewConfirmedCasesByRegionName = byRegionName.group().reduceSum(function(d){return d.NewConfirmedCases;});
var sumNewConfirmedCasesByRegion = byRegion.group().reduceSum(function(d){return d.NewConfirmedCases;});
var sumNewConfirmedCasesByCountry = byCountry.group().reduceSum(function(d){return d.NewConfirmedCases;});

var totalCasesByDate = byDate.group().reduceSum(function(d){return d.CumulativeCases;});
//var totalCasesByDate = byDate.group();
var totalDeathsByDate = byDate.group().reduceSum(function(d){return d.CumulativeDeaths;});

var lastWeeks = [parseDate("29/06/2015").valueOf(),parseDate("22/06/2015").valueOf()];

//helper function for formatting numbers with comma separator for thousands
var formatComma = d3.format(",");

$('#update_date').html(cases['Total'][cases['Total'].length-1]['key'].toDateString()); 
generateLineChart();
generateKeyStats("#key_stats",keyStats["Total"],cases["Total"],deaths['Total']);
generateBarChart(currentFilter);
generateMap();
