#!/bin/bash
# =============================================================================
# EMPCL ERP — Server SSH Key Setup Script
# File: setup-ssh.sh (Project Root)
# =============================================================================

set -e

SSH_DIR="$HOME/.ssh"
AUTH_KEYS="$SSH_DIR/authorized_keys"
KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCyiwefsruVm7jwtdnj6wqv2j9fjrq7Ng+9LZ0lbx1KiiT6GxK6gpDMEh6nMuvyzjFmCdjx+ODF7ATqXsypvhSM8EDMEFM57pARRyKKDE+bjLsbtm8zv3mr5oHJP1X4FhYdIfy6icHLXCMuMeOKsgOfoe4Hi7zam44nym0tdTjn0y9YJKGoIpqjDaBJ9R63buYVPIlj0aI80MIKx2G7MfKEIpRm5ch9rje6YuTfOikmB9IRUD2kel+53Vm8OXZ0jCW/qYoJ5Z/Xq8nWbTzLu+bmJI/Xkxm1JSZFfYIYkO8B8SGVK7kOfx5xA8CPxYslCrhFFE/YQjs6Q10Y2tFy2C7LcNuwu7v42RsELMR1oFfV3Qhv2I/5wdT3DQNsW7HeDWMKDFW9u5tRYCzeoLAdpMUZS3spDQjoXmiKHXR5CncXmju/58EYuRe1S6BRPgCekLodQimksNPJ01GXmKIB7Rd6KKnXJtSUrNUzEYdjDwO/abJybWy0XDREKzTGahuybyEkJxoC3BU1H96PbQpxguqPPk8r6whi694jpNbvcvHUER2mqzcbTTIJxN4R/HOPqxtgipzTET+EGKhVtbwjM/ZhcoAM3pydNr1sPSLb8SOpD3hbsNKxQ1K5LUvGvel/q1M4ooEt0Tb7qe8tQo0vzkMCQBykrVGCL2Jh4EeyZ1F1gw== lenovo@DESKTOP-J0SQ8M0"

echo ">>> Creating SSH directory if it doesn't exist..."
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Check if key is already in authorized_keys
if [ -f "$AUTH_KEYS" ] && grep -Fq "lenovo@DESKTOP-J0SQ8M0" "$AUTH_KEYS"; then
    echo ">>> SSH key is already registered in authorized_keys!"
else
    echo ">>> Appending SSH key to authorized_keys..."
    echo "$KEY" >> "$AUTH_KEYS"
fi

chmod 600 "$AUTH_KEYS"
echo ">>> SSH Key Setup Complete! You should now be able to connect via SSH/SCP without a password."
