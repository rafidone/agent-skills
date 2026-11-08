# Feature: saved searches

Saved searches touch four layers:

- A new `saved_searches` table with owner, name, and serialized filters.
- An API for create, list, re-run, and delete.
- A web UI to save the current search and show a list.
- An email digest that links to a saved search.

Constraints:

- The table must be added without downtime.
- The feature must be dark until the UI is ready.
- The email digest ships one release later.
- The current search flow must keep working throughout.
