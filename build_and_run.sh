#!/bin/bash

# Nome da imagem
IMAGE_NAME="controleimpressao-frontend"
DOCKER_HUB_REPO="angelolmg/controleimpressao-frontend"

# Variável para controlar o push
RUN_CONTAINER="${1:-false}"  # Pega o primeiro argumento ou define como "false" se não houver argumento
PUSH_IMAGE="${2:-false}"  # Pega o primeiro argumento ou define como "false" se não houver argumento

# Para o container (se estiver em execução)
docker stop "$IMAGE_NAME" 2>/dev/null  # Ignora erros se o container não existir

# Remove o container (se existir)
docker rm "$IMAGE_NAME" 2>/dev/null    # Ignora erros se o container não existir

# Build da imagem
docker build -t "$IMAGE_NAME" .

# Tag da imagem para o Docker Hub
docker tag "$IMAGE_NAME" "$DOCKER_HUB_REPO:latest"

# Execução do container
if ["$RUN_CONTAINER" == "true"]; then
  docker run --name "$IMAGE_NAME" -p 80:80 -d "$DOCKER_HUB_REPO:latest"
  echo "Container '$IMAGE_NAME' em execução."
fi

# Push da imagem (condicional)
if [ "$PUSH_IMAGE" == "true" ]; then
  docker push "$DOCKER_HUB_REPO:latest"
  echo "Imagem carregada para o Docker Hub."
else
  echo "Imagem NÃO carregada para o Docker Hub (use './build_and_run.sh true')."
fi


# Aguarda pressionar uma tecla para fechar o shell
read -n 1 -s -p "Pressione qualquer tecla para sair..."
echo "" # Adiciona uma nova linha após a tecla pressionada