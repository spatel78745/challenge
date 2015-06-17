////////////////////////// Begin Pattern matcher ///////////////////////////
var AndExp = function(op1, op2) {
  this.op1 = op1;
  this.op2 = op2;
  this.eval = function(context) {
    var that = this;

    return that.op1.eval(context) && that.op2.eval(context);
  }
};

var OrExp = function(op1, op2) {
  this.op1 = op1;
  this.op2 = op2;

  this.eval = function(context) {
    var that = this;

    return that.op1.eval(context) || that.op2.eval(context);
  }
};

var StrExp = function(op1) {
  this.op1 = op1;

  this.eval = function(context) {
    var that = this;

    return context.search(that.op1) != -1
  }

  this.getOps = function() {
    var that = this;

    return that.op1;
  }
}

var TrueExp = function() {
  this.eval = function(context) {
    return true;
  }
}

var FalseExp = function() {
  this.eval = function(context) {
    return false;
  }
}

var Tokenizer = function(str) {
  this.str = str;
  this.lexemes = str.split(" ");
  this.index = 0;

  this.peek = function() {
    var that = this;

    if (that.index >= that.lexemes.length) return { type: "EOF", val: "" };

    var lexeme = that.lexemes[that.index];
    var c = lexeme.charAt(0);

    if      (c == '&') token = { type: "AND"   , val: "&"    } ;
    else if (c == '|') token = { type: "OR"    , val: "|"    } ;
    else if (c == '(') token = { type: "OPEN"  , val: "("    } ;
    else if (c == ')') token = { type: "CLOSE" , val: ")"    } ;
    else               token = { type: "STR"   , val: lexeme } ;

    return token;
  }

  this.get = function() {
    var that = this;

    token = that.peek();
    if (token.type != "EOF") that.index++;

    return token;
  }

  this.getStr = function() {
    var that = this;

    return that.str;
  }
}

function makeMatcher(tokenizer)
{

  var token = tokenizer.get();
  console.log("token: " + token.type + " " + token.val);
  var subExp;

  if (token.type == "OPEN") {
    console.log("Start parenthesized expression");
    subExp = makeMatcher(tokenizer);
  } else if (token.type == "STR") {
    subExp = new StrExp(token.val);
    console.log("new StrExp: " + subExp.getOps());
  } else {
    console.log("Error: expected string or parenthesis, got [ " + token.val + " ]");
    return new TrueExp();
  }

  var lookahead = tokenizer.peek();
  console.log("lookahead: " + lookahead.type + " " + lookahead.val);

  if (lookahead.type == "EOF")
  {
    console.log("No more tokens");
    return subExp;
  }

  if (lookahead.type == "CLOSE")
  {
    console.log("End parenthesized expression");
    tokenizer.get();
    return subExp;
  }

  if (lookahead.type == "STR") {
    return new AndExp(subExp, makeMatcher(tokenizer));
  }

  tokenizer.get();

  if (lookahead.type == "AND") {
    return new AndExp(subExp, makeMatcher(tokenizer));
  }

  if (lookahead.type == "OR") {
    return new OrExp(subExp , makeMatcher(tokenizer));
  }
}

function match(pattern, context)
{
  var tokenizer = new Tokenizer(pattern);
  var matcher = makeMatcher(tokenizer);

  return matcher.eval(context);
}
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
////////////////////////// End Pattern matcher ///////////////////////////

var MovieCollectionApp = React.createClass({
    getInitialState: function() {
      return {data: []};
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
    console.log("pattern: " + pattern);

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
        <h4>Enter a partial title, genre, actor, year or rating</h4>
        <form className="movieSearch" onSubmit={this.handleSearch}>
          <input type="search" onsearch={this.handleSearch} ref="pattern" />
        </form>
      </div>
    );
  }
});

React.render(
  <MovieCollectionApp url="movies.json" pollInterval={2000} />,
  document.getElementById('content')
);
