"use strict";

const home = require('os').homedir();
const userDataDir = home + "/ninjaqpcr";
console.log(userDataDir)
/*

  Ninja-qPCR Network configuration server
  
  It provides Wi-Fi configuration service.
  User interface files are stored in assets directory.
  URLs:
    /update : 
  */
const { exec } = require("child_process");
const http = require('http');
var URL = require('url');
const fs = require('fs');

const WPA_CONF_HEADER = "# Generated by Ninja-qPCR WiFi config tool.\n" +
  "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n" +
  "update_config=1\n" +
  "country=JP\n";
// TODO country

// Development env

const CMD_WPA = "./wpa_passphrase";
const PATH_WPA_CONF = "./wpa_supplicant.conf";
const PATH_WPA_CONF_TMP = "./wpa_supplicant_temp";
const PATH_CONF = userDataDir + "/network.json";
const SUDO = "";
const REBOOT = "true";
const PORT = 8080;


// RasPi
/*
const CMD_WPA = "wpa_passphrase";
const PATH_WPA_CONF = "/etc/wpa_supplicant/wpa_supplicant.conf";
const PATH_CONF = userDataDir + "/network.json";
const PATH_WPA_CONF_TMP = userDataDir + "/wpa_supplicant_temp";
const SUDO = "sudo";
const PORT = 80;
const REBOOT = "sudo reboot";
*/

class WifiConfServer {
  constructor () {
    this.conf = {};
  }
  saveConf (callback) {
    
  }
  loadConf (callback) {
    fs.readFile(PATH_CONF, (err, rawData)=>{
      try {
        this.conf = JSON.parse(rawData);
        console.log(this.conf);
        console.log("Start listening to port %d", PORT);
        callback();
      } catch (ex) {
        console.log(ex);
        callback();
      }
    });
  }
  init () {
    this.loadConf(()=>{
      console.log("Starting server");
      this.server = http.createServer();
      this.server.listen(PORT);
      this.server.on('request', (req, res)=>{
        const url = URL.parse(req.url).pathname;
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        try {
          if (url == "/list") {
            this.list(req, res);
          } else if (url == "/update") {
            this.update(req, res);
          } else if (url == "/reboot") {
            this.reboot(req, res);
          } else {
            this.responseStatic(url, res);
            
          }
        } catch (ex) {
          console.error(ex);
        }
      });
    });
  }
  
  responseStatic (url, res) {
    if (url == "/") {
      url = "/index.html"
    }
    fs.readFile("assets" + url, (err, rawData)=>{
      if (!err) {
        let contentType = 'text/html; charset=UTF-8';
        if (url.match(/\.css$/)) {
          contentType = 'text/css; charset=UTF-8';
        }
        res.writeHead(200,{'Content-Type': contentType});
        res.write(rawData);
      } else {
        res.writeHead(404,{'Content-Type': 'application/json'});
        res.write("Not found.");
      }
      res.end();
    });
  }
  list (req, res) {
    let resConf = JSON.parse(JSON.stringify(this.conf));
    if (resConf.networks) {
      for (let network of resConf.networks) {
        if (network.passphrase != null && network.passphrase.length > 0) {
          network.passphrase_dummy = "........";
        }
        delete network.passphrase;
      }
    }
    console.log(JSON.stringify(resConf));
    res.write(JSON.stringify(resConf));
    res.end();
  }
  
  reboot (req, res) {
    const content = {
      success:true
    };
    res.write(JSON.stringify(content));
    res.end();
    this.execCmd (REBOOT, ()=>{});
    
  }
  
