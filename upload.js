#!/usr/bin/env node

const fs = require('fs');
const https = require('http')
const http = require('http')
const request = require('request')
const path = require('path')
const url = require('url')
const { exec } = require("child_process");
const { log } = require('console');


let appPath = process.argv[2];
let gatewayUrl = process.argv[3]
let qyrus_username = process.argv[4];
let qyrus_password = process.argv[5];
let qyrus_team_name = process.argv[6];
let qyrus_project_name = process.argv[7];
let qyrus_test_name = process.argv[8];
let environment_name = process.argv[9];
let component_web = process.argv[10];
let component_mobility = process.argv[11];
let enable_debug = process.argv[12];
let browser_name = process.argv[13];
let operating_system = process.argv[14];
let email_id = process.argv[15];
let app_activity = process.argv[16];
let bundle_id = process.argv[17];
let device_pool_name = process.argv[18];
let upload_app = process.argv[19];
let device_name = process.argv[20];

const gatewayURLParse = new URL(gatewayUrl);
let host_name = gatewayURLParse.hostname;
let port = gatewayURLParse.port;
let pathName = gatewayURLParse.pathname;

// testing parameters
if ( appPath == null || qyrus_username == null || qyrus_password == null || appPath == null || gatewayUrl == null ) {
    console.log('ERROR : One or more parameters are invalid');
    process.exitCode = 1;
}

if ( app_activity == null ) {
    app_activity = '';
}

if ( bundle_id == null ) {
    bundle_id = '';
}

if ( environment_name == null ) {
    environment_name = 'Global';
}

if ( enable_debug == 'yes' ) {
    console.log('******* QYRUS Cloud - INPUT PARAMETERS *******');
    console.log('App Path :',appPath);
    console.log('Username :',qyrus_username);
    console.log('Password :',qyrus_password);
    console.log('Team Name :',qyrus_team_name);
    console.log('Project Name :',qyrus_project_name);
    console.log('Test Name :',qyrus_test_name);
    console.log('App Activity :',app_activity);
    console.log('Bundle ID :',bundle_id);
    console.log('Device Pool Name :',device_pool_name);
    console.log('Host Name :',host_name);
    console.log('Port :',port);
    console.log('Path Name :',pathName);
    console.log('Upload App :',upload_app);
    console.log('Device Name :',device_name);
    console.log('Email ID :',email_id);
    console.log('Component Web :',component_web);
    console.log('Component Mobility :',component_mobility);
}

var appName = '';
//upload the app
if ( upload_app === 'yes' ) {
    if ( fs.existsSync(appPath) ) {
        request.post({
            url: gatewayUrl+pathName+"/uploadApp",
            formData: {
                file: fs.createReadStream(appPath),
                uploadUserName: qyrus_username,
                uploadEncodedPassword: qyrus_password,
                teamName: qyrus_team_name,
                projectName: qyrus_project_name
            },
        }, function(error, response, body) {
            if (response.statusCode!=200) {
                console.log('Failed to upload app! Try again.');
                return;
            } else {
            //get the appName
            appName = path.parse(appPath).base;
            console.log("App - "+appName+" uploaded to Qyrus successfully!");
            
            //trigget the run
            runTrigger();
            }
        });
    } else {
        console.log('App not found in artifacts!');
        return;
    }
} else {
    appName = path.parse(appPath).base;
    runTrigger();
} 

