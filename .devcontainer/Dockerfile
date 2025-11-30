# Start from the official devcontainers Node/TypeScript image
FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install common runtime deps for Electron/Chromium apps on Debian/Ubuntu base
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libx11-xcb1 \
    libdrm2 \
    libgbm1 \
    libxkbcommon0 \
    libxdamage1 \
    libxcomposite1 \
    libxrandr2 \
    libxi6 \
    libxcb-dri3-0 \
    libegl1 \
    libgl1 && \
    rm -rf /var/lib/apt/lists/*
