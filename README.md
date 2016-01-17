Genotet
=======

**Master Build Status**
[![Master Build Status](https://travis-ci.org/ViDA-NYU/genotet.svg?branch=master)](https://travis-ci.org/ViDA-NYU/genotet)

**Development Build Status**
[![Development Build Status](https://travis-ci.org/ViDA-NYU/genotet.svg?branch=refactor)](https://travis-ci.org/ViDA-NYU/genotet)

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
    networkPath = .../genotet_data/network/
    bindingPath = .../genotet_data/binding/
    expressionPath = .../genotet_data/expression/
    bigWigToWigPath = .../genotet_data/bigWigToWig
    uploadPath = .../genotet_data/upload/
    bedPath = .../genotet_data/bed/
    ```

- Run the setup script.

    ```
    bash setup.sh
    ```

- Run the server.

    ```
    node server/server.js
    ```
