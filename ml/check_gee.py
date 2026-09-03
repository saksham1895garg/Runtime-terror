import ee
import json
import os
import traceback

try:
    # First, let's see if we can read the credential file directly.
    cred_path = os.path.expanduser('~/.config/earthengine/credentials')
    if os.path.exists(cred_path):
        with open(cred_path, 'r') as f:
            cred_data = json.load(f)
            # Find the client email if it's a service account, or just say it's user auth
            if 'client_email' in cred_data:
                print('Auth Method: Service Account (', cred_data['client_email'], ')')
            else:
                print('Auth Method: User OAuth Token (Refresh token present:', 'refresh_token' in cred_data, ')')
    else:
        print('No earthengine credentials file found at', cred_path)

    # Now try to initialize
    print('Testing ee.Initialize(project="unisaa")...')
    ee.Initialize(project='unisaa')
    print('Initialize SUCCESS.')
    val = ee.Number(1).getInfo()
    print('ee.Number(1).getInfo() ->', val)

except Exception as e:
    print('Test FAILED:', e)
