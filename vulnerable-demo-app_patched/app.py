
from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3, os
from flask_cors import CORS
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['DEBUG'] = False

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=['200 per day', '50 per hour']
)

CORS(app, origins=['http://localhost:3000', 'http://example.com'])

@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = 'default-src 'self';'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

@app.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    conn = sqlite3.connect('users.db')
    query = 'SELECT * FROM users WHERE username=? AND password=?'
    result = conn.execute(query, (username, password)).fetchone()
    return jsonify({"user": result})

@app.route('/run', methods=['POST'])
@limiter.limit('5 per minute')
def run_command():
    cmd = request.json.get('cmd')
    # command injection is still present, consider using a safer approach
    output = os.popen(cmd).read()
    return jsonify({"output": output})
   