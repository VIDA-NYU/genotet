Genotet
=======

**Master Build Status**
[![Master Build Status](https://travis-ci.org/ViDA-NYU/genotet.svg?branch=master)](https://travis-ci.org/ViDA-NYU/genotet)

**Development Build Status**
[![Development Build Status](https://travis-ci.org/ViDA-NYU/genotet.svg?branch=refactor)](https://travis-ci.org/ViDA-NYU/genotet)
[![Code Climate](https://codeclimate.com/github/ViDA-NYU/genotet/badges/gpa.svg)](https://codeclimate.com/github/ViDA-NYU/genotet)

An Interactive Web-based Visual Exploration Framework to Support Validation of Gene Regulatory Networks


Installation:

- Install  and [JRE](http://www.java.com/) on your machine.
- Install Node.js [for for OS X (x64)](https://nodejs.org/en/) or [via package manager](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions):
    ```
    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
- Install [MongoDB](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/):
    ```bash
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
    echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    ```

- Put the genotet folder to your server web directory, or your localhost web directory (e.g. xampp).
- Configure the Apache Web Server:
    ```
    <VirtualHost *:80>
      ServerName your_server_name
      RewriteEngine On
      RewriteCond %{HTTPS} off
      RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI}
    </VirtualHost>

    <VirtualHost *:443>
      ServerName your_server_name
      ServerAdmin your_email

      ServerSignature On
      SSLCertificateFile .../crt.pem
      SSLCertificateKeyFile .../key.pem
      SSLEngine On

      DocumentRoot /var/www/html/genotet

      <Directory /var/www/html/genotet/>
        Require all granted
      </Directory>

      ErrorLog ${APACHE_LOG_DIR}/error.log
      CustomLog ${APACHE_LOG_DIR}/access.log combined
    </VirtualHost>
    ```
- Install required packages for the web pages.
    ```bash
    # at genotet/
    npm install
    bower install
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
    dataPath = .../genotet_data/data/
    bigWigToWigPath = .../genotet_data/bigWigToWig
    privateKeyPath = .../key.pem
    certificatePath = .../crt.pem
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
