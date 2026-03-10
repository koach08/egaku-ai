"""EGAKU AI - AI Image & Video Generation Platform (Commercial Edition)."""
import datetime
import os
import shutil
import subprocess
import sys
import time

import gradio as gr
from PIL import Image

from config import load_config, save_config, get_available_models, get_available_loras, get_available_vaes, get_available_motion_models, SAMPLERS, SCHEDULERS
from comfyui_api import ComfyUIClient, build_txt2img_workflow, build_animatediff_workflow, build_img2vid_workflow
from runpod_manager import RunPodManager, format_pod_status
from civitai_api import CivitAIClient, format_search_results
from guide import GUIDE_SECTIONS, PROMPT_TEMPLATES
from ai_assistant import chat_with_ai, QUICK_QUESTIONS, PROVIDERS
from legal import (
    CONTENT_POLICY, TERMS_OF_SERVICE, SELF_HOSTED_WARNING,
    REGIONAL_GUIDELINES, AGE_VERIFICATION,
    check_prompt_compliance, get_violation_message,
)

config = load_config()
client = ComfyUIClient(config["comfyui_url"])
runpod = RunPodManager(config.get("runpod_api_key", ""))
civitai = CivitAIClient(config.get("civitai_api_key", ""))

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def refresh_models():
    models = get_available_models(config["models_dir"])
    loras = ["None"] + get_available_loras(config["models_dir"])
    vaes = ["None"] + get_available_vaes(config["models_dir"])
    return (
        gr.update(choices=models, value=models[0] if models else None),
        gr.update(choices=loras, value="None"),
        gr.update(choices=vaes, value="None"),
    )


def check_server_status():
    backend = config.get("backend", "local")
    if client.is_server_running():
        label = "Local" if backend == "local" else "RunPod Cloud"
        return f"🟢 ComfyUI Server: Running ({label})"
    if backend == "runpod":
        return "🔴 ComfyUI Server: Not Running — Settingsタブから RunPod を起動してください"
    return "🔴 ComfyUI Server: Not Running — launch.commandで起動してください"


def save_image_to_dir(image, output_dir, prefix="img"):
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp}.png"
    filepath = os.path.join(output_dir, filename)
    image.save(filepath)
    return filepath


def generate_image(prompt, negative_prompt, model, lora, lora_strength, vae,
                   width, height, steps, cfg, sampler, scheduler, seed,
                   batch_size, mode="normal"):
    """Generate image via ComfyUI API."""
    # Content policy check
    is_safe, flagged = check_prompt_compliance(prompt)
    if not is_safe:
        raise gr.Error(get_violation_message(flagged, "ja"))

    if not client.is_server_running():
        raise gr.Error("ComfyUI Server が起動していません。先にComfyUIを起動してください。")

    if not model:
        raise gr.Error("モデルが選択されていません。modelsフォルダにモデルを配置してください。")

    lora_name = "" if lora == "None" else lora
    vae_name = "" if vae == "None" else vae

    workflow = build_txt2img_workflow(
        prompt=prompt,
        negative_prompt=negative_prompt,
        model=model,
        width=width,
        height=height,
        steps=steps,
        cfg=cfg,
        sampler=sampler,
        scheduler=scheduler,
        seed=int(seed),
        batch_size=int(batch_size),
        lora_name=lora_name,
        lora_strength=lora_strength,
        vae_name=vae_name,
    )

    images = client.generate(workflow, timeout=600)

    output_dir = config["output_dir_adult"] if mode == "adult" else config["output_dir_normal"]
    saved_paths = []
    for img in images:
        path = save_image_to_dir(img, output_dir, prefix=mode)
        saved_paths.append(path)

    return images, f"保存先: {', '.join(saved_paths)}"


# ──────────────────────────────────────────────
# Generate functions for each tab
# ──────────────────────────────────────────────

def generate_normal(prompt, neg, model, lora, lora_str, vae, w, h, steps, cfg, sampler, sched, seed, batch):
    images, info = generate_image(prompt, neg, model, lora, lora_str, vae, w, h, steps, cfg, sampler, sched, seed, batch, "normal")
    return images, info


def generate_adult(prompt, neg, model, lora, lora_str, vae, w, h, steps, cfg, sampler, sched, seed, batch):
    images, info = generate_image(prompt, neg, model, lora, lora_str, vae, w, h, steps, cfg, sampler, sched, seed, batch, "adult")
    return images, info


# ──────────────────────────────────────────────
# Video generation
# ──────────────────────────────────────────────

def generate_video_txt2vid(prompt, neg, model, motion_model, lora, lora_str, vae,
                           w, h, steps, cfg, sampler, sched, seed,
                           frame_count, fps, output_format, mode="normal"):
    """Generate video from text prompt using AnimateDiff."""
    is_safe, flagged = check_prompt_compliance(prompt)
    if not is_safe:
        raise gr.Error(get_violation_message(flagged, "ja"))
    if not client.is_server_running():
        raise gr.Error("ComfyUI Server が起動していません。")
    if not model:
        raise gr.Error("モデルが選択されていません。")
    if not motion_model:
        raise gr.Error("Motion Model が選択されていません。AnimateDiffモデルをダウンロードしてください。")

    lora_name = "" if lora == "None" else lora
    vae_name = "" if vae == "None" else vae

    workflow = build_animatediff_workflow(
        prompt=prompt,
        negative_prompt=neg,
        model=model,
        motion_model=motion_model,
        width=int(w),
        height=int(h),
        steps=int(steps),
        cfg=cfg,
        sampler=sampler,
        scheduler=sched,
        seed=int(seed),
        frame_count=int(frame_count),
        fps=int(fps),
        lora_name=lora_name,
        lora_strength=lora_str,
        vae_name=vae_name,
        output_format=output_format,
    )

    output_dir = config["output_dir_adult"] if mode == "adult" else config["output_dir_normal"]
    frames, video_path = client.generate_video(workflow, output_dir, timeout=900)
    info = f"Frames: {len(frames)}"
    if video_path:
        info += f"\n保存先: {video_path}"
    return video_path, frames[:4] if frames else [], info


