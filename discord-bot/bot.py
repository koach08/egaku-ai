"""EGAKU AI Discord Bot — generate images and videos from Discord."""

import os
import asyncio
import logging

import discord
from discord import app_commands
import httpx
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("egaku-bot")

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
API_BASE = os.getenv("API_BASE", "https://api.egaku-ai.com/api")
# Service API key for bot-initiated generations (admin user token)
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


async def poll_job(job_id: str, max_polls: int = 60) -> dict | None:
    """Poll for job completion."""
    async with httpx.AsyncClient() as http:
        for _ in range(max_polls):
            await asyncio.sleep(3)
            try:
                res = await http.get(
                    f"{API_BASE}/generate/status/{job_id}",
                    headers={"Authorization": f"Bearer {SERVICE_TOKEN}"},
                    timeout=10,
                )
                data = res.json()
                if data.get("status") == "completed" and data.get("result_url"):
                    return data
                if data.get("status") == "failed":
                    return data
            except Exception:
                continue
    return None


@tree.command(name="generate", description="Generate an AI image from a text prompt")
@app_commands.describe(
    prompt="Describe the image you want to create",
    model="AI model to use (default: flux_schnell)",
)
@app_commands.choices(model=[
    app_commands.Choice(name="Flux Schnell (Fast)", value="flux_schnell"),
    app_commands.Choice(name="Flux Dev (Quality)", value="fal_flux_dev"),
    app_commands.Choice(name="Flux Realism", value="fal_flux_realism"),
])
async def generate_image(interaction: discord.Interaction, prompt: str, model: str = "flux_schnell"):
    await interaction.response.defer(thinking=True)

    try:
        async with httpx.AsyncClient() as http:
            res = await http.post(
                f"{API_BASE}/generate/image",
                headers={
                    "Authorization": f"Bearer {SERVICE_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "prompt": prompt,
                    "negative_prompt": "worst quality, low quality, blurry",
                    "model": model,
                    "width": 768,
                    "height": 768,
                    "steps": 25,
                    "cfg": 7,
                    "sampler": "euler_ancestral",
                    "seed": -1,
                    "nsfw": False,
                },
                timeout=30,
            )
            data = res.json()

        if data.get("result_url"):
            # Synchronous result
            embed = discord.Embed(
                title="EGAKU AI",
                description=f"**Prompt:** {prompt[:200]}",
                color=0x9333EA,
            )
            embed.set_image(url=data["result_url"])
            embed.set_footer(text=f"Model: {model} | egaku-ai.com")
            await interaction.followup.send(embed=embed)
        elif data.get("job_id"):
            # Async — poll for result
            await interaction.followup.send(f"Generating... (model: {model})")
            result = await poll_job(data["job_id"])
            if result and result.get("result_url"):
                embed = discord.Embed(
                    title="EGAKU AI",
                    description=f"**Prompt:** {prompt[:200]}",
                    color=0x9333EA,
                )
                embed.set_image(url=result["result_url"])
                embed.set_footer(text=f"Model: {model} | Try it free: egaku-ai.com")
                await interaction.edit_original_response(content=None, embed=embed)
            else:
                await interaction.edit_original_response(content="Generation failed. Try a different prompt.")
        else:
            await interaction.followup.send("Generation failed. Try again later.")

    except Exception as e:
        logger.error(f"Generate failed: {e}")
        await interaction.followup.send(f"Error: {e}")


@tree.command(name="music", description="Generate AI music from a text description")
@app_commands.describe(prompt="Describe the music (mood, genre, instruments)")
async def generate_music(interaction: discord.Interaction, prompt: str):
    await interaction.response.defer(thinking=True)

    try:
        async with httpx.AsyncClient() as http:
            res = await http.post(
                f"{API_BASE}/generate/music",
                headers={
                    "Authorization": f"Bearer {SERVICE_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "prompt": prompt,
                    "duration": 30,
                    "model": "ace_step",
                },
                timeout=60,
            )
            data = res.json()

        if data.get("result_url"):
            embed = discord.Embed(
                title="EGAKU AI Music",
                description=f"**Prompt:** {prompt[:200]}",
                color=0xA855F7,
            )
            embed.set_footer(text="Generated with EGAKU AI | egaku-ai.com")
            await interaction.followup.send(embed=embed)
            # Send audio file separately (Discord embeds don't play audio)
            await interaction.channel.send(data["result_url"])
        else:
            await interaction.followup.send("Music generation failed.")

    except Exception as e:
        logger.error(f"Music gen failed: {e}")
        await interaction.followup.send(f"Error: {e}")


@tree.command(name="egaku", description="Show EGAKU AI info and features")
async def egaku_info(interaction: discord.Interaction):
    embed = discord.Embed(
        title="EGAKU AI",
        description="All-in-one AI creative platform. Image, video, and music generation.",
        color=0x9333EA,
        url="https://egaku-ai.com",
    )
    embed.add_field(name="Image", value="30+ models (Flux, Grok, GPT Image 2)", inline=True)
    embed.add_field(name="Video", value="Veo 3, Kling 3.0, Seedance 2.0", inline=True)
    embed.add_field(name="Music", value="AI music from text description", inline=True)
    embed.add_field(name="Commands", value="`/generate` — AI image\n`/music` — AI music\n`/egaku` — this info", inline=False)
    embed.set_footer(text="Free to start: egaku-ai.com")
    await interaction.response.send_message(embed=embed)


@client.event
async def on_ready():
    await tree.sync()
    logger.info(f"Bot ready: {client.user} (synced slash commands)")
    await client.change_presence(
        activity=discord.Activity(type=discord.ActivityType.watching, name="egaku-ai.com")
    )


if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("ERROR: Set DISCORD_TOKEN environment variable")
        exit(1)
    if not SERVICE_TOKEN:
        print("WARNING: No SERVICE_TOKEN set. API calls will fail.")
    client.run(DISCORD_TOKEN)