//Test trigger method
function runTrigger ( ) {
    let apiCallConfig = {
        host: host_name,
        port: port,
        path: pathName+'/componentTestTrigger',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    
    let testObject = {
        "userName": qyrus_username,
        "encodedPassword": qyrus_password,
        "teamName": qyrus_team_name,
        "projectName": qyrus_project_name,
        "testName": qyrus_test_name,
        "operatingSystem": operating_system,
        "browser": browser_name,
        "componentWeb" : component_web,
        "componentMobility" : component_mobility,
        "envName": environment_name,
        "emailId": email_id
    }
    var reqPost = https.request ( apiCallConfig, function(response) {
        if (response.statusCode != 200) {
            console.log("Failed to run test, Try again.");
            process.exitCode = 1;
            return;
        }
        console.log('\x1b[32m%s\x1b[0m','Triggerd the test suite ', qyrus_test_name,' Successfully!');
        let responseBody = '';
        response.on('data', chunk => {
            responseBody += chunk.toString();
        });
        response.on('end', () => {
            console.log('\x1b[32m%s\x1b[0m','Execution of test suite ', qyrus_test_name,' is in progress.');
            checkExecStatus(responseBody);
        });
    });
    reqPost.on('error', function(error) {
        console.log('Error making api request, try again.', error);
        process.exitCode = 1;
        return;
    });
    reqPost.write(JSON.stringify(testObject));
    reqPost.end();
}

//method to check the execution status
function checkExecStatus (testRunResponseBody) {
    let apiCallConfig = {
        host: host_name,
        port: port,
        path: pathName+'/checkExecutionStatus',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    var reqPost = https.request(apiCallConfig, function(response) {
        if(response.statusCode!=200){
            console.log('Failed to run check execution status fully, Try again.');
            process.exitCode = 1;
            return;
        }
        let responseBody = '';
        response.on('data', chunk => {
            responseBody += chunk.toString(); // convert Buffer to string
        });
        response.on('end', () => {   
            var parsedJson = JSON.parse(responseBody);
                execStatusResponseBody = JSON.parse(testRunResponseBody);
                if(parsedJson.runStatus.trim() === "Completed"){
                    var executionId = parsedJson.testExecutionId;
                    responseBody.testExecutionId=execStatusResponseBody;
                    execStatusResponseBody.testExecutionId = executionId;
                    completedTest(JSON.stringify(execStatusResponseBody));
                    return;
                }
            else {
                setTimeout(() => {  checkExecStatus(testRunResponseBody); }, 30000);
            }
        });
    });
    reqPost.on('error', function(error) {
        console.log("Error in checking the execution status : "+error);
        process.exitCode = 1;
        return;
    });
    reqPost.write(testRunResponseBody);
    reqPost.end();
}

//run the below method if the test status is completed.
function completedTest (execStatusResponse) {
    let apiCallConfig = {
        host: host_name,
        port: port,
        path: pathName+'/checkExecutionResult?emailId='+email_id,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    var reqPost = https.request(apiCallConfig, function(response) {
        if(response.statusCode!=200){
            console.log('Failed to run test, Try again.');
            return;
        }

        let responseBody = '';
        response.on('data', chunk => {
            responseBody += chunk.toString(); // convert Buffer to string
        });
        response.on('end', () => {
            var parsedJson = JSON.parse(responseBody);
            if (parsedJson.finalStatus === 'Pass' ) {
                console.log('\x1b[32m%s\x1b[0m','Execution of test suite ',qyrus_test_name,' is now complete!');
                console.log('\x1b[32m%s\x1b[0m',"Test Passed! Click on the below link to download the run report");
                console.log('\x1b[34m%s\x1b[0m',parsedJson.report);
                exec('envman add --key QYRUS_TEST_REPORT_URL --value '+parsedJson.report, 
                function(error, stdout, stderr) {
                    if (error) {
                      console.log(error.code);
                    }
                });
                process.exitCode = 0;
                return;
            } else {
                console.log('\x1b[31m%s\x1b[0m','Execution of test suite ',qyrus_test_name,' is now complete!');
                console.log('\x1b[31m%s\x1b[0m',"Test Failed! Click on the below link to download the run report");
                console.log(parsedJson.report);
                exec('envman add --key QYRUS_TEST_REPORT_URL --value '+parsedJson.report, 
                function(error, stdout, stderr) {
                    if (error) {
                      console.log(error.code);
                    }
                });
                process.exitCode = 1;
                return;
            }
        });
    });
    reqPost.on('error', function(error) {
        console.log("Error in checking the execution status : "+error);
        process.exitCode = 1;
        return;
    });
    reqPost.write(execStatusResponse);
    reqPost.end();
}