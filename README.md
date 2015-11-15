Genotet
=======

Genotet: An Interactive Web-based Visual Exploration Framework to Support Validation of Gene Regulatory Networks


Installation:

- Install node.js on your machine.
- Put the genotet folder to your server web directory, or your localhost web directory (e.g. xampp).
- Install required packages in the server folder.

    ```
    cd server
    npm install
    ```

- Modify server/server.js to locate the data at correct directories.
- Run the server code.

    ```
    node server/server.js
    ```



A configuration file is needed to set the data paths. The file shall be located at _server/config_.
```
networkPath = .../genotet_data/network/
bindingPath = .../genotet_data/binding/
expressionPath = .../genotet_data/expression/
bigWigToWigPath = .../genotet_data/
uploadPath = .../genotet_data/upload/
```
