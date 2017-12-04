function makeLineChart(dataset, xName, yObjs, axisLables) {
    var chartObj = {};
    var color = d3.scale.category10();
    chartObj.xAxisLable = axisLables.xAxis;
    chartObj.yAxisLable = axisLables.yAxis;
    /*
     yObjsects format:
     {y1:{column:'',name:'name',color:'color'},y2}
     */

    chartObj.data = dataset;
    chartObj.margin = {top: 15, right: 60, bottom: 30, left: 50};
    chartObj.width = 650 - chartObj.margin.left - chartObj.margin.right;
    chartObj.height = 1080 - chartObj.margin.top - chartObj.margin.bottom;

// So we can pass the x and y as strings when creating the function
    chartObj.xFunct = function(d){return d[xName]};

// For each yObjs argument, create a yFunction
    function getYFn(column) {
        return function (d) {  
            return d[column];
        };
    }

// Object instead of array
    chartObj.yFuncts = [];
    for (var y  in yObjs) {
        yObjs[y].name = y;
        yObjs[y].yFunct = getYFn(yObjs[y].column); //Need this  list for the ymax function
        chartObj.yFuncts.push(yObjs[y].yFunct);
    }

//Formatter functions for the axes
    chartObj.formatAsNumber = d3.format(".0f");
    chartObj.formatAsDecimal = d3.format(".2f");
    chartObj.formatAsCurrency = d3.format("$.2f");
    chartObj.formatAsFloat = function (d) {
        if (d % 1 !== 0) {
            return d3.format(".2f")(d);
        } else {
            return d3.format(".0f")(d);
        }
        
    };

    chartObj.xFormatter = chartObj.formatAsNumber;
    chartObj.yFormatter = chartObj.formatAsFloat;

    chartObj.bisectYear = d3.bisector(chartObj.xFunct).left; //< Can be overridden in definition

//Create scale functions
    chartObj.xScale = d3.scale.linear().range([0, chartObj.width]).domain(d3.extent(chartObj.data, chartObj.xFunct)); //< Can be overridden in definition

// Get the max of every yFunct
    chartObj.max = function (fn) {
        return d3.max(chartObj.data, fn);
    };
    chartObj.yScale = d3.scale.linear()
           //.range([1000,0])
        .range([chartObj.height,0])
        .domain([500, 
                 //1350]);
                 d3.max(chartObj.yFuncts.map(chartObj.max))]);

    chartObj.formatAsYear = d3.format("");

//Create axis
    chartObj.xAxis = d3.svg.axis().scale(chartObj.xScale).orient("bottom").tickFormat(chartObj.xFormatter); //< Can be overridden in definition

    chartObj.yAxis = d3.svg.axis().scale(chartObj.yScale).orient("left").ticks(5).tickFormat(chartObj.yFormatter); //< Can be overridden in definition


// Build line building functions
    function getYScaleFn(yObj) {
        return function (d) {
            return chartObj.yScale(yObjs[yObj].yFunct(d));
        };
    }
    for (var yObj in yObjs) {
        yObjs[yObj].line = d3.svg.line().interpolate("cardinal").x(function (d) {
            return chartObj.xScale(chartObj.xFunct(d));
        }).y(getYScaleFn(yObj));
    }
    

    chartObj.svg;

// Change chart size according to window size
    chartObj.update_svg_size = function () {
        chartObj.width = parseInt(chartObj.chartDiv.style("width"), 10) - (chartObj.margin.left + chartObj.margin.right);

        chartObj.height = parseInt(chartObj.chartDiv.style("height"), 10) - (chartObj.margin.top + chartObj.margin.bottom);

        /* Update the range of the scale with new width/height */
        chartObj.xScale.range([0, chartObj.width]);
        chartObj.yScale.range([chartObj.height, 0]);

        if (!chartObj.svg) {return false;}

        /* Else Update the axis with the new scale */
        chartObj.svg.select('.x.axis').attr("transform", "translate(0," + chartObj.height + ")").call(chartObj.xAxis);
        chartObj.svg.select('.x.axis .label').attr("x", chartObj.width / 2);

        chartObj.svg.select('.y.axis').call(chartObj.yAxis);
        chartObj.svg.select('.y.axis .label').attr("x", -chartObj.height / 2);

        /* Force D3 to recalculate and update the line */
        for (var y  in yObjs) {
            yObjs[y].path.attr("d", yObjs[y].line);
        }
        

        d3.selectAll(".focus.line").attr("y2", chartObj.height);

        chartObj.chartDiv.select('svg').attr("width", chartObj.width + (chartObj.margin.left + chartObj.margin.right)).attr("height", chartObj.height + (chartObj.margin.top + chartObj.margin.bottom));

        chartObj.svg.select(".overlay").attr("width", chartObj.width).attr("height", chartObj.height);
        return chartObj;
    };

    chartObj.bind = function (selector) {
        chartObj.mainDiv = d3.select(selector);
        // Add all the divs to make it centered and responsive
        chartObj.mainDiv.append("div").attr("class", "inner-wrapper").append("div").attr("class", "outer-box").append("div").attr("class", "inner-box");
        chartSelector = selector + " .inner-box";
        chartObj.chartDiv = d3.select(chartSelector);
        d3.select(window).on('resize.' + chartSelector, chartObj.update_svg_size);
        chartObj.update_svg_size();
        return chartObj;
    };

// Render the chart
    chartObj.render = function () {
        //Create SVG element
        chartObj.svg = chartObj.chartDiv.append("svg").attr("class", "chart-area").attr("width", chartObj.width + (chartObj.margin.left + chartObj.margin.right)).attr("height", chartObj.height + (chartObj.margin.top +chartObj.margin.bottom))
        .append("g").attr("transform", "translate(" + chartObj.margin.left + "," + chartObj.margin.top + ")");

// Draw Lines
        for (var y  in yObjs) {
            yObjs[y].path = chartObj.svg.append("path").datum(chartObj.data).attr("class", "line").attr("d", yObjs[y].line).style("stroke", color(y)).attr("data-series", y).on("mouseover", function () {
                focus.style("display", null);
            }).on("mouseout", function () {
                focus.transition().delay(700).style("display", "none");
            }).on("mousemove", mousemove);
        }
        

// Draw Axis
        chartObj.svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + chartObj.height + ")").call(chartObj.xAxis).append("text").attr("class", "label").attr("x", chartObj.width / 2).attr("y", 30).style("text-anchor", "middle").text(chartObj.xAxisLable);

        chartObj.svg.append("g").attr("class", "y axis").call(chartObj.yAxis).append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -chartObj.height / 2).attr("dy", ".71em").style("text-anchor", "middle").text(chartObj.yAxisLable);

