var page, data;
async function init() {
    page = 1
    data = await d3.csv("data/ranking_dish.csv");
    data2 = await d3.csv("data/bubble_dish.csv");
    getVizOne();
}

function getVizOne() {
        var margin = { top: 20, right: 80, bottom: 10, left: 120 },
            width = 1000,
            height = 600,
            gap = 5,
            num = 20,
            transit_time = 500;

        var svg = d3.select("#scatterplot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height);

        var continent = ['SteakSeafood', 'Seafood', 'Chicken', 'Steak', 'SteakChickenSeafood', 'SeafoodChicken'];
        var color = d3.scaleOrdinal().domain(continent)
            .range(d3.schemeSet1);

        // bar size
        var size = (height - (margin.bottom + margin.top)) / num - gap;

        svg.selectAll("my_legend")
            .data(continent)
            .enter()
            .append("rect")
            .attr("x", width + gap)
            .attr("y", function (d, i) { return margin.top + gap + i * (size + gap); })
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) { return color(d); });

        svg.selectAll("my_continent")
            .data(continent)
            .enter()
            .append("text")
            .attr("x", width + gap + size * 1.5)
            .attr("y", function (d, i) { return margin.top + gap + i * (size + gap) + (size / 2) })
            .text(function (d) { return d })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");

        d3.csv('data/ranking_dish.csv').then(function (data) {
            var parseDate = d3.timeParse("%Y-%m-%d");
            var formatDate = d3.timeFormat("%Y");

            data.forEach(function (d) {
                d.date = formatDate(parseDate(d['date']));
                d.dish = d['dish'];
                d.total_case = +d.confirmed_so_far;
                d.rank = +d.rank - 1;
            });

            data = data.filter(function (d) { return d.total_case > 0; })
            console.log(data);

            var allDates = d3.set(data.map(function (d) { return d.date; })).values();
            var dateSize = d3.set(data.map(function (d) { return d.date; })).size();

            var index = 0;
            var date = allDates[index];

            var date_label = svg.append('text')
                .attr('class', 'date')
                .attr('x', width - 130)
                .attr('y', height - 10)
                .text(date)
                .style('text-anchor', 'start');

            var group = data.filter(function (d) { return d.date == date; })
                .sort(function (a, b) {
                    return d3.descending(a.total_case, b.total_case);
                })
                .slice(0, num);

            var x_scale = d3.scaleLinear()
                .domain([0, d3.max(group, function (d) { return d.total_case; })])
                .range([margin.left, width - margin.right]);

            var x_axis = d3.axisTop()
                .scale(x_scale)
                .ticks(5)
                .tickSize(-(height - margin.top - margin.bottom))
                .tickFormat(function (d) { return d3.format(',')(d); });

            var y_scale = d3.scaleLinear()
                .domain([num, 0])
                .range([height - margin.bottom, margin.top]);

            svg.append('g')
                .call(x_axis)
                .attr('transform', `translate(0, ${margin.top})`)
                .attr('class', 'axis x_axis')
                .selectAll('.tick line');

            svg.selectAll('my_rect')
                .data(group, function (d) { return d.dish; })
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', x_scale(0) + 1)
                .attr('y', function (d) { return y_scale(d.rank) + gap; })
                .attr('width', function (d) { return x_scale(d.total_case) - x_scale(0); })
                .attr('height', size)
                .style('fill', function (d) { return color(d.Continent); });

            svg.selectAll('my_dish')
                .data(group, function (d) { return d.dish; })
                .enter()
                .append('text')
                .attr('class', 'dish')
                .attr('x', margin.left - 2)
                .attr('y', function (d) { return y_scale(d.rank) + ((y_scale(1) - y_scale(0)) / 2) + 1; })
                .text(function (d) { return d.dish; })
                .style('text-anchor', 'end');

            svg.selectAll('my_case')
                .data(group, function (d) { return d.dish; })
                .enter()
                .append('text')
                .attr('class', 'case')
                .attr('x', function (d) { return x_scale(d.total_case) + gap; })
                .attr('y', function (d) { return y_scale(d.rank) + gap + ((y_scale(1) - y_scale(0)) / 2) + 1; })
                .text(function (d) { return d3.format(',')(d.total_case); });

            var transit = d3.interval(function () {
                group = data.filter(function (d) { return d.date == date; })
                    .sort(function (a, b) {
                        return d3.descending(a.total_case, b.total_case);
                    })
                    .slice(0, num);
                x_scale.domain([0, d3.max(group, function (d) { return d.total_case; })]);


                svg.select('.x_axis')
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .call(x_axis);

                var rects = svg.selectAll('.bar').data(group, function (d) { return d.dish; });

                rects
                    .enter()
                    .append('rect')
                    .attr('class', function (d) { return `bar ${d.dish.replace(/\s/g, '_')}`; })
                    .attr('x', x_scale(0) + 1)
                    .attr('y', function (d) { return y_scale(num + 1) + gap; })
                    .attr('width', function (d) { return x_scale(d.total_case) - x_scale(0); })
                    .attr('height', size)
                    .style('fill', function (d) { return color(d.Continent); })
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('y', function (d) { return y_scale(d.rank) + gap; });

                rects
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('y', function (d) { return y_scale(d.rank) + gap; })
                    .attr('width', function (d) { return x_scale(d.total_case) - x_scale(0); });

                rects
                    .exit()
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('y', function (d) { return y_scale(num + 1) + gap; })
                    .attr('width', function (d) { return x_scale(d.total_case) - x_scale(0); })
                    .remove();

                var dishes = svg.selectAll('.dish')
                    .data(group, function (d) { return d.dish; });

                dishes
                    .enter()
                    .append('text')
                    .attr('class', 'dish')
                    .attr('x', margin.left - 5)
                    .attr('y', function (d) { return y_scale(num + 1) + gap + ((y_scale(1) - y_scale(0)) / 2); })
                    .text(function (d) { return d.dish; })
                    .style('text-anchor', 'end')
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('y', function (d) { return y_scale(d.rank) + gap + ((y_scale(1) - y_scale(0)) / 2) + 1; });

                dishes
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('x', margin.left - 5)
                    .attr('y', function (d) { return y_scale(d.rank) + gap + ((y_scale(1) - y_scale(0)) / 2) + 1; });

                dishes
                    .exit()
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('x', margin.left - 5)
                    .attr('y', function (d) { return y_scale(num + 1) + gap; })
                    .remove();

                // Update case number
                var cases = svg.selectAll('.case').data(group, function (d) { return d.dish; });

                cases
                    .enter()
                    .append('text')
                    .attr('class', 'case')
                    .attr('x', function (d) { return x_scale(d.total_case) + gap; })
                    .attr('y', function (d) { return y_scale(num + 1) + gap; })
                    .text(function (d) { return d3.format(',')(d.total_case); })
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('y', function (d) { return y_scale(d.rank) + gap + ((y_scale(1) - y_scale(0)) / 2) + 1; });

                cases
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('x', function (d) { return x_scale(d.total_case) + gap; })
                    .attr('y', function (d) { return y_scale(d.rank) + gap + ((y_scale(1) - y_scale(0)) / 2) + 1; })
                    .tween("text", function (d) {
                        var m = d3.interpolateRound(d.total_case, d.total_case);
                        return function (t) {
                            this.textContent = d3.format(',')(m(t));
                        };
                    });

                cases
                    .exit()
                    .transition()
                    .duration(transit_time)
                    .ease(d3.easeLinear)
                    .attr('x', function (d) { return x_scale(d.total_case) + gap; })
                    .attr('y', function (d) { return y_scale(num + 1) + gap; })
                    .remove();

                date_label.text(date);

                if (index == dateSize - 1) transit.stop();
                index += 1;
                date = allDates[index];

            },
                transit_time);

        });

    d3.select('#page').text(`Page ${page} / 3`)

    let p = `
      <br>
      In this presentation, we discuss how major food categories change available to New Yorkers changes over time.
      The NYPL data set was processed so that only dishes that are in the top 200 are considered. This ranking is based
      on how often a dish shows up across all menus scanned during the period. Dishes not related to
      major food categories were eliminated to simplify the dataset and scope. The original dataset had a date range that 
      required to be pivoted, increasing the size of the dataset substantially.<br><br>
      Notice the major food trends as food delivery improves over time. The type of food available across resturants changes drastically.
      The most common types of food are seafood as New York is located on the East Coast. However, by the end of animation
      the chart reveals additional food categories that dominate menus in the twenty first century.    
      `
    d3.select('#intro')
        .html(p)
}

