# Muon Documentation

This is the documentation project for all of the Muon projects and an overall guide, designed to be published via Github pages

Each of the projects will upload their documentation to here as part of their release process every time a new shapshot or
release artifact is produced. The entire documentation site will then be regenerated.

Outside of the components, the central guide is located only here and should be edited in place.

You can see the documentation site at http://muoncore.io

## Building

This site uses Jekyll for development. Since we use a variety of Jekyll plugins that aren't compatible with Github,
the site needs to be fully built locally before being pushed to Github.

First, install deps using

```
make setup
```

This can be built locally by running 

```bash
make
```

This will run and start Jekyll ready for documentation editing.
