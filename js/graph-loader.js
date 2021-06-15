function loadGraph() {
    d3.select('html').attr('xmlns', 'http://www.w3.org/2000/svg');

    var svg = d3.select('#graph-svg'),
        margin = 200,
        width = Math.abs(svg._groups[0][0].clientWidth - margin),
        height = Math.abs(svg._groups[0][0].clientHeight - margin);

    var xScale = d3.scaleLinear().range([0, width]),
        yScale = d3.scaleLinear().range([height, 0]);

    var g = svg.append('g').attr('transform', 'translate(' + 100 + ',' + 100 + ')');

    var data = [];
    var inc = 5;
    var max = 360;
    for (let i = 0; i <= max; i += inc) {
        data.push([i, Math.sin(i / 57.3)]);
    }
    var dbreak = data.length;
    for (let i = 0; i <= max; i += inc) {
        data.push([i, Math.cos(i / 57.3)]);
    }

    xScale.domain([d3.min(data, (d) => d[0]), d3.max(data, (d) => d[0])]);
    yScale.domain([
        d3.min(data, function (d) {
            return d[1];
        }),
        d3.max(data, function (d) {
            return d[1];
        }),
    ]);

    g.selectAll('.segment')
        .data(data)
        .enter()
        .append('line')
        .attr('class', 'segment')
        .attr('x1', function (d, i) {
            let datum = i > 0 && i != dbreak ? data[i - 1] : data[i];
            return xScale(datum[0]);
        })
        .attr('y1', function (d, i) {
            let datum = i > 0 && i != dbreak ? data[i - 1] : data[i];
            return yScale(datum[1]);
        })
        .attr('x2', function (d, i) {
            return xScale(d[0]);
        })
        .attr('y2', function (d, i) {
            return yScale(d[1]);
        })
        .attr('stroke', function (d, i) {
            return i >= dbreak ? 'red' : 'green';
        });

    //dots:

    // g.selectAll('.dot')
    //     .data(data)
    //     .enter()
    //     .append('circle')
    //     .attr('class', 'dot')
    //     .attr('cx', function (d, i) {
    //         return xScale(d[0]);
    //     })
    //     .attr('cy', function (d, i) {
    //         return yScale(d[1]);
    //     })
    //     .attr('r', 1)
    //     .attr('fill', 'black');

    g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale).ticks(16));

    g.append('g').call(d3.axisLeft(yScale).ticks(6));

    //remove and re-add it so it works
    let ele = d3.select('svg#graph-svg')._groups[0][0];
    let textEle = ele.outerHTML;
    let parent = ele.parentElement;
    ele.outerHTML = '';
    parent.innerHTML += textEle;
}
