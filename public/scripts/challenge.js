////////////////////////// Begin Pattern matcher ///////////////////////////

var Token = function(type, val) {
  return {
    type    : type,
    val     : val,
    toString: function() { return "type: " + this.type + " val: " + this.val; }
  };

  return token;
}

var Tokenizer = function(str) {
  // Private
  var index = 0;
  var lookahead;

  var getc = function() {
    if (index < str.length) {
      var c = str.charAt(index);
      index++;
      return c;
    }
    return false;
  }

  var ungetc = function ungetc() { index--; }

  // Public
  var get = function() {
    var c, token, val;

    function isOp(c)   { return c.match(/[ &|()]/); }
    function isText(c) { return !isOp(c);           }

    if (lookahead) {
      token     = lookahead;
      lookahead = false;

      return token;
    }

    if (!(val = c = getc())) {
      token = new Token("EOF", "EOF");
    } else if (isText(c)) {
      while((c = getc()) && isText(c)) {
        val += c;
      }
      token = new Token("STR", val);
    } else if (c == " ") {
      c = getc();
      if (!c) {
        token = new Token("EOF", "EOF");
      } else if (isOp(c)) {
        token = new Token(c, c);
        while((c = getc()) && (c == ' '));
      } else {
        token = new Token("&", "&");
      }
    } else if (isOp(c)) {
        token = new Token(c, c);
        while((c = getc()) && (c == ' '));
    } else {
      console.log("BUG: Unknown case");
      token = new Token("EOF", "EOF");
    }

    if (c) ungetc();

    return token;
  }

  var peek = function() {
    lookahead = get();

    return lookahead;
  }

  return {
    get : get,
    peek: peek
  }
}

var Exp = function(type, op1, op2) {
  if (type == "&"    ) { return function(context) { return op1(context) && op2(context); } }
  if (type == "|"    ) { return function(context) { return op1(context) || op2(context); } }
  if (type == "TRUE" ) { return function(context) { return true                        ; } }
  if (type == "FALSE") { return function(context) { return false                       ; } }
  if (type == "STR"  ) { return function(context) { return context.search(op1) != -1   ; } }
}

function makeMatcher(tokenizer) {
  var token = tokenizer.get();
  var subExp, lookahead;

  if      (token.type == "(")   { subExp = makeMatcher(tokenizer);    }
  else if (token.type == "STR") { subExp = new Exp("STR", token.val); }
  else                          { return new Exp("TRUE");             }

  lookahead = tokenizer.peek();

  if (lookahead.type == "EOF") { return subExp; }
  if (lookahead.type == ")")
  {
    tokenizer.get();
    return subExp;
  }

  tokenizer.get();

  return new Exp(lookahead.type, subExp, makeMatcher(tokenizer));
}

function match(pattern, context)
{
  var tokenizer = new Tokenizer(pattern);
  var matcher = makeMatcher(tokenizer);

  return matcher(context);
}
////////////////////////// End Pattern matcher ///////////////////////////

var Table = React.createClass({
    render: function render() {
        var _self = this;

        var thead = React.DOM.thead({},
            React.DOM.tr({},
                this.props.cols.map(function (col) {
                    return React.DOM.th({}, col);
            })));

        var tbody = this.props.rows.map(function (row) {
            return React.DOM.tr({},
            _self.props.cols.map(function (col) {
                return React.DOM.td({}, row[col] || "");
            }));
        });

        return React.DOM.table(null, [thead, tbody]);
    }

});