//Draw tooltips
        var focus = chartObj.svg.append("g").attr("class", "focus").style("display", "none");

        for (var y  in yObjs) {
            yObjs[y].tooltip = focus.append("g");
            yObjs[y].tooltip.append("circle").attr("r", 5);
            yObjs[y].tooltip.append("rect").attr("x", 8)
                //.attr("y","0").attr("width",22)
                .attr("height",'0.75em');
            yObjs[y].tooltip.append("text").attr("x", 9).attr("dy", "-.5em"); 
            
        }
        
         //DRAW A POPOUT ---- NEW
        var width = 250,
            height = 170,
            x = 560;
            y = -5;
      
    // draw append chrunk            
    focus.append("rect").attr("x", x).attr("y", y).attr("width", width) .attr("height", height).attr("rx", 5).attr("ry", 5).style("fill", "lightblue");

    // images of dogs
    focus.append("svg:image").attr("xlink:href", "labrador.png").attr("x", x+10).attr("y", y+6).attr("width", "20").attr("height", "20");
    focus.append("svg:image").attr("xlink:href", "labrador-mix.png").attr("x", x+10).attr("y", y+26).attr("width", "20").attr("height", "20");
    focus.append("svg:image").attr("xlink:href", "golden-retriever.png").attr("x", x+10).attr("y", y+46).attr("width", "20").attr("height", "20");
    focus.append("svg:image").attr("xlink:href", "beagle.png").attr("x", x+10).attr("y", y+66).attr("width", "20").attr("height", "20");
    focus.append("svg:image").attr("xlink:href", "AM.png").attr("x", x+8).attr("y", y+86).attr("width", "25").attr("height", "25");
    focus.append("svg:image").attr("xlink:href", "german-shepherd.png").attr("x", x+8).attr("y", y+106).attr("width", "21").attr("height", "21");
    focus.append("svg:image").attr("xlink:href", "shihTzu.png").attr("x", x+9).attr("y", y+126).attr("width", "22").attr("height", "22");
    focus.append("svg:image").attr("xlink:href", "chihuahua.png").attr("x", x+10).attr("y", y+148).attr("width", "20").attr("height", "20");
   
    // text of dogs
    focus.append("text").attr("class","annotation").attr("x",x+40).attr("y", y+20).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation1").attr("x",x+40).attr("y", y+40).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation2").attr("x",x+40).attr("y", y+60).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation3").attr("x",x+40).attr("y", y+80).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation4").attr("x",x+40).attr("y", y+100).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation5").attr("x",x+40).attr("y", y+120).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation6").attr("x",x+40).attr("y", y+140).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
    focus.append("text").attr("class","annotation7").attr("x",x+40).attr("y", y+160).style("font-family", "raleway").style("font-size", 10).style("font-size", "12px");
        
        
        // Year label
        focus.append("text").attr("class", "focus year").attr("x", 500).attr("y", 15);
       
  
        // Focus line
        focus.append("line").attr("class", "focus line").attr("y1", 0).attr("y2", chartObj.height);

        //Draw legend
        var legend = chartObj.mainDiv.append('div').attr("class", "legend");
    
        for (var y  in yObjs) {
            series = legend.append('div');
            series.append('div').attr("class", "series-marker").style("background-color", color(y));
            series.append('p').text(y);
            yObjs[y].legend = series;
        }
        
    
        // Overlay to capture hover
        chartObj.svg.append("rect").attr("class", "overlay").attr("width", chartObj.width).attr("height", chartObj.height).on("mouseover", function () {
            focus.style("display", null);
        }).on("mouseout", function () {
            focus.style("display", "none");
        }).on("mousemove", mousemove);

        return chartObj;
        
        function mousemove() {
            var x0 = chartObj.xScale.invert(d3.mouse(this)[0]), i = chartObj.bisectYear(dataset, x0, 1), d0 = chartObj.data[i - 1], d1 = chartObj.data[i];
            try {
                var d = x0 - chartObj.xFunct(d0) > chartObj.xFunct(d1) - x0 ? d1 : d0;
            } catch (e) { return;}
            minY = chartObj.height;
            
            //var content="";
            var values="";
            var valuesarray=[];
            
            
            for (var y  in yObjs) {
                yObjs[y].tooltip.attr("transform", "translate(" + chartObj.xScale(chartObj.xFunct(d)) + "," + chartObj.yScale(yObjs[y].yFunct(d)) + ")");
                yObjs[y].tooltip.select("text").text(chartObj.yFormatter(yObjs[y].yFunct(d)));
                
                minY = Math.min(minY, chartObj.yScale(yObjs[y].yFunct(d)));
                
                var names=["Labrador Retriever", "Labrador Mix", "Golden Retriever", "Beagle", "America Pitbull Terrier", "German Shepherd", "Shih Tzu", "Chihuahua"]; 
              
                
                values += chartObj.yFormatter(yObjs[y].yFunct(d)) + " ";
                valuesarray = values.split(" ");
                var max=valuesarray[2];
                
                //var content="";
                var content0="", content1="" , content2="", content3="", content4="", content5="", content6="", content7="";
                    content0 = names[0] +": "+ valuesarray[0] + " " + "NO.1";
                    content1 = names[1] +": "+ valuesarray[1] + " " + "NO.2";
                    content2 = names[2] +": "+ valuesarray[2] + " ";
                    content3 = names[3] +": "+ valuesarray[3] + " ";
                    content4 = names[4] +": "+ valuesarray[4] + " ";
                    content5 = names[5] +": "+ valuesarray[5] + " ";
                    content6 = names[6] +": "+ valuesarray[6] + " ";
                    content7 = names[7] +": "+ valuesarray[7] + " ";
                
                    
                for (var i = 2; i < names.length; i++){
                    
                    if (max < valuesarray[i]){ max = valuesarray[i]; }
                    
                }
                switch(max)
                    { case valuesarray[2]: content2 = names[2] +": "+ valuesarray[2] + " "+" NO.3";break;
                    case valuesarray[3]: content3 = names[3] +": "+ valuesarray[3] + " "+" NO.3";break;
                    case valuesarray[4]: content4 = names[4] +": "+ valuesarray[4] + " "+" NO.3";break;
                    case valuesarray[5]: content5 = names[5] +": "+ valuesarray[5] + " "+" NO.3";break;
                    case valuesarray[6]: content6 = names[6] +": "+ valuesarray[6] + " "+" NO.3";break;
                    case valuesarray[7]: content7 = names[7] +": "+ valuesarray[7] + " "+" NO.3";break;
                    //default:content2 = names[2] +": "+ valuesarray[2] + " "+" NO.3";
                   }
                
               // for(var i = 0; i < names.length; i++){
                    //content += names[i] +" "+ valuesarray[i] + " ";}
                 //content += chartObj.yFormatter(yObjs[y].yFunct(d)) + " ";
                }
            
            focus.select(".annotation").text(content0);
            focus.select(".annotation1").text(content1);
            focus.select(".annotation2").text(content2);
            focus.select(".annotation3").text(content3);
            focus.select(".annotation4").text(content4);
            focus.select(".annotation5").text(content5);
            focus.select(".annotation6").text(content6);
            focus.select(".annotation7").text(content7);
            
          
            focus.select(".focus.line").attr("transform", "translate(" + chartObj.xScale(chartObj.xFunct(d)) + ")").attr("y1", minY);
            focus.select(".focus.year").text("Year: " + chartObj.xFormatter(chartObj.xFunct(d)));
        }

    };
    return chartObj;
}