CURRENT_GIT_HEAD=$(shell git rev-parse --short HEAD)

build-image:
	docker build -t madtrick/pewpew .

tag-image:
	docker tag madtrick/pewpew gcr.io/$(PROJECT_ID)/game-engine:$(CURRENT_GIT_HEAD)

push-image:
	docker push gcr.io/$(PROJECT_ID)/game-engine:$(CURRENT_GIT_HEAD)

build-tag-and-push-image: build-image tag-image push-image

template-kubeconfigs:
	ops/bin/template-kubeconfigs -d ops/kubeconfig_templates
