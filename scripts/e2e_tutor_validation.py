import asyncio
import json
import urllib.request
import urllib.error
import sys

BASE_PROXY_URL = "http://localhost:3000/api/v1/data/ai/tutor"

def post_json(payload):
    req = urllib.request.Request(
        BASE_PROXY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        status_code = response.status
        body = json.loads(response.read().decode("utf-8"))
        return status_code, body

def run_e2e_validations():
    print("=================================================================")
    print("🚀 RUNNING FULL END-TO-END VALIDATION SUITE FOR AI TUTOR")
    print("=================================================================\n")

    # -------------------------------------------------------------
    # 4. STRONG KNOWLEDGE PATH TEST
    # -------------------------------------------------------------
    print("--- 4. STRONG KNOWLEDGE PATH TEST ---")
    strong_query = "Which article of the Indian Constitution enshrines the Right to Constitutional Remedies?"
    status, res_strong = post_json({
        "message": strong_query,
        "exam": "UPSC_CSE",
        "subject": "POLITY"
    })
    print(f"Status: {status}")
    print(f"Confidence: {res_strong.get('confidence')}")
    print(f"Knowledge Used: {res_strong.get('knowledge', {}).get('used')}")
    print(f"Result Count: {res_strong.get('knowledge', {}).get('result_count')}")
    print(f"AI Model Used: {res_strong.get('ai', {}).get('used')}")
    print(f"AI Usage: {res_strong.get('ai', {}).get('usage')}")
    print(f"Answer Preview: {res_strong.get('answer', '')[:160]}...")
    print(f"Sources Count: {len(res_strong.get('knowledge', {}).get('sources', []))}")
    assert status == 200
    assert res_strong.get("confidence") == "STRONG"
    assert res_strong.get("knowledge", {}).get("used") is True
    assert res_strong.get("ai", {}).get("used") is False
    assert res_strong.get("ai", {}).get("usage") is None or res_strong.get("ai", {}).get("usage", {}).get("total_tokens", 0) == 0
    print("✅ Strong Knowledge Path Validated (0 Tokens Consumed)\n")

    # -------------------------------------------------------------
    # 5. WEAK KNOWLEDGE PATH TEST (With Real Gemini)
    # -------------------------------------------------------------
    print("--- 5. WEAK KNOWLEDGE PATH TEST ---")
    weak_query = "Green Energy Act solar and hydrogen infrastructure"
    status, res_weak = post_json({
        "message": weak_query
    })
    print(f"Status: {status}")
    print(f"Confidence: {res_weak.get('confidence')}")
    print(f"Knowledge Used: {res_weak.get('knowledge', {}).get('used')}")
    print(f"Result Count: {res_weak.get('knowledge', {}).get('result_count')}")
    print(f"AI Model Used: {res_weak.get('ai', {}).get('used')}")
    print(f"AI Provider: {res_weak.get('ai', {}).get('provider')}")
    print(f"AI Usage: {res_weak.get('ai', {}).get('usage')}")
    print(f"Answer Preview: {res_weak.get('answer', '')[:160]}...")
    print(f"Sources Grounding Count: {len(res_weak.get('knowledge', {}).get('sources', []))}")
    assert status == 200
    assert res_weak.get("confidence") == "WEAK"
    assert res_weak.get("knowledge", {}).get("used") is True
    assert res_weak.get("ai", {}).get("used") is True
    assert res_weak.get("ai", {}).get("usage") is not None
    print("✅ Weak Knowledge Path Validated (Gemini Called with Context Grounding)\n")

    # -------------------------------------------------------------
    # 6. NO-KNOWLEDGE PATH TEST
    # -------------------------------------------------------------
    print("--- 6. NO-KNOWLEDGE PATH TEST ---")
    none_query = "Explain the rules of cricket, LBW law, and the role of the third umpire in modern test matches."
    status, res_none = post_json({
        "message": none_query
    })
    print(f"Status: {status}")
    print(f"Confidence: {res_none.get('confidence')}")
    print(f"Knowledge Used: {res_none.get('knowledge', {}).get('used')}")
    print(f"Result Count: {res_none.get('knowledge', {}).get('result_count')}")
    print(f"AI Model Used: {res_none.get('ai', {}).get('used')}")
    print(f"AI Provider: {res_none.get('ai', {}).get('provider')}")
    print(f"AI Usage: {res_none.get('ai', {}).get('usage')}")
    print(f"Sources Count: {len(res_none.get('knowledge', {}).get('sources', []))}")
    assert status == 200
    assert res_none.get("confidence") == "NONE"
    assert res_none.get("knowledge", {}).get("used") is False
    assert res_none.get("ai", {}).get("used") is True
    assert len(res_none.get("knowledge", {}).get("sources", [])) == 0
    print("✅ No-Knowledge Path Validated (AI Generated without Fake Citations)\n")

    # -------------------------------------------------------------
    # 7. FORCE_AI TEST
    # -------------------------------------------------------------
    print("--- 7. FORCE_AI TEST ---")
    status, res_force = post_json({
        "message": strong_query,
        "exam": "UPSC_CSE",
        "subject": "POLITY",
        "force_ai": True
    })
    print(f"Status: {status}")
    print(f"Confidence: {res_force.get('confidence')}")
    print(f"Knowledge Used: {res_force.get('knowledge', {}).get('used')}")
    print(f"AI Model Used: {res_force.get('ai', {}).get('used')}")
    print(f"AI Usage: {res_force.get('ai', {}).get('usage')}")
    print(f"Sources Grounding Count: {len(res_force.get('knowledge', {}).get('sources', []))}")
    assert status == 200
    assert res_force.get("knowledge", {}).get("used") is True
    assert res_force.get("ai", {}).get("used") is True
    assert res_force.get("ai", {}).get("usage") is not None
    print("✅ FORCE_AI Validated (Override Respected with Grounded Context)\n")

    # -------------------------------------------------------------
    # 8. PROVIDER FAILURE HANDLING (Mock Provider Simulation)
    # -------------------------------------------------------------
    print("--- 8. PROVIDER FAILURE HANDLING TEST ---")
    for sim_mode in ["quota_exceeded", "rate_limit", "unavailable", "auth_error"]:
        status, res_fail = post_json({
            "message": "Explain the significance of judicial review in basic structure doctrine",
            "provider": "mock",
            "mock_mode": sim_mode,
            "force_ai": True
        })
        print(f"Simulated Mode: {sim_mode} -> Status: {status}, Success: {res_fail.get('success')}, AI Error: {res_fail.get('ai', {}).get('error')}")
        assert status == 200
        assert res_fail.get("success") is True
        assert res_fail.get("ai", {}).get("used") is False
        assert "unavailable" in res_fail.get("ai", {}).get("error", "").lower() or "quota" in res_fail.get("ai", {}).get("error", "").lower() or "rate limit" in res_fail.get("ai", {}).get("error", "").lower() or "auth" in res_fail.get("ai", {}).get("error", "").lower()
    print("✅ Provider Failure Handling Validated (Safe Degradation, No Crash)\n")

    # -------------------------------------------------------------
    # 9. AI USAGE REDUCTION BENCHMARK (10 Deterministic Queries)
    # -------------------------------------------------------------
    print("--- 9. AI USAGE REDUCTION BENCHMARK (10 Queries) ---")
    test_queries = [
        # In-domain / Stored Questions (Strong matches)
        {"message": "Which article of the Indian Constitution enshrines the Right to Constitutional Remedies?", "exam": "UPSC_CSE", "subject": "POLITY"},
        {"message": "What is the primary objective of the Monetary Policy Committee in India?", "exam": "UPSC_CSE", "subject": "ECONOMY"},
        {"message": "Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?", "exam": "UPSC_CSE", "subject": "POLITY"},
        {"message": "Discuss the fiscal relations and tax devolution between Union and States under Finance Commission", "exam": "UPSC_CSE", "subject": "ECONOMY"},
        {"message": "Explain the constitutional powers of the Governor regarding reservation of bills for President", "exam": "UPSC_CSE", "subject": "POLITY"},
        
        # Weak / Partial Matches (Documents / Green Energy / General Governance)
        {"message": "Green Energy Act solar and hydrogen infrastructure", "subject": "ECONOMY"},
        {"message": "How does inflation targeting influence liquidity adjustment facility and repo rate?", "subject": "ECONOMY"},
        {"message": "What are the key differences between Writ of Mandamus and Writ of Quo-Warranto?", "subject": "POLITY"},
        
        # None / Out of Domain Matches
        {"message": "How do quantum entanglement and quantum computing superposition algorithms work?"},
        {"message": "What are the rules and offside regulations in modern FIFA association football?"}
    ]

    total_queries = len(test_queries)
    strong_queries = 0
    weak_queries = 0
    none_queries = 0
    ai_calls = 0
    zero_ai_call_queries = 0

    for i, q in enumerate(test_queries, 1):
        status, res = post_json(q)
        conf = res.get("confidence")
        ai_used = res.get("ai", {}).get("used", False)
        
        if conf == "STRONG":
            strong_queries += 1
        elif conf == "WEAK":
            weak_queries += 1
        else:
            none_queries += 1

        if ai_used:
            ai_calls += 1
        else:
            zero_ai_call_queries += 1
        
        print(f"Query {i:02d} [{conf:6s}]: AI Used={str(ai_used):5s} -> '{q['message'][:50]}...'")

    ai_call_rate = (ai_calls / total_queries) * 100.0
    cost_reduction = (zero_ai_call_queries / total_queries) * 100.0

    print(f"\nBenchmark Summary:")
    print(f"  Total Queries:               {total_queries}")
    print(f"  Strong Confidence Queries:   {strong_queries}")
    print(f"  Weak Confidence Queries:     {weak_queries}")
    print(f"  None Confidence Queries:     {none_queries}")
    print(f"  AI Invocations Required:     {ai_calls}")
    print(f"  Zero-AI Knowledge Queries:   {zero_ai_call_queries}")
    print(f"  AI Call Rate:                {ai_call_rate:.1f}%")
    print(f"  Cost / Token Reduction Rate: {cost_reduction:.1f}%")
    print("✅ AI Usage Reduction Benchmark Completed\n")

    # -------------------------------------------------------------
    # 10. SOURCE ATTRIBUTION VALIDATION
    # -------------------------------------------------------------
    print("--- 10. SOURCE ATTRIBUTION TEST ---")
    status, res_src = post_json({
        "message": "Which article of the Indian Constitution enshrines the Right to Constitutional Remedies?",
        "exam": "UPSC_CSE",
        "subject": "POLITY"
    })
    sources = res_src.get("knowledge", {}).get("sources", [])
    assert len(sources) > 0
    for s in sources:
        assert s.get("id") is not None
        assert s.get("type") in ["question", "chunk", "document", "tag"]
        assert s.get("snippet") is not None
        print(f"Source Verified: ID={s.get('id')}, Type={s.get('type')}, Title={s.get('title')[:45]}..., Snippet Length={len(s.get('snippet'))}")
    print("✅ Source Attribution Verified (Authentic Database Fields Only)\n")

    # -------------------------------------------------------------
    # 12. SECURITY CHECK
    # -------------------------------------------------------------
    print("--- 12. SECURITY VERIFICATION ---")
    raw_response_str = json.dumps(res_weak)
    raw_response_str_fail = json.dumps(res_fail)
    
    # Verify no secret keywords, passwords, internal ports, or stack traces
    forbidden_tokens = ["AIzaSy", "postgres:", "localhost:8000", "Traceback (most recent call last)", "/app/applet/api/app"]
    for tok in forbidden_tokens:
        assert tok not in raw_response_str, f"Security Violation: '{tok}' found in normal response!"
        assert tok not in raw_response_str_fail, f"Security Violation: '{tok}' found in failure response!"
    print("✅ Security Check Passed (Zero Credentials or Internal Stack Traces Leaked)\n")

    print("=================================================================")
    print("🎉 ALL END-TO-END VALIDATIONS COMPLETED SUCCESSFULLY")
    print("=================================================================")

if __name__ == "__main__":
    run_e2e_validations()