function getVizSecond() {
        const data = d3.csv('data/bubble_dish.csv').then(function (data) {
        var width = 1600;
        var height = 600;
        var margin = 50;

        var dataByRegion = d3.nest()
            .key(function (d) { return d.region; })
            .rollup(function (v) {
                return {
                    count: v.length,
                    total: d3.sum(v, function (d) { return d.AveragePrice; }),
                    avg: d3.mean(v, function (d) { return d.AveragePrice; })
                };
            }).entries(data);

        var groupByRegion = d3.group(data, d => d.region);
        console.log(groupByRegion);

        var svg = d3.select("svg");



        // Initializeing the circle at center of the canvas
        var node = svg.selectAll(".node")
            .data(dataByRegion)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", hoverOn)
            .on("mouseout", hoverOut);

        //Outer Dish
        node.append("circle")
            .attr("class", "avacado")
            .attr("r", function (d) { return +d.value.avg * 30; })
            .style("fill", "grey")
            .style("fill-opacity", 0.6)
            .attr("stroke", "darkgrey")
            .style("stroke-width", 1);

        //Dish Center
        node.append("circle")
            .attr("class", "pit")
            .attr("r", function (d) { return +d.value.avg * 20; })
            .style("fill", "lightgrey")
            .style("fill-opacity", 0.5)
            .style("cx", function (d) { return +d.value.avg * -1; });


        node.append("text")
            .attr("transform", "translate(0,6)")
            .text(function (d) { return d.key; })
            .style("font-size", "1em")
            .style("color", "lightgrey");



        // Forces applied to nodes:
        var simulation = d3.forceSimulation()
            .force("center", d3.forceCenter().x(450).y(300))
            .force("charge", d3.forceManyBody().strength(0.3))
            .force("collide", d3.forceCollide().strength(.05).radius(50).iterations(1))
        simulation.nodes(dataByRegion)
            .on("tick", function (d) {
                node
                    .attr("fx", function (d) { return d.x; })
                    .attr("fy", function (d) { return d.y; })

                node.attr("transform", function (d) { return "translate(" + d.x + ", " + d.y + ")"; });
            });



        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            if ((d.fx >= basket_x) && (d.fx < (basket_x + basket_w)) && (d.fy >= basket_y) && (d.fy < (basket_y + basket_h))) {
                var dataAtRegionBySeason = d3.nest()
                    .key(function (d) { return d.season; })
                    .rollup(function (v) {
                        return {
                            count: v.length,
                            total: d3.sum(v, function (d) { return d.AveragePrice; }),
                            avg: d3.mean(v, function (d) { return d.AveragePrice; })
                        };
                    }).entries(groupByRegion.get(d.key));

                var barKey = d.key;
                console.log(dataAtRegionBySeason);
                // ranges
                var x = d3.scaleBand().range([0, 200]).padding(0.1);
                var y = d3.scaleLinear().range([200, 0]);

                x.domain(dataAtRegionBySeason.map(function (d) { return d.key; }));
                y.domain([0, d3.max(dataAtRegionBySeason, function (d) { return +d.value.avg; })]).nice();



                svg.append("g")
                    .attr("transform", "translate(1000,100)")
                    .call(d3.axisBottom(x));

                svg.append("g")
                    .call(d3.axisLeft(y).ticks(3));

            } else {
                svg.selectAll("." + d.key + "bar").remove();

            }
            d.fx = null;
            d.fy = null;
        }

        function hoverOn(d, i) {

            svg.append("text")
                .attr("id", "bubble")
                .attr("x", function () { return d.x - 30; })
                .attr("y", function () { return d.y - 15; })
                .style("fill", "black")
                .style("background-color", "white")
                .text(function () { return 'Avg Historic Price: ' + (Math.round(+d.value.avg * 100) / 100) + ' ($/lb)'; })
                .style("color", "lightgrey")
                .style("font-size", "1.2em");
        }

        function hoverOut(d, i) {
            svg.select("#bubble").remove();
        }

        function moreDetails(d, i) {


        }

    });

    let p = `
      From the dishes in the chart above averages the mean pricing of food available to consumers. The radius of the dish represents the popularity
      of the dish. Notice any trends between food prices and volume? If we added commodity foods such as coffee, drinks, we would see
      a positive trend between volume and pricing. <br><br>Please feel free to bring dishes side-by-side to examine further.
      `
    d3.select('#intro')
        .html(p)
}

