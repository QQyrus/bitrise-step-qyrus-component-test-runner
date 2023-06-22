#!/bin/bash
#set -ex
set -o pipefail

THIS_SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

npm install --prefix $THIS_SCRIPT_DIR fs --save --loglevel=error
npm install --prefix $THIS_SCRIPT_DIR https --save --loglevel=error
npm install --prefix $THIS_SCRIPT_DIR http --save --loglevel=error
npm install --prefix $THIS_SCRIPT_DIR request --save --loglevel=error
npm install --prefix $THIS_SCRIPT_DIR child_process --save --loglevel=error
npm install --prefix $THIS_SCRIPT_DIR url --save --loglevel=error

$THIS_SCRIPT_DIR/upload.js "${upload_path}" "${gateway_url}" "${qyrus_username}" "${qyrus_password}" "${qyrus_team_name}" "${qyrus_project_name}" "${qyrus_test_name}" "${environment_name}" "${component_web}" "${component_mobility}" "${enable_debug}" "${browser_name}" "${operating_system}" "${email_id}" "${app_activity}" "${bundle_id}" "${device_pool_name}" "${upload_app}" "${device_name}" || $?