def generate_video_img2vid(image, prompt, neg, model, motion_model, vae,
                           w, h, steps, cfg, sampler, sched, seed,
                           frame_count, fps, denoise, output_format, mode="normal"):
    """Generate video from input image using AnimateDiff img2vid."""
    if not client.is_server_running():
        raise gr.Error("ComfyUI Server が起動していません。")
    if not model:
        raise gr.Error("モデルが選択されていません。")
    if image is None:
        raise gr.Error("入力画像を選択してください。")

    vae_name = "" if vae == "None" else vae

    # Save uploaded image to ComfyUI input dir
    from PIL import Image as PILImage
    comfyui_input = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "comfyui", "input")
    os.makedirs(comfyui_input, exist_ok=True)
    input_filename = f"img2vid_input_{int(time.time())}.png"
    input_path = os.path.join(comfyui_input, input_filename)
    if isinstance(image, str):
        shutil.copy(image, input_path)
    else:
        PILImage.fromarray(image).save(input_path)

    workflow = build_img2vid_workflow(
        image_path=input_path,
        model=model,
        motion_model=motion_model,
        width=int(w),
        height=int(h),
        steps=int(steps),
        cfg=cfg,
        sampler=sampler,
        scheduler=sched,
        seed=int(seed),
        frame_count=int(frame_count),
        fps=int(fps),
        denoise=denoise,
        prompt=prompt,
        negative_prompt=neg,
        output_format=output_format,
    )

    output_dir = config["output_dir_adult"] if mode == "adult" else config["output_dir_normal"]
    frames, video_path = client.generate_video(workflow, output_dir, timeout=900)
    info = f"Frames: {len(frames)}"
    if video_path:
        info += f"\n保存先: {video_path}"
    return video_path, frames[:4] if frames else [], info


# ──────────────────────────────────────────────
# Settings functions
# ──────────────────────────────────────────────

def save_settings(output_normal, output_adult, gdrive_path, comfyui_url, runpod_api_key, backend_choice, civitai_api_key, anthropic_api_key, openai_api_key, xai_api_key):
    config["output_dir_normal"] = output_normal
    config["output_dir_adult"] = output_adult
    config["google_drive_models_dir"] = gdrive_path
    config["comfyui_url"] = comfyui_url
    config["runpod_api_key"] = runpod_api_key
    config["backend"] = backend_choice
    config["civitai_api_key"] = civitai_api_key
    config["anthropic_api_key"] = anthropic_api_key
    config["openai_api_key"] = openai_api_key
    config["xai_api_key"] = xai_api_key
    save_config(config)
    client.server_url = comfyui_url.rstrip("/")
    runpod.api_key = runpod_api_key
    civitai.api_key = civitai_api_key
    return "設定を保存しました"


def switch_backend(choice):
    config["backend"] = choice
    if choice == "local":
        config["comfyui_url"] = "http://127.0.0.1:8188"
        client.server_url = "http://127.0.0.1:8188"
        save_config(config)
        return "ローカルに切り替えました", config["comfyui_url"]
    elif choice == "runpod" and config.get("runpod_comfyui_url"):
        config["comfyui_url"] = config["runpod_comfyui_url"]
        client.server_url = config["runpod_comfyui_url"]
        save_config(config)
        return f"RunPod に切り替えました: {config['runpod_comfyui_url']}", config["comfyui_url"]
    return "RunPod URL が未設定です。先に Pod を起動してください。", config["comfyui_url"]


def runpod_start(gpu_choice="NVIDIA RTX A5000"):
    if not runpod.api_key:
        return "RunPod API Key を Settings で設定してください"
    pod_id = config.get("runpod_pod_id", "")
    if pod_id:
        try:
            pod = runpod.get_pod(pod_id)
            if pod and pod["desiredStatus"] == "RUNNING":
                url = runpod.get_comfyui_url(pod)
                if url:
                    config["runpod_comfyui_url"] = url
                    config["comfyui_url"] = url
                    client.server_url = url
                    save_config(config)
                    return f"既に起動中: {format_pod_status(pod)}\nURL: {url}"
            if pod:
                runpod.start_pod(pod_id)
                url = runpod.wait_for_ready(pod_id, timeout=180)
                if url:
                    config["runpod_comfyui_url"] = url
                    config["comfyui_url"] = url
                    config["backend"] = "runpod"
                    client.server_url = url
                    save_config(config)
                    return f"起動完了!\nURL: {url}"
                return "起動中... 数分かかる場合があります。再度チェックしてください。"
        except Exception as e:
            return f"エラー: {e}"

    # No existing pod, create new one
    try:
        new_pod = runpod.create_pod(gpu_type_id=gpu_choice)
        config["runpod_pod_id"] = new_pod["id"]
        save_config(config)
        url = runpod.wait_for_ready(new_pod["id"], timeout=300)
        if url:
            config["runpod_comfyui_url"] = url
            config["comfyui_url"] = url
            config["backend"] = "runpod"
            client.server_url = url
            save_config(config)
            return f"新規Pod作成・起動完了!\nPod ID: {new_pod['id']}\nGPU: {gpu_choice}\nURL: {url}"
        return f"Pod作成済み (ID: {new_pod['id']}). 起動待ち... 再度チェックしてください。"
    except Exception as e:
        return f"Pod作成エラー: {e}"


