# Deploying FUT Club App to Kubernetes

## Fast local iteration with Skaffold (do this first)

Instead of rebuild → push → re-apply for every small edit, use Skaffold:

```bash
brew install skaffold   # macOS, if you don't have it yet
skaffold dev
```

What this does:
- Builds the image once using the `dev` target in the Dockerfile (includes `nodemon`)
- Deploys everything under `k8s/` except the HPA and Ingress
- Watches your local files (`init/`, `website/routes/`, `website/views/`, `website/components/`, `website/functions/`, `website/public/`, `migrations/`)
- On every save, syncs just that file straight into the running pod — no rebuild
- `.js` file changes (routes, views, server.js, db) trigger an automatic `nodemon` restart inside the pod — views are plain JS modules now, not EJS, so a view edit needs the same restart as any other code change
- CSS changes take effect on the next request with no restart at all
- Port-forwards the app to `http://localhost:8080` automatically
- Streams pod logs straight to your terminal
- `Ctrl+C` tears everything down cleanly

This is the dev loop — use it while you're actively building the UI library
work, admin screen, dynamic nav, etc. Save Docker rebuild + `kubectl apply`
for actual releases (see below).

---

Files added:
- `Dockerfile`, `.dockerignore` — containerizes the app
- `website/routes/index.js` — added a `/healthz` route used by k8s probes
- `k8s/00-namespace.yaml` — dedicated namespace
- `k8s/01-secret.yaml` — DB credentials + session secret (edit before applying!)
- `k8s/02-configmap.yaml` — non-secret app config
- `k8s/03-db-init-configmap.yaml` — your schema.sql + seed.sql, auto-loaded on first Postgres boot
- `k8s/10-postgres.yaml` — Postgres StatefulSet + headless Service + PVC (persistent storage)
- `k8s/20-app.yaml` — app Deployment (3 replicas) + Service
- `k8s/21-hpa.yaml` — autoscaler (2–8 pods based on CPU)
- `k8s/30-ingress.yaml` — external access via an Ingress controller

## 1. Build and push the image

```bash
docker build -t your-registry/fut-club-app:1.0.0 .
docker push your-registry/fut-club-app:1.0.0
```

Replace `your-registry/fut-club-app:1.0.0` with your actual registry path
(Docker Hub, GHCR, ECR, GCR, etc.), and use that same value in
`k8s/20-app.yaml` under `spec.template.spec.containers[0].image`.

If your cluster is local (kind/minikube), load the image directly instead of pushing:
```bash
kind load docker-image your-registry/fut-club-app:1.0.0
# or
minikube image load your-registry/fut-club-app:1.0.0
```

## 2. Set real secrets

Edit `k8s/01-secret.yaml` (or use `kubectl create secret generic` as shown
in its comments) with a real Postgres password and session secret before
applying it. Don't commit real secrets to git.

## 3. Apply the manifests

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secret.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-db-init-configmap.yaml
kubectl apply -f k8s/10-postgres.yaml
kubectl apply -f k8s/20-app.yaml
kubectl apply -f k8s/21-hpa.yaml
kubectl apply -f k8s/30-ingress.yaml   # optional, needs an ingress controller
```

Or all at once: `kubectl apply -f k8s/`

## 4. Check it's running

```bash
kubectl -n fut-club get pods,svc,pvc
kubectl -n fut-club logs -l app=fut-club-app --tail=50
```

Without an Ingress, access it via port-forward:
```bash
kubectl -n fut-club port-forward svc/fut-club-app 8080:80
# then open http://localhost:8080
```

## Notes / things to fix before real production use

- `init/schema.sql` stores plaintext passwords (already flagged in your own
  code comment) — worth hashing (bcrypt) before this goes anywhere public.
- The Postgres StatefulSet init scripts only run **once**, when the data
  volume is empty. To change schema later, use a real migration tool
  rather than editing `03-db-init-configmap.yaml`.
- `21-hpa.yaml` needs the `metrics-server` add-on installed in-cluster.
- `30-ingress.yaml` needs an ingress controller (e.g. `ingress-nginx`) and
  a real hostname/DNS pointed at your cluster's load balancer.
