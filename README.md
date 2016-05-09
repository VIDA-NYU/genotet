Genotet
=======

**Master Build Status**
[![Master Build Status](https://travis-ci.org/ViDA-NYU/genotet.svg?branch=master)](https://travis-ci.org/ViDA-NYU/genotet)

**Development Build Status**
[![Development Build Status](https://travis-ci.org/ViDA-NYU/genotet.svg?branch=refactor)](https://travis-ci.org/ViDA-NYU/genotet)
[![Code Climate](https://codeclimate.com/github/ViDA-NYU/genotet/badges/gpa.svg)](https://codeclimate.com/github/ViDA-NYU/genotet)

An Interactive Web-based Visual Exploration Framework to Support Validation of Gene Regulatory Networks


Installation:

- Install [node.js](https://nodejs.org/en/) and [JRE](http://www.java.com/) on your machine.
- Put the genotet folder to your server web directory, or your localhost web directory (e.g. xampp).
- Install required packages for the web pages.
    ```bash
    # at genotet/
    npm install
    ```

- Install required packages in the server folder.

    ```bash
    # at genotet/
    cd server
    # now at genotet/server
    npm install
    ```

- Create and edit a server configuration file to set the data paths. The file shall be located at _genotet/server/config_.

    ```
    mongoDatabase = genotet
    origin = {server_url}
    dataPath = .../genotet_data/data/
    bigWigToWigPath = .../genotet_data/bigWigToWig
    ```

- Run the setup script. The script downloads the UCSC bigWigToWig tool. Note that the default version is for linux x86_64.
If you are on a Mac or Windows machine, you need to change the downloading url in setup.sh.

    ```
    bash setup.sh
    ```

- Run the server.

    ```
    bash start.sh
    ```