def runpod_stop():
    pod_id = config.get("runpod_pod_id", "")
    if not pod_id:
        return "Pod ID が設定されていません"
    try:
        runpod.stop_pod(pod_id)
        config["backend"] = "local"
        config["comfyui_url"] = "http://127.0.0.1:8188"
        client.server_url = "http://127.0.0.1:8188"
        save_config(config)
        return "Pod を停止しました（ストレージは保持、課金停止）"
    except Exception as e:
        return f"停止エラー: {e}"


def runpod_check_status():
    if not runpod.api_key:
        return "API Key が未設定です"
    pod_id = config.get("runpod_pod_id", "")
    if not pod_id:
        return "Pod が未作成です。「Cloud GPU 起動」で新規作成してください。"
    try:
        pod = runpod.get_pod(pod_id)
        if pod:
            return format_pod_status(pod)
        return "Pod が見つかりません（削除済み？）"
    except Exception as e:
        return f"確認エラー: {e}"


# ──────────────────────────────────────────────
# CivitAI functions
# ──────────────────────────────────────────────

def civitai_search(query, model_type, sort, nsfw):
    try:
        results = civitai.search_models(
            query=query,
            model_type=model_type,
            sort=sort,
            nsfw=nsfw,
            limit=10,
        )
        return format_search_results(results)
    except Exception as e:
        return f"検索エラー: {e}"


def civitai_download(version_id, model_type_dest):
    """Download model from CivitAI by version ID."""
    if not version_id:
        return "Version ID を入力してください（検索結果に表示されます）"

    dest_map = {
        "Checkpoint": "checkpoints",
        "LoRA": "loras",
        "VAE": "vae",
        "ControlNet": "controlnet",
        "Upscaler": "upscale_models",
        "Embedding": "embeddings",
    }
    dest_dir = os.path.join(config["models_dir"], dest_map.get(model_type_dest, "checkpoints"))
    os.makedirs(dest_dir, exist_ok=True)

    try:
        info = civitai.get_download_url(int(version_id))
        if not info:
            return "ダウンロードURLが見つかりません"
        size_gb = info["size_kb"] / 1024 / 1024
        filepath = civitai.download_model(int(version_id), dest_dir)
        return f"ダウンロード完了!\nFile: {os.path.basename(filepath)}\nSize: {size_gb:.1f}GB\nPath: {filepath}\n\n「Refresh Models」を押してモデルリストを更新してください"
    except Exception as e:
        return f"ダウンロードエラー: {e}"


def civitai_upload_image(image_path, title, nsfw):
    """Upload generated image to CivitAI."""
    if not civitai.api_key:
        return "CivitAI API Key を Settings で設定してください"
    if not image_path:
        return "画像を選択してください"
    try:
        result = civitai.upload_image(image_path)
        return f"アップロード完了! Image ID: {result.get('id', 'N/A')}"
    except Exception as e:
        return f"アップロードエラー: {e}"


def link_google_drive(gdrive_path):
    """Link Google Drive models folder to local models directory."""
    if not gdrive_path or not os.path.isdir(gdrive_path):
        return "指定されたパスが存在しません"

    models_dir = config["models_dir"]
    linked = []
    for subdir in ["checkpoints", "loras", "vae", "controlnet", "embeddings", "upscale_models"]:
        src = os.path.join(gdrive_path, subdir)
        if os.path.isdir(src):
            for f in os.listdir(src):
                src_file = os.path.join(src, f)
                dst_file = os.path.join(models_dir, subdir, f)
                if not os.path.exists(dst_file):
                    os.symlink(src_file, dst_file)
                    linked.append(f)
    if linked:
        return f"リンク完了: {', '.join(linked)}"
    return "リンクするファイルが見つかりませんでした。Google Driveのフォルダにcheckpoints/等のサブフォルダを作成してモデルを配置してください。"


def open_folder(path):
    if os.path.isdir(path):
        subprocess.Popen(["open", path])
        return f"フォルダを開きました: {path}"
    return f"フォルダが存在しません: {path}"


# ──────────────────────────────────────────────
# Build generation controls (shared between tabs)
# ──────────────────────────────────────────────

