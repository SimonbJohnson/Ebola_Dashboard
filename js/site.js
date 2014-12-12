function generateLineChart(id,datain){
    var margin = {top: 20, right: 20, bottom: 25, left: 50},
        width = $(id).width() - margin.left - margin.right,
        height = $(id).height() - margin.top - margin.bottom;

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
            return x(d.date);
        })
        .y(function(d) { return y(d.cases); });

    var line2 = d3.svg.line()
        .x(function(d) {            
            return (x(d.date)); })
        .y(function(d) { return y(d.deaths); });

    var svg = d3.select(id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          
    x.domain(d3.extent(datain, function(d) { 
        return d.date; }));
    y.domain([0,d3.max(datain, function(d) { return d.cases; })]);

    svg.append("g")
        .attr("class", "xaxis axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "yaxis axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Cases");

    svg.append("path")
        .datum(datain)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill","none")
        .attr("stroke","steelblue")
        .attr("stroke-width","1px");

    svg.append("path")
        .datum(datain)
        .attr("class", "line2")
        .attr("d", line2)
        .attr("fill","none")
        .attr("stroke","red")
        .attr("stroke-width","1px");
}

function generateKeyStats(id,keystats,datain){
    var html = "<p>Population: "+keystats["population"] + "<p>";
    html = html + "<p>Cases: "+datain[0]["cases"] + "<p>";
    html = html + "<p>Deaths: "+datain[0]["deaths"] + "<p>";
    html = html + "<p>Crude Mortality Rate: "+Math.round(datain[0]["deaths"]/datain[0]["cases"]*100) + "%<p>";
    $(id).html(html);
}

function generateMap(){
    var color = ["#ffffff","#ffe082","#ffbd13","#ff8053","#ff493d"];
    
    byWeek.filterAll();
    byCountry.filterAll();
    byRegion.filterAll();
        
    byWeek.filter(function(d){
      return lastWeeks.indexOf(d) > -1;
    });
 
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = $('#map').width() - margin.left - margin.right,
    height = 325;
   
    var projection = d3.geo.mercator()
        .center([0,5])
        .scale(1800);

    var tooltip = d3.select("#map").append("tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
        
    var svg = d3.select('#map').append("svg")
        .attr("width", width)
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
        .attr("id",function(d){return d.properties.PCODE_REF;})
        .attr("class","region")
        .append("svg:title")
        .text(function(d) { return d.properties.NAME_REF; });
    
    sumNewCasesByRegion.all().forEach(function(e) {
        
            if(e.value==0){
                d3.select("#"+e.key).attr("fill",color[0]);
            } else if(e.value<25){
                d3.select("#"+e.key).attr("fill",color[1]);
            } else if(e.value<50){
                d3.select("#"+e.key).attr("fill",color[2]);
            } else if(e.value<100){
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

function transitionLineChart(id,datain){

    var margin = {top: 20, right: 20, bottom: 25, left: 50},
        width = $(id).width() - margin.left - margin.right,
        height = $(id).height() - margin.top - margin.bottom;

    var parseDate = d3.time.format("%d/%m/%Y").parse;

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
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.cases); });

    var line2 = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.deaths); });
  
    x.domain(d3.extent(datain, function(d) { return d.date; }));
    y.domain([0,d3.max(datain, function(d) { return d.cases; })]);

    d3.selectAll(".line")
        .datum(datain)
        .transition().duration(duration)
        .attr("d", line);
        
    d3.selectAll(".line2")
        .datum(datain)
        .transition().duration(duration)
        .attr("d", line2);    
           
    d3.selectAll(".yaxis")
        .transition().duration(duration)
        .call(yAxis);

    d3.selectAll(".xaxis")
        .transition().duration(duration)
        .call(xAxis);
}


function transitionTitles(filter){
    var title = filter;
    if(filter==="Total"){title = "Guinea, Liberia and Sierra Leone";}
    $("#key_stats_title").html("Key Stats for " + title);
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
    transitionLineChart("#line_total",casesAndDeaths[filter]);
    generateKeyStats("#key_stats",keyStats[filter],casesAndDeaths[filter]);
    generateBarChart(filter);
    transitionTitles(filter);
    transitionMap(filter);
}

function generateBarChart(filter){
    $("#bar_chart").html("");
    if(filter=="Total"){
        byWeek.filterAll();
        byCountry.filterAll();
        byRegion.filterAll();

        byWeek.filter(function(d){
          return lastWeeks.indexOf(d) > -1;
        });

        var data=sumNewCasesByCountry.all();        
    } else {
        byWeek.filterAll();
        byCountry.filterAll();
        byRegion.filterAll();
        byCountry.filter(filter);
        byWeek.filter(function(d){
          return lastWeeks.indexOf(d) > -1;
        });

        var data=sumNewCasesByRegionName.all();
        
        for(var i = data.length - 1; i >= 0; i--) {
            if(data[i].value === 0) {
               data.splice(i, 1);
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
            //.attr("dx", "-.8em")
            //.attr("dy", ".15em")
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
casesAndDeaths["Total"].forEach(function(d){
    d.date = parseDate(d.date);
    d.cases = +d.cases;
    d.deaths = +d.deaths;
});
casesAndDeaths["Guinea"].forEach(function(d){
    d.date = parseDate(d.date);
    d.cases = +d.cases;
    d.deaths = +d.deaths;    
});
casesAndDeaths["Liberia"].forEach(function(d){
    d.date = parseDate(d.date);
    d.cases = +d.cases;
    d.deaths = +d.deaths;    
});
casesAndDeaths["Sierra Leone"].forEach(function(d){
    d.date = parseDate(d.date);
    d.cases = +d.cases;
    d.deaths = +d.deaths;    
});

var cf = crossfilter(data);

byCountry = cf.dimension(function(d){return d.Country;});
byWeek = cf.dimension(function(d){return d.WeekDate;});
byRegion = cf.dimension(function(d){return d.PCodeUse;});
byRegionName = cf.dimension(function(d){return d.Region;});

var sumNewCasesByRegionName = byRegionName.group().reduceSum(function(d){return d.NewCases;});
var sumNewCasesByRegion = byRegion.group().reduceSum(function(d){return d.NewCases;});
var sumNewCasesByCountry = byCountry.group().reduceSum(function(d){return d.NewCases;});

var lastWeeks = ["08/12/2014","01/12/2014"];

$('#update_date').html(casesAndDeaths['Total'][0]['date'].toDateString()); 
generateLineChart("#line_total",casesAndDeaths["Total"]);
generateKeyStats("#key_stats",keyStats["Total"],casesAndDeaths["Total"]);
generateBarChart(currentFilter);
generateMap();
