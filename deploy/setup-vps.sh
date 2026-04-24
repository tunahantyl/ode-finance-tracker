#!/usr/bin/env bash
# =============================================================
# Öde - VPS bootstrap script (Ubuntu 22.04 / 24.04)
# Idempotent: birden fazla çalıştırılabilir, hiçbir şeyi bozmaz.
# Eski PM2/bot/Node kurulumlarınız varsa ETKİLENMEZ.
#
# Çalıştırma (root veya sudo'lu kullanıcı):
#   chmod +x deploy/setup-vps.sh
#   sudo ./deploy/setup-vps.sh
# =============================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup]${NC} $*"; }
die() { echo -e "${RED}[setup]${NC} $*"; exit 1; }

[[ $EUID -eq 0 ]] || die "Bu script root yetkisi gerektirir. 'sudo' ile çalıştırın."

APP_USER="${APP_USER:-ode}"
APP_DIR="${APP_DIR:-/var/www/ode}"
NODE_MAJOR="${NODE_MAJOR:-22}"

# ---- 1. apt update + temel araçlar ----
log "apt update + temel paketler"
apt-get update -y
apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg git build-essential ufw

# ---- 2. Node.js (NodeSource) — sadece eksikse kur ----
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
    log "Node.js ${NODE_MAJOR}.x kuruluyor (NodeSource)"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
else
    log "Node.js zaten kurulu: $(node -v)"
fi

# ---- 3. PM2 (global) — sadece eksikse ----
if ! command -v pm2 >/dev/null; then
    log "PM2 kuruluyor"
    npm install -g pm2
else
    log "PM2 zaten kurulu: $(pm2 -v) — eski process'leriniz ETKİLENMEZ."
fi

# ---- 4. Nginx — sadece eksikse ----
if ! command -v nginx >/dev/null; then
    log "Nginx kuruluyor"
    apt-get install -y nginx
    systemctl enable --now nginx
else
    log "Nginx zaten kurulu — sadece yeni server block ekleyeceğiz."
fi

# ---- 5. Certbot ----
if ! command -v certbot >/dev/null; then
    log "Certbot (Let's Encrypt) kuruluyor"
    apt-get install -y certbot python3-certbot-nginx
else
    log "Certbot zaten kurulu."
fi

# ---- 6. Uygulama kullanıcısı + dizin ----
if ! id "$APP_USER" >/dev/null 2>&1; then
    log "Kullanıcı oluşturuluyor: ${APP_USER}"
    useradd --system --create-home --shell /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
log "Uygulama dizini hazır: $APP_DIR"

# ---- 7. UFW firewall (varsa kullan, yoksa kurma; mevcut kuralları korur) ----
if ufw status | grep -q "Status: active"; then
    log "UFW aktif — 80/443 ekleniyor"
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
else
    warn "UFW pasif — manuel açmak istersen: ufw allow 80,443/tcp && ufw enable"
fi

# ---- 8. Bilgi ----
echo ""
log "Hazır. Sıradaki adımlar (DEPLOY.md içinde detaylı):"
echo "  1) DNS: api.tunatest2.site -> $(curl -s ifconfig.me) (A kaydı)"
echo "  2) sudo -u $APP_USER bash"
echo "     cd $APP_DIR && git clone <REPO_URL> ."
echo "  3) cp backend/.env.production.example backend/.env  &&  nano backend/.env"
echo "  4) cd backend && npm install --omit=dev && npm run db:migrate"
echo "  5) (yeniden root) cp /home/$APP_USER/.../deploy/nginx-api.conf /etc/nginx/sites-available/"
echo "  6) ln -s /etc/nginx/sites-available/api.tunatest2.site /etc/nginx/sites-enabled/"
echo "  7) certbot --nginx -d api.tunatest2.site"
echo "  8) sudo -u $APP_USER pm2 startOrReload $APP_DIR/backend/ecosystem.config.cjs"
echo "  9) pm2 save && pm2 startup   (eski PM2 process'leriniz korunur)"