function drawPieChart(ctx, width, title, stats) {
  var i;

  var x = y = radius = width / 4;

  colors = new Array("DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOrange",
      "DarkRed", "DarkSalmon");

  function drawTitle() {
    ctx.font ="12px Courier";
    ctx.textAlign = "center";
    ctx.fillText(title, width / 2, 12);
  }

  drawLegend = function() {
    var x = width * (2/3), y = 24, i;

    ctx.font ="12px Courier";
    ctx.textAlign = "start";

    i = 0;
    for (var key in stats) {
      if (stats.hasOwnProperty(key) && key != "total") {
        var fraction = stats[key] / stats["total"];
        ctx.fillStyle = colors[i];
        ctx.fillText(key + " " + Math.ceil(fraction * 100) + "%", x, y);
        y += 12;
        i++;
      }
    }
  }

  function drawWedge(sAngle, eAngle, color) {
    function rad_to_deg(rad) { return 180 / Math.PI * rad; }

    //console.log("draw: x= " + x + " y= " + y + " sAngle= " + rad_to_deg(sAngle) + " eAngle= "
    //    + rad_to_deg(eAngle) + " diff: " + rad_to_deg(eAngle - sAngle) + " color= " + color);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, sAngle, eAngle);
    ctx.closePath();
    ctx.fill();
  }

  function drawPie() {
    var sAngle = 0;

    var idx = 0;
    for (var key in stats) {
      if (stats.hasOwnProperty(key) && key != "total") {
        var fraction = stats[key] / stats["total"];
        //console.log("stats[" + key + "] = " + stats[key] + " fraction: " + fraction);
        var eAngle = sAngle + fraction * 2 * Math.PI;

        drawWedge(sAngle, eAngle, colors[idx]);

        sAngle = eAngle;
        idx++;
      }
    }
  }

  drawTitle();
  drawLegend();
  drawPie();
}
///////////////////////////////////// END PIE CHART

var MovieCollectionApp = React.createClass({
    getInitialState: function() {
      return {data: [], stats: []};
    },

  loadMoviesFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
     });
    },

  componentDidMount: function() {
    this.loadMoviesFromServer();
    setInterval(this.loadMoviesFromServer, this.props.pollInterval);
  },

  handleMovieSubmit: function(movie) {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: movie,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  render: function() {
    return (
      <div className="movieCollectionApp">
        <h1>Movie Manager</h1>
        <MovieForm onMovieSubmit={this.handleMovieSubmit} />
        <hr />
        <MovieTable data={this.state.data} />
        <MovieAnalytics data={this.state.data}/>
      </div>
    );
  }
});

var MovieTable = React.createClass({
  getInitialState: function() {
    return {pattern: ""};
  },

  handleMovieSearch: function (pattern) {
    this.setState({pattern: pattern.toLowerCase()});
  },

  render: function() {
    var movies=this.props.data;
    var tableCols=["Title", "Genre", "Actors", "Year", "Rating"];

    function compare(row1, row2) {
      return row1.Title.localeCompare(row2.Title);
    }

    function filter(rows, pattern) {
      if (!pattern) return rows;


      for(i = 0, j = 0, filteredRows = []; i < rows.length; i++) {

        function preprocess(row) {
          concat = "";

          for(field in row) {
            concat += row[field];
          }

          return concat.trim().toLowerCase().replace(/ +/, " ");
        }

        var preprocessed = preprocess(rows[i]);
//        var match = preprocess(rows[i]).search(preprocess(pattern));
        var isMatch = match(preprocess(pattern), preprocess(rows[i]));

        if (isMatch) {
          filteredRows[j] = rows[i];
          j++;
        }
      }

      return filteredRows;
    }

    for(i = 0, tableRows = []; i < movies.length; i++) {
      tableRows[i]={
        Title  : movies[i].title,
        Genre  : movies[i].genre,
        Actors : movies[i].actors,
        Year   : movies[i].year,
        Rating : movies[i].rating,
      }
    }


    tableRows.sort(compare);

    tableRows = filter(tableRows, this.state.pattern);

    return (
      <div className="movieTable">
        <MovieSearch onMovieSearch={this.handleMovieSearch} />
        <br/>
        <Table cols={tableCols} rows={tableRows}/>
      </div>
    );
  }
});

