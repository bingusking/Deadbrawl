# Deadbrawl

A 2D browser fighting game with three fighters (Vish, Rift, Jacob), a CPU mode, a training dummy and online matchmaking.

## Run locally

```
npm install
npm start
```

Then open http://localhost:3000. Open it in two tabs and pick **Online** in both to test matchmaking.

## Online play

The server pairs the first two players in the queue. Each player locks a different fighter. The first player in the queue hosts the fight and streams the game state to the second.

## Deploy

`render.yaml` sets this up as a free Render web service (`npm install`, then `node server.js`).
