from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/test')
def test():
    return jsonify({'data': ['a', 'b', 'c']})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=False)