def build_gen_controls(tab_name):
    """Build the common generation controls for a tab. Returns all input components."""
    models = get_available_models(config["models_dir"])
    loras = ["None"] + get_available_loras(config["models_dir"])
    vaes = ["None"] + get_available_vaes(config["models_dir"])

    with gr.Row():
        with gr.Column(scale=2):
            prompt = gr.Textbox(label="Prompt", lines=4, placeholder="Describe what you want to generate...")
            negative = gr.Textbox(label="Negative Prompt", lines=2, value=config["default_negative_prompt"])
        with gr.Column(scale=1):
            model = gr.Dropdown(choices=models, label="Model (Checkpoint)", value=models[0] if models else None)
            lora = gr.Dropdown(choices=loras, label="LoRA", value="None")
            lora_strength = gr.Slider(0, 2, value=0.8, step=0.05, label="LoRA Strength")
            vae = gr.Dropdown(choices=vaes, label="VAE", value="None")

    with gr.Row():
        width = gr.Slider(256, 2048, value=config["default_width"], step=64, label="Width")
        height = gr.Slider(256, 2048, value=config["default_height"], step=64, label="Height")

    with gr.Row():
        steps = gr.Slider(1, 100, value=config["default_steps"], step=1, label="Steps")
        cfg = gr.Slider(1, 30, value=config["default_cfg"], step=0.5, label="CFG Scale")
        seed = gr.Number(value=-1, label="Seed (-1=random)", precision=0)
        batch_size = gr.Slider(1, 8, value=1, step=1, label="Batch Size")

    with gr.Row():
        sampler = gr.Dropdown(choices=SAMPLERS, value=config["default_sampler"], label="Sampler")
        scheduler = gr.Dropdown(choices=SCHEDULERS, value=config["default_scheduler"], label="Scheduler")

    with gr.Row():
        generate_btn = gr.Button(f"Generate ({tab_name})", variant="primary", size="lg")
        refresh_btn = gr.Button("Refresh Models", size="sm")

    with gr.Row():
        gallery = gr.Gallery(label="Generated Images", columns=2, height=512)
    info = gr.Textbox(label="Info", interactive=False)

    refresh_btn.click(
        fn=refresh_models,
        outputs=[model, lora, vae],
    )

    return (prompt, negative, model, lora, lora_strength, vae,
            width, height, steps, cfg, sampler, scheduler, seed, batch_size,
            generate_btn, gallery, info)


# ──────────────────────────────────────────────
# UI Layout
# ──────────────────────────────────────────────

