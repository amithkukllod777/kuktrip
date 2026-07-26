# Deploy Kuk Trip to AWS — trip.kuklabs.com

This hosts Kuk Trip on a single AWS **EC2** box with **Docker + Caddy** (auto-TLS)
and **persistent volumes**, and wires **push-to-main auto-deploy** via GitHub
Actions + AWS SSM. Everything below lives in this repo (`deploy/` +
`.github/workflows/deploy-aws.yml`).

> **Why EC2 (not Fargate/App Runner):** Kuk Trip stores data in **SQLite**
> (`/app/data`) plus local **uploads** — it needs a **persistent disk** and runs
> **single-instance**. EC2 with an EBS volume is the correct, cheapest fit and
> matches KukBook's AWS setup.
>
> **Note:** an agent cannot provision AWS infra for you — the steps below need to
> be run once by someone with AWS access. After that, `git push` to `main`
> deploys automatically.

## Architecture

```
Internet ──▶ trip.kuklabs.com (DNS A → EC2 EIP)
          ──▶ EC2 :443  Caddy (Let's Encrypt TLS)  ──▶ app:3000 (Kuk Trip)
                                                        volumes: data (SQLite), uploads
GitHub push→main ─▶ Actions: build image → GHCR → AWS SSM → EC2 `docker compose pull && up -d`
```

## One-time setup

### 1. EC2 instance
- Launch **Ubuntu 22.04**, `t3.small` (2 GB) or larger, **EBS ≥ 20 GB gp3**.
- Allocate an **Elastic IP** and associate it.
- **Security group** inbound: `80/tcp`, `443/tcp` from `0.0.0.0/0`; `22/tcp` only from your admin IP (optional — SSM removes the need for SSH).
- **IAM instance role**: attach the AWS managed policy **`AmazonSSMManagedInstanceCore`** (lets the deploy job run commands via SSM).

### 2. DNS
- In the DNS host for **kuklabs.com** (Route 53 or wherever), add:
  `trip.kuklabs.com  A  <EC2 Elastic IP>`
- Wait for it to resolve before first boot (Caddy needs it to issue the cert).

### 3. Install Docker on the EC2
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu   # re-login after
```

### 4. Put the compose stack on the box
```bash
sudo mkdir -p /opt/kuktrip && sudo chown $USER /opt/kuktrip && cd /opt/kuktrip
# copy these two files from the repo's deploy/ folder:
#   deploy/docker-compose.prod.yml  → /opt/kuktrip/docker-compose.prod.yml
#   deploy/Caddyfile                → /opt/kuktrip/Caddyfile
cp /path/to/repo/deploy/.env.production.example .env
# edit .env: set ENCRYPTION_KEY ( openssl rand -hex 32 ), TZ, and first-boot ADMIN_*
```

### 5. Let the box pull the private image from GHCR
The deploy pushes `ghcr.io/amithkukllod777/kuktrip:prod` (private by default).
Log the box in once with a **read-only** GitHub PAT (`read:packages`):
```bash
echo <GHCR_READ_PAT> | docker login ghcr.io -u <github-username> --password-stdin
```
*(Alternative: make the GHCR package public and skip this.)*

### 6. First boot
```bash
cd /opt/kuktrip
docker compose -f docker-compose.prod.yml pull    # after the first CI build exists
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f  # watch Caddy get the cert
```
Open **https://trip.kuklabs.com** → log in with the `ADMIN_*` you set, then remove
`ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` and `up -d` again.

### 7. Wire GitHub auto-deploy
In the repo **Settings → Secrets and variables → Actions**:
- **Secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (an IAM user allowed to `ssm:SendCommand`/`GetCommandInvocation` on the instance).
- **Variables:** `AWS_REGION` (e.g. `ap-south-1`), `EC2_INSTANCE_ID` (e.g. `i-0abc…`).

Now every push to `main` (excluding docs/android/qa-audit paths) → builds the
image → pushes to GHCR → SSM tells the EC2 to `pull && up -d`. You can also run it
manually via **Actions → Deploy to AWS → Run workflow**.

## Optional: real "Continue with Google"
Kuk Trip's federated button uses OIDC. To make it a real Google sign-in, register a
Google OAuth client and set on the server (in `.env`, then redeploy):
`OIDC_ISSUER=https://accounts.google.com`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`,
`OIDC_DISPLAY_NAME=Google`, and `APP_URL=https://trip.kuklabs.com` (redirect URI
must match what you register with Google).

## Backups
The SQLite DB + uploads live in the `kuktrip-data` / `kuktrip-uploads` Docker
volumes. Snapshot the EBS volume on a schedule, and/or `docker run --rm -v
kuktrip-data:/d -v $PWD:/b alpine tar czf /b/kuktrip-data.tgz -C /d .` to a bucket.
The app also writes periodic backups under `/app/data/backups`.
