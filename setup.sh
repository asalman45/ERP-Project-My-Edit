#!/bin/bash
# =============================================================================
# EMPCL ERP — Server Provisioning Script
# Target OS: Ubuntu 24.04 LTS (DigitalOcean)
# Run as:  bash setup.sh
# =============================================================================
set -e

echo ""
echo "=============================================="
echo "  EMPCL ERP — Phase 1: Server Provisioning"
echo "=============================================="
echo ""

# ── Step 1: Update & upgrade system packages ──────────────────────────────────
echo "[1/5] Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    lsb-release \
    software-properties-common \
    ufw \
    git

# ── Step 2: Install Docker Engine ─────────────────────────────────────────────
echo ""
echo "[2/5] Installing Docker Engine..."

# Remove old/conflicting Docker versions if any
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ── Step 3: Enable and start Docker service ───────────────────────────────────
echo ""
echo "[3/5] Enabling and starting Docker service..."
systemctl enable docker
systemctl start docker

# ── Step 4: Verify Docker installation ───────────────────────────────────────
echo ""
echo "[4/5] Verifying installation..."
docker --version
docker compose version

# ── Step 5: Configure UFW firewall ───────────────────────────────────────────
echo ""
echo "[5/5] Configuring firewall (UFW)..."
ufw allow OpenSSH
ufw allow 4000/tcp    # Backend API
ufw allow 9000/tcp    # Frontend (Nginx)
ufw allow 5050/tcp    # pgAdmin (optional, remove if you don't need it public)
ufw --force enable
ufw status

echo ""
echo "=============================================="
echo "  ✅  Server provisioning COMPLETE!"
echo "  Docker and Docker Compose are ready."
echo "  Next: transfer project files and launch."
echo "=============================================="
echo ""
