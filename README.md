### Docker

Build an image and tag it with the current `HEAD`

```bash
make build-tag-and-push-image
```

List all tags for the game image

```bash
gcloud container images list-tags --project $PROJECT_ID gcr.io/nth-segment-264718/game-engine
```

### Kubernetes

The game is deployed to [GKE](https://console.cloud.google.com/kubernetes/list?project=nth-segment-264718)

#### Generate kubeconfigs

```bash
make template-kubeconfigs
```

* Create the deployment file for the currently configured project using an image created from the `HEAD` of the repo.
* Create service file
* Create ingress file

#### Deployments

##### Apply the deployment

```bash
kubectl apply -f ops/kubeconfigs/game-engine-deployment.yml
```

##### Check status of deployment

```bash
kubectl get deployments.apps
```

```bash
kubectl rollout status deployment/game-engine
```

Deployment information also available in [google cloud console](https://console.cloud.google.com/kubernetes/deployment/europe-west3-a/game-engine/default/game-engine?project=nth-segment-264718&tab=overview&deployment_overview_active_revisions_tablesize=50&duration=PT1H&pod_summary_list_tablesize=20&service_list_datatablesize=20)

#### Services

#####  Apply service

```bash
kubectl apply -f ops/kubeconfigs/game-engine-service.yml
```

##### Check services

```bash
kubectl get services
```

#### Ingresses

The setup uses an ingress to expose the service to external incomming traffic.

##### Apply ingress

```bash
kubectl apply -f ops/kubeconfig_templates/game-engine-ingress.yml
```

##### Check ingress

```bash
kubectl get ingresses
```

##### TLS certs for the ingress

The game sits behind ssl. The certificate is signed with [https://letsencrypt.org/](https://letsencrypt.org/) using the [acme.sh](https://github.com/acmesh-official/acme.sh) tool.

###### To generate the certificate

```bash
docker exec -e GD_Key=$GODADDY_KEY -e GD_Secret=$GODADDY_SECRET acme.sh --issue -d piwpew.com -d '*.piwpew.com'  --dns dns_gd
```

The developer key and secret for Goddady are in 1Password.

###### To store the certificate and key as a k8s secret

```bash
kubectl create secret tls game-engine-tls --key out/piwpew.com/piwpew.com.key --cert out/piwpew.com/fullchain.cer
```

The path to the certificate and the key might have to be adjusted.

###### To update the certificate

```bash
PENDING but should be doable with acme.sh as well
```

###### List the certificates

```bash
gcloud --project $PROJECT_ID compute ssl-certificates list
```

#### Logs

```bash
kubectl logs -l app=game-engine
```

Logs also available in [google cloud console](https://console.cloud.google.com/logs/viewer?project=nth-segment-264718&minLogLevel=0&expandAll=false&timestamp=2020-02-13T17:49:20.044000000Z&customFacets=&limitCustomFacetWidth=true&dateRangeStart=2020-02-13T16:49:20.295Z&dateRangeEnd=2020-02-13T17:49:20.295Z&interval=PT1H&resource=container%2Fcluster_name%2Fgame-engine&scrollTimestamp=2020-02-13T17:44:20.494105225Z&logName=projects%2Fnth-segment-264718%2Flogs%2Fgame-engine)

