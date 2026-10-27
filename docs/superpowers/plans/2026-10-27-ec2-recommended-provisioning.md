# 1-Click Transparent EC2 Provisioning with Live Boot Audit Trail

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a transparent, automated 1-click EC2 provisioning experience that sizes an AWS instance based on repository analysis, locks to AWS Free Tier (`t3.micro`), self-injects an in-memory deploy SSH key via cloud-init, and streams a real-time boot-up audit trail via SSE.

**Architecture:** 
- Backend creates a managed security group (`proveit-sandbox-sg`) opening port 22 plus the repo's analyzed port.
- Generates a self-contained deploy key pair and injects the public key into cloud-init `UserData` alongside Docker installation.
- Streams real-time progress via Server-Sent Events (`/api/agent/ec2/provision/stream/{job_id}`) until the instance is running and the Docker daemon responds.
- Frontend displays a transparent review modal with pre-filled recommendations and an expandable customization accordion, leading into a live audit trail display.

**Tech Stack:** Python 3.13, FastAPI, Boto3, SQLModel, SSE (Server-Sent Events), Next.js 14, TypeScript.

## Global Constraints
- Enforce AWS Free Tier: default and recommended instance type is strictly `t3.micro` (or `t2.micro`).
- Zero manual SSH setup: deploy public key is injected automatically via cloud-init `UserData`.
- Non-blocking: long-running AWS provisioning (~60-90s) streams real-time step checkpoints via SSE.
- Backward compatibility: offline simulation / mock mode fallback remains supported if `CLOUD_MODE=mock`.

---

### Task 1: Self-Contained SSH Deploy Key & Cloud-Init Docker Provisioner

**Files:**
- Modify: `model/proveit_model/tools/aws_tools.py`
- Test: `backend/tests/test_aws_provisioner.py`

**Interfaces:**
- Produces: `AWSTools.generate_deploy_key_pair() -> Dict[str, str]` (returns `{"public_key": str, "private_key": str}`)
- Produces: `AWSTools.provision_recommended_ec2(name, instance_type, region, app_port) -> Dict[str, Any]`

- [ ] **Step 1: Write the failing unit test**
Create `backend/tests/test_aws_provisioner.py` testing key generation and mock provision with recommended parameters.

- [ ] **Step 2: Run test to verify it fails**
Run: `.\venv\Scripts\pytest.exe backend/tests/test_aws_provisioner.py -v`
Expected: FAIL with attribute error.

- [ ] **Step 3: Implement deploy key generation and cloud-init bootstrap in `model/proveit_model/tools/aws_tools.py`**
Implement standard RSA/ED25519 key generation using standard Python `cryptography` library. Inject public key into `UserData` with Docker install commands. Ensure Security Group `proveit-sandbox-sg` is created or reused with port 22 + detected `app_port`.

- [ ] **Step 4: Run test to verify it passes**
Run: `.\venv\Scripts\pytest.exe backend/tests/test_aws_provisioner.py -v`
Expected: PASS.

---

### Task 2: Backend Streaming Provisioning Endpoint & SSE Audit Stream

**Files:**
- Modify: `backend/app/routers/agent.py`
- Test: `backend/tests/test_ec2_provision_api.py`

**Interfaces:**
- Produces: `POST /api/agent/ec2/provision` -> `{"job_id": str, "status": "INITIATED", "stream_url": str}`
- Produces: `GET /api/agent/ec2/provision/stream/{job_id}` -> Live SSE stream yielding checkpoint events (`STAGE`, `LOG`, `SUCCESS`, `ERROR`).

- [ ] **Step 1: Write failing API test**
Create `backend/tests/test_ec2_provision_api.py` verifying job initiation and SSE stream connection.

- [ ] **Step 2: Run test to verify it fails**
Run: `.\venv\Scripts\pytest.exe backend/tests/test_ec2_provision_api.py -v`
Expected: FAIL (404 Not Found).

- [ ] **Step 3: Implement endpoints in `backend/app/routers/agent.py`**
Store active provision jobs in an in-memory queue. In background thread/task, progress through:
1. `SECURITY_GROUP`: Verify/create `proveit-sandbox-sg` with port 22 and `app_port`.
2. `DISPATCH`: Call Boto3 `ec2.run_instances()`.
3. `STATE_CHECK`: Wait until instance state is `running` and public IP is assigned.
4. `BOOTSTRAP_WAIT`: Poll TCP port 22.
5. `DOCKER_VERIFIED`: Verify Docker daemon and save `EC2Instance` to database.

- [ ] **Step 4: Run test to verify it passes**
Run: `.\venv\Scripts\pytest.exe backend/tests/test_ec2_provision_api.py -v`
Expected: PASS.

---

### Task 3: Frontend Transparent Recommendation Modal & Live Boot Audit Trail

**Files:**
- Modify: `frontend/src/app/console/page.tsx`

**Interfaces:**
- Displays transparent configuration summary (Region, `t3.micro` Free Tier, Port, Security Group).
- Features dual-action: " Continue with Recommended Settings" vs Expandable "Customize Settings".
- Displays live SSE streaming audit trail of the boot sequence with step icons and real-time elapsed timestamps.

- [ ] **Step 1: Add "Launch Recommended AWS EC2" trigger button**
In `RepoAnalyzerPanel` (`analyze` tab) and `EC2FleetPanel` (`ec2` tab), add the trigger button.

- [ ] **Step 2: Build `EC2ProvisionWizardModal` component**
Render pre-filled recommendation summary card. Include accordion for custom inputs (Name, Region, Instance Type locked to free tier).

- [ ] **Step 3: Connect SSE Audit Stream**
When launch is triggered, switch to the live audit log view connected to `EventSource(/api/agent/ec2/provision/stream/{job_id})`. Render checkpoint badges and progress logs.

- [ ] **Step 4: Verification**
Verify frontend with `cmd /c npx tsc --noEmit`.
Verify full end-to-end flow with simulated and live fallback checks.
