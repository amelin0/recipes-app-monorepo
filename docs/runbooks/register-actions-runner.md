---
title: Підключити self-hosted GitHub Actions runner на dev-сервері
severity: medium
owner: '@oncall'
last-tested: 2026-09-07
---

# Підключити self-hosted GitHub Actions runner на dev-сервері

## When to use this

- Уперше налаштовуєте автодеплой: `.github/workflows/deploy.yml` є, але job
  висить на **«Waiting for a runner to pick up this job»** і не падає — це
  єдиний симптом того, що раннера немає.
- Раннер показує **Offline** у Settings → Actions → Runners.
- Сервер переставили, перевстановили або змінили користувача.

Той самий підхід, що на 11am: раннер стоїть **на тому ж сервері**, куди
деплоїмо, і виконує рівно один рядок — `infra/prod/deploy.sh`.

## Prerequisites

- SSH-доступ до dev-сервера
- Права **admin** на репозиторії `amelin0/recipes-app-monorepo` (без них
  сторінка з токеном реєстрації недоступна)
- Стек уже піднімався руками хоча б раз: є `infra/prod/.env.prod`, є образи,
  міграції застосовані. Раннер автоматизує повторний деплой, а не перший.

## Steps

### 1. Окремий користувач, не root

```bash
sudo adduser --disabled-password --gecos '' actions
sudo usermod -aG docker actions
```

`docker` group ≈ root на цій машині — це відомий компроміс, і саме тому
раннер не має бути root'ом ще й номінально. Приватний репозиторій означає, що
код на ньому виконує лише той, хто вже має доступ на запис.

### 2. Клон, з якого деплоїмо

Це **не** робоча тека раннера. Раннер щоразу створює собі чисту
`_work/`-теку, а нам потрібне місце, де переживають `.env.prod` і локальна
історія образів, без якої немає відкату.

```bash
sudo -iu actions
git clone git@github.com:amelin0/recipes-app-monorepo.git ~/recipes-app-monorepo
cd ~/recipes-app-monorepo && git checkout development
```

Якщо `.env.prod` уже лежить у клоні іншого користувача — перенесіть його
разом із правами:

```bash
sudo cp /home/<old>/recipes-app-monorepo/infra/prod/.env.* ~/recipes-app-monorepo/infra/prod/
sudo chown actions:actions ~/recipes-app-monorepo/infra/prod/.env.*
sudo chmod 600 ~/recipes-app-monorepo/infra/prod/.env.*
```

### 3. Git-доступ

Токен Actions **не** дає раннеру доступу до git поза його власною робочою
текою, а `deploy.sh` робить `git fetch` саме в цьому клоні. Тож потрібен
ключ:

```bash
sudo -iu actions
ssh-keygen -t ed25519 -C 'dev-server deploy key' -f ~/.ssh/id_ed25519 -N ''
cat ~/.ssh/id_ed25519.pub
```

Публічний ключ → GitHub → репозиторій → **Settings → Deploy keys → Add**,
**без** «Allow write access»: деплою потрібне лише читання.

```bash
ssh -T git@github.com     # має привітатися назвою репозиторію
```

### 4. Раннер

Точні URL і токен GitHub показує на сторінці
**Settings → Actions → Runners → New self-hosted runner** (Linux x64). Токен
реєстрації живе **годину** — беріть його безпосередньо перед `config.sh`.

```bash
sudo -iu actions
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.328.0/actions-runner-linux-x64-2.328.0.tar.gz
tar xzf actions-runner-linux-x64.tar.gz

./config.sh --url https://github.com/amelin0/recipes-app-monorepo \
            --token <РЕЄСТРАЦІЙНИЙ_ТОКЕН> \
            --name dns-dev --labels self-hosted,linux,x64 --unattended
```

Версію звірте зі сторінкою — команда вище фіксує конкретну, щоб не тягнути
`latest`, який колись зміниться під ногами.

### 5. Служба, а не сесія

```bash
sudo ./svc.sh install actions
sudo ./svc.sh start
sudo ./svc.sh status
```

Без цього раннер живе рівно доти, доки відкрита ваша SSH-сесія — і зникає
разом із нею, а job знову «чекає раннера».

### 6. Змінна `PROD_REPO`

GitHub → репозиторій → **Settings → Secrets and variables → Actions →
Variables → New repository variable**:

| Name | Value |
| --- | --- |
| `PROD_REPO` | `/home/actions/recipes-app-monorepo` |

Це **variable**, не secret: шлях не таємниця, а секретне значення не видно в
логах, і діагностувати помилку в ньому було б неможливо. Workflow падає з
явним повідомленням, якщо змінної немає.

## Verification

1. **Runners** у Settings → Actions: `dns-dev` зі станом **Idle**.
2. Ручний прогін: **Actions → deploy → Run workflow → development**.
3. У логах job'а має бути послідовність `── 1/6 fetch` … `── 6/6 deployed`.
4. Перевірити, що деплой справді змінив те, що обслуговує:

```bash
curl -s https://dev.api.client.rationfit.com/api/v1/health/ready
grep IMAGE_TAG /home/actions/recipes-app-monorepo/infra/prod/.env.prod
```

Тег має збігатися з коротким sha того коміту, який деплоїли.

## Rollback

**Раннер поводиться дивно, а деплой потрібен зараз** — деплойте руками, шлях
той самий:

```bash
sudo -iu actions
cd ~/recipes-app-monorepo && bash infra/prod/deploy.sh --ref development
```

**Деплой зробив гірше** — `deploy.sh` уже сам повертає попередній тег, якщо
health не піднявся. Якщо ж поламалося пізніше, відкат ручний:

```bash
bash infra/prod/deploy.sh --tag <попередній_sha>
```

Скрипт друкує попередній тег наприкінці кожного успішного прогону.

⚠️ **Відкат повертає контейнери, а не схему.** Міграції односторонні й уже
застосовані.

**Зняти раннер зовсім:**

```bash
cd ~/actions-runner && sudo ./svc.sh stop && sudo ./svc.sh uninstall
./config.sh remove --token <ТОКЕН_ВИДАЛЕННЯ>
```

## Postmortem hooks

- Job висить на «Waiting for a runner» — це **не** падіння, і GitHub про це не
  сповістить. Перевіряти `sudo ./svc.sh status` на сервері.
- Якщо деплой упав на міграціях, стара збірка ще обслуговує: розбиратися можна
  без поспіху, але **не** запускати другий деплой поверх — `concurrency` цього
  не зупинить, якщо перший уже завершився помилкою.
- Якщо раннер зайняв диск (`_work/`, кеші, старі образи) і прилетів
  `dns-disk-low` — `docker image prune -f` і чистка `~/actions-runner/_work`.