var Movie = React.createClass({
  render: function() {
    return (
      <div className="movie">
        <h3 className="movieTitle">
          {this.props.title}
        </h3>
        {this.props.genre}, {this.props.actors}, {this.props.year}, {this.props.rating}
      </div>
    );
  }
});

var MovieForm = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var title = React.findDOMNode(this.refs.title).value.trim();
    var genre = React.findDOMNode(this.refs.genre).value.trim();
    var actors = React.findDOMNode(this.refs.actors).value.trim();
    var year = React.findDOMNode(this.refs.year).value.trim();
    var rating = React.findDOMNode(this.refs.rating).value.trim();

    if (!title || !genre || !actors || !year || !rating) {
      return;
    }

    this.props.onMovieSubmit({title: title, genre: genre, actors: actors, year: year, rating: rating});

    React.findDOMNode(this.refs.title).value = '';
    React.findDOMNode(this.refs.genre).value = '';
    React.findDOMNode(this.refs.actors).value = '';
    React.findDOMNode(this.refs.year).value = '';
    React.findDOMNode(this.refs.rating).value = '';
    return;
  },

  render: function() {
    return (
      <div className="newMovie">
        <h3>Add New Movie</h3>
        <form className="movieForm" onSubmit={this.handleSubmit}>
          <input type="text" placeholder="Title" ref="title" />
          <input type="text" placeholder="Genre" ref="genre" />
          <input type="text" placeholder="Actors" ref="actors"/>
          <input type="text" placeholder="Year" ref="year" />
          <input type="text" placeholder="Rating" ref="rating"/>
          <input type="submit" value="Add" />
        </form>
      </div>
    );
  }
});

var MovieSearch = React.createClass({
  incSearch: function() {
    var pattern = React.findDOMNode(this.refs.pattern).value.trim();

    this.props.onMovieSearch(pattern);
  },


  handleSearch: function(e) {
    e.preventDefault();

    this.incSearch();

    return;
  },

  componentDidMount: function() {
    setInterval(this.incSearch, 500);
  },

  render: function() {
    return (
      <div className="newMovie">
        <h3>Search</h3>
        <p><b>Enter a partial title, genre, actor, year or rating or an expression. Examples:</b></p>
        <ul>
          <li>corio</li>
          <li>corio & 2004</li>
          <li>(scifi | drama) & ralph</li>
        </ul>
        <form className="movieSearch" onSubmit={this.handleSearch}>
          <input type="search" onsearch={this.handleSearch} ref="pattern" />
        </form>
      </div>
    );
  }
});

var MovieAnalytics = React.createClass({

  render: function() {
    return (
      <div className="movieAnalytics">
        <hr />
        <h3>Analytics</h3>
        <MovieGenreAnalytics data={this.props.data} />
      </div>
    );
  }
});

var MovieGenreAnalytics = React.createClass({

  componentDidMount: function() {
    var context = this.getDOMNode().getContext('2d');
    this.paint(context);
  },

  componentDidUpdate: function() {
    var context = this.getDOMNode().getContext('2d');
    context.clearRect(0, 0, 200, 200);
    this.paint(context);
  },

  paint: function(context) {
    var movies=this.props.data;
    var stats = {};

    console.log("Computing genre stats");
    stats.total = 0;
    for (var i = 0; i < movies.length; i++) {
      var genre = movies[i].genre;

      stats[genre] = (stats.hasOwnProperty(genre) ? stats[genre] + 1 : 1);
      stats.total++;
    }

    for (var key in stats) {
      if (stats.hasOwnProperty(key)) {
        console.log("key: " + key + " val: " + stats[key]);
      }
    }

    console.log("total: " + stats.total);

    context.save();
    drawPieChart(context, 400, "Genres", stats);
    context.restore();
  },

  render: function() {
    return <canvas width={400} height={200} />
  }
});

React.render(
  <MovieCollectionApp url="movies.json" pollInterval={2000} />,
  document.getElementById('content')
);
