from flask import Flask, request, jsonify
import sqlite3, os, subprocess
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecret123'   # hardcoded secret
app.config['DEBUG'] = True                     # debug in prod
CORS(app)                                      # wildcard CORS

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = conn.execute(query).fetchone()
    return jsonify({"user": result})

@app.route('/run', methods=['POST'])
def run_command():
    cmd = request.json.get('cmd')
    output = subprocess.run(cmd, shell=True, capture_output=True)  # command injection
    return jsonify({"output": output.stdout.decode()})

if __name__ == '__main__':
    app.run(debug=True)