with gr.Blocks(title="EGAKU AI") as app:

    gr.HTML("<h1 class='main-title'>EGAKU AI</h1>")

    with gr.Row():
        status = gr.Textbox(value=check_server_status(), label="Server Status", interactive=False, elem_classes="status-bar", scale=3)
        backend_radio = gr.Radio(
            choices=["local", "runpod"],
            value=config.get("backend", "local"),
            label="Backend",
            info="local=Mac MPS / runpod=Cloud GPU",
            scale=1,
        )
        refresh_status_btn = gr.Button("Check Server", size="sm", scale=0)

    backend_switch_info = gr.Textbox(label="", interactive=False, visible=False)

    def switch_backend_ui(choice):
        msg, url = switch_backend(choice)
        return check_server_status(), msg

    backend_radio.change(fn=switch_backend_ui, inputs=[backend_radio], outputs=[status, backend_switch_info])
    refresh_status_btn.click(fn=check_server_status, outputs=[status])

    with gr.Tabs():
        # ── Quick (Normal) Tab ──
        with gr.Tab("Quick (Normal)"):
            gr.Markdown("**手軽に画像生成** — プロンプトを入力してGenerateを押すだけ")
            (q_prompt, q_neg, q_model, q_lora, q_lora_str, q_vae,
             q_w, q_h, q_steps, q_cfg, q_sampler, q_sched, q_seed, q_batch,
             q_gen_btn, q_gallery, q_info) = build_gen_controls("Normal")

            q_gen_btn.click(
                fn=generate_normal,
                inputs=[q_prompt, q_neg, q_model, q_lora, q_lora_str, q_vae,
                        q_w, q_h, q_steps, q_cfg, q_sampler, q_sched, q_seed, q_batch],
                outputs=[q_gallery, q_info],
            )

        # ── Advanced (ComfyUI) Tab ──
        with gr.Tab("Advanced (ComfyUI)"):
            gr.Markdown("**ComfyUI ネイティブUI** — フル機能のノードエディタ")
            gr.HTML(
                '<iframe src="http://127.0.0.1:8188" '
                'style="width:100%; height:800px; border:none; border-radius:8px;"></iframe>'
            )

        # ── Adult (R18) Tab ──
        with gr.Tab("Adult (R18)", elem_id="adult-tab"):
            gr.Markdown(
                "**R18 / Adult Content Generation**\n\n"
                "⚠️ **Warning / 警告**: This section generates adult content. You must be 18+ to use this feature. "
                "All generated content must comply with applicable laws. Illegal content (CSAM, non-consensual deepfakes) is strictly prohibited and will be reported.\n\n"
                "⚠️ **警告**: このセクションはアダルトコンテンツを生成します。18歳以上の方のみ利用可能です。"
                "全てのコンテンツは適用法に準拠する必要があります。違法コンテンツ（CSAM、非同意ディープフェイク）は厳禁であり、当局に報告されます。"
            )
            (a_prompt, a_neg, a_model, a_lora, a_lora_str, a_vae,
             a_w, a_h, a_steps, a_cfg, a_sampler, a_sched, a_seed, a_batch,
             a_gen_btn, a_gallery, a_info) = build_gen_controls("Adult")

            a_gen_btn.click(
                fn=generate_adult,
                inputs=[a_prompt, a_neg, a_model, a_lora, a_lora_str, a_vae,
                        a_w, a_h, a_steps, a_cfg, a_sampler, a_sched, a_seed, a_batch],
                outputs=[a_gallery, a_info],
            )

        # ── Video Tab ──
        with gr.Tab("Video"):
            gr.Markdown("**動画生成** — AnimateDiff で txt2vid / img2vid。SD1.5モデル対応。")

            models = get_available_models(config["models_dir"])
            loras = ["None"] + get_available_loras(config["models_dir"])
            vaes = ["None"] + get_available_vaes(config["models_dir"])
            motion_models = get_available_motion_models()

            with gr.Tabs():
                # ─ txt2vid ─
                with gr.Tab("Text to Video (txt2vid)"):
                    gr.Markdown("テキストから動画を生成します。SD1.5のチェックポイントを使用してください。")
                    with gr.Row():
                        with gr.Column(scale=2):
                            v_prompt = gr.Textbox(label="Prompt", lines=3, placeholder="1girl, walking, wind blowing hair, outdoor, sunny day")
                            v_neg = gr.Textbox(label="Negative Prompt", lines=2, value=config["default_negative_prompt"])
                        with gr.Column(scale=1):
                            v_model = gr.Dropdown(choices=models, label="Checkpoint (SD1.5推奨)", value=models[0] if models else None)
                            v_motion = gr.Dropdown(choices=motion_models, label="Motion Model", value=motion_models[0] if motion_models else None)
                            v_lora = gr.Dropdown(choices=loras, label="LoRA", value="None")
                            v_lora_str = gr.Slider(0, 2, value=0.8, step=0.05, label="LoRA Strength")
                            v_vae = gr.Dropdown(choices=vaes, label="VAE", value="None")

                    with gr.Row():
                        v_w = gr.Slider(256, 1024, value=512, step=64, label="Width")
                        v_h = gr.Slider(256, 1024, value=512, step=64, label="Height")
                        v_frames = gr.Slider(8, 32, value=16, step=1, label="Frames")
                        v_fps = gr.Slider(4, 30, value=8, step=1, label="FPS")

                    with gr.Row():
                        v_steps = gr.Slider(1, 50, value=20, step=1, label="Steps")
                        v_cfg = gr.Slider(1, 20, value=7.5, step=0.5, label="CFG")
                        v_seed = gr.Number(value=-1, label="Seed (-1=random)", precision=0)

                    with gr.Row():
                        v_sampler = gr.Dropdown(choices=SAMPLERS, value="euler_ancestral", label="Sampler")
                        v_sched = gr.Dropdown(choices=SCHEDULERS, value="normal", label="Scheduler")
                        v_format = gr.Dropdown(choices=["gif", "mp4", "webp"], value="gif", label="Output Format")
                        v_mode = gr.Radio(choices=["normal", "adult"], value="normal", label="Save to")

                    v_gen_btn = gr.Button("Generate Video", variant="primary", size="lg")

                    with gr.Row():
                        v_video = gr.Video(label="Generated Video", height=400)
                        v_preview = gr.Gallery(label="Preview Frames", columns=4, height=256)
                    v_info = gr.Textbox(label="Info", interactive=False)

                    v_gen_btn.click(
                        fn=generate_video_txt2vid,
                        inputs=[v_prompt, v_neg, v_model, v_motion, v_lora, v_lora_str, v_vae,
                                v_w, v_h, v_steps, v_cfg, v_sampler, v_sched, v_seed,
                                v_frames, v_fps, v_format, v_mode],
                        outputs=[v_video, v_preview, v_info],
                    )

                # ─ img2vid ─
                with gr.Tab("Image to Video (img2vid)"):
                    gr.Markdown("画像をアニメーションに変換します。元画像の構図を保ちつつ動きを加えます。")
                    with gr.Row():
                        with gr.Column(scale=2):
                            i2v_image = gr.Image(label="Input Image", type="numpy")
                            i2v_prompt = gr.Textbox(label="Motion Prompt (optional)", lines=2, placeholder="gentle wind, hair moving, blinking")
                            i2v_neg = gr.Textbox(label="Negative Prompt", lines=1, value="worst quality, static, blurry, distorted")
                        with gr.Column(scale=1):
                            i2v_model = gr.Dropdown(choices=models, label="Checkpoint (SD1.5推奨)", value=models[0] if models else None)
                            i2v_motion = gr.Dropdown(choices=motion_models, label="Motion Model", value=motion_models[0] if motion_models else None)
                            i2v_vae = gr.Dropdown(choices=vaes, label="VAE", value="None")
                            i2v_denoise = gr.Slider(0.1, 1.0, value=0.65, step=0.05, label="Denoise (低い=元画像に忠実)")

                    with gr.Row():
                        i2v_w = gr.Slider(256, 1024, value=512, step=64, label="Width")
                        i2v_h = gr.Slider(256, 1024, value=512, step=64, label="Height")
                        i2v_frames = gr.Slider(8, 32, value=16, step=1, label="Frames")
                        i2v_fps = gr.Slider(4, 30, value=8, step=1, label="FPS")

                    with gr.Row():
                        i2v_steps = gr.Slider(1, 50, value=20, step=1, label="Steps")
                        i2v_cfg = gr.Slider(1, 20, value=7.5, step=0.5, label="CFG")
                        i2v_seed = gr.Number(value=-1, label="Seed", precision=0)

                    with gr.Row():
                        i2v_sampler = gr.Dropdown(choices=SAMPLERS, value="euler_ancestral", label="Sampler")
                        i2v_sched = gr.Dropdown(choices=SCHEDULERS, value="normal", label="Scheduler")
                        i2v_format = gr.Dropdown(choices=["gif", "mp4", "webp"], value="gif", label="Output Format")
                        i2v_mode = gr.Radio(choices=["normal", "adult"], value="normal", label="Save to")

                    i2v_gen_btn = gr.Button("Generate Video from Image", variant="primary", size="lg")

                    with gr.Row():
                        i2v_video = gr.Video(label="Generated Video", height=400)
                        i2v_preview = gr.Gallery(label="Preview Frames", columns=4, height=256)
                    i2v_info = gr.Textbox(label="Info", interactive=False)

                    i2v_gen_btn.click(
                        fn=generate_video_img2vid,
                        inputs=[i2v_image, i2v_prompt, i2v_neg, i2v_model, i2v_motion, i2v_vae,
                                i2v_w, i2v_h, i2v_steps, i2v_cfg, i2v_sampler, i2v_sched, i2v_seed,
                                i2v_frames, i2v_fps, i2v_denoise, i2v_format, i2v_mode],
                        outputs=[i2v_video, i2v_preview, i2v_info],
                    )

                # ─ Video tips ─
                with gr.Tab("Tips"):
                    gr.Markdown("""
## AnimateDiff 動画生成のコツ

### 基本設定
- **Motion Model**: `mm_sd_v15_v2.ckpt` が最も安定
- **Checkpoint**: SD1.5ベースのモデルのみ対応（SDXLは非対応）
- **サイズ**: 512x512 が最も安定。512x768もOK
- **Frames**: 16フレームが標準。増やすとVRAM消費が増大

### 推奨設定
| パラメータ | テスト | 標準 | 高品質 |
|-----------|-------|------|--------|
| Steps | 10-15 | 20 | 25-30 |
| CFG | 7 | 7.5 | 7-8 |
| Frames | 8 | 16 | 24 |
| FPS | 8 | 8 | 12 |
| Size | 384x384 | 512x512 | 512x768 |

### img2vid のコツ
- **Denoise 0.5-0.7**: 元画像に近い動き（推奨）
- **Denoise 0.8-1.0**: 大きな変化、元画像から離れる
- **Motion Prompt**: `wind, hair moving, blinking, breathing` などの動きを指示

### VRAM使用量の目安
| 設定 | Mac MPS (18GB) | RunPod (24GB) |
|------|---------------|---------------|
| 512x512, 16f | 可能 (遅い) | 快適 |
| 512x768, 16f | ギリギリ | 快適 |
| 512x512, 24f | 不可 | 快適 |
| 512x768, 24f | 不可 | 可能 |

### 注意事項
- Mac MPSでの動画生成は**非常に遅い**（1本5-15分）
- 本格的な動画生成には**RunPod推奨**
- 初回は16フレーム/512x512でテストしてから拡大
""")

        # ── CivitAI Tab ──
        with gr.Tab("CivitAI"):
            gr.Markdown("**CivitAI連携** — モデル検索・ダウンロード・画像アップロード・トレーニング")

            with gr.Group():
                gr.Markdown("### Model Search (モデル検索)")
                with gr.Row():
                    c_query = gr.Textbox(label="検索キーワード", placeholder="例: realistic, anime, NSFW...")
                    c_type = gr.Dropdown(
                        choices=["Checkpoint", "LORA", "TextualInversion", "VAE", "ControlNet", "Upscaler"],
                        value="Checkpoint",
                        label="Type",
                    )
                    c_sort = gr.Dropdown(
                        choices=["Highest Rated", "Most Downloaded", "Newest"],
                        value="Highest Rated",
                        label="Sort",
                    )
                    c_nsfw = gr.Checkbox(label="NSFW含む", value=False)
                with gr.Row():
                    c_search_btn = gr.Button("検索", variant="primary")
                c_results = gr.Textbox(label="検索結果", lines=15, interactive=False)
                c_search_btn.click(
                    fn=civitai_search,
                    inputs=[c_query, c_type, c_sort, c_nsfw],
                    outputs=[c_results],
                )

            with gr.Group():
                gr.Markdown("### Download (モデルDL)")
                gr.Markdown("検索結果の **Version ID** を入力してダウンロード。modelsフォルダに自動保存されます。")
                with gr.Row():
                    c_version_id = gr.Textbox(label="Version ID", placeholder="検索結果のVersion IDをコピペ")
                    c_dest_type = gr.Dropdown(
                        choices=["Checkpoint", "LoRA", "VAE", "ControlNet", "Upscaler", "Embedding"],
                        value="Checkpoint",
                        label="保存先タイプ",
                    )
                    c_dl_btn = gr.Button("ダウンロード", variant="primary")
                c_dl_status = gr.Textbox(label="ダウンロード状況", lines=4, interactive=False)
                c_dl_btn.click(
                    fn=civitai_download,
                    inputs=[c_version_id, c_dest_type],
                    outputs=[c_dl_status],
                )

            with gr.Group():
                gr.Markdown("### Upload (画像アップロード)")
                gr.Markdown("生成した画像をCivitAIに投稿します。(API Key必須)")
                with gr.Row():
                    c_upload_file = gr.Textbox(label="画像パス", placeholder="outputs/normal/img_20260306_xxxx.png")
                    c_upload_nsfw = gr.Checkbox(label="NSFW", value=False)
                c_upload_btn = gr.Button("CivitAIにアップロード")
                c_upload_status = gr.Textbox(label="アップロード状況", interactive=False)
                c_upload_btn.click(
                    fn=civitai_upload_image,
                    inputs=[c_upload_file, gr.Textbox(visible=False, value=""), c_upload_nsfw],
                    outputs=[c_upload_status],
                )

            with gr.Group():
                gr.Markdown("### Training (モデルトレーニング)")
                gr.Markdown(
                    "CivitAIのトレーニング機能を使ってカスタムLoRAを作成できます。\n\n"
                    "- **SD1.5 LoRA**: ~500-1000 Buzz\n"
                    "- **SDXL LoRA**: ~1000-2000 Buzz\n"
                    "- トレーニングはCivitAIのGPUで実行されます（ローカルGPU不要）\n\n"
                    "**[CivitAI Training Page](https://civitai.com/models/train)** で直接トレーニングを開始できます。"
                )

        # ── AI Assistant Tab ──
        with gr.Tab("AI Assistant"):
            gr.Markdown("**AI アシスタント** — 戦略相談・プロンプト提案・モデル選択・トレーニング計画")

            with gr.Row():
                ai_provider = gr.Dropdown(
                    choices=list(PROVIDERS.keys()),
                    value="Claude (高品質アドバイス)",
                    label="AI プロバイダー",
                    scale=2,
                )
                ai_model_override = gr.Dropdown(
                    choices=["auto", "claude-opus-4-20250514", "claude-sonnet-4-20250514", "claude-haiku-4-5-20251001", "gpt-4o", "gpt-4o-mini", "grok-3", "grok-3-mini"],
                    value="auto",
                    label="モデル (auto=プロバイダーのデフォルト)",
                    scale=2,
                )

            with gr.Row():
                with gr.Column(scale=3):
                    chatbot = gr.Chatbot(label="AI Advisor", height=500)
                    with gr.Row():
                        chat_input = gr.Textbox(
                            label="質問・相談",
                            placeholder="例: リアル系ポートレートのプロンプトを提案して / CivitAIで売れるLoRAのアイデアは？",
                            lines=2,
                            scale=4,
                        )
                        chat_btn = gr.Button("送信", variant="primary", scale=1)
                    clear_btn = gr.Button("会話クリア", size="sm")

                with gr.Column(scale=1):
                    gr.Markdown("### クイック質問")
                    for i, q in enumerate(QUICK_QUESTIONS):
                        quick_btn = gr.Button(q, size="sm")
                        quick_btn.click(
                            fn=lambda msg, h, prov, mo, qq=q: (
                                h + [(qq, chat_with_ai(qq, h, config, prov, mo))],
                                "",
                            ),
                            inputs=[chat_input, chatbot, ai_provider, ai_model_override],
                            outputs=[chatbot, chat_input],
                        )

            def chat_respond(message, history, provider, model_override):
                if not message.strip():
                    return history, ""
                response = chat_with_ai(message, history, config, provider, model_override)
                history.append((message, response))
                return history, ""

            chat_btn.click(fn=chat_respond, inputs=[chat_input, chatbot, ai_provider, ai_model_override], outputs=[chatbot, chat_input])
            chat_input.submit(fn=chat_respond, inputs=[chat_input, chatbot, ai_provider, ai_model_override], outputs=[chatbot, chat_input])
            clear_btn.click(fn=lambda: ([], ""), outputs=[chatbot, chat_input])

        # ── Guide Tab ──
        with gr.Tab("Guide"):
            gr.Markdown("**ガイド** — プロンプトの書き方・モデル選択・設定・収益化のコツ")

            with gr.Tabs():
                for key, section in GUIDE_SECTIONS.items():
                    with gr.Tab(section["title"]):
                        gr.Markdown(section["content"])

                with gr.Tab("プロンプトテンプレート"):
                    gr.Markdown("## プロンプトテンプレート\nコピペしてQuick/Adultタブで使えます。")
                    for key, tmpl in PROMPT_TEMPLATES.items():
                        with gr.Group():
                            gr.Markdown(f"### {tmpl['name']}")
                            gr.Textbox(value=tmpl["prompt"], label="Prompt", lines=2, interactive=False)
                            gr.Textbox(value=tmpl["negative"], label="Negative Prompt", lines=1, interactive=False)
                            settings_str = f"Steps: {tmpl['settings']['steps']} | CFG: {tmpl['settings']['cfg']} | Size: {tmpl['settings']['width']}x{tmpl['settings']['height']} | Sampler: {tmpl['settings']['sampler']}"
                            gr.Markdown(f"**設定**: {settings_str}")
                            gr.Markdown(f"**推奨モデル**: {', '.join(tmpl['recommended_models'])}")

        # ── Settings Tab ──
        with gr.Tab("Settings"):
            gr.Markdown("**設定** — バックエンド・保存先・Google Drive連携・RunPod・CivitAI")

            with gr.Group():
                gr.Markdown("### Backend (バックエンド切り替え)")
                with gr.Row():
                    s_backend = gr.Radio(
                        choices=["local", "runpod"],
                        value=config.get("backend", "local"),
                        label="ComfyUI 実行先",
                        info="local = Mac本体 (MPS) / runpod = クラウドGPU (NVIDIA)",
                    )
                    backend_status = gr.Textbox(label="切り替え状況", interactive=False)
                s_backend.change(fn=lambda choice: switch_backend(choice)[0], inputs=[s_backend], outputs=[backend_status])

            with gr.Group():
                gr.Markdown("### RunPod Cloud GPU")
                gr.Markdown(
                    "RunPodのAPI KeyはRunPodダッシュボードの Settings > API Keys から取得してください。\n\n"
                    "GPU を選んで「Cloud GPU 起動」を押すとComfyUI付きPodが作成されます。\n"
                    "起動後、上部の Backend を `runpod` に切り替えてください。"
                )
                s_runpod_key = gr.Textbox(
                    label="RunPod API Key",
                    value=config.get("runpod_api_key", ""),
                    type="password",
                )
                runpod_gpu_select = gr.Dropdown(
                    choices=[
                        "NVIDIA RTX A5000",         # 24GB $0.16/hr - コスパ最高
                        "NVIDIA GeForce RTX 3090",  # 24GB $0.22/hr
                        "NVIDIA GeForce RTX 4080",  # 16GB $0.27/hr
                        "NVIDIA GeForce RTX 4090",  # 24GB $0.44/hr - 最速
                        "NVIDIA GeForce RTX 3080",  # 10GB $0.17/hr - 安い
                        "NVIDIA RTX A4000",          # 16GB $0.17/hr
                    ],
                    value="NVIDIA RTX A5000",
                    label="GPU タイプ",
                    info="A5000(24GB,$0.16/hr)がコスパ最高。4090($0.44/hr)が最速。",
                )
                runpod_status = gr.Textbox(label="RunPod Status", lines=3, interactive=False)
                with gr.Row():
                    runpod_start_btn = gr.Button("Cloud GPU 起動", variant="primary")
                    runpod_stop_btn = gr.Button("Cloud GPU 停止", variant="stop")
                    runpod_check_btn = gr.Button("状態確認")

                runpod_start_btn.click(fn=runpod_start, inputs=[runpod_gpu_select], outputs=[runpod_status])
                runpod_stop_btn.click(fn=runpod_stop, outputs=[runpod_status])
                runpod_check_btn.click(fn=runpod_check_status, outputs=[runpod_status])

            with gr.Group():
                gr.Markdown("### API Keys")
                s_civitai_key = gr.Textbox(
                    label="CivitAI API Key",
                    value=config.get("civitai_api_key", ""),
                    type="password",
                )
                s_anthropic_key = gr.Textbox(
                    label="Anthropic API Key (Claude - 高品質アドバイス)",
                    value=config.get("anthropic_api_key", ""),
                    type="password",
                    info="https://console.anthropic.com/",
                )
                s_openai_key = gr.Textbox(
                    label="OpenAI API Key (GPT - 一般相談)",
                    value=config.get("openai_api_key", ""),
                    type="password",
                    info="https://platform.openai.com/api-keys",
                )
                s_xai_key = gr.Textbox(
                    label="xAI API Key (Grok - NSFW対応)",
                    value=config.get("xai_api_key", ""),
                    type="password",
                    info="https://console.x.ai/",
                )

            with gr.Group():
                gr.Markdown("### Output Directories")
                s_output_normal = gr.Textbox(label="Normal 保存先", value=config["output_dir_normal"])
                s_output_adult = gr.Textbox(label="Adult 保存先", value=config["output_dir_adult"])
                with gr.Row():
                    open_normal_btn = gr.Button("Normal フォルダを開く")
                    open_adult_btn = gr.Button("Adult フォルダを開く")
                    open_models_btn = gr.Button("Models フォルダを開く")

            with gr.Group():
                gr.Markdown("### Google Drive 連携")
                gr.Markdown(
                    "Google Driveデスクトップアプリをインストール後、\n"
                    "Google Drive内にモデル用フォルダを作成し、パスを指定してください。\n\n"
                    "例: `/Users/koachmedia/Library/CloudStorage/GoogleDrive-xxx/My Drive/AI-models`"
                )
                s_gdrive = gr.Textbox(label="Google Drive Models Path", value=config.get("google_drive_models_dir", ""))
                gdrive_link_btn = gr.Button("Google Drive モデルをリンク")
                gdrive_status = gr.Textbox(label="リンク状況", interactive=False)

            with gr.Group():
                gr.Markdown("### Server")
                s_comfyui_url_display = gr.Textbox(label="ComfyUI Server URL (自動設定)", value=config["comfyui_url"], interactive=False)

            save_btn = gr.Button("設定を保存", variant="primary")
            save_status = gr.Textbox(label="", interactive=False)

            save_btn.click(
                fn=save_settings,
                inputs=[s_output_normal, s_output_adult, s_gdrive, s_comfyui_url_display, s_runpod_key, s_backend, s_civitai_key, s_anthropic_key, s_openai_key, s_xai_key],
                outputs=[save_status],
            )
            gdrive_link_btn.click(fn=link_google_drive, inputs=[s_gdrive], outputs=[gdrive_status])
            open_normal_btn.click(fn=lambda: open_folder(config["output_dir_normal"]), outputs=[save_status])
            open_adult_btn.click(fn=lambda: open_folder(config["output_dir_adult"]), outputs=[save_status])
            open_models_btn.click(fn=lambda: open_folder(config["models_dir"]), outputs=[save_status])

        # ── Legal / 法的情報 Tab ──
        with gr.Tab("Legal / 法的情報"):
            gr.Markdown("**Legal Information / 法的情報** — Content Policy, Terms of Service, Disclaimer")

            with gr.Tabs():
                with gr.Tab("Disclaimer / 免責事項"):
                    gr.Markdown(SELF_HOSTED_WARNING["en"])
                    gr.Markdown("---")
                    gr.Markdown(SELF_HOSTED_WARNING["ja"])

                with gr.Tab("Content Policy / コンテンツポリシー"):
                    gr.Markdown(CONTENT_POLICY["en"])
                    gr.Markdown("---")
                    gr.Markdown(CONTENT_POLICY["ja"])

                with gr.Tab("Terms of Service / 利用規約"):
                    gr.Markdown(TERMS_OF_SERVICE["en"])
                    gr.Markdown("---")
                    gr.Markdown(TERMS_OF_SERVICE["ja"])

                with gr.Tab("Regional Guidelines / 地域別ルール"):
                    gr.Markdown(REGIONAL_GUIDELINES["en"])
                    gr.Markdown("---")
                    gr.Markdown(REGIONAL_GUIDELINES["ja"])


if __name__ == "__main__":
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        theme=gr.themes.Soft(),
    )