  update (req, res) {
    req.on("data", (rawData)=>{
      const data = JSON.parse(rawData);
      let validNetworks = [];
      let validationErrors = [];
      let response = {};
      if (Array.isArray(data)) {
        for (let network of data) {
          console.log(network);
          if (this.isEmpty(network)) {
            // Skip empty data.
            continue;
          } else {
            const errors = this.validate(network);
            if (errors.length == 0) {
              // Valid network
              validNetworks.push(network);
            } else {
              validationErrors.push({
                id:network.id,
                errors: errors
              });
            }
          }
        }
        
        if (validNetworks.length == 0 && validationErrors.length == 0) {
          // Empty
          response.isValid = false;
          response.reason = "empty";
          response.message = "Please specify at least one SSID.";
        } else if (validationErrors.length) {
          // Has errors
          response.isValid = false;
          response.reason = "invalid";
          response.message = "Some fields have errors.";
          response.errors = validationErrors;
        } else {
          // One or more valid networks
          response.isValid = true;
        }
      } else {
        // Empty.
        response.isValid = false;
        response.message = "Invalid data format. It is caused by program error. Please contact the devepoper.";
        response.reason = "malformed";
      }
      console.log("Response")
      console.log(JSON.stringify(response));
      if (response.isValid) {
        this.saveNetworks(validNetworks, (error)=>{
          res.writeHead(200,{'Content-Type': 'application/json'});
          if (error) {
            response.isValid = false;
            response.reason = "save_failure";
            response.message = "Failed to save.";
          }
          res.write(JSON.stringify(response));
          res.end();
        });
      } else {
        res.writeHead(200,{'Content-Type': 'application/json'});
        res.write(JSON.stringify(response));
        res.end();
      }
    });
    
  }
  isEmpty (network) {
    return network.ssid == null || network.ssid.length == 0;
  }
  validate(network) {
    let errors = [];
    if (network.passphraseUpdated) {
      const pass = network.passphrase;
      if (pass != null && pass.length > 0 && (pass.length < 8 || pass.length > 63)) {
        errors.push({
          field:"passphrase",
          message:"Passphrase must be 8..63 characters."
        });
      }
    }
    if (network.priority && network.priority.length > 0) {
      const parsed = parseInt(network.priority);
      if (parsed < 0) {
        errors.push({
          networkId:network.id,
          field:"priority",
          message:"Priority should be a valid integer."
        });
      }
    }
    return errors;
  }
  saveNetworks (networks, callback) {
    // Copy fields (Other fields are deleted before saving)
    const fieldsToKeep = [
      "ssid" , "passphrase", "priority", "hidden"
    ];
    let saveData = {
      networks:[]
    };
    let wpaConfElements = [WPA_CONF_HEADER];
    for (let network of networks) {
      let lines = [];
      lines.push("network={");
      lines.push('ssid="' + this.escape(network.ssid) + '"');
      if (!network.isNew && !network.passphraseUpdated) {
        // Keep existing password
        const oldConf = this.conf.networks[network.id];
        network.passphrase = oldConf.passphrase;
      }
      lines.push('psk="' + this.escape(network.passphrase) + '"');
      if (network.priority) {
        lines.push("priority=" + network.priority)
      }
      if (network.hidden) {
        // Stealth
        lines.push("scan_ssid=1");
      }
      lines.push("}");
      wpaConfElements.push(lines.join("\n"));
      let obj = {};
      for (let field of fieldsToKeep) {
        if (network[field] != null) {
          obj[field] = network[field];
        }
      }
      saveData.networks.push(obj);
    }
    const wpaConfContent = wpaConfElements.join("\n");
    console.log(wpaConfContent)
    console.log(JSON.stringify(saveData));
    
    fs.writeFile(PATH_CONF, JSON.stringify(saveData), (err)=>{
      console.error(err);
      if (err != null) {
        callback(err);
        return;
      }
      fs.writeFile(PATH_WPA_CONF_TMP, wpaConfContent, (err)=>{
        console.error(err);
        if (err != null) {
          callback(err);
          return;
        }
        const command = SUDO + " cp -f " + PATH_WPA_CONF_TMP + " " + PATH_WPA_CONF + ";"
        this.execCmd(command, (err)=>{
          callback(err);
        });
      });
    });
  }
  escape (str) {
    if (str == null) return null;
    return str.replace(new RegExp("\"", "g"), "\\\"");
  }
  execCmd (command, callback) {
    console.log("Exec cmd: " + command);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        callback(error.message);
      }
      else if (stderr) {
        callback(stderr);
      } else {
        callback(null);
      }
    });
    
  }
}
new WifiConfServer().init();