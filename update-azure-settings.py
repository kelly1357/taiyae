#!/usr/bin/env python3
"""
Update Azure Static Web App settings with SMTP/email environment variables.

Usage:
  python update-azure-settings.py

Prerequisites:
  - Azure CLI installed and logged in (az login)
  - Update RESOURCE_GROUP and SWA_NAME below
"""

import subprocess
import json
import sys

# ─── Configure these ───
RESOURCE_GROUP = "taiyae"   # Your Azure resource group name
SWA_NAME = "taiyae"         # Your Azure Static Web App name

SETTINGS = {
    "SMTP_HOST": "smtp.office365.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "no-reply@horizonwolves.com",
    "SMTP_PASS": "zuxjig-myvta6-Jogheb",
    "EMAIL_FROM": "Horizon Wolves <no-reply@horizonwolves.com>",
    "APP_URL": "https://www.horizonwolves.com",
}


def main():
    # Verify Azure CLI is installed
    try:
        result = subprocess.run(
            ["az", "account", "show"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print("❌ Not logged in to Azure CLI. Run 'az login' first.")
            sys.exit(1)
        account = json.loads(result.stdout)
        print(f"✅ Logged in as: {account.get('user', {}).get('name', 'unknown')}")
        print(f"   Subscription: {account.get('name', 'unknown')}")
    except FileNotFoundError:
        print("❌ Azure CLI not found. Install it: https://aka.ms/installazurecli")
        sys.exit(1)

    # Build the settings arguments
    settings_args = [f"{key}={value}" for key, value in SETTINGS.items()]

    print(f"\n📦 Updating {len(SETTINGS)} settings on {SWA_NAME}...")
    for key in SETTINGS:
        display_value = "********" if "PASS" in key else SETTINGS[key]
        print(f"   {key} = {display_value}")

    # Apply settings via az staticwebapp appsettings set
    settings_args = [f"{key}={value}" for key, value in SETTINGS.items()]

    cmd = [
        "az", "staticwebapp", "appsettings", "set",
        "--name", SWA_NAME,
        "--resource-group", RESOURCE_GROUP,
        "--setting-names", *settings_args,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"\n✅ All settings updated successfully on {SWA_NAME}.")
    else:
        print(f"\n❌ Failed to update settings:")
        print(result.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
