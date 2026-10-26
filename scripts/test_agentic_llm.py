import urllib.request
import json

def test_api(name, url, method="GET", data=None):
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8") if data else None,
            headers={"Content-Type": "application/json"} if data else {},
        )
        res = urllib.request.urlopen(req)
        body = json.loads(res.read().decode("utf-8"))
        print(f"[OK] {name}: Status {res.status}")
        return body
    except Exception as e:
        print(f"[ERROR] {name}: {e}")
        return None

if __name__ == "__main__":
    print("=== TESTING AGENTIC AI & MULTI-LLM SYSTEM ===")
    
    # 1. Test LLM Status
    status = test_api("LLM Status", "http://127.0.0.1:8000/api/agent/llm/status")
    if status:
        print(f"   Active Provider: {status.get('provider')} | Model: {status.get('model')}")
        print(f"   Available Providers: {[p['name'] for p in status.get('available_providers', [])]}")

    # 2. Test Conversational Chat Agent
    chat_resp = test_api(
        "Chat with Agent",
        "http://127.0.0.1:8000/api/agent/chat",
        method="POST",
        data={"message": "Can you explain how ProveIt autonomously deploys GitHub repositories to EC2 and self-heals failures?"}
    )
    if chat_resp:
        print(f"   Agent Reply ({chat_resp.get('provider')}): {chat_resp.get('reply')[:140]}...")

    # 3. Test Agentic Repo Stack Analyzer on FastAPI
    analysis = test_api(
        "Agentic Repo Analyzer: fastapi/fastapi",
        "http://127.0.0.1:8000/api/agent/analyze",
        method="POST",
        data={"repo_url": "https://github.com/fastapi/fastapi"}
    )
    if analysis:
        print(f"   Repository: {analysis.get('repository')}")
        print(f"   Framework: {analysis.get('framework')} | Port: {analysis.get('port')}")
        print(f"   AI Architecture Evaluation: {analysis.get('agent_summary')}")
        print(f"   Autonomous Readiness Score: {analysis.get('readiness_score')}%")
        print(f"   Security Audit: {analysis.get('security_audit')}")
        print(f"   Recommended Health Endpoint: {analysis.get('health_endpoint')}")

    # 4. Test Dynamic LLM Switching to Groq / OpenAI compatible
    config_resp = test_api(
        "Switch LLM to Groq",
        "http://127.0.0.1:8000/api/agent/llm/configure",
        method="POST",
        data={"provider": "groq", "model": "llama-3.3-70b-versatile"}
    )
    if config_resp:
        print(f"   Configured: {config_resp.get('message')}")
