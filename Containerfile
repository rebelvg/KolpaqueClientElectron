FROM docker.io/library/node:22-bookworm

RUN apt-get update && apt-get install -y \
  # Electron deps (as before)
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxrandr2 \
  libxdamage1 \
  libxtst6 \
  libdrm2 \
  libgbm1 \
  libasound2 \
  libxcb-dri3-0 \
  libxshmfence1 \
  libcups2 \
  libgtk-3-0 \
  libxss1 \
  libnotify4 \
  xdg-utils \
  libwayland-client0 \
  libwayland-cursor0 \
  libwayland-egl1 \
  libxkbcommon0 \
  \
  # New: weston + X backend so it can show in a window
  weston \
  xwayland \
  \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

CMD ["bash"]
