"""RunPod Cloud GPU Manager - Start/stop/manage RunPod instances with ComfyUI."""
import json
import urllib.request
import urllib.error
import time

RUNPOD_API_URL = "https://api.runpod.io/graphql"

# ComfyUI template on RunPod
COMFYUI_TEMPLATE_ID = "runpod-comfyui"


class RunPodManager:
    def __init__(self, api_key=""):
        self.api_key = api_key

    def _graphql(self, query, variables=None):
        if not self.api_key:
            raise ValueError("RunPod API Key が設定されていません")
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            RUNPOD_API_URL,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "AI-diffusion/1.0",
            },
        )
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
        if "errors" in result:
            raise RuntimeError(f"RunPod API Error: {result['errors']}")
        return result["data"]

    def get_pods(self):
        query = """
        query {
            myself {
                pods {
                    id
                    name
                    desiredStatus
                    runtime { uptimeInSeconds gpus { id gpuUtilPercent memoryUtilPercent } ports { ip isIpPublic privatePort publicPort type } }
                    machine { gpuDisplayName }
                    imageName
                }
            }
        }
        """
        data = self._graphql(query)
        return data["myself"]["pods"]

    def get_pod(self, pod_id):
        pods = self.get_pods()
        for pod in pods:
            if pod["id"] == pod_id:
                return pod
        return None

    def get_comfyui_url(self, pod):
        """Extract ComfyUI URL from pod runtime info."""
        if not pod or not pod.get("runtime") or not pod["runtime"].get("ports"):
            return None
        for port_info in pod["runtime"]["ports"]:
            if port_info["privatePort"] == 8188 and port_info.get("ip"):
                public_port = port_info.get("publicPort", 8188)
                ip = port_info["ip"]
                proto = "https" if port_info.get("type") == "https" else "http"
                return f"{proto}://{ip}:{public_port}"
        # Fallback: RunPod proxy URL
        return f"https://{pod['id']}-8188.proxy.runpod.net"

    def create_pod(self, name="AI-diffusion-ComfyUI", gpu_type_id="NVIDIA RTX A5000", volume_size=20):
        query = """
        mutation ($input: PodFindAndDeployOnDemandInput!) {
            podFindAndDeployOnDemand(input: $input) {
                id
                name
                desiredStatus
                imageName
                machine { gpuDisplayName }
            }
        }
        """
        variables = {
            "input": {
                "name": name,
                "imageName": "runpod/stable-diffusion:comfy-ui",
                "gpuTypeId": gpu_type_id,
                "cloudType": "ALL",
                "volumeInGb": volume_size,
                "containerDiskInGb": 10,
                "minVcpuCount": 2,
                "minMemoryInGb": 16,
                "ports": "8188/http,22/tcp",
                "volumeMountPath": "/workspace",
            }
        }
        data = self._graphql(query, variables)
        return data["podFindAndDeployOnDemand"]

    def start_pod(self, pod_id):
        query = """
        mutation ($input: PodResumeInput!) {
            podResume(input: $input) {
                id
                desiredStatus
            }
        }
        """
        variables = {"input": {"podId": pod_id, "gpuCount": 1}}
        data = self._graphql(query, variables)
        return data["podResume"]

    def stop_pod(self, pod_id):
        query = """
        mutation ($input: PodStopInput!) {
            podStop(input: $input) {
                id
                desiredStatus
            }
        }
        """
        variables = {"input": {"podId": pod_id}}
        data = self._graphql(query, variables)
        return data["podStop"]

    def terminate_pod(self, pod_id):
        query = """
        mutation ($input: PodTerminateInput!) {
            podTerminate(input: $input)
        }
        """
        variables = {"input": {"podId": pod_id}}
        self._graphql(query, variables)
        return True

    def get_gpu_types(self):
        query = """
        query {
            gpuTypes {
                id
                displayName
                memoryInGb
                communityPrice
                securePrice
            }
        }
        """
        data = self._graphql(query)
        gpus = data["gpuTypes"]
        # Filter to relevant GPUs and sort by price
        relevant = [g for g in gpus if g.get("communityPrice") and g["communityPrice"] > 0]
        return sorted(relevant, key=lambda g: g["communityPrice"])

    def wait_for_ready(self, pod_id, timeout=300):
        """Wait for pod to be running and ComfyUI to be accessible."""
        start = time.time()
        while time.time() - start < timeout:
            pod = self.get_pod(pod_id)
            if pod and pod["desiredStatus"] == "RUNNING" and pod.get("runtime"):
                url = self.get_comfyui_url(pod)
                if url:
                    # Check if ComfyUI is actually responding
                    try:
                        urllib.request.urlopen(f"{url}/system_stats", timeout=5)
                        return url
                    except (urllib.error.URLError, TimeoutError):
                        pass
            time.sleep(5)
        return None


def format_pod_status(pod):
    if not pod:
        return "Pod が見つかりません"
    gpu = pod.get("machine", {}).get("gpuDisplayName", "Unknown")
    status = pod.get("desiredStatus", "Unknown")
    uptime = ""
    if pod.get("runtime") and pod["runtime"].get("uptimeInSeconds"):
        mins = pod["runtime"]["uptimeInSeconds"] // 60
        uptime = f" (稼働: {mins}分)"
    return f"Pod: {pod['name']} | GPU: {gpu} | Status: {status}{uptime}"
