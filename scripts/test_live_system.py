import urllib.request
import json

def test(name, url, method='GET', data=None):
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode('utf-8') if data else None,
            headers={'Content-Type': 'application/json'} if data else {}
        )
        res = urllib.request.urlopen(req)
        body = json.loads(res.read().decode('utf-8'))
        print(f"[OK] {name}: Status {res.status}")
        if isinstance(body, list):
            print(f"   Items returned from Supabase: {len(body)}")
        elif isinstance(body, dict):
            if 'runtime' in body:
                print(f"   Repository: {body.get('repository')}")
                print(f"   Runtime: {body.get('runtime')} | Framework: {body.get('framework')} | Port: {body.get('port')}")
                print(f"   Dependencies detected: {body.get('dependencies', [])[:5]}")
                print(f"   Dockerfile: {body.get('has_dockerfile')} ({body.get('dockerfile_base')})")
            else:
                print(f"   Data: {body}")
    except Exception as e:
        print(f"[ERROR] {name}: {e}")

if __name__ == '__main__':
    print("=== LIVE BACKEND + SUPABASE VERIFICATION ===")
    test("Infra Topology", "http://127.0.0.1:8000/api/agent/infra")
    test("Runs History (Supabase)", "http://127.0.0.1:8000/api/agent/runs")
    test("Proof Ledger (Supabase)", "http://127.0.0.1:8000/api/agent/ledger")
    test("EC2 Fleet (Supabase)", "http://127.0.0.1:8000/api/agent/ec2/instances")
    test("Analyze Public Repo: pallets/flask", "http://127.0.0.1:8000/api/agent/analyze", method='POST', data={'repo_url': 'https://github.com/pallets/flask'})
    test("Analyze Public Repo: fastapi/fastapi", "http://127.0.0.1:8000/api/agent/analyze", method='POST', data={'repo_url': 'https://github.com/fastapi/fastapi'})
