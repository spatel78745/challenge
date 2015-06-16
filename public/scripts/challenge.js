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

    console.log("INITIAL STATE: " + this.state.pattern);

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
        var match = preprocess(rows[i]).search(preprocess(pattern));

        if (match != -1) {
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
  handleSearch: function(e) {
    e.preventDefault();

    var pattern = React.findDOMNode(this.refs.pattern).value.trim();
    console.log("pattern: " + pattern);

    this.props.onMovieSearch(pattern);

    return;
  },

  render: function() {
    return (
      <div className="newMovie">
        <h3>Search</h3>
        <h4>Enter a partial title, genre, actor, year or rating</h4>
        <form className="movieSearch" onSubmit={this.handleSearch}>
          <input type="search" incremental="incremental" onsearch={this.handleSearch} ref="pattern" />
        </form>
      </div>
    );
  }
});

React.render(
  <MovieCollectionApp url="movies.json" pollInterval={2000} />,
  document.getElementById('content')
);
