 External Frameworks
- None. I studied the React tutorial and modified the example to manage movies
- There's a server component, server.go, that I modified to support movies
  (rather than the comment-list required by the tutorial)

Quick-Start Guide:
- To use the app, start the server:
  $ go run movie-server.go

- Then, in Chrome, open http://localhost:3000

- To add movies, fill in the form and click Add

- To search for a movie, enter a partial title, genre, actor, or rating in
  the search box and press "return." If you leave the box empty and press
  enter, you will see a list of all the movies

Files
- movie-server.go   - A simple HTTP server that responds to POSTs about movies
- movies.json       - A list of movies maintained by the app
- started           - The date I started the challenge
- public/           - Files served by movie-server.go
  - base.css    - I added a style for tables
  - index.html  - Verbatim from the tutorial except it loads "challenge.js"
  - scripts/
    - challenge.js  - The React code that drives the app

