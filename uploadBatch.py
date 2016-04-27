# This is a python script for uploading batch data to Genotet server.
# The user may write a *.tsv file, with each line as:
#       file_path data_name file_type description
# The command line would be:
#       python uploadBatch.py username example.tsv
# And then enter your password for Genotet.

from requests_toolbelt import MultipartEncoder
import requests
import sys
import getpass
import json

url = 'http://localhost:3000' # Please change it accordingly.

def upload_file(file_path, data_name, file_type, description, cookies):
    upload_url = url + '/genotet/upload'
    file_path_parts = file_path.split('\/')
    file_name = file_path_parts[len(file_path_parts) - 1]
    params = MultipartEncoder(
        fields={'type': file_type,
                'name': data_name,
                'description': description,
                'username': 'anonymous',
                'file': (file_name, open(file_path, 'rb'), 'text/plain')})
    headers = {'Content-Type': params.content_type}
    cookie = {'genotet-session': cookies['genotet-session']}
    response = requests.post(upload_url, data=params, headers=headers, cookies=cookie)
    print response.status_code
    return True


def auth(username, password):
    auth_url = url + '/genotet/user'
    params = {
        'type': 'sign-in',
        'username': username,
        'password': password
    }
    params = {'data': json.dumps(params)}
    response = requests.get(auth_url, params=params)
    if response.status_code != 200:
        return False
    return response.cookies, True
    

def main(argv):
    if len(argv) < 3:
        print 'input not enough'
        return
    username = argv[1]
    password = getpass.getpass('Password:')
    cookies, auth_result = auth(username, password)
    if not auth_result:
        print 'username/password not correct'
        return
    else:
        print 'sign in success'
    file_path = argv[2]
    tsv_file = open(file_path, 'r')
    for line in tsv_file:
        parts = line.split('\t')
        result = upload_file(parts[0], parts[1], parts[2], parts[3], cookies)
        if not result:
            print 'failed to upload ' + parts[0]
            return

if __name__ == '__main__':
    main(sys.argv)