function getVizThree() {
   
    // define data
    var dataset = [
        { label: "Seafood", count: 18107 },
        { label: "Chicken", count: 8054 },
        { label: "Steak", count: 15545 },
        { label: "Steak, Chicken & Seafood", count: 50 },
        { label: "Seafood & Chicken", count: 8000 },
        { label: "Seafood & Steak", count: 5000 },
    ];

    // chart dimensions
    var width = 1600;
    var height = 600;

    // a circle chart needs a radius
    var radius = Math.min(width, height) / 2;
    var donutWidth = 75; // size of donut hole. not needed if doing pie chart

    // legend dimensions
    var legendRectSize = 25; // defines the size of the colored squares in legend
    var legendSpacing = 6; // defines spacing between squares

    // define color scale
    var color = d3.scaleOrdinal(d3.schemeDark2);

    // calculate new total
    var total = d3.sum(dataset, d => d.count);

    // define new total section
    var newTotal = d3.select('.new-total-holder')
        .append('span')
        .attr('class', 'newTotal').text(total);

    var svg = d3.select('#scatterplot') // select element in the DOM with id 'chart'
        .append('svg') // append an svg element to the element we've selected
        .attr('width', width) // set the width of the svg element we just added
        .attr('height', height) // set the height of the svg element we just added
        .append('g') // append 'g' element to the svg element
        .attr('transform', 'translate(' + (width /3.5) + ',' + (height / 2) + ')'); // our reference is now to the 'g' element. centerting the 'g' element to the svg element

    var arc = d3.arc()
        .innerRadius(radius - donutWidth) // radius - donutWidth = size of donut hole. use 0 for pie chart
        .outerRadius(radius); // size of overall chart

    var pie = d3.pie() // start and end angles of the segments
        .value(function (d) { return d.count; }) // how to extract the numerical data from each entry in our dataset
        .sort(null); // by default, data sorts in oescending value. this will mess with our animation so we set it to null

    //**********************
    //        TOOLTIP
    //**********************

    var tooltip = d3.select('#scatterplot') // select element in the DOM with id 'chart'
        .append('div') // append a div element to the element we've selected                                    
        .attr('class', 'tooltip'); // add class 'tooltip' on the divs we just selected

    tooltip.append('div') // add divs to the tooltip defined above
        .attr('class', 'label'); // add class 'label' on the selection
    tooltip.append('div') // add divs to the tooltip defined above   
        .attr('class', 'count'); // add class 'count' on the selection                  
    tooltip.append('div') // add divs to the tooltip defined above  
        .attr('class', 'percent'); // add class 'percent' on the selection

    dataset.forEach(function (d) {
        d.count = +d.count; // calculate count as we iterate through the data
        d.enabled = true; // add enabled property to track which entries are checked
    });

    // creating the chart
    var path = svg.selectAll('path') // select all path elements inside the svg. specifically the 'g' element. they don't exist yet but they will be created below
        .data(pie(dataset)) //associate dataset wit he path elements we're about to create. must pass through the pie function. it magically knows how to extract values and bakes it into the pie
        .enter() //creates placeholder nodes for each of the values
        .append('path') // replace placeholders with path elements
        .attr('d', arc) // define d attribute with arc function above
        .attr('fill', function (d) { return color(d.data.label); }) // use color scale to define fill of each label in dataset
        .each(function (d) { this._current - d; }); // creates a smooth animation for each track

    // mouse event handlers are attached to path so they need to come after its definition
    path.on('mouseover', function (d) {  // when mouse enters div      
        var total = d3.sum(dataset.map(function (d) { // calculate the total number of tickets in the dataset         
            return (d.enabled) ? d.count : 0; // checking to see if the entry is enabled. if it isn't, we return 0 and cause other percentages to increase                                      
        }));
        var percent = Math.round(1000 * d.data.count / total) / 10; // calculate percent
        tooltip.select('.label').html(d.data.label); // set current label           
        tooltip.select('.count').html('Menus: ' + d.data.count); // set current count            
        tooltip.select('.percent').html(percent + '%'); // set percent calculated above          
        tooltip.style('display', 'block'); // set display                     
    });

    path.on('mouseout', function () { // when mouse leaves div                        
        tooltip.style('display', 'none'); // hide tooltip for that element
    });

    path.on('mousemove', function (d) { // when mouse moves                  
        tooltip.style('top', (d3.event.layerY + 10) + 'px') // always 10px below the cursor
            .style('left', (d3.event.layerX + 10) + 'px'); // always 10px to the right of the mouse
    });

    // define legend
    var legend = svg.selectAll('.legend') // selecting elements with class 'legend'
        .data(color.domain()) // refers to an array of labels from our dataset
        .enter() // creates placeholder
        .append('g') // replace placeholders with g elements
        .attr('class', 'legend') // each g is given a legend class
        .attr('transform', function (d, i) {
            var height = legendRectSize + legendSpacing; // height of element is the height of the colored square plus the spacing      
            var offset = height * color.domain().length / 2; // vertical offset of the entire legend = height of a single element & half the total number of elements  
            var horz = -2 * legendRectSize; // the legend is shifted to the left to make room for the text
            var vert = i * height - offset; // the top of the element is hifted up or down from the center using the offset defiend earlier and the index of the current element 'i'               
            return 'translate(' + horz + ',' + vert + ')'; //return translation       
        });

    // adding colored squares to legend
    legend.append('rect') // append rectangle squares to legend                                   
        .attr('width', legendRectSize) // width of rect size is defined above                        
        .attr('height', legendRectSize) // height of rect size is defined above                      
        .style('fill', color) // each fill is passed a color
        .style('stroke', color) // each stroke is passed a color
        .on('click', function (label) {
            var rect = d3.select(this); // this refers to the colored squared just clicked
            var enabled = true; // set enabled true to default
            var totalEnabled = d3.sum(dataset.map(function (d) { // can't disable all options
                return (d.enabled) ? 1 : 0; // return 1 for each enabled entry. and summing it up
            }));
            if (rect.attr('class') === 'disabled') { // if class is disabled
                rect.attr('class', ''); // remove class disabled
            } else { // else
                if (totalEnabled < 2) return; // if less than two labels are flagged, exit
                rect.attr('class', 'disabled'); // otherwise flag the square disabled
                enabled = false; // set enabled to false
            }

            pie.value(function (d) {
                if (d.label === label) d.enabled = enabled; // if entry label matches legend label
                return (d.enabled) ? d.count : 0; // update enabled property and return count or 0 based on the entry's status
            });

            path = path.data(pie(dataset)); // update pie with new data

            path.transition() // transition of redrawn pie
                .duration(750) // 
                .attrTween('d', function (d) { // 'd' specifies the d attribute that we'll be animating
                    var interpolate = d3.interpolate(this._current, d); // this = current path element
                    this._current = interpolate(0); // interpolate between current value and the new value of 'd'
                    return function (t) {
                        return arc(interpolate(t));
                    };
                });

            // calculate new total
            var newTotalCalc = d3.sum(dataset.filter(function (d) { return d.enabled; }), d => d.count)

            // append newTotalCalc to newTotal which is defined above
            newTotal.text(newTotalCalc);
        });

    // adding text to legend
    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function (d) { return d;}); // return label

    
    function update(data) {

        // Compute the position of each group on the pie:
        var pie = d3.pie() // start and end angles of the segments
            .value(function (d) { return d.count; }) // how to extract the numerical data from each entry in our dataset
            .sort(null); // by default, data sorts in oescending value. this will mess with our animation so we set it to null        var data_ready = pie(d3.entries(data))

        // map to data
        var u = svg.selectAll("path")
            .data(data_ready)

        path = path.data(pie(dataset)); // update pie with new data

        path.transition() // transition of redrawn pie
            .duration(750) // 
            .attrTween('d', function (d) { // 'd' specifies the d attribute that we'll be animating
                var interpolate = d3.interpolate(this._current, d); // this = current path element
                this._current = interpolate(0); // interpolate between current value and the new value of 'd'
                return function (t) {
                    return arc(interpolate(t));
                };
            });

        // calculate new total
        var newTotalCalc = d3.sum(dataset.filter(function (d) { return d.enabled; }), d => d.count)

        // append newTotalCalc to newTotal which is defined above
        newTotal.text(newTotalCalc);

    }

   

    let p = `
      <br>
      <button disabled onclick="update(data1850)">1850</button>
      <button disabled onclick="update(data1950)">1950</button>
      <button autofocus onclick="update(data2000)">2000</button>
      <br><br>
      In this final chart, we will explore the relationship between different major food categories. 
      Here you can clearly see the relationship between the different food categories. Surprisingly dishes that combine
      multiple food categories are also very popular.<br><br>

      Thank you for joining me in this journey! Remember that a major aspect of this narrative was the processing of the raw data.
      This was  accomplished using the pandas library through Jupyter Notebooks.<br><br>
      `
    d3.select('#intro')
        .html(p)
}

function pageMod(page) {
    if (page == 1) {
        getVizOne();
    }
    if (page == 2) {
        getVizSecond();
    }
    if (page == 3) {
        getVizThree();
    }
}

function nextPage() {
    if (page == 3) return;
    page = Math.min(page + 1, 3)
    d3.select('#scatterplot').html("")
    d3.select('#page').text(`Page ${page} / 3`)
    pageMod(page);
}

function prevPage() {
    if (page == 1) return;
    page = Math.max(page - 1, 1)
    d3.select('#scatterplot').html("")
    d3.select('#page').text(`Page ${page} / 3`)
    pageMod(page);
}

// Pagination
var pageItem = $(".pagination li").not(".prev,.next");
var prev = $(".pagination li.prev");
var next = $(".pagination li.next");

pageItem.click(function () {
    pageItem.removeClass("active");
    $(this).not(".prev,.next").addClass("active");
});

next.click(function () {

    if ($('li.active').next().not(".next").length == 1) {
        $('li.active').removeClass('active').next().addClass('active');
    }
});

prev.click(function () {

    if ($('li.active').prev().not(".prev").length == 1) {
        $('li.active').removeClass('active').prev().addClass('active');
    }
});