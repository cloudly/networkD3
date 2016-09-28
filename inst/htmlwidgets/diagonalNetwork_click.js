HTMLWidgets.widget({

  name: "diagonalNetwork_click",
  type: "output",

  initialize: function(el, width, height) {

    d3.select(el).append("svg")
      .style("width", "100%")
      .style("height", "100%")
      .append("g")
      .attr("transform", "translate(40,0)");
    return d3.layout.tree();

  },

  resize: function(el, width, height, tree) {
    // resize now handled by svg viewBox attribute
    /*
    var s = d3.select(el).selectAll("svg");
    s.attr("width", width).attr("height", height);
    
    var margin = {top: 20, right: 20, bottom: 20, left: 20};
    width = width - margin.right - margin.left;
    height = height - margin.top - margin.bottom;
    
    tree.size([height, width]);
    var svg = d3.select(el).selectAll("svg").select("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    */

  },

  renderValue: function(el, x, tree) {


    // x is a list with two elements, options and root; root must already be a
    // JSON array with the d3Tree root data

    var s = d3.select(el).selectAll("svg");

    // s.attr("width", width + margin.right + margin.left)
    // s.attr("height", height + margin.top + margin.bottom)
    // s.append("g")
    // s.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
   
    // when re-rendering the svg, the viewBox attribute set in the code below, will
    // be affected by the previously set viewBox. This line ensures, that the 
    // viewBox will always be calculated right. 
    s.attr("viewBox", null);
    
    // margin handling
    //   set our default margin to be 20
    //   will override with x.options.margin if provided
    var margin = {top: 20, right: 20, bottom: 20, left: 80}; //same

    //   go through each key of x.options.margin
    //   use this value if provided from the R side
    Object.keys(x.options.margin).map(function(ky){
      if(x.options.margin[ky] !== null) {
        margin[ky] = x.options.margin[ky];
      }
      // set the margin on the svg with css style
      // commenting this out since not correct
      // s.style(["margin",ky].join("-"), margin[ky]);
    });
      
    
    width = s.node().getBoundingClientRect().width - margin.right - margin.left; //same
    height = s.node().getBoundingClientRect().height - margin.top - margin.bottom; //same

    s.attr("width", width + margin.right + margin.left)
    s.attr("height", height + margin.top + margin.bottom)
    s.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // new lines
    var i = 0,
    duration = 750,
    root;

    
    //added Math.max(1, ...) to avoid NaN values when dealing with nodes of depth 0.
    tree.size([height, width])
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / Math.max(1, a.depth); });

    // select the svg group element and remove existing children
    s.attr("pointer-events", "all").selectAll("*").remove();
    s.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var svg = d3.select(el).selectAll("g");


    var root = x.root;

    root.x0 = height / 2;
    root.y0 = 0;

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      var nodes = tree.nodes(root),
        links = tree.links(nodes);
      }
    }

    var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; }); //same


    //root.children.forEach(collapse);
    update(root);
    d3.select(self.frameElement).style("height", "800px");  
   

    function update(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.depth * 180; });

      // Update the nodes…
      var node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", click);

      nodeEnter.append("circle")
          .attr("r", 1e-6)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
          .style("opacity", x.options.opacity)
          .style("stroke", x.options.nodeStroke)
          .style("stroke-width", "1.5px");

      nodeEnter.append("text")
          .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
          .text(function(d) { return d.name; })
         // .style("fill-opacity", 1e-6)
          .style("font", x.options.fontSize + "px " + x.options.fontFamily)
          .style("opacity", x.options.opacity)
          .style("fill", x.options.textColour);

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select("circle")
          .attr("r", 4.5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeUpdate.select("text")
          .style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .remove();

      nodeExit.select("circle")
          .attr("r", 1e-6);

      nodeExit.select("text")
          .style("fill-opacity", 1e-6);

      // Update the links…
      var link = svg.selectAll("path.link")
          .data(links, function(d) { return d.target.id; })
          // .enter().append("path")
          ;

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .style("fill", "none")
          .style("stroke", x.options.linkColour)
          .style("opacity", "0.55")
          .style("stroke-width", "1.5px")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          });

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

  },
});
